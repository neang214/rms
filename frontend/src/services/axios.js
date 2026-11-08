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
  const token = sessionStorage.getItem("rms_token")
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`
  }
  return config
})

clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      sessionStorage.removeItem("rms_token")
      sessionStorage.removeItem("rms-tab-authenticated")
      localStorage.removeItem("rms_token")
    }
    return Promise.reject(error)
  }
)

export default clientApi 