import prisma from "../../utils/db.js";

const getPhnomPenhStartOfDay = () => {
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Phnom_Penh",
  }).format(new Date());
  return new Date(`${todayStr}T00:00:00+07:00`);
};

const getPhnomPenhStartOfWeek = () => {
  const now = new Date();
  const ppDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Phnom_Penh",
  }).format(now);
  const ppDate = new Date(`${ppDateStr}T00:00:00+07:00`);
  const day = ppDate.getDay();
  ppDate.setDate(ppDate.getDate() - day);
  return ppDate;
};

const getPhnomPenhStartOfMonth = () => {
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Phnom_Penh",
  }).format(new Date());
  const [year, month] = todayStr.split("-");
  return new Date(`${year}-${month}-01T00:00:00+07:00`);
};

export const getDailyRevenue = async (req, res) => {
  try {
    const startOfDay = getPhnomPenhStartOfDay();

    const revenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: "Completed",
        payment_date: { gte: startOfDay },
      },
    });

    res.json({ total: revenue._sum.amount || 0 });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getWeeklyRevenue = async (req, res) => {
  try {
    const startOfWeek = getPhnomPenhStartOfWeek();

    const revenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: "Completed",
        payment_date: { gte: startOfWeek },
      },
    });

    res.json({ total: revenue._sum.amount || 0 });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMonthlyRevenue = async (req, res) => {
  try {
    const startOfMonth = getPhnomPenhStartOfMonth();

    const revenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: "Completed",
        payment_date: { gte: startOfMonth },
      },
    });

    res.json({ total: revenue._sum.amount || 0 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTopSelling = async (req, res) => {
  try {
    const topSell = await prisma.orderItem.groupBy({
      by: ["menu_item_id"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    const ids = topSell.map((i) => i.menu_item_id);
    const menuItems = ids.length
      ? await prisma.menuItem.findMany({
          where: { menu_item_id: { in: ids } },
          select: { menu_item_id: true, item_name: true, item_name_km: true },
        })
      : [];
    const byId = new Map(menuItems.map((m) => [m.menu_item_id, m]));

    const withNames = topSell.map((item) => {
      const menuItem = byId.get(item.menu_item_id);
      return {
        item_name: menuItem?.item_name || `Item #${item.menu_item_id}`,
        item_name_km: menuItem?.item_name_km || null,
        total_quantity: item._sum.quantity,
      };
    });

    res.json(withNames);
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const peakHour = async (req, res) => {
  try {
    const peakHours = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM (order_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Phnom_Penh'))::INT as hour,
        CAST(COUNT(*) AS INT) as total_orders
      FROM orders
      GROUP BY 1
      ORDER BY total_orders DESC, hour ASC
      LIMIT 5
    `;
    res.json(peakHours);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
