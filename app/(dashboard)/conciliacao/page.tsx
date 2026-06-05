'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, XCircle } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { MonthNav } from '@/components/MonthNav'
import type { ConciliacaoPeriodo } from '@/types'

function VarianceBadge({ value }: { value: number }) {
  const pos = value >= 0
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${pos ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {pos ? '+' : ''}{formatCurrency(value)}
    </span>
  )
}

export default function ConciliacaoPage() {
  const nav = useMesSelecionado()
  const { mes, ano } = nav
  const [modo, setModo] = useState<'mensal' | 'periodo'>('mensal')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [saldoInput, setSaldoInput] = useState('')

  const storageKey = `saldo_banco_${mes}_${ano}`

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setSaldoInput(saved)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else setSaldoInput('')
  }, [storageKey])

  const queryKey = modo === 'mensal'
    ? ['conciliacao', mes, ano]
    : ['conciliacao', 'periodo', inicio, fim]

  const queryFn = () => {
    if (modo === 'periodo' && inicio && fim) {
      return api.get<ConciliacaoPeriodo>(`/conciliacao/periodo?inicio=${inicio}&fim=${fim}`).then(r => r.data)
    }
    return api.get<ConciliacaoPeriodo>(`/conciliacao/mensal?mes=${mes}&ano=${ano}`).then(r => r.data)
  }

  const enabled = modo === 'mensal' || (!!inicio && !!fim)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn,
    enabled,
  })

  const btnInactive = 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Conciliação</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Previsto vs realizado por período</p>
        </div>
        {modo === 'mensal' && <MonthNav nav={nav} />}
      </div>

      {/* Modo selector */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setModo('mensal')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${modo === 'mensal' ? 'bg-blue-600 text-white' : btnInactive}`}
          >
            Por mês
          </button>
          <button
            onClick={() => setModo('periodo')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${modo === 'periodo' ? 'bg-blue-600 text-white' : btnInactive}`}
          >
            Período customizado
          </button>
        </div>
        {modo === 'periodo' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={inicio}
              onChange={e => setInicio(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-400"
            />
            <span className="text-gray-400 text-sm">até</span>
            <input
              type="date"
              value={fim}
              onChange={e => setFim(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-400"
            />
          </div>
        )}
      </div>

      {/* Saldo bancário informado */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Saldo atual no banco (informado)</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">R$</span>
            <input
              type="text"
              value={saldoInput}
              onChange={e => {
                setSaldoInput(e.target.value)
                localStorage.setItem(storageKey, e.target.value)
              }}
              placeholder="0,00"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Digite o saldo que aparece no extrato do banco para verificar a conciliação</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : !data ? null : (
        <>
          {/* Status de conciliação */}
          {saldoInput !== '' && (() => {
            const saldoBanco = parseFloat(saldoInput.replace(/\./g, '').replace(',', '.'))
            if (isNaN(saldoBanco)) return null
            const saldoSistema = data.saldoPeriodo
            const diferenca = saldoBanco - saldoSistema
            const conciliado = Math.abs(diferenca) < 0.02
            return (
              <div className={`flex items-center justify-between gap-4 px-5 py-4 rounded-xl border mb-6 ${
                conciliado
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
              }`}>
                <div className="flex items-center gap-3">
                  {conciliado
                    ? <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                    : <XCircle className="w-6 h-6 text-red-500 dark:text-red-400 flex-shrink-0" />}
                  <div>
                    <p className={`font-semibold text-sm ${conciliado ? 'text-green-800 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      {conciliado ? 'Conciliado ✓' : 'Não conciliado ✗'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Banco: <strong>{formatCurrency(saldoBanco)}</strong> · Sistema: <strong>{formatCurrency(saldoSistema)}</strong>
                    </p>
                  </div>
                </div>
                {!conciliado && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Diferença</p>
                    <p className={`text-lg font-bold ${diferenca > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {diferenca > 0 ? '+' : ''}{formatCurrency(Math.abs(diferenca))}
                    </p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard label="Entradas Realizadas" value={data.totalEntradas} color="green" />
            <SummaryCard label="Saídas Realizadas" value={data.totalSaidas} color="red" />
            <SummaryCard label="Entradas Previstas" value={data.totalEntradasPrevistas} color="blue" />
            <SummaryCard label="Saídas Previstas" value={data.totalSaidasPrevistas} color="orange" />
          </div>

          {/* Variance Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Variância Entradas</p>
              <p className={`text-lg font-bold ${data.varianciaTotalEntradas >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(data.varianciaTotalEntradas)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">realizado - previsto</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Variância Saídas</p>
              <p className={`text-lg font-bold ${data.varianciaTotalSaidas <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(data.varianciaTotalSaidas)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">realizado - previsto</p>
            </div>
          </div>

          {/* Daily Table */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Detalhamento Diário</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Entradas</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-green-600 uppercase">Prev.</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Saídas</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-red-600 uppercase">Prev.</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Saldo Dia</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acumulado</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Var. Ent.</th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Var. Saí.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {data.itensDiarios
                    .filter((d) => d.entradas > 0 || d.saidas > 0 || d.entradasPrevistas > 0 || d.saidasPrevistas > 0)
                    .map((item) => (
                      <tr key={item.data} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(item.data)}</td>
                        <td className="px-4 py-2.5 text-right text-green-600 dark:text-green-400 font-medium">
                          {item.entradas > 0 ? formatCurrency(item.entradas) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-green-400 dark:text-green-600">
                          {item.entradasPrevistas > 0 ? formatCurrency(item.entradasPrevistas) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-red-500 dark:text-red-400 font-medium">
                          {item.saidas > 0 ? formatCurrency(item.saidas) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-red-300 dark:text-red-600">
                          {item.saidasPrevistas > 0 ? formatCurrency(item.saidasPrevistas) : '—'}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-medium ${item.saldoDia >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-500 dark:text-orange-400'}`}>
                          {formatCurrency(item.saldoDia)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">
                          {formatCurrency(item.saldoAcumulado)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {(item.entradasPrevistas > 0 || item.varianciaEntradas !== 0) && (
                            <VarianceBadge value={item.varianciaEntradas} />
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {(item.saidasPrevistas > 0 || item.varianciaSaidas !== 0) && (
                            <VarianceBadge value={-item.varianciaSaidas} />
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-500 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
    orange: 'text-orange-500 dark:text-orange-400',
  }
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-bold ${colors[color]}`}>{formatCurrency(value)}</p>
    </div>
  )
}
