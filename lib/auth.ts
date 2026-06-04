import Cookies from 'js-cookie'

export const AUTH_COOKIE    = 'financeiro_token'
export const REFRESH_COOKIE = 'financeiro_refresh'

export function saveToken(token: string) {
  Cookies.set(AUTH_COOKIE, token, { expires: 1 / 96, sameSite: 'strict' }) // 15 min
}

export function saveRefreshToken(token: string) {
  Cookies.set(REFRESH_COOKIE, token, { expires: 30, sameSite: 'strict' })
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
