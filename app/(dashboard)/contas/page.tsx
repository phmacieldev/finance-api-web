'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Trash2, Landmark, ChevronDown } from 'lucide-react'
import api from '@/lib/api'
import type { ContaBancaria } from '@/types'

const BANCOS_BR = [
  'Nubank', 'Itaú', 'Bradesco', 'Banco do Brasil', 'Caixa Econômica Federal',
  'Santander', 'Inter', 'C6 Bank', 'Sicoob', 'Sicredi',
  'BTG Pactual', 'XP Investimentos', 'Banco Original', 'Banco Safra',
  'Neon', 'PagBank', 'Mercado Pago', 'PicPay', 'Cora', 'Asaas',
  'BV (Banco Votorantim)', 'Banrisul', 'Banco Pine', 'Daycoval',
  'Banco BMG', 'Banco Pan', 'Sofisa Direto', 'Toro Investimentos',
  'Rico', 'Clear', 'Modal', 'Outro',
]

function BancoCombobox({ value, onChange, tipo }: { value: string; onChange: (v: string) => void; tipo: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.length === 0
    ? BANCOS_BR
    : BANCOS_BR.filter(b => b.toLowerCase().includes(query.toLowerCase()))

  const TIPO_INPUT_COLORS: Record<string, string> = {
    CORRENTE:    'border-blue-400 focus:border-blue-500 dark:border-blue-500',
    POUPANCA:    'border-green-400 focus:border-green-500 dark:border-green-500',
    INVESTIMENTO:'border-purple-400 focus:border-purple-500 dark:border-purple-500',
    OUTRO:       'border-gray-300 focus:border-gray-400 dark:border-slate-600',
  }
  const inputColorClass = TIPO_INPUT_COLORS[tipo] ?? TIPO_INPUT_COLORS.OUTRO

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setQuery(value) }, [value])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Selecione ou digite o banco"
          className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 ${inputColorClass}`}
        />
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(b => (
            <li
              key={b}
              onMouseDown={e => { e.preventDefault(); onChange(b); setQuery(b); setOpen(false) }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-600 hover:text-gray-900 dark:hover:text-white ${
                value === b ? 'bg-blue-50 dark:bg-slate-600 text-blue-600 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-slate-100'
              }`}
            >
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const TIPO_LABELS: Record<string, string> = {
  CORRENTE: 'Conta Corrente',
  POUPANCA: 'Poupança',
  INVESTIMENTO: 'Investimento',
  OUTRO: 'Outro',
}

const TIPO_COLORS: Record<string, string> = {
  CORRENTE: 'bg-blue-100 text-blue-700',
  POUPANCA: 'bg-green-100 text-green-700',
  INVESTIMENTO: 'bg-purple-100 text-purple-700',
  OUTRO: 'bg-gray-100 text-gray-600',
}

export default function ContasPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [form, setForm] = useState({ nome: '', banco: '', tipo: 'CORRENTE' })

  const { data: contas = [], isLoading } = useQuery<ContaBancaria[]>({
    queryKey: ['contas-bancarias'],
    queryFn: () => api.get<ContaBancaria[]>('/contas-bancarias').then(r => r.data),
  })

  const { mutate: criar, isPending } = useMutation({
    mutationFn: () => api.post('/contas-bancarias', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contas-bancarias'] })
      setOpen(false)
      setForm({ nome: '', banco: '', tipo: 'CORRENTE' })
    },
  })

  const { mutate: desativar } = useMutation({
    mutationFn: (id: string) => api.delete(`/contas-bancarias/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contas-bancarias'] })
      setConfirmDelete(null)
    },
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Contas Bancárias</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie as contas para separar extratos por banco</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova conta
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contas.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl">
          <Landmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-500">Nenhuma conta cadastrada</p>
          <p className="text-sm text-gray-400 mt-1">Adicione contas para separar extratos por banco</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contas.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-4 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{c.nome}</p>
                  <p className="text-sm text-gray-500">{c.banco}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLORS[c.tipo]}`}>
                  {TIPO_LABELS[c.tipo]}
                </span>
                {confirmDelete === c.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => desativar(c.id)}
                      className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded">
                      Confirmar
                    </button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="px-2 py-1 text-xs border border-gray-200 rounded text-gray-500">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 rounded transition-all"
                    title="Remover conta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-xl mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Nova conta bancária</h3>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Nome da conta</label>
                <input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Conta PJ Bradesco"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Banco</label>
                <BancoCombobox
                  value={form.banco}
                  onChange={v => setForm(f => ({ ...f, banco: v }))}
                  tipo={form.tipo}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="CORRENTE">Conta Corrente</option>
                  <option value="POUPANCA">Poupança</option>
                  <option value="INVESTIMENTO">Investimento</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setOpen(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                  Cancelar
                </button>
                <button
                  disabled={!form.nome.trim() || !form.banco.trim() || isPending}
                  onClick={() => criar()}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg"
                >
                  {isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
