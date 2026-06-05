'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Building2, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { clearMesSelecionado } from '@/hooks/useMesSelecionado'
import type { EmpresaResumo } from '@/types'

export function EmpresaSwitcher({
  currentEnterpriseId,
  currentEnterpriseName,
}: {
  currentEnterpriseId: string
  currentEnterpriseName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  const { data: empresas = [] } = useQuery<EmpresaResumo[]>({
    queryKey: ['me', 'empresas'],
    queryFn: () => api.get('/me/empresas').then(r => r.data),
    staleTime: 60_000,
  })

  async function switchEmpresa(id: string) {
    if (id === currentEnterpriseId || switching) return
    setSwitching(id)
    setOpen(false)
    try {
      await api.post(`/auth/switch-empresa/${id}`)
      clearMesSelecionado()
      queryClient.clear()
      router.push('/dashboard')
    } catch {
      setSwitching(null)
    }
  }

  if (empresas.length <= 1) {
    return (
      <div className="px-4 py-2 flex items-center gap-2">
        <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        <span className="text-xs text-slate-400 truncate">{currentEnterpriseName}</span>
      </div>
    )
  }

  return (
    <div className="relative px-3 py-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-slate-800 transition-colors text-left"
      >
        {switching ? (
          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
        ) : (
          <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        )}
        <span className="text-xs text-slate-300 truncate flex-1">{currentEnterpriseName}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-500 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
            {empresas.map(empresa => (
              <button
                key={empresa.id}
                onClick={() => switchEmpresa(empresa.id)}
                disabled={!!switching}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {empresa.id === currentEnterpriseId ? (
                  <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 truncate font-medium">{empresa.name}</p>
                  <p className="text-xs text-slate-500">{empresa.role} · {empresa.plan}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
