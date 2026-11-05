import { TrendingUp, Calendar, DollarSign, Flame, Clock } from "lucide-react"
import { Card, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui"
import { useLang } from "@/i18n/LanguageContext"
import { menuItemName } from "@/lib/utils"

export function RevenueStats({ dailyRevenue, weeklyRevenue, monthlyRevenue }) {
  const { t } = useLang()
  const revenueStats = [
    { label: t("dashboard.todayRevenue"), value: dailyRevenue?.total ? `$${Number(dailyRevenue.total).toFixed(2)}` : "$0.00", sub: t("dashboard.todaySub"), icon: TrendingUp, color: "text-[var(--color-primary)]" },
    { label: t("dashboard.weeklyRevenue"), value: weeklyRevenue?.total ? `$${Number(weeklyRevenue.total).toFixed(2)}` : "$0.00", sub: t("dashboard.weeklySub"), icon: Calendar, color: "text-[var(--color-info)]" },
    { label: t("dashboard.monthlyRevenue"), value: monthlyRevenue?.total ? `$${Number(monthlyRevenue.total).toFixed(2)}` : "$0.00", sub: t("dashboard.monthlySub"), icon: DollarSign, color: "text-[var(--color-plum)]" },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {revenueStats.map(({ label, value, sub, icon: Icon, color }) => (
        <Card key={label} className="p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">{label}</span>
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-muted)] flex items-center justify-center">
              <Icon size={16} className={color} />
            </div>
          </div>
          <div className="text-2xl font-bold text-[var(--color-text)] mb-1">{value}</div>
          <div className="text-xs text-[var(--color-muted)]">{sub}</div>
        </Card>
      ))}
    </div>
  )
}

export function TopSellingTable({ topSellingItems }) {
  const { t, lang } = useLang()
  return (
    <Card>
      <div className="p-5 pb-3 border-b border-[var(--color-border)] flex items-center gap-2">
        <Flame size={18} className="text-[var(--color-flame)]" />
        <div>
          <div className="font-semibold text-[var(--color-primary)] text-base">{t("dashboard.topSelling")}</div>
          <div className="text-xs text-[var(--color-muted)] mt-0.5">{t("dashboard.topSellingSub")}</div>
        </div>
      </div>

      <div className="p-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-16">{t("dashboard.rank")}</TableHead>
              <TableHead>{t("dashboard.itemName")}</TableHead>
              <TableHead className="text-right">{t("dashboard.unitsSold")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topSellingItems && topSellingItems.length > 0 ? (
              topSellingItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-bold text-[var(--color-muted)]">
                    #{index + 1}
                  </TableCell>
                  <TableCell className="font-medium text-[var(--color-text)]">
                    {menuItemName(item, lang)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="font-semibold">
                      {item.total_quantity} {t("dashboard.sold")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-xs text-[var(--color-muted)] py-6">
                  {t("dashboard.noSales")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

function formatHourLabel(hourNum) {
  const h = Number(hourNum)
  const suffix = h >= 12 ? "PM" : "AM"
  const hr12 = h % 12 === 0 ? 12 : h % 12
  return `${hr12}:00 ${suffix}`
}

export function PeakHoursCard({ peakHours = [] }) {
  const { t } = useLang()
  const maxOrders = peakHours.length > 0
    ? Math.max(...peakHours.map(p => Number(p.total_orders) || 0), 1)
    : 1

  return (
    <Card>
      <div className="p-5 pb-3 border-b border-[var(--color-border)] flex items-center gap-2">
        <Clock size={18} className="text-[var(--color-info)]" />
        <div>
          <div className="font-semibold text-[var(--color-primary)] text-base">{t("dashboard.peakHours")}</div>
          <div className="text-xs text-[var(--color-muted)] mt-0.5">{t("dashboard.peakHoursSub")}</div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {peakHours.length === 0 ? (
          <div className="text-center text-xs text-[var(--color-muted)] py-6">
            {t("dashboard.noSales")}
          </div>
        ) : (
          peakHours.map((row) => {
            const count = Number(row.total_orders) || 0
            const pct = Math.round((count / maxOrders) * 100)
            return (
              <div key={row.hour} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[var(--color-text)]">{formatHourLabel(row.hour)}</span>
                  <span className="font-semibold text-[var(--color-primary)]">
                    {count} {t("cashier.orders")}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[var(--color-primary-muted)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}
