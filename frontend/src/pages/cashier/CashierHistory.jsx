import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Receipt, ChevronDown, ChevronUp, Clock, Package, Printer, Users, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOrderStore } from "../../context/orderContext"
import { useTableStore } from "../../context/tableContext"
import { usePageTitle } from "../../hooks/usePageTitle"
import { PageHeader, StatsBar, LoadingState, EmptyState } from "@/components/shared"
import { printOrderReceipt, printDailyReport } from "@/components/cashier/orderHelpers"

const KHR_RATE = 4100

const statusCfg = {
  Pending:   { label: "Pending",   color: "text-[var(--color-text-secondary)]",   bg: "bg-[var(--color-border)]" },
  Preparing: { label: "Preparing", color: "text-[var(--color-warning)]",  bg: "bg-[var(--color-accent-muted)]" },
  Served:    { label: "Served",    color: "text-[var(--color-info)]",   bg: "bg-[var(--color-info-muted)]" },
  Paid:      { label: "Paid",      color: "text-[var(--color-primary)]",  bg: "bg-[var(--color-primary-muted)]" },
}

function toLocalDateStr(date = new Date()) {
  return date.toISOString().split("T")[0]
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function OrderRow({ order }) {
  const [open, setOpen] = useState(false)
  const cfg = statusCfg[order.status] || statusCfg.Pending
  const total = order.order_items?.reduce((s, oi) => s + Number(oi.unit_price) * oi.quantity, 0) || 0
  const payment = order.payments?.[0]

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-primary-muted)] transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-muted)] flex items-center justify-center shrink-0">
          <Receipt size={14} className="text-[var(--color-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              #{String(order.order_id).padStart(4, "0")}
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              Table {order.table?.table_number}
            </span>
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>
              {cfg.label}
            </span>
          </div>
          <div className="text-xs text-[var(--color-muted)] mt-0.5">
            {formatTime(order.order_date)} · {order.order_items?.length || 0} item{order.order_items?.length !== 1 ? "s" : ""}
            {order.user && ` · ${order.user.username}`}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-[var(--color-text)]">${total.toFixed(2)}</div>
          {payment && (
            <div className="text-[10px] text-[var(--color-muted)]">{payment.method?.method_name}</div>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-[var(--color-muted)] shrink-0" /> : <ChevronDown size={14} className="text-[var(--color-muted)] shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-[var(--color-border)] px-4 py-3 space-y-3">
          <div className="space-y-2">
            {order.order_items?.map(oi => (
              <div key={oi.order_item_id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-[10px] font-bold flex items-center justify-center shrink-0">
                    {oi.quantity}
                  </span>
                  <span className="text-[var(--color-text)]">{oi.menu_item?.item_name}</span>
                  <span className="text-[10px] text-[var(--color-muted)] capitalize">
                    ({oi.menu_item?.category?.type})
                  </span>
                </div>
                <span className="text-[var(--color-text)] font-medium">
                  ${(Number(oi.unit_price) * oi.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--color-border)] pt-2 flex justify-between items-center">
            <div className="text-xs text-[var(--color-muted)]">
              {payment ? (
                <span>Paid via {payment.method?.method_name} at {formatTime(payment.payment_date)}</span>
              ) : (
                <span className="text-[var(--color-warning)]">Not yet paid</span>
              )}
            </div>
            <div className="text-sm font-bold text-[var(--color-primary)]">
              ${total.toFixed(2)}
              <span className="text-xs font-normal text-[var(--color-muted)] ml-1">
                ៛{Math.round(total * KHR_RATE).toLocaleString()}
              </span>
            </div>
          </div>

          {order.party_size != null && (
            <div className="text-xs text-[var(--color-muted)] flex items-center gap-1">
              <Users size={12} /> {order.party_size} guest{order.party_size !== 1 ? "s" : ""}
            </div>
          )}

          {order.note && (
            <div className="text-xs text-[var(--color-muted)] italic bg-[var(--color-primary-muted)] rounded-lg px-3 py-2">
              Note: {order.note}
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={() => printOrderReceipt(order)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all">
              <Printer size={13} /> Print receipt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DateNav({ date, max, isToday, onPrev, onNext, onPick }) {
  return (
    <div className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2">
      <button onClick={onPrev} className="p-1 rounded-lg hover:bg-[var(--color-primary-muted)] text-[var(--color-muted)]">
        <ChevronLeft size={15} />
      </button>
      <input
        type="date"
        value={date}
        max={max}
        onChange={e => e.target.value && onPick(e.target.value)}
        className="text-sm font-medium text-[var(--color-text)] bg-transparent outline-none cursor-pointer"
      />
      <button onClick={onNext} disabled={isToday}
        className={cn("p-1 rounded-lg text-[var(--color-muted)]", !isToday && "hover:bg-[var(--color-primary-muted)]")}>
        <ChevronRight size={15} />
      </button>
    </div>
  )
}

function TableFilter({ tables, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--color-muted)]">Table</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm font-medium text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 outline-none focus:border-[var(--color-primary)] cursor-pointer"
      >
        <option value="">All tables</option>
        {tables.map(t => (
          <option key={t.table_id} value={t.table_id}>{t.table_number}</option>
        ))}
      </select>
    </div>
  )
}

export default function CashierHistory() {
  usePageTitle("Order History")
  const { fetchOrderHistory } = useOrderStore()
  const { tables, fetchTables } = useTableStore()

  const [date, setDate] = useState(toLocalDateStr())
  const [tableId, setTableId] = useState("")     // "" = all tables
  const [search, setSearch] = useState("")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { fetchTables() }, [])

  const load = async (d, t) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOrderHistory(d, t || undefined)
      setData(result)
    } catch {
      setError("Failed to load order history.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(date, tableId) }, [date, tableId])

  const prevDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    setDate(toLocalDateStr(d))
  }

  const nextDay = () => {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    const today = toLocalDateStr()
    if (toLocalDateStr(d) <= today) setDate(toLocalDateStr(d))
  }

  const isToday = date === toLocalDateStr()

  const displayDate = new Date(date + "T12:00:00").toLocaleDateString([], {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  })

  const tableLabel = tableId
    ? tables.find(t => String(t.table_id) === String(tableId))?.table_number
    : null

  const handlePrint = () => {
    if (!data || !data.orders?.length) return
    printDailyReport({ date, displayDate, tableLabel, data })
  }

  const canPrint = !loading && data && data.orders?.length > 0

  const searchQuery = search.trim().toLowerCase()
  const searchDigits = searchQuery.replace(/\D/g, "")
  const searchAsNumber = searchDigits ? parseInt(searchDigits, 10) : null

  const filteredOrders = (data?.orders || []).filter(o => {
    if (!searchQuery) return true
    const orderIdStr = String(o.order_id)
    const padded = orderIdStr.padStart(4, "0")
    if (
      (searchAsNumber !== null && o.order_id === searchAsNumber) ||
      orderIdStr.includes(searchQuery) ||
      padded.includes(searchQuery) ||
      `#${orderIdStr}`.includes(searchQuery) ||
      `#${padded}`.includes(searchQuery) ||
      `ord-${padded}`.toLowerCase().includes(searchQuery) ||
      `ord-${orderIdStr}`.toLowerCase().includes(searchQuery)
    ) return true

    if (String(o.table?.table_number ?? "").toLowerCase().includes(searchQuery)) return true
    if (o.note && o.note.toLowerCase().includes(searchQuery)) return true
    if (o.order_items?.some(oi => oi.menu_item?.item_name?.toLowerCase().includes(searchQuery))) return true
    if (o.payments?.some(p => p.method?.method_name?.toLowerCase().includes(searchQuery))) return true
    return false
  })

  return (
    <div className="space-y-4">
      <PageHeader icon={Clock} title="Order History"
        subtitle="Daily order & payment breakdown by table"
        right={<DateNav date={date} max={toLocalDateStr()} isToday={isToday} onPrev={prevDay} onNext={nextDay} onPick={setDate} />} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order # (e.g. #0042), table, or note..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <TableFilter tables={tables} value={tableId} onChange={setTableId} />
        </div>
        <button
          onClick={handlePrint}
          disabled={!canPrint}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 h-10 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          title={`Print Daily Report for ${displayDate}`}
        >
          <Printer size={15} /> Print Daily Report
        </button>
      </div>

      {data?.summary && (
        <StatsBar columns={3} stats={[
          { label: "Total Orders", value: data.summary.total_orders, color: "text-[var(--color-text)]" },
          { label: "Paid",         value: data.summary.paid_orders,  color: "text-[var(--color-primary)]" },
          { label: "Revenue",      value: `$${data.summary.total_revenue}`, color: "text-[var(--color-text)]" },
        ]} />
      )}

      {loading ? (
        <LoadingState text="Loading orders..." />
      ) : error ? (
        <div className="text-center py-16 text-[var(--color-danger)] text-sm">{error}</div>
      ) : !data || data.orders.length === 0 ? (
        <EmptyState icon={Package} text={`No orders on ${displayDate}${tableLabel ? ` for Table ${tableLabel}` : ""}`} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState icon={Package} text={`No orders matching "${search}" on ${displayDate}`} />
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-[var(--color-muted)] px-1">
            {displayDate}{tableLabel ? ` · Table ${tableLabel}` : ""}{search ? ` · ${filteredOrders.length} matching "${search}"` : ""}
          </div>
          {filteredOrders.map(order => (
            <OrderRow key={order.order_id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
