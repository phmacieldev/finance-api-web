'use client'

import { useQuery } from '@tanstack/react-query'
import { Info, Printer } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, monthName } from '@/lib/utils'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { MonthNav } from '@/components/MonthNav'
import type { Dre, DreCategoriaTotalDTO } from '@/types'

export default function DrePage() {
  const nav = useMesSelecionado()
  const { mes, ano } = nav

  const { data, isLoading } = useQuery({
    queryKey: ['dre', mes, ano],
    queryFn: () => api.get<Dre>(`/dre?mes=${mes}&ano=${ano}`).then((r) => r.data),
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">DRE</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Demonstrativo de Resultados do Exercício</p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <MonthNav nav={nav} />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <Printer className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 flex items-start gap-2 mb-6 no-print">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Para o DRE ser preenchido, categorize os lançamentos em <strong>Extratos</strong> e mapeie cada categoria para uma linha do DRE em <strong>Categorias</strong>.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : !data ? null : (
        <>
          {data.linhas.every(l => l.valor === 0) && data.lucroLiquido === 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-2 mb-6">
              <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                O DRE está vazio porque nenhuma categoria está mapeada para uma linha do demonstrativo.
                Acesse <strong>Categorias</strong> e defina o campo <em>Linha do DRE</em> em cada categoria.
              </p>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
              <h2 className="font-semibold text-gray-800 dark:text-white capitalize">
                DRE — {monthName(mes)} / {ano}
              </h2>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {data.linhas.map((linha, i) => {
                const isPositive = linha.valor >= 0
                const isLucroLiquido = linha.label.includes('Lucro Líquido')
                const hasCats = !linha.ehSubtotal && linha.categorias?.length > 0

                return (
                  <div
                    key={i}
                    className={`px-6 py-3 ${
                      isLucroLiquido
                        ? 'bg-blue-600 dark:bg-blue-700 font-semibold'
                        : linha.ehSubtotal
                        ? 'bg-gray-50 dark:bg-slate-700/60 font-semibold'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${
                        isLucroLiquido
                          ? 'text-white font-bold'
                          : linha.ehSubtotal
                          ? 'text-gray-800 dark:text-gray-100 font-semibold'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {linha.label}
                      </span>
                      <span className={`text-sm font-semibold tabular-nums ${
                        isLucroLiquido
                          ? isPositive ? 'text-green-200' : 'text-red-300'
                          : isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(linha.valor)}
                      </span>
                    </div>

                    {hasCats && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {linha.categorias.map((cat: DreCategoriaTotalDTO) => (
                          <span
                            key={cat.nome}
                            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-600/80 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600"
                          >
                            {cat.nome} — {formatCurrency(cat.valor)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className={`px-6 py-4 border-t-2 ${
              data.lucroLiquido >= 0
                ? 'border-green-500 bg-green-50 dark:bg-green-900/25'
                : 'border-red-500 bg-red-50 dark:bg-red-900/25'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white">Resultado do Período</span>
                <span className={`text-xl font-bold ${data.lucroLiquido >= 0 ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
                  {formatCurrency(data.lucroLiquido)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
