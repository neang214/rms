import prisma from "./db.js";

/*
 * Computes a daily-reset "waiting number" for an order — its position among
 * all of today's orders, oldest first (#1, #2, #3...). This is calculated
 * on demand rather than stored on the order, so it needs no schema change
 * and works retroactively for orders that already exist.
 *
 * One shared sequence across the whole restaurant (kitchen + barista both
 * see the same number for a given order), matching a real takeout-counter
 * ticket system.
 *
 * Simplification: ties are broken by timestamp only (no order_id
 * tiebreak) — fine in practice since two orders landing in the exact same
 * millisecond is effectively never going to happen at café scale.
 */
export async function getQueueNumber(order) {
  const dateStr = new Date(order.order_date).toISOString().split("T")[0];
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);

  const countBefore = await prisma.order.count({
    where: {
      order_date: { gte: dayStart, lt: order.order_date },
    },
  });

  return countBefore + 1;
}

/*
 * Batch version — computes queue numbers for several orders at once
 * (e.g. the kitchen/barista queue, which usually holds a handful of
 * distinct orders at a time). Runs one count query per unique order;
 * fine at café scale, avoids the complexity of a single windowed SQL
 * query for a small, infrequently-changing list.
 */
export async function attachQueueNumbers(orders) {
  const map = new Map();
  for (const order of orders) {
    if (map.has(order.order_id)) continue;
    map.set(order.order_id, await getQueueNumber(order));
  }
  return map;
}
