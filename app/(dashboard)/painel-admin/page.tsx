'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2, XCircle, Clock, Building2, ChevronRight,
  Crown, Shield, User as UserIcon, Trash2, ArrowLeft, CreditCard, Plus, X,
} from 'lucide-react'

import api from '@/lib/api'
import type { AdminEnterprise, AdminUser, CompanyRole } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: 'Aguardando aprovação',
  ATIVA: 'Ativa',
  BLOQUEADA: 'Bloqueada',
}
const STATUS_COLORS: Record<string, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  ATIVA:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  BLOQUEADA: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}
const PLAN_COLORS: Record<string, string> = {
  FREE:  'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300',
  BASIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  PRO:   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}
const ROLE_META: Record<CompanyRole, { label: string; color: string; icon: React.ReactNode }> = {
  CEO:   { label: 'CEO',        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',   icon: <Crown  className="w-3 h-3" /> },
  OWNER: { label: 'Operador',   color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: <Shield className="w-3 h-3" /> },
  USER:  { label: 'Visualizador', color: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300',       icon: <UserIcon className="w-3 h-3" /> },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function PainelAdminPage() {
  const qc = useQueryClient()
  const [filtroStatus, setFiltroStatus] = useState('')
  const [selectedEmpresa, setSelectedEmpresa] = useState<AdminEnterprise | null>(null)
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<{ id: string; role: CompanyRole } | null>(null)
  const [editingPlan, setEditingPlan] = useState(false)
  const [planDraft, setPlanDraft] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [addUserForm, setAddUserForm] = useState({ name: '', email: '', password: '', role: 'USER' as CompanyRole })
  const [addUserError, setAddUserError] = useState('')
  const [confirmDeleteEmpresa, setConfirmDeleteEmpresa] = useState(false)

  const { data: empresas = [], isLoading } = useQuery<AdminEnterprise[]>({
    queryKey: ['admin-empresas', filtroStatus],
    queryFn: () => api.get<AdminEnterprise[]>(`/admin/empresas${filtroStatus ? `?status=${filtroStatus}` : ''}`).then(r => r.data),
  })

  const { data: usuariosEmpresa = [], isLoading: loadingUsers } = useQuery<AdminUser[]>({
    queryKey: ['admin-empresa-usuarios', selectedEmpresa?.id],
    queryFn: () => api.get<AdminUser[]>(`/admin/empresas/${selectedEmpresa!.id}/usuarios`).then(r => r.data),
    enabled: !!selectedEmpresa,
  })

  const { mutate: aprovar } = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/empresas/${id}/aprovar`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['admin-empresas'] })
      if (selectedEmpresa?.id === id) setSelectedEmpresa(e => e ? { ...e, status: 'ATIVA' } : e)
    },
  })
  const { mutate: rejeitar } = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/empresas/${id}/rejeitar`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['admin-empresas'] })
      if (selectedEmpresa?.id === id) setSelectedEmpresa(e => e ? { ...e, status: 'BLOQUEADA' } : e)
    },
  })
  const { mutate: salvarPlano, isPending: savingPlan } = useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) => api.patch(`/admin/empresas/${id}/plano`, { plan }),
    onSuccess: (_, { plan }) => {
      qc.invalidateQueries({ queryKey: ['admin-empresas'] })
      setSelectedEmpresa(e => e ? { ...e, plan } : e)
      setEditingPlan(false)
    },
  })
  const { mutate: removerUser } = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/empresas/${selectedEmpresa!.id}/usuarios/${userId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-empresa-usuarios'] }); setConfirmDeleteUser(null) },
  })
  const { mutate: deletarEmpresa, isPending: deletandoEmpresa } = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/empresas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-empresas'] })
      setSelectedEmpresa(null)
      setConfirmDeleteEmpresa(false)
    },
  })
  const { mutate: alterarRole } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/empresas/${selectedEmpresa!.id}/usuarios/${id}`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-empresa-usuarios'] }); setEditingRole(null) },
  })
  const { mutate: adicionarUsuario, isPending: adicionando } = useMutation({
    mutationFn: () => api.post(`/admin/empresas/${selectedEmpresa!.id}/usuarios`, addUserForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-empresa-usuarios'] })
      setAddUserForm({ name: '', email: '', password: '', role: 'USER' })
      setShowAddUser(false)
      setAddUserError('')
    },
    onError: (e: any) => setAddUserError(e?.response?.data?.message ?? 'Erro ao cadastrar'),
  })

  const pendentes = empresas.filter(e => e.status === 'PENDENTE').length

  function abrirEmpresa(e: AdminEnterprise) {
    setSelectedEmpresa(e)
    setPlanDraft(e.plan)
    setEditingPlan(false)
    setEditingRole(null)
    setConfirmDeleteUser(null)
    setShowAddUser(false)
    setAddUserError('')
  }

  function submitAddUser() {
    if (!addUserForm.name.trim() || !addUserForm.email.trim() || !addUserForm.password.trim()) {
      setAddUserError('Preencha todos os campos')
      return
    }
    setAddUserError('')
    adicionarUsuario()
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Painel Admin</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie as empresas cadastradas na plataforma</p>
        </div>
        {pendentes > 0 && !selectedEmpresa && (
          <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-sm font-medium px-3 py-1 rounded-full">
            {pendentes} pendente{pendentes !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Lista de empresas */}
      {!selectedEmpresa && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {([['', 'Todas'], ['PENDENTE', 'Pendentes'], ['ATIVA', 'Ativas'], ['BLOQUEADA', 'Bloqueadas']] as const).map(([s, l]) => (
              <button key={s} onClick={() => setFiltroStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filtroStatus === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}>{l}</button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : empresas.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
              <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma empresa encontrada</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Empresa</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">CNPJ</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Plano</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cadastro</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {empresas.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-3">
                        <button onClick={() => abrirEmpresa(e)}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                          {e.name} <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{e.cnpj}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[e.plan] ?? PLAN_COLORS['FREE']}`}>
                          {e.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[e.status]}`}>
                          {e.status === 'PENDENTE' && <Clock className="w-3 h-3" />}
                          {e.status === 'ATIVA' && <CheckCircle2 className="w-3 h-3" />}
                          {e.status === 'BLOQUEADA' && <XCircle className="w-3 h-3" />}
                          {STATUS_LABELS[e.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(e.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {e.status !== 'ATIVA' && (
                            <button onClick={() => aprovar(e.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                            </button>
                          )}
                          {e.status !== 'BLOQUEADA' && (
                            <button onClick={() => rejeitar(e.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 text-xs rounded-lg">
                              <XCircle className="w-3.5 h-3.5" /> Bloquear
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Detalhe da empresa */}
      {selectedEmpresa && (
        <div>
          <button onClick={() => setSelectedEmpresa(null)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-5">
            <ArrowLeft className="w-4 h-4" /> Voltar para empresas
          </button>

          {/* Info da empresa */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 mb-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedEmpresa.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">CNPJ: {selectedEmpresa.cnpj} &middot; Cadastro: {formatDate(selectedEmpresa.createdAt)}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {selectedEmpresa.status !== 'ATIVA' && (
                  <button onClick={() => aprovar(selectedEmpresa.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg">
                    <CheckCircle2 className="w-4 h-4" /> Aprovar
                  </button>
                )}
                {selectedEmpresa.status !== 'BLOQUEADA' && (
                  <button onClick={() => rejeitar(selectedEmpresa.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-sm rounded-lg">
                    <XCircle className="w-4 h-4" /> Bloquear
                  </button>
                )}
                {confirmDeleteEmpresa ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">Apagar tudo?</span>
                    <button
                      onClick={() => deletarEmpresa(selectedEmpresa.id)}
                      disabled={deletandoEmpresa}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {deletandoEmpresa ? 'Deletando...' : 'Confirmar'}
                    </button>
                    <button onClick={() => setConfirmDeleteEmpresa(false)}
                      className="px-3 py-1.5 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteEmpresa(true)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" /> Deletar empresa
                  </button>
                )}
              </div>
            </div>

            {/* Status + Plano */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Status:</span>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedEmpresa.status]}`}>
                  {STATUS_LABELS[selectedEmpresa.status]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Plano:</span>
                {editingPlan ? (
                  <div className="flex items-center gap-2">
                    <select value={planDraft} onChange={e => setPlanDraft(e.target.value)}
                      className="text-xs border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1">
                      <option value="FREE">FREE</option>
                      <option value="BASIC">BASIC</option>
                      <option value="PRO">PRO</option>
                    </select>
                    <button
                      disabled={savingPlan}
                      onClick={() => salvarPlano({ id: selectedEmpresa.id, plan: planDraft })}
                      className="text-xs px-2 py-1 bg-blue-600 disabled:opacity-50 text-white rounded">
                      {savingPlan ? '...' : 'Salvar'}
                    </button>
                    <button onClick={() => setEditingPlan(false)}
                      className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-500">Cancelar</button>
                  </div>
                ) : (
                  <button onClick={() => setEditingPlan(true)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80 ${PLAN_COLORS[selectedEmpresa.plan] ?? PLAN_COLORS['FREE']}`}>
                    {selectedEmpresa.plan}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Usuários da empresa */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Usuários</h3>
            <button
              onClick={() => { setShowAddUser(f => !f); setAddUserError('') }}
              className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {showAddUser ? <><X className="w-3.5 h-3.5" /> Cancelar</> : <><Plus className="w-3.5 h-3.5" /> Cadastrar usuário</>}
            </button>
          </div>

          {showAddUser && (
            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Nome</label>
                  <input value={addUserForm.name} onChange={e => setAddUserForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nome completo"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">E-mail</label>
                  <input value={addUserForm.email} onChange={e => setAddUserForm(f => ({ ...f, email: e.target.value }))}
                    type="email" placeholder="email@empresa.com"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Senha</label>
                  <input value={addUserForm.password} onChange={e => setAddUserForm(f => ({ ...f, password: e.target.value }))}
                    type="password" placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cargo</label>
                  <select value={addUserForm.role} onChange={e => setAddUserForm(f => ({ ...f, role: e.target.value as CompanyRole }))}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500">
                    <option value="CEO">CEO — Dono</option>
                    <option value="OWNER">Operador</option>
                    <option value="USER">Visualizador</option>
                  </select>
                </div>
              </div>
              {addUserError && <p className="text-red-500 text-xs mb-2">{addUserError}</p>}
              <button onClick={submitAddUser} disabled={adicionando}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg">
                {adicionando ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          )}

          {loadingUsers ? (
            <div className="flex justify-center py-10">
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
                    <th className="w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {usuariosEmpresa.map((u) => {
                    const meta = ROLE_META[u.role] ?? ROLE_META['USER']
                    return (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 group">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500">{u.email}</td>
                        <td className="px-4 py-3">
                          {editingRole?.id === u.id ? (
                            <div className="flex items-center gap-2">
                              <select value={editingRole.role}
                                onChange={e => setEditingRole({ id: u.id, role: e.target.value as CompanyRole })}
                                className="text-xs border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1">
                                {(['CEO', 'OWNER', 'USER'] as CompanyRole[]).map(r => (
                                  <option key={r} value={r}>{ROLE_META[r].label}</option>
                                ))}
                              </select>
                              <button onClick={() => alterarRole(editingRole)}
                                className="text-xs px-2 py-1 bg-blue-600 text-white rounded">Salvar</button>
                              <button onClick={() => setEditingRole(null)}
                                className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-500">Cancelar</button>
                            </div>
                          ) : (
                            <button onClick={() => setEditingRole({ id: u.id, role: u.role })}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80 ${meta.color}`}>
                              {meta.icon} {meta.label}
                            </button>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          {confirmDeleteUser === u.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => removerUser(u.id)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded">Confirmar</button>
                              <button onClick={() => setConfirmDeleteUser(null)}
                                className="px-2 py-1 text-xs border border-gray-200 rounded text-gray-500">Cancelar</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteUser(u.id)}
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}
