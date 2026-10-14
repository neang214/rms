import { useEffect } from "react"
import { useDashboardStore } from "../../context/dashboardContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { RevenueStats, TopSellingTable, PeakHoursCard } from "@/components/admin/DashboardParts"

export default function Dashboard() {
  usePageTitle("Dashboard")
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

  useEffect(() => {
    fetchTopSelling()
    fetchPeakHours()
    fetchDailyRevenue()
    fetchWeeklyRevenue()
    fetchMonthlyRevenue()
  }, [fetchDailyRevenue, fetchWeeklyRevenue, fetchMonthlyRevenue, fetchTopSelling, fetchPeakHours])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">Analytics Dashboard</h1>
        <p className="text-sm text-[var(--color-muted)] mt-0.5">Real-time revenue performance and product tracking.</p>
      </div>

      <RevenueStats dailyRevenue={dailyRevenue} weeklyRevenue={weeklyRevenue} monthlyRevenue={monthlyRevenue} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopSellingTable topSellingItems={topSellingItems} />
        <PeakHoursCard peakHours={peakHours} />
      </div>
    </div>
  )
}
