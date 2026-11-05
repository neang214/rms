import { useState, useEffect } from "react"
import { useOrderStore } from "../../context/orderContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { ReportBuilder, toLocalDateStr } from "@/components/admin/PaymentsParts"
import { useLang } from "@/i18n/LanguageContext"

export default function Reports() {
  const { t } = useLang()
  usePageTitle(t("nav.reports"))
  const { orders, fetchOrders, isLoading: ordersLoading } = useOrderStore()

  const todayStr = toLocalDateStr()
  const [activePeriod, setActivePeriod] = useState("Daily")
  const [customFrom, setCustomFrom] = useState(todayStr)
  const [customTo, setCustomTo] = useState(todayStr)

  useEffect(() => {
    fetchOrders().catch(() => {})
  }, [fetchOrders])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">{t("report.title")}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-0.5">
          {t("reports.filterSales")}
        </p>
      </div>

      <ReportBuilder
        activePeriod={activePeriod}
        setActivePeriod={setActivePeriod}
        customFrom={customFrom}
        setCustomFrom={setCustomFrom}
        customTo={customTo}
        setCustomTo={setCustomTo}
        orders={orders}
        ordersLoading={ordersLoading}
      />
    </div>
  )
}
