'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, DollarSign, ArrowRight,
  CalendarClock, Clock, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { formatCurrency, formatPercent, formatDate, monthName } from '@/lib/utils'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { MonthNav } from '@/components/MonthNav'
import type { Dashboard, RelatorioMensal, Previsao } from '@/types'

export default function DashboardPage() {
  const nav = useMesSelecionado()
  const { mes, ano } = nav

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', mes, ano],
    queryFn: () => api.get<Dashboard>(`/dashboard?mes=${mes}&ano=${ano}`).then(r => r.data),
  })

  const { data: historico } = useQuery({
    queryKey: ['relatorio', 'historico-6m'],
    queryFn: () => api.get<RelatorioMensal>('/relatorio/mensal?meses=6').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const { data: previsoes } = useQuery({
    queryKey: ['previsoes', 'proximas'],
    queryFn: () => api.get<Previsao[]>('/previsoes').then(r => r.data),
    select: (list) => {
      const hoje = new Date()
      const diasAlvo = new Set<number>()
      for (let i = 0; i <= 7; i++) {
        const d = new Date(hoje)
        d.setDate(hoje.getDate() + i)
        diasAlvo.add(d.getDate())
      }
      return list
        .filter(p => p.ativa && p.diaRecorrencia != null)
        .filter(p => diasAlvo.has(p.diaRecorrencia ?? 0))
        .sort((a, b) => (a.diaRecorrencia ?? 0) - (b.diaRecorrencia ?? 0))
        .slice(0, 5)
    },
  })

  const chartData = data?.fluxoDiario.map(d => ({
    data: formatDate(d.data).slice(0, 5),
    Entradas: d.entradas,
    'Saídas': d.saidas,
    Saldo: d.saldoAcumulado,
  })) ?? []

  const comparativoData = data
    ? [
        { name: 'Entradas', 'Mês Atual': Number(data.totalEntradas), 'Mês Anterior': Number(data.totalEntradasMesAnterior) },
        { name: 'Saídas', 'Mês Atual': Number(data.totalSaidas), 'Mês Anterior': Number(data.totalSaidasMesAnterior) },
      ]
    : []

  const tendenciaData = historico?.itens.map(item => ({
    label: `${monthName(item.mes).slice(0, 3)}/${String(item.ano).slice(-2)}`,
    Receitas: item.entradas,
    Despesas: item.saidas,
    Resultado: item.saldo,
  })) ?? []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <MonthNav nav={nav} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI row: hero + 3 month cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-sm">
              <p className="text-xs text-blue-200 mb-1 uppercase tracking-wide">Posição Total</p>
              <p className="text-2xl font-bold leading-tight">{formatCurrency(data?.saldoTotal ?? 0)}</p>
              <p className="text-xs text-blue-300 mt-2">saldo acumulado desde o início</p>
            </div>
            <StatCard
              label="Receita do Mês"
              value={formatCurrency(data?.totalEntradas ?? 0)}
              change={data?.variacaoEntradas}
              icon={<TrendingUp className="w-5 h-5 text-green-600" />}
              color="green"
            />
            <StatCard
              label="Despesa do Mês"
              value={formatCurrency(data?.totalSaidas ?? 0)}
              change={data?.variacaoSaidas}
              icon={<TrendingDown className="w-5 h-5 text-red-500" />}
              color="red"
              invertChange
            />
            <StatCard
              label="Resultado do Mês"
              value={formatCurrency(data?.saldoMes ?? 0)}
              icon={<DollarSign className="w-5 h-5 text-blue-600" />}
              color={Number(data?.saldoMes ?? 0) >= 0 ? 'blue' : 'red'}
            />
          </div>

          {/* Alert */}
          {(data?.transacoesSemCategoria ?? 0) > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-amber-700 dark:text-amber-400">
                <strong>{data?.transacoesSemCategoria}</strong> transação(ões) sem categoria.{' '}
                <Link href="/extratos" className="underline hover:no-underline">Categorizar agora →</Link>
              </span>
            </div>
          )}

          {/* 6-month trend */}
          {tendenciaData.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">
                Tendência — Últimos 6 Meses
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={tendenciaData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    width={52}
                  />
                  <Tooltip
                    formatter={(v: unknown) => [formatCurrency(Number(v)), '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone" dataKey="Receitas" stroke="#22c55e" strokeWidth={2}
                    dot={{ r: 3, fill: '#22c55e' }} activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2}
                    dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone" dataKey="Resultado" stroke="#6366f1" strokeWidth={2}
                    strokeDasharray="5 3" dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Daily cashflow + month comparison */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">
                Fluxo de Caixa Diário
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    formatter={(v: unknown) => [formatCurrency(Number(v)), '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="Entradas" stroke="#22c55e" fill="url(#colorEntradas)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Saídas" stroke="#ef4444" fill="url(#colorSaidas)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">
                Comparativo — Mês Anterior
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparativoData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    formatter={(v: unknown) => [formatCurrency(Number(v)), '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Mês Atual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Mês Anterior" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent transactions + upcoming forecasts */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Últimos Lançamentos
                </h2>
                <Link
                  href="/extratos"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {(data?.ultimosLancamentos ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500">
                  Nenhum lançamento registrado ainda.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {data?.ultimosLancamentos.map(l => (
                    <div key={l.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 dark:text-slate-200 truncate">
                          {l.razaoSocial || '—'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                          {formatDate(String(l.data))}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ml-4 flex-shrink-0 ${
                          l.valor >= 0 ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {formatCurrency(l.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-indigo-500" />
                  Próximos 7 dias
                </h2>
                <Link
                  href="/previsoes"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Ver <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {!previsoes || previsoes.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500">
                  Nenhum vencimento nos próximos 7 dias.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {previsoes.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-800 dark:text-slate-200 truncate">
                          {p.descricao}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> dia {p.diaRecorrencia}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold ml-3 flex-shrink-0 ${
                          p.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {formatCurrency(p.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top categories */}
          <div className="grid md:grid-cols-2 gap-4">
            <TopTable title="Top Despesas" items={data?.topDespesas ?? []} color="red" />
            <TopTable title="Top Receitas" items={data?.topReceitas ?? []} color="green" />
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  label, value, change, icon, color, invertChange = false,
}: {
  label: string
  value: string
  change?: number
  icon: React.ReactNode
  color: string
  invertChange?: boolean
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30',
    red:   'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30',
    blue:  'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30',
  }
  const positive = change != null && (invertChange ? change <= 0 : change >= 0)
  const changeColor = change != null ? (positive ? 'text-green-600' : 'text-red-500') : ''

  return (
    <div className={`bg-white dark:bg-slate-800 border rounded-xl p-5 dark:border-slate-700 ${colorMap[color] ?? ''}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change != null && (
            <p className={`text-xs mt-1 font-medium ${changeColor}`}>
              {change >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(change))} vs anterior
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm flex-shrink-0">{icon}</div>
      </div>
    </div>
  )
}

function TopTable({
  title, items, color,
}: {
  title: string
  items: { nomeCategoria: string; total: number }[]
  color: string
}) {
  const max = items.length > 0 ? Math.max(...items.map(i => i.total)) : 1
  const barColor = color === 'red' ? 'bg-red-400' : 'bg-green-400'

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500">Sem dados para exibir</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-400 dark:text-slate-500 w-4">{i + 1}.</span>
                  <span className="text-sm text-gray-700 dark:text-slate-300 truncate">{item.nomeCategoria}</span>
                </div>
                <span
                  className={`text-sm font-medium ml-2 flex-shrink-0 ${
                    color === 'red' ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(item.total)}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all`}
                  style={{ width: `${(item.total / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
