import axios from 'axios'
import { getToken, getRefreshToken, saveToken, saveRefreshToken, removeToken } from './auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<string> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry || typeof window === 'undefined') {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      removeToken()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    original._retry = true

    try {
      if (!refreshing) {
        refreshing = axios
          .post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } },
          )
          .then((res) => {
            const { token, refreshToken: newRefresh } = res.data
            saveToken(token)
            if (newRefresh) saveRefreshToken(newRefresh)
            return token
          })
          .finally(() => {
            refreshing = null
          })
      }

      const newToken = await refreshing
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch {
      removeToken()
      window.location.href = '/login'
      return Promise.reject(error)
    }
  },
)

export default api
