'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import type { Categoria } from '@/types'
import { DRE_CATEGORIAS } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  tipo: z.enum(['RECEITA', 'DESPESA']),
  dreCategoria: z.string().optional(),
})
type Form = z.infer<typeof schema>

const DRE_LABELS: Record<string, string> = {
  RECEITA_BRUTA: 'Receita Bruta',
  DEDUCAO_RECEITA: 'Dedução de Receita',
  CPV: 'CPV/CSV',
  DESPESA_VENDAS: 'Desp. Vendas',
  DESPESA_ADMINISTRATIVA: 'Desp. Administrativa',
  DESPESA_FINANCEIRA: 'Desp. Financeira',
  RECEITA_FINANCEIRA: 'Rec. Financeira',
  IMPOSTO: 'Imposto (IR/CS)',
  OUTROS: 'Outros',
}

export default function CategoriasPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'RECEITA' | 'DESPESA'>('ALL')

  const { data: categorias = [], isLoading } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get<Categoria[]>('/categorias').then((r) => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: 'DESPESA' },
  })

  const { mutate: criar, isPending } = useMutation({
    mutationFn: (data: Form) => api.post('/categorias', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categorias'] }); reset(); setOpen(false) },
  })

  const { mutate: deletar } = useMutation({
    mutationFn: (id: string) => api.delete(`/categorias/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  })

  const filtradas = categorias.filter((c) => filter === 'ALL' || c.tipo === filter)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-500 mt-0.5">Organize lançamentos por departamento</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['ALL', 'RECEITA', 'DESPESA'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'ALL' ? 'Todas' : f === 'RECEITA' ? 'Receita' : 'Despesa'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">Nenhuma categoria</p>
          <p className="text-sm mt-1">Crie sua primeira categoria acima</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtradas.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex items-start justify-between group">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{c.name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.tipo === 'RECEITA'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {c.tipo === 'RECEITA' ? 'Receita' : 'Despesa'}
                  </span>
                  {c.dreCategoria && (
                    <span className="text-xs text-slate-500">{DRE_LABELS[c.dreCategoria] ?? c.dreCategoria}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deletar(c.id)}
                className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Nova Categoria</h3>
              <button onClick={() => { setOpen(false); reset() }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <form onSubmit={handleSubmit((d) => criar(d))} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Nome</label>
                <input
                  {...register('name')}
                  placeholder="Ex: Folha de Pagamento"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Tipo</label>
                <select {...register('tipo')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                  <option value="DESPESA">Despesa</option>
                  <option value="RECEITA">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Linha do DRE <span className="text-gray-400">(opcional)</span></label>
                <select {...register('dreCategoria')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                  <option value="">— não mapeado</option>
                  {DRE_CATEGORIAS.map((d) => (
                    <option key={d} value={d}>{DRE_LABELS[d] ?? d}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setOpen(false); reset() }}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                >Cancelar</button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg"
                >{isPending ? 'Criando...' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
