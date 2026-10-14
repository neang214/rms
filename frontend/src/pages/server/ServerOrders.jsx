import { useState, useEffect } from "react"
import { ShoppingBag, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOrderStore } from "../../context/orderContext"
import { useSocketRole, useSocketEvent } from "../../services/socket"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useLang } from "@/i18n/LanguageContext"
import { PageHeader, StatsBar } from "@/components/shared"
import { orderTotal } from "@/components/cashier/orderHelpers"
import ActiveOrdersTable from "@/components/cashier/ActiveOrdersTable"
import ViewOrderDialog from "@/components/cashier/ViewOrderDialog"

export default function ServerOrders() {
  const { t } = useLang()
  usePageTitle("Order Management")
  const { orders, fetchOrders, isLoading } = useOrderStore()

  const [viewOrder, setViewOrder] = useState(null)
  const [search, setSearch] = useState("")

  useSocketRole("server")

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 60000)
    return () => clearInterval(interval)
  }, [])

  useSocketEvent("order:new", () => fetchOrders())
  useSocketEvent("order:confirmed", () => fetchOrders())
  useSocketEvent("order:status_changed", () => fetchOrders())
  useSocketEvent("order:deleted", () => fetchOrders())
  useSocketEvent("order_item:new", () => fetchOrders())
  useSocketEvent("order_item:status_changed", () => fetchOrders())

  const activeOrders = orders.filter(o => !(o.is_paid ?? o.status === "Paid") && o.confirmed !== false)

  const searchQuery = search.trim().toLowerCase()
  const searchDigits = searchQuery.replace(/\D/g, "")
  const searchAsNumber = searchDigits ? parseInt(searchDigits, 10) : null

  const searchedOrders = searchQuery
    ? activeOrders.filter(o =>
        String(o.table?.table_number ?? "").toLowerCase().includes(searchQuery) ||
        (searchAsNumber !== null && o.queue_number === searchAsNumber)
      )
    : activeOrders

  const stats = {
    active: activeOrders.length,
    pending: activeOrders.filter(o => o.status === "Pending").length,
    cooking: activeOrders.filter(o => o.status === "Preparing").length,
    ready: activeOrders.filter(o => o.status === "Served").length,
    total: activeOrders.reduce((s, o) => s + orderTotal(o), 0),
  }

  const grouped = {
    Served: searchedOrders.filter(o => o.status === "Served"),
    Preparing: searchedOrders.filter(o => o.status === "Preparing"),
    Pending: searchedOrders.filter(o => o.status === "Pending"),
  }

  const sectionConfig = [
    { key: "Served", label: t("cashier.readyForPayment"), sub: `${grouped.Served.length} ${t("cashier.orders")}`, accent: "text-[var(--color-primary)]", bar: "bg-[var(--color-primary)]" },
    { key: "Preparing", label: t("cashier.beingPrepared"), sub: `${grouped.Preparing.length} ${t("cashier.ordersInKitchen")}`, accent: "text-[var(--color-warning)]", bar: "bg-[var(--color-warning)]/80" },
    { key: "Pending", label: t("cashier.newOrders"), sub: `${grouped.Pending.length} ${t("cashier.ordersWaiting")}`, accent: "text-[var(--color-text-secondary)]", bar: "bg-[var(--color-muted)]" },
  ]

  return (
    <div className="space-y-4">
      <PageHeader icon={ShoppingBag} title={t("nav.orders")}
        subtitle={`• ${stats.active} active`} />

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Find by table # or waiting #"
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      <StatsBar columns={5} stats={[
        { label: t("cashier.statActive"), value: stats.active, color: "text-[var(--color-primary)]", bg: "bg-[var(--color-primary-muted)]" },
        { label: t("status.pending"), value: stats.pending, color: "text-[var(--color-warning)]", bg: "bg-[var(--color-accent-muted)]" },
        { label: t("status.cooking"), value: stats.cooking, color: "text-[var(--color-flame)]", bg: "bg-[var(--color-flame-muted)]" },
        { label: t("status.ready"), value: stats.ready, color: "text-[var(--color-primary)]", bg: "bg-[var(--color-primary-muted)]" },
        { label: t("common.total"), value: `$${stats.total.toFixed(2)}`, color: "text-[var(--color-plum)]", bg: "bg-[var(--color-plum-muted)]" },
      ]} />

      {isLoading && activeOrders.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-muted)] text-sm">Loading orders...</div>
      ) : activeOrders.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-muted)] text-sm">No active orders.</div>
      ) : searchQuery && searchedOrders.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-muted)] text-sm">No active order matches "{searchQuery}".</div>
      ) : (
        sectionConfig.map(({ key, label, sub, accent, bar }) => (
          grouped[key].length > 0 && (
            <div key={key}>
              <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-1 h-5 rounded-full", bar)} />
                <div>
                  <div className={cn("font-semibold text-sm", accent)}>{label}</div>
                  <div className="text-[10px] text-[var(--color-muted)]">{sub}</div>
                </div>
              </div>
              <ActiveOrdersTable orders={grouped[key]} onView={setViewOrder} />
            </div>
          )
        ))
      )}

      <ViewOrderDialog order={viewOrder} onClose={() => setViewOrder(null)} />
    </div>
  )
}
