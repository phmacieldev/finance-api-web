'use client'

import { useState, useEffect } from 'react'
import { currentMes, currentAno } from '@/lib/utils'

const STORAGE_KEY = 'financeiro_mes_selecionado'

export interface MesSelecionado {
  mes: number
  ano: number
  prevMes: () => void
  nextMes: () => void
  irParaMesAtual: () => void
  setMes: (mes: number) => void
  setAno: (ano: number) => void
  isMesAtual: boolean
}

function salvar(mes: number, ano: number) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ mes, ano })) } catch {}
}

export function useMesSelecionado(): MesSelecionado {
  // Começa com o mês atual para evitar mismatch de hidratação SSR
  const [mes, setMesState] = useState(currentMes)
  const [ano, setAnoState] = useState(currentAno)

  // Carrega do sessionStorage após a montagem do componente
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const { mes: m, ano: a } = JSON.parse(stored)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (m && a) { setMesState(m); setAnoState(a) }
      }
    } catch {}
  }, [])

  function set(m: number, a: number) {
    setMesState(m)
    setAnoState(a)
    salvar(m, a)
  }

  function prevMes() {
    if (mes === 1) set(12, ano - 1)
    else set(mes - 1, ano)
  }

  function nextMes() {
    if (mes === 12) set(1, ano + 1)
    else set(mes + 1, ano)
  }

  function irParaMesAtual() {
    set(currentMes(), currentAno())
  }

  function setMes(m: number) { set(m, ano) }
  function setAno(a: number) { set(mes, a) }

  const isMesAtual = mes === currentMes() && ano === currentAno()

  return { mes, ano, prevMes, nextMes, irParaMesAtual, setMes, setAno, isMesAtual }
}

export function clearMesSelecionado() {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch {}
}
