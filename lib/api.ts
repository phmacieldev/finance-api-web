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
  // Sempre usa o proxy Next.js (app/api/v1/[...path]) — cookies ficam no mesmo domínio
  // do frontend (first-party), evitando bloqueio de cookies cross-origin em browsers modernos.
  // O proxy encaminha para BACKEND_URL em produção (var de ambiente server-side no Vercel).
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

/** Promise compartilhada entre requisições concorrentes durante o refresh — evita múltiplos refreshes em paralelo */
let refreshing: Promise<void> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config

    // Não interceptar se:
    // - status não é 401
    // - já tentamos retry nesta requisição
    // - estamos server-side (sem cookie de contexto)
    // - a própria requisição que falhou era o refresh (evita loop infinito)
    if (
      error.response?.status !== 401 ||
      (original as (typeof original & { _retry?: boolean }))!._retry ||
      typeof window === 'undefined' ||
      original?.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error)
    }

    ;(original as typeof original & { _retry: boolean })!._retry = true

    try {
      // Requisições concorrentes compartilham a mesma Promise de refresh
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
      return api(original!)
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
