'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Trash2, Crown, Shield, User as UserIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import type { User, CompanyRole } from '@/types'

const ROLE_META: Record<CompanyRole, { label: string; desc: string; color: string; icon: React.ReactNode }> = {
  CEO:   { label: 'Owner',      desc: 'Dono — acesso total',         color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',  icon: <Crown  className="w-3 h-3" /> },
  OWNER: { label: 'Operador',   desc: 'Operador — gerencia tudo exceto Owner', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: <Shield className="w-3 h-3" /> },
  USER:  { label: 'Visualizador', desc: 'Leitura — dashboard, DRE e relatório', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300', icon: <UserIcon className="w-3 h-3" /> },
}

const inviteSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['CEO', 'OWNER', 'USER']),
})
type InviteForm = z.infer<typeof inviteSchema>

export default function UsuariosPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<{ id: string; role: CompanyRole } | null>(null)

  const { data: me } = useQuery<{ id: string; role: string }>({
    queryKey: ['me'],
    queryFn: () => api.get('/me').then(r => r.data),
  })
  const isCeo = me?.role === 'CEO'
  const isOwner = me?.role === 'OWNER'
  const canManage = isCeo || isOwner

  const { data: usuarios = [], isLoading } = useQuery<User[]>({
    queryKey: ['usuarios'],
    queryFn: () => api.get<User[]>('/users').then(r => r.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'USER' },
  })

  const { mutate: convidar, isPending } = useMutation({
    mutationFn: (data: InviteForm) => api.post('/users', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); reset(); setOpen(false) },
  })

  const { mutate: deletar } = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); setConfirmDelete(null) },
  })

  const { mutate: editarRole } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.patch(`/users/${id}`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); setEditingRole(null) },
  })

  function canEditUser(u: User) {
    if (!canManage) return false
    if (u.id === me?.id) return false
    if (isOwner && u.role === 'CEO') return false
    return true
  }

  function rolesDisponiveis(): CompanyRole[] {
    if (isCeo) return ['CEO', 'OWNER', 'USER']
    return ['OWNER', 'USER']
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Usuários</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gerencie os membros da empresa</p>
        </div>
        {canManage && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Convidar usuário
          </button>
        )}
      </div>

      {/* Legenda de papéis */}
      <div className="flex flex-wrap gap-3 mb-5">
        {(['CEO', 'OWNER', 'USER'] as CompanyRole[]).map(r => {
          const m = ROLE_META[r]
          return (
            <div key={r} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${m.color}`}>
                {m.icon} {m.label}
              </span>
              <span>— {m.desc}</span>
            </div>
          )
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">E-mail</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Papel</th>
                {canManage && <th className="w-20" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {usuarios.map((u) => {
                const isMe = u.id === me?.id
                const meta = ROLE_META[u.role as CompanyRole] ?? ROLE_META['USER']
                return (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 group">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        {u.name}
                        {isMe && <span className="text-xs text-gray-400">(você)</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      {canEditUser(u) && editingRole?.id === u.id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingRole.role}
                            onChange={e => setEditingRole({ id: u.id, role: e.target.value as CompanyRole })}
                            className="text-xs border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 focus:outline-none"
                          >
                            {rolesDisponiveis().map(r => (
                              <option key={r} value={r}>{ROLE_META[r].label}</option>
                            ))}
                          </select>
                          <button onClick={() => editarRole(editingRole)}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded">Salvar</button>
                          <button onClick={() => setEditingRole(null)}
                            className="text-xs px-2 py-1 border border-gray-200 dark:border-slate-600 rounded text-gray-500">Cancelar</button>
                        </div>
                      ) : (
                        <button
                          disabled={!canEditUser(u)}
                          onClick={() => canEditUser(u) && setEditingRole({ id: u.id, role: u.role as CompanyRole })}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${meta.color} ${canEditUser(u) ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                        >
                          {meta.icon} {meta.label}
                        </button>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-2 py-3">
                        {canEditUser(u) && (
                          confirmDelete === u.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => deletar(u.id)}
                                className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded">Confirmar</button>
                              <button onClick={() => setConfirmDelete(null)}
                                className="px-2 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded text-gray-500">Cancelar</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(u.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 rounded transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de convite */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-xl mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Convidar usuário</h3>
              <button onClick={() => { setOpen(false); reset() }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit(d => convidar(d))} className="space-y-4">
              <div>
                <label className="block text-sm text-white mb-1">Nome</label>
                <input {...register('name')} placeholder="Nome completo"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm text-white mb-1">E-mail</label>
                <input {...register('email')} type="email" placeholder="usuario@empresa.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm text-white mb-1">Senha temporária</label>
                <input {...register('password')} type="password" placeholder="Mínimo 8 caracteres"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm text-white mb-1">Papel</label>
                <select {...register('role')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                  {rolesDisponiveis().map(r => (
                    <option key={r} value={r}>{ROLE_META[r].label} — {ROLE_META[r].desc}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setOpen(false); reset() }}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg">
                  {isPending ? 'Criando...' : 'Convidar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
