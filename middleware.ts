import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/esqueci-senha',
  '/resetar-senha',
  '/verificar-email',
  '/verificar-pendente',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname === '/'

  // financeiro_token expira em 15min — usar financeiro_refresh (30d) para saber se está logado
  // O interceptor do axios renova o access token automaticamente quando necessário
  const isAuthenticated =
    request.cookies.has('financeiro_refresh') ||
    request.cookies.has('financeiro_token')

  // Rota protegida sem sessão → /login
  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Já logado tentando acessar rota pública (ex: /login) → dashboard
  if (isAuthenticated && isPublic && pathname !== '/verificar-pendente') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Roda em todas as rotas exceto api/, assets estáticos e favicon
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
