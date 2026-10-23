import axios from "axios"

export const GUEST_SESSION_KEY = "zoom_guest_session"

const clientApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

clientApi.interceptors.request.use((config) => {
  const guestSession = localStorage.getItem(GUEST_SESSION_KEY)
  if (guestSession) {
    config.headers["x-guest-session"] = guestSession
  }
  const token = localStorage.getItem("rms_token")
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`
  }
  return config
})

export default clientApi 