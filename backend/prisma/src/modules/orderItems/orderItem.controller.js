import prisma from "../../utils/db.js";
import { verifyGuestLocation } from "../../utils/geo.js";
import { getIO } from "../../sockets/index.js";
import { attachQueueNumbers } from "../../utils/queueNumber.js";

const getQueue = async (type) => {
  const items = await prisma.orderItem.findMany({
    where: {
      status: { in: ["Pending", "Preparing"] },
      menu_item: {
        category: { type },
      },
      order: { confirmed: true },
    },
    include: {
      menu_item: {
        select: {
          item_name: true,
          category: { select: { category_name: true } },
        },
      },
      order: {
        select: {
          order_id: true,
          order_date: true,
          note: true,
          party_size: true,
          table: { select: { table_number: true } },
        },
      },
    },
    orderBy: {
      order: { order_date: "asc" },
    },
  });

  // Computed on the fly (not a stored column) — the same daily-reset
  // ticket number shown to the guest, attached here so kitchen/barista
  // tickets display the identical number.
  const queueNumbers = await attachQueueNumbers(items.map(i => i.order));
  return items.map(i => ({
    ...i,
    order: { ...i.order, queue_number: queueNumbers.get(i.order.order_id) },
  }));
};

export const getItemsByOrder = async (req, res) => {
  try {
    const items = await prisma.orderItem.findMany({
      where: { order_id: parseInt(req.params.orderId) },
      include: {
        menu_item: {
          select: { item_name: true, price: true },
        },
      },
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getKitchenQueue = async (req, res) => {
  try {
    const items = await getQueue("food");
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getBaristaQueue = async (req, res) => {
  try {
    const items = await getQueue("drink");
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ------------------------------------------------------------
// POST /api/order-items
// Guest or staff adds an item to an order. No auth required (guest QR
// ordering flow) but rate limited at the route level.
// ------------------------------------------------------------
export const addItem = async (req, res) => {
  const { order_id, menu_item_id, quantity, channel, latitude, longitude } = req.body;

  if (!order_id || !menu_item_id || !quantity) {
    return res.status(400).json({
      message: "Required fields missing: order_id, menu_item_id, quantity",
    });
  }

  // Same guest location gate as createOrder — covers the case where an
  // order already exists and the guest is just adding more items to it.
  if (channel === "guest") {
    const check = verifyGuestLocation(latitude, longitude);
    if (!check.ok) return res.status(check.status).json({ message: check.message });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { order_id: parseInt(order_id) },
      select: { order_id: true, status: true, confirmed: true, table_id: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Paid") {
      return res
        .status(400)
        .json({ message: "This order has already been paid and is closed" });
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { menu_item_id },
      select: { price: true, available: true, item_name: true, category: { select: { type: true } } },
    });

    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    if (!menuItem.available) {
      return res.status(400).json({ message: "Menu item is not available" });
    }

    const orderItem = await prisma.orderItem.create({
      data: {
        order_id: parseInt(order_id),
        menu_item_id: parseInt(menu_item_id),
        quantity: parseInt(quantity),
        unit_price: menuItem.price,
      },
      include: {
        menu_item: { select: { item_name: true, price: true } },
        order: { select: { order_id: true, table: { select: { table_number: true } } } },
      },
    });

    const io = getIO();

    // Cashier always sees new items land, regardless of confirmation state
    io.to("role:cashier").emit("order_item:new", orderItem);
    io.to(`table:${order.table_id}`).emit("order_item:new", orderItem);

    // Kitchen/barista only see it if the order has already cleared the
    // confirmation gate — unconfirmed guest orders stay invisible to them
    // until a cashier approves, same rule the queue query already enforces
    if (order.confirmed) {
      if (menuItem.category?.type === "food") {
        io.to("role:kitchen").emit("order_item:new", orderItem);
      } else if (menuItem.category?.type === "drink") {
        io.to("role:barista").emit("order_item:new", orderItem);
      }
    }

    res.status(201).json(orderItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ------------------------------------------------------------
// PATCH /api/order-items/:id/status
// Kitchen/barista mark item Pending -> Preparing -> Ready
// ------------------------------------------------------------
export const updateItemStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["Pending", "Preparing", "Ready"];

  if (!validStatuses.includes(status)) {
    return res
      .status(400)
      .json({ message: `Status must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    const orderItem = await prisma.orderItem.update({
      where: { order_item_id: parseInt(req.params.id) },
      data: { status },
      include: {
        menu_item: { select: { item_name: true, category: { select: { type: true } } } },
      },
    });

    const io = getIO();
    const room = orderItem.menu_item?.category?.type === "drink" ? "role:barista" : "role:kitchen";
    io.to(room).to("role:cashier").emit("order_item:status_changed", orderItem);

    if (status === "Ready") {
      const allItems = await prisma.orderItem.findMany({
        where: { order_id: orderItem.order_id },
        select: { status: true },
      });

      const allReady = allItems.every((item) => item.status === "Ready");

      if (allReady) {
        const updatedOrder = await prisma.order.update({
          where: { order_id: orderItem.order_id },
          data: { status: "Served" },
        });
        io.to("role:cashier").to("role:admin").emit("order:status_changed", updatedOrder);
        io.to(`table:${updatedOrder.table_id}`).emit("order:status_changed", updatedOrder);
      }
    }

    res.json(orderItem);
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ message: "Order item not found" });
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const orderItem = await prisma.orderItem.findUnique({
      where: { order_item_id: parseInt(req.params.id) },
    });

    if (!orderItem) {
      return res.status(404).json({ message: "Order item not found" });
    }

    if (orderItem.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Cannot remove item that is already being prepared" });
    }

    await prisma.orderItem.delete({
      where: { order_item_id: parseInt(req.params.id) },
    });

    res.status(200).json({ message: "Item successfully removed from order" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
