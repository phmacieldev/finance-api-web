import axios from 'axios'
import Cookies from 'js-cookie'
import { AUTH_COOKIE } from './auth'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = Cookies.get(AUTH_COOKIE)
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove(AUTH_COOKIE)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
