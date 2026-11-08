import { useEffect, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import { useDashboardStore } from "../../context/dashboardContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useLang } from "@/i18n/LanguageContext"
import { useSocketRole, useSocketEvent } from "../../services/socket"
import { RevenueStats, TopSellingTable, PeakHoursCard } from "@/components/admin/DashboardParts"

export default function Dashboard() {
  const { t } = useLang()
  usePageTitle(t("dashboard.title"))
  const {
    dailyRevenue,
    weeklyRevenue,
    monthlyRevenue,
    topSellingItems,
    peakHours,
    isLoading,
    fetchDailyRevenue,
    fetchWeeklyRevenue,
    fetchMonthlyRevenue,
    fetchTopSelling,
    fetchPeakHours,
  } = useDashboardStore()

  const refreshAll = useCallback(() => {
    fetchTopSelling()
    fetchPeakHours()
    fetchDailyRevenue()
    fetchWeeklyRevenue()
    fetchMonthlyRevenue()
  }, [fetchDailyRevenue, fetchWeeklyRevenue, fetchMonthlyRevenue, fetchTopSelling, fetchPeakHours])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  useSocketRole("admin")
  useSocketEvent("payment:completed", refreshAll)
  useSocketEvent("order:new", refreshAll)
  useSocketEvent("order:status_changed", refreshAll)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">{t("dashboard.title")}</h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
              {t("tables.live")}
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted)] mt-1">{t("dashboard.subtitle")}</p>
        </div>

        <button
          onClick={refreshAll}
          disabled={isLoading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 text-xs font-semibold text-[var(--color-text-secondary)] transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          {t("guest.refresh")}
        </button>
      </div>

      <RevenueStats dailyRevenue={dailyRevenue} weeklyRevenue={weeklyRevenue} monthlyRevenue={monthlyRevenue} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <TopSellingTable topSellingItems={topSellingItems} />
        <PeakHoursCard peakHours={peakHours} />
      </div>
    </div>
  )
}
