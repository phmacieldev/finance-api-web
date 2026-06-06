'use client'

import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Printer, BarChart2, TrendingUp } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { RelatorioMensal } from '@/types'

const MES_LABELS = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MESES_OPCOES = [3, 6, 12] as const

const COLORS = { entradas: '#22c55e', saidas: '#ef4444', resultado: '#6366f1' }
const TICK = { fontSize: 11, fill: '#94a3b8' }
const TOOLTIP_STYLE = { borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }

export default function RelatorioPage() {
  const [meses, setMeses] = useState<3 | 6 | 12>(6)
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')

  const { data, isLoading } = useQuery<RelatorioMensal>({
    queryKey: ['relatorio-mensal', meses],
    queryFn: () => api.get<RelatorioMensal>(`/relatorio/mensal?meses=${meses}`).then(r => r.data),
    placeholderData: keepPreviousData,
  })

  const chartData = data?.itens.map(item => ({
    label: `${MES_LABELS[item.mes]}/${String(item.ano).slice(2)}`,
    Entradas: item.entradas,
    Saídas: item.saidas,
    Resultado: item.saldo,
  })) ?? []

  const totalEntradas = data?.itens.reduce((s, i) => s + i.entradas, 0) ?? 0
  const totalSaidas = data?.itens.reduce((s, i) => s + i.saidas, 0) ?? 0
  const totalSaldo = totalEntradas - totalSaidas

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Relatório Comparativo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Evolução mensal de entradas, saídas e resultado</p>
        </div>
        <div className="flex gap-2 no-print items-center">
          {MESES_OPCOES.map((m) => (
            <button
              key={m}
              onClick={() => setMeses(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                meses === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {m} meses
            </button>
          ))}

          {/* Tipo de gráfico */}
          <div className="flex border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setChartType('bar')}
              title="Barras"
              className={`px-2.5 py-1.5 transition-colors ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('line')}
              title="Linhas"
              className={`px-2.5 py-1.5 transition-colors ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <Printer className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`rounded-xl p-5 text-white shadow-sm ${
          totalSaldo >= 0
            ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
            : 'bg-gradient-to-br from-red-500 to-rose-700'
        }`}>
          <p className="text-xs text-blue-200 mb-1 uppercase tracking-wide">Resultado Acumulado</p>
          <p className="text-2xl font-bold leading-tight">{formatCurrency(totalSaldo)}</p>
          <p className="text-xs text-blue-300 mt-2">entradas − saídas · últimos {meses} meses</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total de Entradas</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalEntradas)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">nos últimos {meses} meses</p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total de Saídas</p>
          <p className="text-xl font-bold text-red-500 dark:text-red-400">{formatCurrency(totalSaidas)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">nos últimos {meses} meses</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">
          {chartType === 'bar' ? 'Comparativo Mensal' : 'Tendência Mensal'}
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={TICK} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={TICK} width={60} />
              <Tooltip formatter={(v) => [formatCurrency(Number(v)), '']} contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="Entradas" fill={COLORS.entradas} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Saídas" fill={COLORS.saidas} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Resultado" fill={COLORS.resultado} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={TICK} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={TICK} width={60} />
              <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v)), '']} contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone" dataKey="Entradas" stroke={COLORS.entradas} strokeWidth={2}
                dot={{ r: 3, fill: COLORS.entradas }} activeDot={{ r: 5 }}
              />
              <Line
                type="monotone" dataKey="Saídas" stroke={COLORS.saidas} strokeWidth={2}
                dot={{ r: 3, fill: COLORS.saidas }} activeDot={{ r: 5 }}
              />
              <Line
                type="monotone" dataKey="Resultado" stroke={COLORS.resultado} strokeWidth={2}
                strokeDasharray="5 3" dot={{ r: 3, fill: COLORS.resultado }} activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabela detalhe */}
      {!isLoading && chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Detalhe por mês</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mês</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entradas</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Saídas</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {data!.itens.map((item) => (
                <tr key={`${item.ano}-${item.mes}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-2.5 text-gray-700 dark:text-white font-medium">
                    {MES_LABELS[item.mes]} / {item.ano}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS.entradas }} />
                      <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(item.entradas)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS.saidas }} />
                      <span className="font-medium text-red-500 dark:text-red-400">{formatCurrency(item.saidas)}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${
                    item.saldo >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(item.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900">
              <tr>
                <td className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Total
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalEntradas)}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-red-500 dark:text-red-400">
                  {formatCurrency(totalSaidas)}
                </td>
                <td className={`px-4 py-2.5 text-right font-bold ${
                  totalSaldo >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(totalSaldo)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
