import { useEffect } from "react"
import { usePaymentStore } from "../../context/paymentContext"
import { useOrderStore } from "../../context/orderContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { PaymentStats, ReportBuilder } from "@/components/admin/PaymentsParts"

export default function PaymentsReport() {
  usePageTitle("Payment & Report")
  const { payments, fetchPayments } = usePaymentStore()
  const { orders, fetchOrders, isLoading: ordersLoading } = useOrderStore()

  useEffect(() => {
    fetchPayments()
    fetchOrders()
  }, [])

  const todaysPayments = payments.filter(p => {
    const d = new Date(p.payment_date)
    const today = new Date()
    return d.toDateString() === today.toDateString() && p.status === "Completed"
  })

  const todaysRevenue = todaysPayments.reduce((s, p) => s + Number(p.amount), 0)


  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-display font-bold text-[var(--color-text)]">Payments & Reports</h1>

      <PaymentStats orders={orders} todaysPayments={todaysPayments} todaysRevenue={todaysRevenue} />

      <ReportBuilder orders={orders} ordersLoading={ordersLoading} periods={["Daily"]} />
    </div>
  )
}
