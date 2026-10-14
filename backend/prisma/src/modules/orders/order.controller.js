import prisma from "../../utils/db.js";
import { getIO } from "../../sockets/index.js";
import { verifyGuestLocation } from "../../utils/geo.js";
import { getQueueNumber, attachQueueNumbers } from "../../utils/queueNumber.js";

// ------------------------------------------------------------
// GET /api/orders
// Get all orders with optional status filter
// ------------------------------------------------------------
export const getAllOrders = async (req, res) => {
  const { status } = req.query;
  try {
    const orders = await prisma.order.findMany({
      where: status ? { status } : {},
      include: {
        table: { select: { table_number: true } },
        user:  { select: { username: true, role: true } },
        order_items: {
          include: {
            menu_item: { select: { item_name: true, price: true } },
          },
        },
        // completed payments only — lets the cashier list reliably tell a
        // paid order from an unpaid one even if order.status ever desyncs
        // (e.g. legacy orders paid before status was set to "Paid").
        payments: { where: { status: "Completed" }, select: { payment_id: true } },
      },
      orderBy: { order_date: "desc" },
    });

    // Expose a single clean flag the cashier list can trust: an order is paid
    // if its status says so OR it has a completed payment (covers legacy rows
    // whose status was never updated). Drop the raw payments array.
    // Also attach each order's computed daily waiting number, so the
    // cashier can search/filter by it.
    const queueNumbers = await attachQueueNumbers(orders);
    const shaped = orders.map(({ payments, ...o }) => ({
      ...o,
      is_paid: o.status === "Paid" || (payments?.length || 0) > 0,
      queue_number: queueNumbers.get(o.order_id),
    }));
    res.json(shaped);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ------------------------------------------------------------
// GET /api/orders/:id
// Get single order with all items and payments
// ------------------------------------------------------------
export const getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { order_id: parseInt(req.params.id) },
      include: {
        table: { select: { table_number: true } },
        user:  { select: { username: true, role: true } },
        order_items: {
          include: {
            menu_item: { select: { item_name: true, price: true } },
          },
        },
        payments: true,
      },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ------------------------------------------------------------
// GET /api/orders/table/:tableId
// Get active order for a table (status != Paid)
// Returns null if no active order
// ------------------------------------------------------------
export const getActiveOrderByTable = async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: {
        table_id: parseInt(req.params.tableId),
        status: { not: "Paid" },
        // a paid-but-not-marked-"Paid" order is finished — don't treat it as
        // the table's active session, so each table starts fresh after payment
        payments: { none: { status: "Completed" } },
      },
      include: {
        order_items: {
          include: {
            // image_url included specifically for the guest-facing order
            // status page, which shows item photos
            menu_item: { select: { item_name: true, price: true, image_url: true } },
          },
        },
      },
    });
    if (!order) return res.json(null);

    const queue_number = await getQueueNumber(order);
    res.json({ ...order, queue_number });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ------------------------------------------------------------
// GET /api/orders/unconfirmed
// Cashier/admin only — orders placed by guests that haven't been
// confirmed as a real customer yet.
// ------------------------------------------------------------
export const getUnconfirmedOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        confirmed: false,
        status: { not: "Paid" },
      },
      include: {
        table: { select: { table_number: true } },
        order_items: {
          include: {
            menu_item: { select: { item_name: true, price: true } },
          },
        },
      },
      orderBy: { order_date: "asc" },
    });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ------------------------------------------------------------
// POST /api/orders
// Create new order + set table as occupied
// Body: { table_id, note? }
//
// Guest-placed orders start as confirmed = false and are NOT emitted to
// kitchen/barista rooms yet — only to the cashier room, since they still
// need to clear the confirmation gate first. Staff-placed orders are
// trusted immediately and go straight to the relevant queue rooms too
// (handled by addItem in orderItem.controller.js, since that's when
// individual items actually get attached to the order).
// ------------------------------------------------------------
export const createOrder = async (req, res) => {
  const { table_id, note, party_size, channel, latitude, longitude } = req.body;

  if (!table_id) {
    return res.status(400).json({ message: "table_id is required" });
  }

  // Guest orders declare channel:"guest" and must prove they're physically
  // at the café. Staff-placed orders (cashier) don't send this and skip
  // the check entirely.
  if (channel === "guest") {
    const check = verifyGuestLocation(latitude, longitude);
    if (!check.ok) return res.status(check.status).json({ message: check.message });
  }

  try {
    const table = await prisma.table.findUnique({
      where: { table_id: parseInt(table_id) },
    });

    if (!table)
      return res.status(404).json({ message: "Table not found" });

    const existingOrder = await prisma.order.findFirst({
      where: {
        table_id: parseInt(table_id),
        status: { not: "Paid" },
        // ignore orders that are already paid but whose status was never
        // updated to "Paid" (legacy rows) — they shouldn't block the table
        payments: { none: { status: "Completed" } },
      },
    });

    if (existingOrder) {
      return res.status(400).json({
        message: "Table already has an active order",
        order_id: existingOrder.order_id,
      });
    }

    const isGuest = !req.user?.userId;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          table_id:  parseInt(table_id),
          user_id:   req.user?.userId ?? null,
          note:      note || null,
          party_size: party_size ? parseInt(party_size) : null,
          // Guest orders auto-confirm here — by this point a "guest"
          // channel order has already passed the GPS location check above
          // (or the check is disabled), so there's no separate manual
          // cashier-approval step. Staff-placed orders were already
          // auto-confirmed as before.
          confirmed: true,
        },
        include: {
          table: { select: { table_number: true } },
        },
      });

      await tx.table.update({
        where: { table_id: parseInt(table_id) },
        data:  { is_available: false },
      });

      return newOrder;
    });

    // Real-time: tell cashier a new order exists (confirmed or not — they
    // see everything). Also tell anyone watching this table directly.
    const io = getIO();
    io.to("role:cashier").emit("order:new", order);
    io.to(`table:${order.table_id}`).emit("order:new", order);
    // table just became occupied — admin/cashier table views update live
    io.to("role:admin").to("role:cashier").emit("table:updated", {
      table_id: order.table_id,
      is_available: false,
    });

    // Computed on the fly (not stored) — this order's position among
    // today's orders, oldest first.
    const queue_number = await getQueueNumber(order);

    res.status(201).json({ ...order, queue_number });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ------------------------------------------------------------
