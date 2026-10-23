
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { QRCodeSVG } from "qrcode.react"
import JsBarcode from "jsbarcode"

export const KHR_RATE = 4100

export function orderTotal(order) {
  return order.order_items?.reduce(
    (sum, oi) => sum + Number(oi.unit_price) * oi.quantity,
    0
  ) || 0
}

export const statusConfig = {
  Served:    { labelKey: "cashier.readyForPayment", color: "bg-[var(--color-primary)] text-white", barColor: "border-l-[var(--color-primary)]" },
  Preparing: { labelKey: "status.cooking",          color: "bg-[var(--color-accent-muted)] text-[var(--color-warning)]", barColor: "border-l-[var(--color-warning)]" },
  Pending:   { labelKey: "status.pending",          color: "bg-[var(--color-border)] text-[var(--color-text-secondary)]", barColor: "border-l-[var(--color-border-strong)]" },
}

export function escapeHtml(str) {
  if (!str) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function generateBarcodeSvg(value) {
  try {
    const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    JsBarcode(svgNode, value, {
      format: "CODE128",
      width: 1.6,
      height: 44,
      displayValue: true,
      fontSize: 11,
      font: "monospace",
      textMargin: 3,
      margin: 4,
    })
    svgNode.setAttribute("style", "max-width: 100%; height: auto; display: block; margin: 0 auto;")
    return svgNode.outerHTML
  } catch (err) {
    console.error("Barcode generation error:", err)
    return ""
  }
}

export function generateQrCodeSvg(value, size = 76) {
  try {
    return renderToStaticMarkup(
      React.createElement(QRCodeSVG, {
        value: String(value),
        size,
        level: "M",
        fgColor: "#000000",
        bgColor: "#ffffff",
      })
    )
  } catch (err) {
    console.error("QR generation error:", err)
    return ""
  }
}

export function executePrint(html) {
  // Use a hidden iframe to prevent popup blockers and eliminate premature window closure
  let frame = document.getElementById("__rms_print_frame__")
  if (!frame) {
    frame = document.createElement("iframe")
    frame.id = "__rms_print_frame__"
    frame.style.position = "fixed"
    frame.style.right = "0"
    frame.style.bottom = "0"
    frame.style.width = "0"
    frame.style.height = "0"
    frame.style.border = "0"
    document.body.appendChild(frame)
  }

  try {
    const doc = frame.contentWindow?.document || frame.contentDocument
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
      setTimeout(() => {
        try {
          frame.contentWindow.focus()
          frame.contentWindow.print()
        } catch (e) {
          console.error("Iframe print error:", e)
        }
      }, 150)
      return
    }
  } catch (err) {
    console.warn("Iframe print fallback:", err)
  }

  // Fallback to window.open if iframe is blocked
  const win = window.open("", "_blank", "width=800,height=700")
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => {
      try { win.print() } catch (e) {}
    }, 250)
  }
}

