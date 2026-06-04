import Cookies from 'js-cookie'

export const AUTH_COOKIE = 'financeiro_token'

export function saveToken(token: string) {
  Cookies.set(AUTH_COOKIE, token, { expires: 1, sameSite: 'strict' })
}

export function getToken(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return Cookies.get(AUTH_COOKIE)
}

export function removeToken() {
  Cookies.remove(AUTH_COOKIE)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
