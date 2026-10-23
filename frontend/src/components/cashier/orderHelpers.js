
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

function escapeHtml(str) {
  if (!str) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function executePrint(html) {
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

  // Graceful fallback to window.open if iframe is blocked
  const win = window.open("", "_blank", "width=380,height=640")
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
