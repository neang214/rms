import { TrendingUp, Calendar, DollarSign, Flame, Clock } from "lucide-react"
import { Card, Badge } from "@/components/ui"
import { useLang } from "@/i18n/LanguageContext"
import { cn, menuItemName } from "@/lib/utils"

const KHR_RATE = 4100

export function RevenueStats({ dailyRevenue, weeklyRevenue, monthlyRevenue }) {
  const { t } = useLang()
  const dailyVal = Number(dailyRevenue?.total || 0)
  const weeklyVal = Number(weeklyRevenue?.total || 0)
  const monthlyVal = Number(monthlyRevenue?.total || 0)

  const revenueStats = [
    {
      label: t("dashboard.todayRevenue"),
      usd: `$${dailyVal.toFixed(2)}`,
      khr: `៛${Math.round(dailyVal * KHR_RATE).toLocaleString()}`,
      sub: t("dashboard.todaySub"),
      icon: TrendingUp,
      iconBg: "bg-[var(--color-primary-muted)] text-[var(--color-primary)]",
      accentBar: "bg-[var(--color-primary)]",
    },
    {
      label: t("dashboard.weeklyRevenue"),
      usd: `$${weeklyVal.toFixed(2)}`,
      khr: `៛${Math.round(weeklyVal * KHR_RATE).toLocaleString()}`,
      sub: t("dashboard.weeklySub"),
      icon: Calendar,
      iconBg: "bg-[var(--color-info-muted)] text-[var(--color-info)]",
      accentBar: "bg-[var(--color-info)]",
    },
    {
      label: t("dashboard.monthlyRevenue"),
      usd: `$${monthlyVal.toFixed(2)}`,
      khr: `៛${Math.round(monthlyVal * KHR_RATE).toLocaleString()}`,
      sub: t("dashboard.monthlySub"),
      icon: DollarSign,
      iconBg: "bg-[var(--color-plum-muted)] text-[var(--color-plum)]",
      accentBar: "bg-[var(--color-plum)]",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {revenueStats.map(({ label, usd, khr, sub, icon: Icon, iconBg, accentBar }) => (
        <Card key={label} className="relative overflow-hidden p-5 hover:shadow-md transition-shadow">
          <div className={cn("absolute top-0 left-0 right-0 h-1", accentBar)} />
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">{label}</span>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
              <Icon size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-[var(--color-text)]">{usd}</span>
            <span className="text-xs font-semibold text-[var(--color-muted)]">{khr}</span>
          </div>
          <div className="text-xs text-[var(--color-muted)]">{sub}</div>
        </Card>
      ))}
    </div>
  )
}

function rankBadgeStyle(index) {
  if (index === 0) return "bg-[var(--color-accent-muted)] text-[var(--color-warning)] border border-[var(--color-warning)]/30"
  if (index === 1) return "bg-[var(--color-primary-muted)] text-[var(--color-primary)] border border-[var(--color-primary)]/25"
  if (index === 2) return "bg-[var(--color-flame-muted)] text-[var(--color-flame)] border border-[var(--color-flame)]/25"
  return "bg-[var(--color-background)] text-[var(--color-muted)] border border-[var(--color-border)]"
}

export function TopSellingTable({ topSellingItems = [] }) {
  const { t, lang } = useLang()
  const items = topSellingItems.slice(0, 5)
  const maxQty = items.length > 0
    ? Math.max(...items.map(i => Number(i.total_quantity) || 0), 1)
    : 1

  return (
    <Card className="overflow-hidden">
      <div className="p-5 pb-4 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-flame-muted)] text-[var(--color-flame)] flex items-center justify-center shrink-0">
            <Flame size={19} />
          </div>
          <div>
            <div className="font-semibold text-[var(--color-text)] text-base">{t("dashboard.topSelling")}</div>
            <div className="text-xs text-[var(--color-muted)] mt-0.5">{t("dashboard.topSellingSub")}</div>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">
          Top {items.length || 5}
        </Badge>
      </div>

      <div className="p-5 space-y-3.5">
        {items.length > 0 ? (
          items.map((item, index) => {
            const qty = Number(item.total_quantity) || 0
            const pct = Math.max(Math.round((qty / maxQty) * 100), 6)
            return (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn("w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0", rankBadgeStyle(index))}>
                      #{index + 1}
                    </span>
                    <span className="font-medium text-sm text-[var(--color-text)] truncate">
                      {menuItemName(item, lang)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-semibold shrink-0">
                    {qty} {t("dashboard.sold")}
                  </Badge>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--color-background)] border border-[var(--color-border)]/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-flame)] transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center text-xs text-[var(--color-muted)] py-8">
            {t("dashboard.noSales")}
          </div>
        )}
      </div>
    </Card>
  )
}

function formatHourRange(hourNum) {
  const fmt = (h) => {
    const normalized = ((h % 24) + 24) % 24
    const suffix = normalized >= 12 ? "PM" : "AM"
    const hr12 = normalized % 12 === 0 ? 12 : normalized % 12
    return `${hr12}:00 ${suffix}`
  }
  const h = Number(hourNum)
  return `${fmt(h)} – ${fmt(h + 1)}`
}

export function PeakHoursCard({ peakHours = [] }) {
  const { t } = useLang()

  // Sort by highest order count and show only the Top 5 busiest hours
  const topPeakHours = [...peakHours]
    .filter(p => Number(p.total_orders) > 0)
    .sort((a, b) => Number(b.total_orders) - Number(a.total_orders))
    .slice(0, 5)

  const maxOrders = topPeakHours.length > 0
    ? Math.max(...topPeakHours.map(p => Number(p.total_orders) || 0), 1)
    : 1

  return (
    <Card className="overflow-hidden">
      <div className="p-5 pb-4 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-info-muted)] text-[var(--color-info)] flex items-center justify-center shrink-0">
            <Clock size={19} />
          </div>
          <div>
            <div className="font-semibold text-[var(--color-text)] text-base">{t("dashboard.peakHours")}</div>
            <div className="text-xs text-[var(--color-muted)] mt-0.5">{t("dashboard.peakHoursSub")}</div>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">
          Top {topPeakHours.length || 5}
        </Badge>
      </div>

      <div className="p-5 space-y-3.5">
        {topPeakHours.length === 0 ? (
          <div className="text-center text-xs text-[var(--color-muted)] py-8">
            {t("dashboard.noSales")}
          </div>
        ) : (
          topPeakHours.map((row, index) => {
            const count = Number(row.total_orders) || 0
            const pct = Math.max(Math.round((count / maxOrders) * 100), 6)
            return (
              <div key={row.hour} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn("w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0", rankBadgeStyle(index))}>
                      #{index + 1}
                    </span>
                    <span className="font-medium text-sm text-[var(--color-text)] truncate">
                      {formatHourRange(row.hour)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-semibold shrink-0">
                    {count} {t("cashier.orders")}
                  </Badge>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--color-background)] border border-[var(--color-border)]/60 overflow-hidden">
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
