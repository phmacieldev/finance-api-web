'use client'

import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Printer } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { RelatorioMensal } from '@/types'

const MES_LABELS = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const MESES_OPCOES = [3, 6, 12] as const

export default function RelatorioPage() {
  const [meses, setMeses] = useState<3 | 6 | 12>(6)

  const { data, isLoading } = useQuery<RelatorioMensal>({
    queryKey: ['relatorio-mensal', meses],
    queryFn: () => api.get<RelatorioMensal>(`/relatorio/mensal?meses=${meses}`).then(r => r.data),
    placeholderData: keepPreviousData,
  })

  const chartData = data?.itens.map(item => ({
    label: `${MES_LABELS[item.mes]}/${String(item.ano).slice(2)}`,
    Entradas: item.entradas,
    Saídas: item.saidas,
    Saldo: item.saldo,
    _item: item,
  })) ?? []

  const totalEntradas = data?.itens.reduce((s, i) => s + i.entradas, 0) ?? 0
  const totalSaidas = data?.itens.reduce((s, i) => s + i.saidas, 0) ?? 0
  const totalSaldo = totalEntradas - totalSaidas

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Relatório Comparativo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Evolução mensal de entradas, saídas e saldo</p>
        </div>
        <div className="flex gap-2 no-print">
          {MESES_OPCOES.map((m) => (
            <button
              key={m}
              onClick={() => setMeses(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                meses === m ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {m} meses
            </button>
          ))}
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
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total de entradas</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalEntradas)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">nos últimos {meses} meses</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total de saídas</p>
          <p className="text-xl font-bold text-red-500 dark:text-red-400">{formatCurrency(totalSaidas)}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">nos últimos {meses} meses</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Saldo acumulado</p>
          <p className={`text-xl font-bold ${totalSaldo >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(totalSaldo)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">entradas − saídas</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-slate-700" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} width={60} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), '']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="Entradas" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Saídas" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Saldo" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tabela detalhe */}
      {!isLoading && chartData.length > 0 && (
        <div className="mt-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Detalhe por mês</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mês</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entradas</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Saídas</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {data!.itens.map((item) => (
                <tr key={`${item.ano}-${item.mes}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-200 font-medium">
                    {MES_LABELS[item.mes]} / {item.ano}
                  </td>
                  <td className="px-4 py-2.5 text-right text-green-600 dark:text-green-400 font-medium">
                    {formatCurrency(item.entradas)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-red-500 dark:text-red-400 font-medium">
                    {formatCurrency(item.saidas)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${item.saldo >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(item.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
