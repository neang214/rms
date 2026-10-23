import { useState, useCallback } from "react"
import { useSocketRole, useSocketEvent } from "../services/socket"
import { useOrderStore } from "../context/orderContext"
import { useOrderItemStore } from "../context/orderItemContext"

let sharedAudioCtx = null
function getAudioContext() {
  if (!sharedAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    sharedAudioCtx = new Ctx()
  }
  return sharedAudioCtx
}

export function isAudioUnlocked() {
  return !!sharedAudioCtx && sharedAudioCtx.state === "running"
}

export function unlockAudioNow() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playAlertSound()).catch(() => {})
    } else {
      playAlertSound()
    }
  } catch (err) {
    console.warn("Could not unlock audio:", err)
  }
}

export function playAlertSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const scheduleChime = () => {
      const playTone = (freq, startTime, duration, volume = 0.5) => {
        try {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = freq
          osc.type = "sine"
          const t0 = Math.max(startTime, ctx.currentTime + 0.01)
          gain.gain.setValueAtTime(volume, t0)
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
          osc.start(t0)
          osc.stop(t0 + duration)
        } catch {}
      }
      const now = ctx.currentTime + 0.02
      playTone(880, now, 0.2)
      playTone(1175, now + 0.22, 0.26)
      playTone(880, now + 0.52, 0.2)
      playTone(1175, now + 0.74, 0.26)
    }

    if (ctx.state === "suspended") {
      ctx.resume().then(scheduleChime).catch(() => {})
    } else {
      scheduleChime()
    }
  } catch (err) {
    console.warn("Could not play alert sound:", err)
  }
}

export function unlockAudioOnFirstInteraction() {
  const unlock = () => {
    try {
      const ctx = getAudioContext()
      if (ctx) {
        if (ctx.state === "suspended") ctx.resume()
        // Silent buffer play is required to unlock audio on iOS WebKit & Android Chrome
        const buffer = ctx.createBuffer(1, 1, 22050)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        source.start(0)
      }
    } catch {}
    window.removeEventListener("click", unlock)
    window.removeEventListener("keydown", unlock)
    window.removeEventListener("touchstart", unlock)
  }
  window.addEventListener("click", unlock, { once: true })
  window.addEventListener("keydown", unlock, { once: true })
  window.addEventListener("touchstart", unlock, { once: true })
}

export function useStaffNotifications(role) {
  const { connected } = useSocketRole(role)
  const [bellRinging, setBellRinging] = useState(false)

  const { unconfirmedOrders, fetchUnconfirmedOrders } = useOrderStore()
  const { kitchenQueue, baristaQueue, fetchKitchenQueue, fetchBaristaQueue } = useOrderItemStore()

  const ring = useCallback(() => {
    setBellRinging(true)
    playAlertSound()
    setTimeout(() => setBellRinging(false), 2000)
  }, [])

  useSocketEvent("order:new", () => {
    if (role === "cashier" || role === "admin" || role === "server") {
      fetchUnconfirmedOrders()
      ring()
    }
    if (role === "kitchen") {
      fetchKitchenQueue()
      ring()
    }
    if (role === "barista") {
      fetchBaristaQueue()
      ring()
    }
  })

  useSocketEvent("order:confirmed", () => {
    if (role === "cashier" || role === "admin") fetchUnconfirmedOrders()
    if (role === "kitchen") {
      fetchKitchenQueue()
      ring()
    }
    if (role === "barista") {
      fetchBaristaQueue()
      ring()
    }
  })

  useSocketEvent("order:deleted", () => {
    if (role === "cashier" || role === "admin") fetchUnconfirmedOrders()
    if (role === "kitchen") fetchKitchenQueue()
    if (role === "barista") fetchBaristaQueue()
  })

  useSocketEvent("order_item:new", () => {
    if (role === "cashier" || role === "admin" || role === "server") {
      fetchUnconfirmedOrders()
      ring()
    }
    if (role === "kitchen") {
      fetchKitchenQueue()
      ring()
    }
    if (role === "barista") {
      fetchBaristaQueue()
      ring()
    }
  })

  useSocketEvent("order_item:status_changed", (item) => {
    if (role === "kitchen") fetchKitchenQueue()
    if (role === "barista") fetchBaristaQueue()
    if (item?.status === "Ready" && (role === "cashier" || role === "server" || role === "admin")) {
      ring()
    }
  })

  useSocketEvent("order:status_changed", (order) => {
    if (order?.status === "Served" && (role === "cashier" || role === "server" || role === "admin")) {
      ring()
    }
  })

  let count = 0
  if (role === "cashier" || role === "admin" || role === "server") count = unconfirmedOrders.length
  if (role === "kitchen") count = kitchenQueue.filter(i => i.status === "Pending").length
  if (role === "barista") count = baristaQueue.filter(i => i.status === "Pending").length

  const refresh = useCallback(() => {
    if (role === "cashier" || role === "admin" || role === "server") fetchUnconfirmedOrders()
    if (role === "kitchen") fetchKitchenQueue()
    if (role === "barista") fetchBaristaQueue()
  }, [role])

  return { count, bellRinging, connected, refresh }
}
