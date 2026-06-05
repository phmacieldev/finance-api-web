'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { removeToken, getRefreshToken } from '@/lib/auth'
import { clearMesSelecionado, useMesSelecionado } from '@/hooks/useMesSelecionado'
import { useTheme } from '@/components/theme'
import { ToastProvider } from '@/components/Toast'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import {
  LayoutDashboard, FileText, Tags, CalendarDays,
  GitMerge, BarChart3, Download, LogOut, TrendingUp, Sun, Moon, Settings,
  Users, LineChart, Building2, ShieldCheck
} from 'lucide-react'

const navItemsApp = [
  { href: '/dashboard',       label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/extratos',        label: 'Extratos',       icon: FileText },
  { href: '/categorias',      label: 'Categorias',     icon: Tags },
  { href: '/contas',          label: 'Contas',         icon: Building2 },
  { href: '/previsoes',       label: 'Previsões',      icon: CalendarDays },
  { href: '/conciliacao',     label: 'Conciliação',    icon: GitMerge },
  { href: '/dre',             label: 'DRE',            icon: BarChart3 },
  { href: '/relatorio',       label: 'Relatório',      icon: LineChart },
  { href: '/export',          label: 'Exportar',       icon: Download },
  { href: '/usuarios',        label: 'Usuários',       icon: Users },
  { href: '/configuracoes',   label: 'Configurações',  icon: Settings },
]

const navItemsAdmin = [
  { href: '/painel-admin',    label: 'Painel Admin',  icon: ShieldCheck },
  { href: '/admin-usuarios',  label: 'Usuários',       icon: Users },
  { href: '/configuracoes',   label: 'Configurações',  icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { mes, ano } = useMesSelecionado()

  const { data: me, isLoading: meLoading } = useQuery<{ role: string; emailVerificado?: boolean }>({
    queryKey: ['me'],
    queryFn: () => api.get('/me').then(r => r.data),
    staleTime: 300_000,
  })
  const isPlatformAdmin = me?.role === 'PLATFORM_ADMIN'
  const isUser = me?.role === 'USER'

  const adminPaths = ['/painel-admin', '/admin-usuarios', '/configuracoes']
  useEffect(() => {
    if (!meLoading && isPlatformAdmin) {
      const onAdminRoute = adminPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (!onAdminRoute) router.replace('/painel-admin')
    }
  }, [isPlatformAdmin, meLoading, pathname])

  const { data: semCatList = [] } = useQuery<{ id: string }[]>({
    queryKey: ['sem-categoria', mes, ano],
    queryFn: () =>
      api.get<{ id: string }[]>(`/extratos/sem-categoria?mes=${mes}&ano=${ano}`).then((r) => r.data),
    staleTime: 60_000,
    enabled: !isPlatformAdmin,
  })
  const semCatCount = semCatList.length

  async function logout() {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try { await api.post('/auth/logout', { refreshToken }) } catch { /* ignora erro de rede */ }
    }
    removeToken()
    clearMesSelecionado()
    queryClient.clear()
    router.push('/login')
  }

  return (
    <ToastProvider>
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-slate-900 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <TrendingUp className="w-5 h-5 text-blue-400 mr-2" />
          <span className="text-white font-semibold text-sm">Financeiro SaaS</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {meLoading ? (
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : (isPlatformAdmin ? navItemsAdmin : navItemsApp).filter(({ href }) => {
            if (isUser) return ['/dashboard', '/dre', '/relatorio', '/configuracoes'].includes(href)
            return true
          }).map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && href !== '/painel-admin' && pathname.startsWith(href))
            const badge = href === '/extratos' && semCatCount > 0 ? semCatCount : null
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {badge != null && (
                  <span className="ml-auto bg-amber-500 text-white text-xs font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center leading-none">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Tema + Logout */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
            {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
        {me && !me.emailVerificado && !isPlatformAdmin && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-6 py-2 flex items-center justify-between text-sm">
            <span className="text-amber-800 dark:text-amber-300">
              Confirme seu e-mail para garantir acesso contínuo à conta.
            </span>
            <button
              onClick={() => api.post(`/auth/reenviar-verificacao?email=${(me as { email?: string })?.email ?? ''}`).catch(() => {})}
              className="text-amber-700 dark:text-amber-400 underline hover:no-underline ml-4"
            >
              Reenviar link
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
    </ToastProvider>
  )
}
