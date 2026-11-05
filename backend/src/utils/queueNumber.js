import prisma from "./db.js";

const ppDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Phnom_Penh",
});

export async function getQueueNumber(order) {
  const orderDate = new Date(order.order_date);
  const dateStr = ppDateFormatter.format(orderDate);
  const dayStart = new Date(`${dateStr}T00:00:00+07:00`);

  const countBefore = await prisma.order.count({
    where: {
      order_date: { gte: dayStart, lt: orderDate },
    },
  });

  return countBefore + 1;
}

export async function attachQueueNumbers(orders) {
  const map = new Map();
  if (!orders || orders.length === 0) return map;

  const uniqueDates = new Set();
  for (const order of orders) {
    if (!order?.order_date) continue;
    uniqueDates.add(ppDateFormatter.format(new Date(order.order_date)));
  }

  if (uniqueDates.size === 0) return map;

  const sortedDates = Array.from(uniqueDates).sort();
  const minStart = new Date(`${sortedDates[0]}T00:00:00+07:00`);
  const maxEnd = new Date(`${sortedDates[sortedDates.length - 1]}T23:59:59.999+07:00`);

  const allOrdersInRange = await prisma.order.findMany({
    where: {
      order_date: { gte: minStart, lte: maxEnd },
    },
    select: {
      order_id: true,
      order_date: true,
    },
    orderBy: [{ order_date: "asc" }, { order_id: "asc" }],
  });

  const byDay = new Map();
  for (const o of allOrdersInRange) {
    const dStr = ppDateFormatter.format(new Date(o.order_date));
    let list = byDay.get(dStr);
    if (!list) {
      list = [];
      byDay.set(dStr, list);
    }
    list.push(o);
  }

  const queueById = new Map();
  for (const list of byDay.values()) {
    for (let i = 0; i < list.length; i++) {
      queueById.set(list[i].order_id, i + 1);
    }
  }

  for (const order of orders) {
    if (!order || map.has(order.order_id)) continue;
    map.set(order.order_id, queueById.get(order.order_id) ?? 1);
  }

  return map;
}
