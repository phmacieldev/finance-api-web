import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/types'

export function extractApiError(error: unknown): ApiError | null {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Partial<ApiError>
    if (typeof data.status === 'number' && typeof data.message === 'string') {
      return data as ApiError
    }
  }
  return null
}

export function extractFieldErrors(error: unknown): Record<string, string> {
  return extractApiError(error)?.campos ?? {}
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let refreshing: Promise<void> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status !== 401 || original._retry || typeof window === 'undefined') {
      return Promise.reject(error)
    }

    original._retry = true

    try {
      if (!refreshing) {
        refreshing = axios
          .post(
            `${api.defaults.baseURL}/auth/refresh`,
            null,
            { withCredentials: true },
          )
          .then(() => undefined)
          .finally(() => {
            refreshing = null
          })
      }

      await refreshing
      return api(original)
    } catch (refreshError) {
      refreshing = null
      const status = (refreshError as AxiosError).response?.status
      if (status === 401 || status === 403) {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  },
)

export default api
