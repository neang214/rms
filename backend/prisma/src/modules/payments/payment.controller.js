import prisma from "../../utils/db.js";

export const getAllPayments = async (req, res) => {
    try {
        const payments = await prisma.payment.findMany({
            include: {
                order: {
                    select: {
                        order_id: true,
                        table: { select: { table_number: true } },
                    },
                },
                user: { select: { username: true } },
                method: { select: { method_name: true } },
            },
            orderBy: { payment_date: "desc" },
        });

        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPaymentById = async (req, res) => {
    try {
        const payment = await prisma.payment.findUnique({
            where: { payment_id: parseInt(req.params.id) },
            include: {
                order: {
                    select: {
                        order_id: true,
                        table: { select: { table_number: true } },
                    },
                },
                user: { select: { username: true } },
                method: { select: { method_name: true } },
            },
        });
        if (!payment)
            return res.status(404).json({ message: "Payment not found" });

        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPaymentByOrder = async (req, res) => {
    try {
        const payment = await prisma.payment.findFirst({
            where: { order_id: parseInt(req.params.orderId) },
            include: {
                method: { select: { method_name: true } },
            },
        });

        if (!payment)
            return res
                .status(404)
                .json({ message: "No payment found for this order" });

        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const createPayment = async (req, res) => {
    const { order_id, method_id, method_name } = req.body;
    // JWT payload uses camelCase userId, not snake_case user_id
    const user_id = req.user.userId;

    if (!order_id || (!method_id && !method_name))
        return res
            .status(400)
            .json({ message: "order_id and a payment method are required" });

    try {
        // 1. Fetch the order and verify it exists
        const order = await prisma.order.findUnique({
            where: { order_id: parseInt(order_id) },
            include: {
                order_items: true,
                // only fetch completed payments for double-payment check
                payments: { where: { status: "Completed" } },
            },
        });

        if (!order) return res.status(404).json({ message: "Order not found" });

        // 2. Block double-payment — prevents duplicate charge if cashier
        //    double-clicks Pay during a slow network moment
        if (order.payments.length > 0)
            return res
                .status(409)
                .json({ message: "This order has already been paid" });

        // 3. Belt-and-suspenders: also block if order status is already Paid
        //    in case payment record and order status ever desync
        if (order.status === "Paid")
            return res
                .status(409)
                .json({ message: "This order has already been paid" });

        // Block payment on an order the cashier hasn't confirmed yet — it must
        // be approved (or rejected) first, otherwise a customer could be
        // charged for an order that never went to the kitchen.
        if (order.confirmed === false)
            return res
                .status(400)
                .json({ message: "Order must be confirmed before it can be paid" });

        const totalAmount = order.order_items.reduce((sum, item) => {
            return sum + item.quantity * Number(item.unit_price);
        }, 0);

        // 4. Run all DB changes in a transaction so they succeed or fail together
        const result = await prisma.$transaction(async (tx) => {
            let resolvedMethodId = method_id ? parseInt(method_id) : null;
            if (method_name) {
                let m = await tx.paymentMethod.findFirst({ where: { method_name } });
                if (!m) m = await tx.paymentMethod.create({ data: { method_name } });
                resolvedMethodId = m.method_id;
            }

            const payment = await tx.payment.create({
                data: {
                    order: { connect: { order_id: parseInt(order_id) } },
                    method: { connect: { method_id: resolvedMethodId } },
                    user: { connect: { user_id: user_id } },
                    amount: totalAmount,
                    status: "Completed",
                },
            });

            // Mark the order as Paid
            await tx.order.update({
                where: { order_id: parseInt(order_id) },
                data: { status: "Paid" },
            });

            // Free up the table so it shows as available again
            if (order.table_id) {
                await tx.table.update({
                    where: { table_id: order.table_id },
                    data: { is_available: true },
                });
            }

            return payment;
        });

        res.status(201).json(result);
    } catch (error) {
        if (error.code === "P2003")
            return res
                .status(404)
                .json({ message: "Payment method not found" });
        console.error("createPayment error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updatePaymentStatus = async (req, res) => {
    const { status } = req.body;
    const validStatuses = ["Pending", "Completed", "Failed"];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            message: `Status must be one of: ${validStatuses.join(", ")}`,
        });
    }

    try {
        const payment = await prisma.payment.update({
            where: { payment_id: parseInt(req.params.id) },
            data: { status },
        });

        res.json(payment);
    } catch (error) {
        if (error.code === "P2025")
            return res.status(404).json({ message: "Payment not found" });
        res.status(500).json({ message: "Internal Server Error" });
    }
};
