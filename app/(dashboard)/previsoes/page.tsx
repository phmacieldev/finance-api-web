'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Previsao, Categoria, PageResponse } from '@/types'
import { FREQUENCIAS } from '@/types'

const FREQ_LABELS: Record<string, string> = {
  UNICA: 'Única', SEMANAL: 'Semanal', QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal', BIMESTRAL: 'Bimestral', TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral', ANUAL: 'Anual',
}

const schema = z.object({
  descricao: z.string().min(2, 'Descrição obrigatória'),
  tipo: z.enum(['RECEITA', 'DESPESA']),
  valor: z.number().positive('Valor deve ser positivo'),
  frequencia: z.string(),
  dataInicio: z.string(),
  dataFim: z.string().optional(),
  diaRecorrencia: z.number().optional(),
  categoriaId: z.string().optional(),
})
type Form = z.infer<typeof schema>

const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500'

export default function PrevisoesPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'RECEITA' | 'DESPESA'>('ALL')
  const [page, setPage] = useState(0)

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['previsoes', page],
    queryFn: () => api.get<PageResponse<Previsao>>(`/previsoes?page=${page}&size=100`).then((r) => r.data),
  })
  const previsoes = pageData?.content ?? []
  const totalPages = pageData?.totalPages ?? 1

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get<Categoria[]>('/categorias').then((r) => r.data),
  })

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'DESPESA', frequencia: 'MENSAL', dataInicio: new Date().toISOString().slice(0, 10) },
  })

  const frequencia = useWatch({ control, name: 'frequencia' })

  const { mutate: criar, isPending } = useMutation({
    mutationFn: (data: Form) => api.post('/previsoes', {
      ...data,
      categoriaId: data.categoriaId || undefined,
      dataFim: data.dataFim || undefined,
      diaRecorrencia: data.diaRecorrencia || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['previsoes'] }); reset(); setOpen(false); setPage(0) },
  })

  const { mutate: desativar } = useMutation({
    mutationFn: (id: string) => api.delete(`/previsoes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['previsoes'] }),
  })

  const filtradas = previsoes.filter((p) => filter === 'ALL' || p.tipo === filter)
  const totalReceitas = previsoes.filter(p => p.tipo === 'RECEITA').reduce((s, p) => s + p.valor, 0)
  const totalDespesas = previsoes.filter(p => p.tipo === 'DESPESA').reduce((s, p) => s + p.valor, 0)

  const btnInactive = 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Previsões</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Receitas e despesas recorrentes esperadas</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg"
        >
          <Plus className="w-4 h-4" /> Nova Previsão
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 border border-green-100 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Receitas previstas</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalReceitas)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Despesas previstas</p>
          <p className="text-xl font-bold text-red-500 dark:text-red-400">{formatCurrency(totalDespesas)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['ALL', 'RECEITA', 'DESPESA'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : btnInactive}`}>
            {f === 'ALL' ? 'Todas' : f === 'RECEITA' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">Nenhuma previsão cadastrada</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {['Descrição', 'Tipo', 'Valor', 'Frequência', 'Início', 'Fim', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtradas.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 group">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{p.descricao}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${p.tipo === 'RECEITA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.tipo === 'RECEITA' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {p.tipo}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${p.tipo === 'RECEITA' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {formatCurrency(p.valor)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{FREQ_LABELS[p.frequencia]}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.dataInicio}</td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{p.dataFim ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => desativar(p.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Página {page + 1} de {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">
                  Anterior
                </button>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700">
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 dark:text-white">Nova Previsão</h3>
              <button onClick={() => { setOpen(false); reset() }}><X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" /></button>
            </div>
            <form onSubmit={handleSubmit((d: Form) => criar(d))} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <input {...register('descricao')} placeholder="Ex: Aluguel" className={inputCls} />
                {errors.descricao && <p className="text-red-500 text-xs mt-1">{errors.descricao.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                  <select {...register('tipo')} className={inputCls}>
                    <option value="DESPESA">Despesa</option>
                    <option value="RECEITA">Receita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
                  <input {...register('valor', { valueAsNumber: true })} type="number" step="0.01" placeholder="0,00" className={inputCls} />
                  {errors.valor && <p className="text-red-500 text-xs mt-1">{errors.valor.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Frequência</label>
                <select {...register('frequencia')} className={inputCls}>
                  {FREQUENCIAS.map((f) => <option key={f} value={f}>{FREQ_LABELS[f]}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Data início</label>
                  <input {...register('dataInicio')} type="date" className={inputCls} />
                </div>
                {frequencia !== 'UNICA' && (
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Data fim <span className="text-gray-400">(opcional)</span></label>
                    <input {...register('dataFim')} type="date" className={inputCls} />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Categoria <span className="text-gray-400">(opcional)</span></label>
                <select {...register('categoriaId')} className={inputCls}>
                  <option value="">— sem categoria</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setOpen(false); reset() }}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg">
                  {isPending ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
