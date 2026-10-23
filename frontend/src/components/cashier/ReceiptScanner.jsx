import { useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { QrCode, X, Loader2 } from "lucide-react"

const SCANNER_ELEMENT_ID = "receipt-qr-scanner"

function extractOrderId(decodedText) {
  if (!decodedText) return null
  const clean = String(decodedText).trim()

  // 1. Matches ORD-0042, ORD-42, order:42, #42
  const prefMatch = clean.match(/(?:order:?|ORD-?|#)(\d+)/i)
  if (prefMatch) return parseInt(prefMatch[1], 10)

  // 2. Matches URL patterns like /orders/42 or ?order=42
  const urlMatch = clean.match(/[?&/]order[=_/-]?(\d+)/i)
  if (urlMatch) return parseInt(urlMatch[1], 10)

  // 3. Raw number (e.g. 0042 or 42)
  if (/^\d+$/.test(clean)) {
    return parseInt(clean, 10)
  }

  return null
}

export default function ReceiptScanner({ onFound, onClose }) {
  const [error, setError] = useState("")
  const scannerRef = useRef(null)
  const startedRef = useRef(false)

  const stopScanner = async () => {
    if (scannerRef.current && startedRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch {
        // already stopped — ignore
      }
    }
    startedRef.current = false
  }

  const handleClose = async () => {
    await stopScanner()
    onClose()
  }

  // Start scanning once the viewport div is mounted.
  const bindScanner = async (node) => {
    if (!node || startedRef.current) return
    startedRef.current = true
    try {
      const qr = new Html5Qrcode(SCANNER_ELEMENT_ID, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.UPC_A,
        ],
        verbose: false,
      })
      scannerRef.current = qr
      await qr.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 260, height: 180 } },
        async (decodedText) => {
          const orderId = extractOrderId(decodedText)
          if (orderId) {
            await stopScanner()
            onFound(orderId)
          } else {
            setError(`Scanned "${decodedText}". Please scan the receipt barcode or QR code.`)
          }
        },
        () => {
        }
      )
    } catch (err) {
      console.error(err)
      setError("Couldn't access the camera. Please allow camera permission and try again.")
      startedRef.current = false
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-white">
          <QrCode size={18} />
          <span className="text-sm font-medium">Scan receipt</span>
        </div>
        <button onClick={handleClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div id={SCANNER_ELEMENT_ID} ref={bindScanner} className="w-full max-w-sm rounded-2xl overflow-hidden" />
      </div>
      <div className="p-6 text-center text-white/70 text-xs space-y-2">
        {error ? (
          <div className="text-[var(--color-danger)]">{error}</div>
        ) : (
          <div className="flex items-center justify-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Point camera at the barcode or QR code on the receipt</div>
        )}
      </div>
    </div>
  )
}
