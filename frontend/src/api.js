import axios from "axios"
import { jwtDecode } from "jwt-decode"
import { toast } from "react-toastify"


export const BASE_URL = import.meta.env.VITE_BASE_URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || BASE_URL

export const resolveMediaUrl = (path) => {
    if (!path) return path
    if (/^https?:\/\//i.test(path)) return path
    if (!API_BASE_URL) return path
    return `${API_BASE_URL}${path}`
}

const api = axios.create({
    baseURL: BASE_URL
})

const refreshClient = axios.create({
    baseURL: BASE_URL
})

let isRefreshing = false
let refreshSubscribers = []
let hasSessionExpiredNotice = false

const subscribeTokenRefresh = (callback) => {
    refreshSubscribers.push(callback)
}

const notifyRefreshSubscribers = (newToken) => {
    refreshSubscribers.forEach((callback) => callback(newToken))
    refreshSubscribers = []
}


api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access")
        if(token){
            const decoded = jwtDecode(token)
            const expiry_date = decoded.exp
            const current_time = Date.now() / 1000
            if(expiry_date > current_time){
                config.headers.Authorization = `Bearer ${token}`
            }
            
        }
        return config;
    },

    (error) => {
        return Promise.reject(error)
    }

)

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (!originalRequest || originalRequest._retry) {
            return Promise.reject(error)
        }

        if (error.response?.status !== 401) {
            return Promise.reject(error)
        }

        const refresh = localStorage.getItem("refresh")
        if (!refresh) {
            return Promise.reject(error)
        }

        originalRequest._retry = true

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                subscribeTokenRefresh((newToken) => {
                    if (!newToken) {
                        reject(error)
                        return
                    }
                    originalRequest.headers.Authorization = `Bearer ${newToken}`
                    resolve(api(originalRequest))
                })
            })
        }

        isRefreshing = true

        try {
            const response = await refreshClient.post("token_refresh/", { refresh })
            const newAccess = response.data.access

            localStorage.setItem("access", newAccess)
            api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
            notifyRefreshSubscribers(newAccess)
            originalRequest.headers.Authorization = `Bearer ${newAccess}`

            return api(originalRequest)
        } catch (refreshError) {
            localStorage.removeItem("access")
            localStorage.removeItem("refresh")
            notifyRefreshSubscribers(null)

            if (!hasSessionExpiredNotice) {
                hasSessionExpiredNotice = true
                toast.error("Сессия истекла. Войдите снова.")
                if (window.location.pathname !== "/signin") {
                    window.location.assign("/signin")
                }
            }
            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    }
)






export default api