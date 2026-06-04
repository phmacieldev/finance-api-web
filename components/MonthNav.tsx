'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthName } from '@/lib/utils'
import type { MesSelecionado } from '@/hooks/useMesSelecionado'

interface MonthNavProps {
  nav: MesSelecionado
}

export function MonthNav({ nav }: MonthNavProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={nav.prevMes}
        className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
        title="Mês anterior"
      >
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </button>

      <span className="text-sm font-medium text-gray-700 min-w-36 text-center capitalize select-none">
        {monthName(nav.mes)} {nav.ano}
      </span>

      <button
        onClick={nav.nextMes}
        className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
        title="Próximo mês"
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>

      {!nav.isMesAtual && (
        <button
          onClick={nav.irParaMesAtual}
          className="ml-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          title="Ir para o mês atual"
        >
          Hoje
        </button>
      )}
    </div>
  )
}
