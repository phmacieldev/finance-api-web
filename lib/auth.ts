import Cookies from 'js-cookie'

export const AUTH_COOKIE    = 'financeiro_token'
export const REFRESH_COOKIE = 'financeiro_refresh'

const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'

export function saveToken(token: string) {
  Cookies.set(AUTH_COOKIE, token, { expires: 1 / 24, sameSite: 'strict', secure }) // 1h
}

export function saveRefreshToken(token: string) {
  Cookies.set(REFRESH_COOKIE, token, { expires: 30, sameSite: 'strict', secure })
}

export function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return Cookies.get(AUTH_COOKIE)
}

export function getRefreshToken(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return Cookies.get(REFRESH_COOKIE)
}

export function removeToken() {
  Cookies.remove(AUTH_COOKIE)
  Cookies.remove(REFRESH_COOKIE)
}

export function isAuthenticated(): boolean {
  return !!getToken() || !!getRefreshToken()
}
