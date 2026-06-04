'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Wallet, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { MonthNav } from '@/components/MonthNav'
import type { Dashboard } from '@/types'

export default function DashboardPage() {
  const nav = useMesSelecionado()
  const { mes, ano } = nav

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', mes, ano],
    queryFn: () => api.get<Dashboard>(`/dashboard?mes=${mes}&ano=${ano}`).then((r) => r.data),
  })

  const chartData = data?.fluxoDiario.map((d) => ({
    data: formatDate(d.data).slice(0, 5),
    Entradas: d.entradas,
    'Saídas': d.saidas,
    Saldo: d.saldoAcumulado,
  })) ?? []

  const comparativoData = data
    ? [
        {
          name: 'Entradas',
          'Mês Atual': Number(data.totalEntradas),
          'Mês Anterior': Number(data.totalEntradasMesAnterior),
        },
        {
          name: 'Saídas',
          'Mês Atual': Number(data.totalSaidas),
          'Mês Anterior': Number(data.totalSaidasMesAnterior),
        },
      ]
    : []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <MonthNav nav={nav} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Entradas"
              value={formatCurrency(data?.totalEntradas ?? 0)}
              anterior={formatCurrency(data?.totalEntradasMesAnterior ?? 0)}
              change={data?.variacaoEntradas}
              icon={<TrendingUp className="w-5 h-5 text-green-600" />}
              color="green"
            />
            <StatCard
              label="Total Saídas"
              value={formatCurrency(data?.totalSaidas ?? 0)}
              anterior={formatCurrency(data?.totalSaidasMesAnterior ?? 0)}
              change={data?.variacaoSaidas}
              icon={<TrendingDown className="w-5 h-5 text-red-500" />}
              color="red"
              invertChange
            />
            <StatCard
              label="Saldo do Mês"
              value={formatCurrency(data?.saldoMes ?? 0)}
              icon={<DollarSign className="w-5 h-5 text-blue-600" />}
              color="blue"
            />
            <StatCard
              label="Saldo Atual"
              value={formatCurrency(data?.saldoAtual ?? 0)}
              icon={<Wallet className="w-5 h-5 text-purple-600" />}
              color="purple"
            />
          </div>

          {(data?.transacoesSemCategoria ?? 0) > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 flex items-center gap-2 mb-6">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-amber-700 dark:text-amber-400">
                <strong>{data?.transacoesSemCategoria}</strong> transação(ões) sem categoria. Categorize para melhorar os relatórios.
              </span>
            </div>
          )}

          {/* Charts row */}
          <div className="grid lg:grid-cols-3 gap-4 mb-6">
            {/* Fluxo diário — ocupa 2 colunas */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Fluxo de Caixa Diário</h2>
              <ResponsiveContainer width="100%" height={240}>
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
                  <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
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

            {/* Comparativo mês anterior */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Comparativo — Mês Anterior</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={comparativoData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
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

          {/* Top categorias */}
          <div className="grid md:grid-cols-2 gap-4">
            <TopTable title="Top Despesas" items={data?.topDespesas ?? []} color="red" />
            <TopTable title="Top Receitas" items={data?.topReceitas ?? []} color="green" />
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, anterior, change, icon, color, invertChange = false }: {
  label: string
  value: string
  anterior?: string
  change?: number
  icon: React.ReactNode
  color: string
  invertChange?: boolean
}) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30',
    red: 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30',
    blue: 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30',
    purple: 'bg-purple-50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/30',
  }

  const positive = change != null && (invertChange ? change <= 0 : change >= 0)
  const changeColor = change != null ? (positive ? 'text-green-600' : 'text-red-500') : ''
  const arrow = change != null ? (change >= 0 ? '▲' : '▼') : ''

  return (
    <div className={`bg-white dark:bg-slate-800 border rounded-xl p-5 dark:border-slate-700 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change != null && (
            <p className={`text-xs mt-1 font-medium ${changeColor}`}>
              {arrow} {formatPercent(Math.abs(change))} vs anterior
            </p>
          )}
          {anterior && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Ant.: {anterior}</p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm flex-shrink-0">{icon}</div>
      </div>
    </div>
  )
}

function TopTable({ title, items, color }: {
  title: string
  items: { nomeCategoria: string; total: number }[]
  color: string
}) {
  const max = items.length > 0 ? Math.max(...items.map((i) => i.total)) : 1
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
                <span className={`text-sm font-medium ml-2 flex-shrink-0 ${color === 'red' ? 'text-red-600' : 'text-green-600'}`}>
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
