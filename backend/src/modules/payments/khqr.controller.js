import { BakongKHQR, khqrData, IndividualInfo } from "bakong-khqr";
import prisma from "../../utils/db.js";
import { getIO } from "../../sockets/index.js";

const KHR_RATE = 4100;
const md5CheckCache = new Map(); // md5 -> { ts, res }

export const generateKHQR = async (req, res) => {
  const { order_id, currency = "USD" } = req.body;

  console.log(`[KHQR] generateKHQR — order_id=${order_id} currency=${currency}`);

  if (!order_id)
    return res.status(400).json({ message: "order_id is required" });

  try {
    const order = await prisma.order.findUnique({
      where: { order_id: parseInt(order_id) },
      include: {
        order_items: true,
        payments: { where: { status: "Completed" } },
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.payments.length > 0)
      return res.status(409).json({ message: "This order has already been paid" });
    if (order.confirmed === false)
      return res.status(400).json({ message: "Order must be confirmed before it can be paid" });

    const totalUSD = order.order_items.reduce(
      (sum, item) => sum + item.quantity * Number(item.unit_price), 0
    );

    const isusd = currency.toUpperCase() === "USD";
    const amount = isusd
      ? parseFloat(totalUSD.toFixed(2))
      : Math.round(totalUSD * KHR_RATE);

    const rawTarget = (
      process.env[isusd ? "KHQR_BAKONG_ID_USD" : "KHQR_BAKONG_ID_KHR"] ||
      (isusd ? "500536911" : "600579964")
    ).trim();

    // Support both direct Bakong IDs (e.g. "username@abaa" / "username@bkrt")
    // and ABA Bank account numbers routed via "abaakhppxxx@abaa".
    const isDirectBakongId = rawTarget.includes("@");
    const bakongId = isDirectBakongId
      ? rawTarget
      : (process.env.BAKONG_ACCOUNT_ID || process.env.KHQR_BAKONG_ACCOUNT_ID || "abaakhppxxx@abaa");

    let accountNumber = "";
    if (!isDirectBakongId) {
      accountNumber = rawTarget.replace(/[\s-]/g, "");
    }

    const merchantName = process.env.KHQR_MERCHANT_NAME || process.env.BAKONG_MERCHANT_NAME || "NEANG NEN";
    const merchantCity = process.env.KHQR_MERCHANT_CITY || process.env.BAKONG_MERCHANT_CITY || "Phnom Penh";

    console.log(`[KHQR] bakongId=${bakongId} accountNumber=${accountNumber || "(direct)"} amount=${amount} ${currency}`);

    const optionalData = {
      currency: isusd ? khqrData.currency.usd : khqrData.currency.khr,
      amount,
      billNumber: String(order_id).padStart(4, "0"),
      expirationTimestamp: Date.now() + 10 * 60 * 1000,
      ...(accountNumber
        ? {
            accountInformation: accountNumber,
            acquiringBank: process.env.KHQR_ACQUIRING_BANK || "ABA Bank",
          }
        : {}),
    };

    // IndividualInfo correct signature: (bakongAccountID, merchantName, merchantCity, optionalData)
    // Currency and amount go ONLY in optionalData, NOT as constructor params
    const info = new IndividualInfo(
      bakongId,
      merchantName,
      merchantCity,
      optionalData
    );

    const khqr = new BakongKHQR();
    const result = khqr.generateIndividual(info);

    if (result.status.code !== 0)
      return res.status(500).json({ message: "Failed to generate KHQR", detail: result.status.message });

    console.log(`[KHQR] result: code=${result.status.code} md5=${result.data.md5} qr=${result.data.qr}`);

    res.json({
      qr: result.data.qr,
      md5: result.data.md5,
      amount,
      currency: currency.toUpperCase(),
      order_id: parseInt(order_id),
      expires_at: Date.now() + 10 * 60 * 1000,
    });
  } catch (error) {
    console.error("[KHQR] generateKHQR error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkKHQR = async (req, res) => {
  const { md5 } = req.params;
  const { order_id } = req.query;

  if (!md5 || !order_id)
    return res.status(400).json({ message: "md5 and order_id are required" });

  const parsedOrderId = parseInt(order_id);

  try {
    // Check if the order is already marked Paid in DB before calling Bakong API
    const existingOrder = await prisma.order.findUnique({
      where: { order_id: parsedOrderId },
      include: {
        payments: { where: { status: "Completed" } },
      },
    });

    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (existingOrder.payments.length > 0 || existingOrder.status === "Paid") {
      return res.json({ paid: true, already_processed: true, order_id: parsedOrderId });
    }

    const token = process.env.BAKONG_TOKEN;
    if (!token)
      return res.json({ paid: false, reason: "BAKONG_TOKEN not configured — use manual confirm" });

    const bakongRes = await checkBakongMD5(md5, token);
    if (!bakongRes.paid) {
      return res.json({
        paid: false,
        ...(bakongRes.rateLimited ? { rate_limited: true, reason: bakongRes.reason } : {}),
      });
    }

    let khqrMethod = await prisma.paymentMethod.findFirst({ where: { method_name: "KHQR" } });
    if (!khqrMethod)
      khqrMethod = await prisma.paymentMethod.create({ data: { method_name: "KHQR" } });

    const cashier = await prisma.user.findFirst({ where: { role: { in: ["cashier", "admin"] } } });

    const result = await prisma.$transaction(async (tx) => {
      // Serialize concurrent payment attempts for this order
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${parsedOrderId})`;

      const order = await tx.order.findUnique({
        where: { order_id: parsedOrderId },
        include: {
          order_items: true,
          payments: { where: { status: "Completed" } },
        },
      });

      if (!order) {
        const err = new Error("ORDER_NOT_FOUND");
        err.statusCode = 404;
        throw err;
      }

      if (order.payments.length > 0 || order.status === "Paid") {
        return { already_processed: true, order };
      }

      const totalAmount = order.order_items.reduce(
        (sum, item) => sum + item.quantity * Number(item.unit_price), 0
      );

      const createdPayment = await tx.payment.create({
        data: {
          order_id: parsedOrderId,
          method_id: khqrMethod.method_id,
          user_id: req.user?.userId || cashier?.user_id || 1,
          amount: totalAmount,
          status: "Completed",
          external_ref: md5 ? String(md5).slice(0, 100) : null,
        },
      });

      await tx.order.update({ where: { order_id: parsedOrderId }, data: { status: "Paid" } });
      if (order.table_id)
        await tx.table.update({ where: { table_id: order.table_id }, data: { is_available: true } });

      return { payment: createdPayment, order };
    });

    if (result.already_processed) {
      return res.json({ paid: true, already_processed: true, order_id: parsedOrderId });
    }

    const io = getIO();
    io.to("role:cashier").to("role:admin")
      .emit("payment:completed", { order_id: parsedOrderId, payment: result.payment });
    io.to("role:cashier").to("role:admin")
      .emit("order:status_changed", { order_id: parsedOrderId, table_id: result.order.table_id, status: "Paid" });
    io.to(`table:${result.order.table_id}`)
      .emit("order:status_changed", { order_id: parsedOrderId, table_id: result.order.table_id, status: "Paid" });

    if (result.order.table_id) {
      io.to("role:admin").to("role:cashier")
        .emit("table:updated", { table_id: result.order.table_id, is_available: true });
    }

    res.json({ paid: true, order_id: parsedOrderId });
  } catch (error) {
    if (error.statusCode === 404) return res.status(404).json({ message: "Order not found" });
    if (error.code === "P2002") // duplicate external_ref
      return res.json({ paid: true, already_processed: true, order_id: parsedOrderId });
    console.error("[KHQR] checkKHQR error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

async function checkBakongMD5(md5, rawTokens) {
  const cached = md5CheckCache.get(md5);
  if (cached && Date.now() - cached.ts < 4000) {
    return cached.res;
  }

  const tokens = String(rawTokens)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  let lastResult = { paid: false };
  for (const token of tokens) {
    const res = await callBakongCheckMD5(md5, token);
    lastResult = res;
    if (res.paid) {
      md5CheckCache.set(md5, { ts: Date.now(), res });
      return res;
    }
    // If this token has not hit daily rate limit (errorCode 17), no need to try fallback token
    if (!res.rateLimited) {
      break;
    }
  }

  md5CheckCache.set(md5, { ts: Date.now(), res: lastResult });
  return lastResult;
}

async function callBakongCheckMD5(md5, token) {
  const { default: https } = await import("https");
  return new Promise((resolve) => {
    const body = JSON.stringify({ md5 });
    const options = {
      hostname: "api-bakong.nbc.gov.kh",
      path: "/v1/check_transaction_by_md5",
      method: "POST",
      family: 4,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        Authorization: `Bearer ${token}`,
      },
    };
    const req = https.request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => { data += chunk; });
      response.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.responseCode === 0) {
            console.log(`[KHQR] checkBakongMD5 PAID md5=${md5}`);
            resolve({ paid: true, data: parsed.data });
          } else {
            if (parsed.errorCode === 17) {
              console.warn(`[KHQR] Bakong API daily limit (100/day) reached: ${parsed.responseMessage}`);
              resolve({ paid: false, rateLimited: true, reason: parsed.responseMessage });
            } else {
              resolve({ paid: false, reason: parsed.responseMessage });
            }
          }
        } catch {
          resolve({ paid: false });
        }
      });
    });
    req.on("error", () => resolve({ paid: false }));
    req.write(body);
    req.end();
  });
}
