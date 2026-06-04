'use client'

import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, monthName } from '@/lib/utils'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { MonthNav } from '@/components/MonthNav'
import type { Dre } from '@/types'

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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">DRE</h1>
          <p className="text-sm text-gray-500 mt-0.5">Demonstrativo de Resultados do Exercício</p>
        </div>
        <MonthNav nav={nav} />
      </div>

      {/* Tip */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 flex items-start gap-2 mb-6">
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
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
              DRE — {monthName(mes)} / {ano}
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {data.linhas.map((linha, i) => {
              const isPositive = linha.valor >= 0
              const isLucroLiquido = linha.label.includes('Lucro Líquido')

              return (
                <div
                  key={i}
                  className={`flex items-center justify-between px-6 py-3 ${
                    isLucroLiquido
                      ? 'bg-blue-700 dark:bg-blue-800 font-semibold'
                      : linha.ehSubtotal
                      ? 'bg-slate-100 dark:bg-slate-700 font-semibold'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700/40'
                  }`}
                >
                  <span className={`text-sm ${
                    isLucroLiquido
                      ? 'text-white font-bold'
                      : linha.ehSubtotal
                      ? 'text-gray-800 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {linha.label}
                  </span>
                  <span className={`text-sm font-medium tabular-nums ${
                    isLucroLiquido
                      ? isPositive ? 'text-green-300' : 'text-red-300'
                      : linha.ehSubtotal
                      ? isPositive ? 'text-gray-800 dark:text-gray-100' : 'text-red-600 dark:text-red-400'
                      : isPositive ? 'text-gray-700 dark:text-gray-300' : 'text-red-500 dark:text-red-400'
                  }`}>
                    {formatCurrency(linha.valor)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Resultado final destacado */}
          <div className={`px-6 py-4 mt-0 border-t-2 ${
            data.lucroLiquido >= 0
              ? 'border-green-400 bg-green-50 dark:bg-green-950/30'
              : 'border-red-400 bg-red-50 dark:bg-red-950/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 dark:text-gray-100">Resultado do Período</span>
              <span className={`text-xl font-bold ${data.lucroLiquido >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
