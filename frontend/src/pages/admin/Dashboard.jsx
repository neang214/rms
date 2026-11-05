import { useEffect, useCallback } from "react"
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
      <div>
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">{t("dashboard.title")}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-0.5">{t("dashboard.subtitle")}</p>
      </div>

      <RevenueStats dailyRevenue={dailyRevenue} weeklyRevenue={weeklyRevenue} monthlyRevenue={monthlyRevenue} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSellingTable topSellingItems={topSellingItems} />
        <PeakHoursCard peakHours={peakHours} />
      </div>
    </div>
  )
}