export function printOrderReceipt(order) {
  if (!order) return
  const total = orderTotal(order)
  const khr = Math.round(total * KHR_RATE)
  const payment = order.payments?.[0]
  const isPaid = order.status === "Paid" || !!payment

  const barcodeVal = `ORD-${String(order.order_id).padStart(4, "0")}`
  const barcodeSvg = generateBarcodeSvg(barcodeVal)
  const qrSvg = generateQrCodeSvg(barcodeVal, 76)

  const dt = new Date(order.order_date || Date.now()).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const lines = (order.order_items || []).map(oi => {
    const qty = Number(oi.quantity) || 1
    const price = Number(oi.unit_price || oi.menu_item?.price || 0)
    const lineTotal = price * qty
    const name = oi.menu_item?.item_name || "Item"
    return `<tr>
      <td class="qty">${qty}&times;</td>
      <td class="desc">
        <div class="name">${escapeHtml(name)}</div>
        ${oi.note ? `<div class="note">${escapeHtml(oi.note)}</div>` : ""}
      </td>
      <td class="price">$${price.toFixed(2)}</td>
      <td class="amount">$${lineTotal.toFixed(2)}</td>
    </tr>`
  }).join("")

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt #${String(order.order_id).padStart(4, "0")}</title>
    <style>
      @page {
        margin: 0;
        size: 80mm auto;
      }
      *, *::before, *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      html, body {
        width: 100%;
        background: #ffffff;
        color: #000000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
        font-size: 11px;
        line-height: 1.35;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .ticket {
        width: 74mm;
        max-width: 100%;
        margin: 0 auto;
        padding: 10px 8px;
      }
      .header {
        text-align: center;
        margin-bottom: 8px;
      }
      .brand {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .subbrand {
        font-size: 11px;
        font-weight: 600;
        color: #333;
      }
      .loc {
        font-size: 9px;
        color: #666;
        margin-top: 1px;
      }
      .divider {
        border: none;
        border-top: 1px dashed #777;
        margin: 6px 0;
      }
      .queue-card {
        border: 2px solid #000;
        border-radius: 4px;
        text-align: center;
        padding: 4px 0;
        margin: 6px 0;
      }
      .queue-label {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 1px;
      }
      .queue-value {
        font-size: 26px;
        font-weight: 900;
        line-height: 1;
        margin-top: 2px;
      }
      .meta {
        font-size: 10.5px;
        line-height: 1.45;
        margin-bottom: 4px;
      }
      .meta-row {
        display: flex;
        justify-content: space-between;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 6px 0;
      }
      th {
        font-size: 9.5px;
        font-weight: 700;
        text-transform: uppercase;
        border-bottom: 1px solid #000;
        padding-bottom: 3px;
      }
      td {
        padding: 3px 0;
        vertical-align: top;
      }
      .qty {
        width: 12%;
        font-weight: 700;
      }
      .desc {
        width: 50%;
        padding-right: 4px;
      }
      .price {
        width: 18%;
        text-align: right;
        color: #555;
      }
      .amount {
        width: 20%;
        text-align: right;
        font-weight: 700;
      }
      .name {
        font-weight: 600;
        word-break: break-word;
      }
      .note {
        font-size: 9px;
        color: #555;
        font-style: italic;
        margin-top: 1px;
      }
      .totals {
        margin-top: 4px;
      }
      .totals-row {
        display: flex;
        justify-content: space-between;
        padding: 2px 0;
      }
      .grand-total {
        font-size: 14px;
        font-weight: 900;
        border-top: 1px dashed #777;
        border-bottom: 1px dashed #777;
        padding: 4px 0;
        margin: 4px 0;
      }
      .riel-total {
        font-size: 12px;
        font-weight: 700;
      }
      .rate-note {
        font-size: 9px;
        color: #666;
      }
      .payment-status {
        text-align: center;
        border: 1px solid #000;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 1.5px;
        padding: 4px 0;
        margin: 6px 0;
      }
      .foot {
        text-align: center;
        font-size: 9.5px;
        color: #555;
        margin-top: 8px;
        line-height: 1.4;
      }
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="header">
        <div class="brand">ZOOM</div>
        <div class="subbrand">Garden Café &amp; Wine</div>
        <div class="loc">Sen Sok, Phnom Penh</div>
      </div>

      ${order.queue_number != null ? `
        <div class="queue-card">
          <div class="queue-label">ORDER QUEUE NUMBER</div>
          <div class="queue-value">#${order.queue_number}</div>
        </div>
      ` : ""}

      <hr class="divider" />

      <div class="meta">
        <div class="meta-row">
          <span><b>Order:</b> #${String(order.order_id).padStart(4, "0")}</span>
          <span><b>Table:</b> ${order.table?.table_number ?? "—"}</span>
        </div>
        <div class="meta-row">
          <span><b>Date:</b> ${dt}</span>
          ${order.party_size ? `<span><b>Guests:</b> ${order.party_size}</span>` : ""}
        </div>
        ${order.note ? `<div><b>Note:</b> ${escapeHtml(order.note)}</div>` : ""}
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align:left">Qty</th>
            <th style="text-align:left">Item</th>
            <th style="text-align:right">Price</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${lines}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row grand-total">
          <span>TOTAL (USD)</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        <div class="totals-row riel-total">
          <span>TOTAL (KHR)</span>
          <span>៛${khr.toLocaleString()}</span>
        </div>
        <div class="totals-row rate-note">
          <span>Exchange Rate</span>
          <span>$1.00 = ៛${KHR_RATE.toLocaleString()}</span>
        </div>
      </div>

      <hr class="divider" />

      ${isPaid ? `
        <div class="payment-status">*** PAID ***</div>
        <div class="meta-row" style="font-size:10.5px">
          <span>Payment Method:</span>
          <span><b>${escapeHtml(payment?.method?.method_name || "Completed")}</b></span>
        </div>
      ` : `
        <div class="payment-status">*** UNPAID BILL ***</div>
        <div style="text-align:center;font-size:9.5px;color:#555">
          Please settle payment at cashier
        </div>
      `}

      <div style="text-align:center;margin:10px 0 6px;padding:6px 0;border-top:1px dashed #777;border-bottom:1px dashed #777">
        ${qrSvg ? `
          <div style="display:flex;justify-content:center;margin-bottom:6px">
            <div style="background:#fff;padding:4px;border:1px solid #111;border-radius:4px;display:inline-block">
              ${qrSvg}
            </div>
          </div>
        ` : ""}
        <div style="display:flex;justify-content:center;overflow:hidden">
          ${barcodeSvg}
        </div>
        <div style="font-size:8px;color:#555;margin-top:4px;letter-spacing:0.5px">
          Scan barcode or QR code to lookup receipt
        </div>
      </div>

      <hr class="divider" />

      <div class="foot">
        <div>Thank you for dining with us!</div>
        <div>Please come again</div>
        <div style="font-size:8.5px;color:#888;margin-top:3px">
          Printed: ${new Date().toLocaleString("en-US", { dateStyle: "short", timeStyle: "medium" })}
        </div>
      </div>
    </div>
  </body>
</html>`

  executePrint(html)
}

export function printDailyReport({ date, displayDate, tableLabel, data }) {
  if (!data || !data.orders) return

  const rows = (data.orders || []).map(o => {
    const total = o.order_items?.reduce((s, oi) => s + Number(oi.unit_price) * oi.quantity, 0) || 0
    const khr = Math.round(total * KHR_RATE)
    const pay = o.payments?.[0]?.method?.method_name || "—"
    const time = new Date(o.order_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    return `<tr>
      <td style="font-weight:700">#${String(o.order_id).padStart(4, "0")}</td>
      <td>${o.table?.table_number ?? "—"}</td>
      <td>${time}</td>
      <td><span class="badge ${o.status === "Paid" ? "badge-paid" : ""}">${o.status}</span></td>
      <td style="text-align:center">${o.order_items?.length || 0}</td>
      <td style="text-align:right;font-weight:700">$${total.toFixed(2)}</td>
      <td style="text-align:right">៛${khr.toLocaleString()}</td>
      <td>${pay}</td>
    </tr>`
  }).join("")

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Daily Sales Report — ${displayDate || date}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1a1a1a; padding: 20px; font-size: 12px; line-height: 1.4; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px; }
    .brand { font-size: 22px; font-weight: 800; color: #059669; letter-spacing: -0.5px; }
    .sub { font-size: 11px; color: #666; margin-top: 2px; }
    .report-title { text-align: right; }
    .report-title h2 { font-size: 16px; font-weight: 700; color: #111; }
    .report-title p { font-size: 11px; color: #666; margin-top: 2px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
    .card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
    .card-value { font-size: 18px; font-weight: 800; color: #0f172a; }
    .card-value.primary { color: #059669; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f1f5f9; color: #334155; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; text-align: left; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11.5px; }
    tr:nth-child(even) td { background: #fafafa; }
    .badge { font-size: 9.5px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #475569; }
    .badge-paid { background: #ecfdf5; color: #059669; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ZOOM Garden Café &amp; Wine</div>
      <div class="sub">Sen Sok, Phnom Penh · RMS Daily Audit</div>
    </div>
    <div class="report-title">
      <h2>Daily Order &amp; Revenue Report</h2>
      <p><b>${displayDate || date}</b>${tableLabel ? ` · Table ${tableLabel}` : " · All Tables"}</p>
    </div>
  </div>

  <div class="summary-grid">
    <div class="card">
      <div class="card-label">Total Orders</div>
      <div class="card-value">${data.summary.total_orders}</div>
    </div>
    <div class="card">
      <div class="card-label">Paid Orders</div>
      <div class="card-value primary">${data.summary.paid_orders}</div>
    </div>
    <div class="card">
      <div class="card-label">Revenue (USD)</div>
      <div class="card-value primary">$${Number(data.summary.total_revenue).toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-label">Revenue (KHR)</div>
      <div class="card-value">៛${Math.round(Number(data.summary.total_revenue) * KHR_RATE).toLocaleString()}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Order #</th>
        <th>Table</th>
        <th>Time</th>
        <th>Status</th>
        <th style="text-align:center">Items</th>
        <th style="text-align:right">Total ($)</th>
        <th style="text-align:right">Total (៛)</th>
        <th>Paid Via</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="8" style="text-align:center;padding:16px;color:#94a3b8">No orders for this date</td></tr>`}
    </tbody>
  </table>

  <div class="footer">
    <div>ZOOM Garden Cafe &amp; Wine Management System</div>
    <div>Generated: ${new Date().toLocaleString()}</div>
  </div>
</body>
</html>`

  executePrint(html)
}

export function printExecutiveReport({ period, totalRevenue, paidOrders, avgOrderValue, periodOrders }) {
  const rows = (periodOrders || []).map(o => {
    const total = o.order_items?.reduce((s, oi) => s + Number(oi.unit_price) * oi.quantity, 0) || Number(o.total_price || 0)
    const dt = new Date(o.order_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
    const pay = o.payments?.[0]?.method?.method_name || "—"
    return `<tr>
      <td style="font-weight:700">#${String(o.order_id).padStart(4, "0")}</td>
      <td>${o.table?.table_number ?? "—"}</td>
      <td>${dt}</td>
      <td><span class="badge ${o.status === "Paid" ? "badge-paid" : ""}">${o.status}</span></td>
      <td style="text-align:center">${o.order_items?.length || 0}</td>
      <td style="text-align:right;font-weight:700">$${total.toFixed(2)}</td>
      <td>${pay}</td>
    </tr>`
  }).join("")

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Sales &amp; Revenue Report — ${period}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1a1a1a; padding: 20px; font-size: 12px; line-height: 1.4; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 16px; }
    .brand { font-size: 22px; font-weight: 800; color: #059669; letter-spacing: -0.5px; }
    .sub { font-size: 11px; color: #666; margin-top: 2px; }
    .report-title { text-align: right; }
    .report-title h2 { font-size: 16px; font-weight: 700; color: #111; }
    .report-title p { font-size: 11px; color: #666; margin-top: 2px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
    .card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
    .card-value { font-size: 18px; font-weight: 800; color: #0f172a; }
    .card-value.primary { color: #059669; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f1f5f9; color: #334155; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; text-align: left; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11.5px; }
    tr:nth-child(even) td { background: #fafafa; }
    .badge { font-size: 9.5px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #475569; }
    .badge-paid { background: #ecfdf5; color: #059669; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ZOOM Garden Café &amp; Wine</div>
      <div class="sub">Sen Sok, Phnom Penh · Executive Management Report</div>
    </div>
    <div class="report-title">
      <h2>Sales &amp; Revenue Report</h2>
      <p>Period: <b>${period}</b></p>
    </div>
  </div>

  <div class="summary-grid">
    <div class="card">
      <div class="card-label">Total Revenue</div>
      <div class="card-value primary">$${Number(totalRevenue).toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-label">Paid Orders</div>
      <div class="card-value primary">${paidOrders.length}</div>
    </div>
    <div class="card">
      <div class="card-label">Avg Order Value</div>
      <div class="card-value">$${Number(avgOrderValue).toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-label">Total Period Orders</div>
      <div class="card-value">${periodOrders.length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Order #</th>
        <th>Table</th>
        <th>Date / Time</th>
        <th>Status</th>
        <th style="text-align:center">Items</th>
        <th style="text-align:right">Total ($)</th>
        <th>Payment</th>
      </tr>
    </thead>
    <tbody>
      ${rows || `<tr><td colspan="7" style="text-align:center;padding:16px;color:#94a3b8">No orders for this period</td></tr>`}
    </tbody>
  </table>

  <div class="footer">
    <div>ZOOM Garden Cafe &amp; Wine Management System</div>
    <div>Generated: ${new Date().toLocaleString()}</div>
  </div>
</body>
</html>`

  executePrint(html)
}
