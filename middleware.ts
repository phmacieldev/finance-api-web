import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/verificar-email',
  '/verificar-pendente',
  '/esqueci-senha',
  '/resetar-senha',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))

  const hasToken   = request.cookies.has('financeiro_token')
  const hasRefresh = request.cookies.has('financeiro_refresh')
  const isAuthenticated = hasToken || hasRefresh

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && isPublic && pathname !== '/verificar-pendente') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