// PATCH /api/orders/:id/confirm
// Cashier/admin only — confirms a guest order is a real customer.
// Once confirmed, kitchen/barista rooms are notified for the first time.
// ------------------------------------------------------------
export const confirmOrder = async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { order_id: parseInt(req.params.id) },
      data:  { confirmed: true },
      include: {
        table: { select: { table_number: true } },
        order_items: {
          include: { menu_item: { select: { item_name: true, category: { select: { type: true } } } } },
        },
      },
    });

    const io = getIO();
    io.to("role:cashier").emit("order:confirmed", order);

    // now that it's confirmed, kitchen/barista can see it for the first
    // time — split items by category type so each room only gets what's
    // relevant to them
    const hasFood  = order.order_items.some(oi => oi.menu_item?.category?.type === "food");
    const hasDrink = order.order_items.some(oi => oi.menu_item?.category?.type === "drink");
    if (hasFood)  io.to("role:kitchen").emit("order:new", order);
    if (hasDrink) io.to("role:barista").emit("order:new", order);

    res.json(order);
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ message: "Order not found" });
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ------------------------------------------------------------
// PATCH /api/orders/:id/status
// Update order status
// Body: { status }
// ------------------------------------------------------------
export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["Pending", "Preparing", "Served", "Paid"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      message: `Status must be one of: ${validStatuses.join(", ")}`,
    });
  }

  try {
    const order = await prisma.order.update({
      where: { order_id: parseInt(req.params.id) },
      data:  { status },
    });

    const io = getIO();
    io.to("role:cashier").to("role:kitchen").to("role:barista").to("role:admin")
      .emit("order:status_changed", order);
    io.to(`table:${order.table_id}`).emit("order:status_changed", order);

    res.json(order);
  } catch (error) {
    console.log(error);
    if (error.code === "P2025")
      return res.status(404).json({ message: "Order not found" });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ------------------------------------------------------------
// DELETE /api/orders/:id
// Cancel order — admin/cashier only, only while status is Pending
// Also frees the table. Doubles as "Reject" for unconfirmed orders.
// ------------------------------------------------------------
export const deleteOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { order_id: parseInt(req.params.id) },
    });

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    if (order.status !== "Pending") {
      return res.status(400).json({
        message: "Cannot cancel order that is already being prepared",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({
        where: { order_id: parseInt(req.params.id) },
      });

      await tx.order.delete({
        where: { order_id: parseInt(req.params.id) },
      });

      await tx.table.update({
        where: { table_id: order.table_id },
        data:  { is_available: true },
      });
    });

    const io = getIO();
    io.to("role:cashier").to("role:kitchen").to("role:barista").to("role:admin")
      .emit("order:deleted", { order_id: order.order_id, table_id: order.table_id });
    io.to(`table:${order.table_id}`).emit("order:deleted", { order_id: order.order_id });
    // table is free again
    io.to("role:admin").to("role:cashier").emit("table:updated", {
      table_id: order.table_id,
      is_available: true,
    });

    res.json({ message: "Order cancelled" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET /api/orders/history?date=2026-06-19
// Returns all orders for a specific day (defaults to today) with full
// item and payment breakdown — used by the admin Order History page.
// date param is in YYYY-MM-DD format, interpreted as server local time.
export const getOrderHistory = async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split("T")[0];
    const start = new Date(`${dateStr}T00:00:00.000Z`);
    const end   = new Date(`${dateStr}T23:59:59.999Z`);

    // Optional table filter — when present, only that table's orders for the day.
    const tableId = req.query.table_id ? parseInt(req.query.table_id) : null;

    const orders = await prisma.order.findMany({
      where: {
        order_date: { gte: start, lte: end },
        ...(tableId ? { table_id: tableId } : {}),
      },
      include: {
        table: { select: { table_number: true } },
        user:  { select: { username: true, role: true } },
        order_items: {
          include: {
            menu_item: {
              select: {
                item_name: true,
                price: true,
                category: { select: { category_name: true, type: true } },
              },
            },
          },
        },
        payments: {
          include: {
            method: { select: { method_name: true } },
          },
        },
      },
      orderBy: { order_date: "desc" },
    });

    // Summary stats for the day — useful to surface at the top of the
    // history page without the frontend having to aggregate them itself.
    const totalRevenue = orders
      .filter(o => o.status === "Paid")
      .reduce((sum, o) => {
        return sum + o.order_items.reduce((s, oi) => s + Number(oi.unit_price) * oi.quantity, 0);
      }, 0);

    res.json({
      date: dateStr,
      table_id: tableId,
      orders,
      summary: {
        total_orders: orders.length,
        paid_orders: orders.filter(o => o.status === "Paid").length,
        total_revenue: totalRevenue.toFixed(2),
      },
    });
  } catch (error) {
    console.error("getOrderHistory error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
