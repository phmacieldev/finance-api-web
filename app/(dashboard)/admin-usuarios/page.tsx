'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Crown, Shield, User as UserIcon, Trash2, Plus, X } from 'lucide-react'
import api from '@/lib/api'
import type { AdminEnterprise, AdminUser, CompanyRole } from '@/types'

const ROLE_META: Record<CompanyRole, { label: string; color: string; icon: React.ReactNode }> = {
  CEO:   { label: 'CEO',          color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',    icon: <Crown   className="w-3 h-3" /> },
  OWNER: { label: 'Operador',     color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: <Shield  className="w-3 h-3" /> },
  USER:  { label: 'Visualizador', color: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300',          icon: <UserIcon className="w-3 h-3" /> },
}

const BLANK_FORM = { name: '', email: '', password: '', role: 'USER' as CompanyRole }

function EmpresaRow({ empresa }: { empresa: AdminEnterprise }) {
  const qc = useQueryClient()
  const [open, setOpen]           = useState(false)
  const [editingRole, setEditingRole] = useState<{ id: string; role: CompanyRole } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(BLANK_FORM)
  const [formError, setFormError] = useState('')

  const { data: usuarios = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-empresa-usuarios', empresa.id],
    queryFn: () => api.get<AdminUser[]>(`/admin/empresas/${empresa.id}/usuarios`).then(r => r.data),
    enabled: open,
  })

  const { mutate: alterarRole } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/empresas/${empresa.id}/usuarios/${id}`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-empresa-usuarios', empresa.id] }); setEditingRole(null) },
  })

  const { mutate: remover } = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/empresas/${empresa.id}/usuarios/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-empresa-usuarios', empresa.id] }); setConfirmDelete(null) },
  })

  const { mutate: adicionar, isPending: adicionando } = useMutation({
    mutationFn: () => api.post(`/admin/empresas/${empresa.id}/usuarios`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-empresa-usuarios', empresa.id] })
      setForm(BLANK_FORM)
      setShowForm(false)
      setFormError('')
    },
    onError: (e: any) => setFormError(e?.response?.data?.message ?? 'Erro ao cadastrar usuário'),
  })

  function submitForm() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Preencha todos os campos')
      return
    }
    setFormError('')
    adicionar()
  }

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {/* Header do acordeão */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{empresa.name}</p>
            <p className="text-xs text-gray-500">{empresa.cnpj}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          empresa.plan === 'PRO'   ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' :
          empresa.plan === 'BASIC' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
          'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
        }`}>{empresa.plan}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-slate-700">
          {/* Barra de ações */}
          <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-700/60">
            <span className="text-xs text-gray-500">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => { setShowForm(f => !f); setFormError('') }}
              className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {showForm ? <><X className="w-3.5 h-3.5" /> Cancelar</> : <><Plus className="w-3.5 h-3.5" /> Cadastrar usuário</>}
            </button>
          </div>

          {/* Formulário de cadastro */}
          {showForm && (
            <div className="px-5 py-4 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Nome</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nome completo"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">E-mail</label>
                  <input
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    type="email"
                    placeholder="email@empresa.com"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Senha</label>
                  <input
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cargo</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as CompanyRole }))}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="CEO">CEO — Dono</option>
                    <option value="OWNER">Operador</option>
                    <option value="USER">Visualizador</option>
                  </select>
                </div>
              </div>
              {formError && <p className="text-red-500 text-xs mb-2">{formError}</p>}
              <button
                onClick={submitForm}
                disabled={adicionando}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg"
              >
                {adicionando ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          )}

          {/* Lista de usuários */}
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : usuarios.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum usuário cadastrado</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase">Nome</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">E-mail</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Cargo</th>
                  <th className="w-14" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
                {usuarios.map(u => {
                  const meta = ROLE_META[u.role] ?? ROLE_META['USER']
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 group">
                      <td className="px-5 py-2.5 font-medium text-gray-800 dark:text-gray-200">{u.name}</td>
                      <td className="px-4 py-2.5 text-gray-500">{u.email}</td>
                      <td className="px-4 py-2.5">
                        {editingRole?.id === u.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={editingRole.role}
                              onChange={e => setEditingRole({ id: u.id, role: e.target.value as CompanyRole })}
                              className="text-xs border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1"
                            >
                              {(['CEO', 'OWNER', 'USER'] as CompanyRole[]).map(r => (
                                <option key={r} value={r}>{ROLE_META[r].label}</option>
                              ))}
                            </select>
                            <button onClick={() => alterarRole(editingRole)}
                              className="text-xs px-2 py-1 bg-blue-600 text-white rounded">Salvar</button>
                            <button onClick={() => setEditingRole(null)}
                              className="text-xs px-2 py-1 border border-gray-200 dark:border-slate-600 rounded text-gray-500">Cancelar</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingRole({ id: u.id, role: u.role })}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80 ${meta.color}`}
                          >
                            {meta.icon} {meta.label}
                          </button>
                        )}
                      </td>
                      <td className="px-2 py-2.5">
                        {confirmDelete === u.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => remover(u.id)}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded">Sim</button>
                            <button onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded text-gray-500">Não</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(u.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 rounded transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminUsuariosPage() {
  const { data: empresas = [], isLoading } = useQuery<AdminEnterprise[]>({
    queryKey: ['admin-empresas', ''],
    queryFn: () => api.get<AdminEnterprise[]>('/admin/empresas').then(r => r.data),
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Usuários</h1>
        <p className="text-sm text-gray-500 mt-0.5">Todos os usuários cadastrados, agrupados por empresa. Clique em uma empresa para expandir.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : empresas.length === 0 ? (
        <p className="text-center text-gray-500 py-16">Nenhuma empresa cadastrada</p>
      ) : (
        <div className="space-y-3">
          {empresas.map(e => <EmpresaRow key={e.id} empresa={e} />)}
        </div>
      )}
    </div>
  )
}
