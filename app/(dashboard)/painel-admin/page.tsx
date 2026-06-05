'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2, XCircle, Clock, Building2, ChevronRight,
  Crown, Shield, User as UserIcon, Trash2, ArrowLeft, CreditCard, Plus, X, ShieldCheck, Pencil,
} from 'lucide-react'
import Link from 'next/link'
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
  CEO:   { label: 'Owner',        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',     icon: <Crown    className="w-3 h-3" /> },
  OWNER: { label: 'Operador',     color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: <Shield   className="w-3 h-3" /> },
  USER:  { label: 'Visualizador', color: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300',           icon: <UserIcon className="w-3 h-3" /> },
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
  const [showNovoAdmin, setShowNovoAdmin] = useState(false)
  const [novoAdminForm, setNovoAdminForm] = useState({ name: '', email: '', password: '' })
  const [novoAdminError, setNovoAdminError] = useState('')
  const [confirmDeleteEmpresa, setConfirmDeleteEmpresa] = useState(false)
  const [editingEmpresaNome, setEditingEmpresaNome] = useState(false)
  const [empresaNomeDraft, setEmpresaNomeDraft] = useState('')
  const [editingUser, setEditingUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [showNovaEmpresa, setShowNovaEmpresa] = useState(false)
  const [novaEmpresaForm, setNovaEmpresaForm] = useState({
    name: '', tipoPessoa: 'JURIDICA' as 'JURIDICA' | 'FISICA', cnpj: '', cpf: '', plan: 'FREE',
    adminName: '', adminEmail: '', adminPassword: '',
  })
  const [novaEmpresaError, setNovaEmpresaError] = useState('')

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
  const { mutate: editarEmpresa, isPending: salvandoEmpresa } = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch<AdminEnterprise>(`/admin/empresas/${id}`, { name }),
    onSuccess: (_, { name }) => {
      qc.invalidateQueries({ queryKey: ['admin-empresas'] })
      setSelectedEmpresa(e => e ? { ...e, name } : e)
      setEditingEmpresaNome(false)
    },
  })
  const { mutate: editarUsuario, isPending: salvandoUsuario } = useMutation({
    mutationFn: ({ id, name, email }: { id: string; name: string; email: string }) =>
      api.patch(`/admin/empresas/${selectedEmpresa!.id}/usuarios/${id}`, { name, email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-empresa-usuarios'] })
      setEditingUser(null)
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
    onError: (e: unknown) => setAddUserError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao cadastrar'),
  })
  const { mutate: criarAdmin, isPending: criandoAdmin } = useMutation({
    mutationFn: () => api.post('/admin/plataforma/usuarios', novoAdminForm),
    onSuccess: () => {
      setNovoAdminForm({ name: '', email: '', password: '' })
      setShowNovoAdmin(false)
      setNovoAdminError('')
    },
    onError: (e: unknown) => setNovoAdminError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao criar admin'),
  })
  const { mutate: criarEmpresa, isPending: criandoEmpresa } = useMutation({
    mutationFn: () => api.post('/admin/empresas', {
      ...novaEmpresaForm,
      cnpj: novaEmpresaForm.tipoPessoa === 'JURIDICA' ? novaEmpresaForm.cnpj.replace(/\D/g, '') : undefined,
      cpf:  novaEmpresaForm.tipoPessoa === 'FISICA'   ? novaEmpresaForm.cpf.replace(/\D/g, '')  : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-empresas'] })
      setNovaEmpresaForm({ name: '', tipoPessoa: 'JURIDICA', cnpj: '', cpf: '', plan: 'FREE', adminName: '', adminEmail: '', adminPassword: '' })
      setShowNovaEmpresa(false)
      setNovaEmpresaError('')
    },
    onError: (e: unknown) => setNovaEmpresaError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao criar empresa'),
  })

  function submitNovaEmpresa() {
    const f = novaEmpresaForm
    const doc = f.tipoPessoa === 'JURIDICA' ? f.cnpj.replace(/\D/g, '') : f.cpf.replace(/\D/g, '')
    const docLen = f.tipoPessoa === 'JURIDICA' ? 14 : 11
    if (!f.name.trim() || doc.length !== docLen || !f.adminName.trim() || !f.adminEmail.trim() || f.adminPassword.length < 8) {
      setNovaEmpresaError('Preencha todos os campos corretamente')
      return
    }
    setNovaEmpresaError('')
    criarEmpresa()
  }

  function submitNovoAdmin() {
    if (!novoAdminForm.name.trim() || !novoAdminForm.email.trim() || !novoAdminForm.password.trim()) {
      setNovoAdminError('Preencha todos os campos')
      return
    }
    setNovoAdminError('')
    criarAdmin()
  }

  const totalEmpresas = empresas.length
  const ativas    = empresas.filter(e => e.status === 'ATIVA').length
  const pendentes = empresas.filter(e => e.status === 'PENDENTE').length
  const bloqueadas = empresas.filter(e => e.status === 'BLOQUEADA').length

  function abrirEmpresa(e: AdminEnterprise) {
    setSelectedEmpresa(e)
    setPlanDraft(e.plan)
    setEditingPlan(false)
    setEditingRole(null)
    setEditingUser(null)
    setEditingEmpresaNome(false)
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Painel Admin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gerencie as empresas cadastradas na plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/painel-admin/audit-log"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 bg-white dark:bg-slate-800 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" /> Audit Log
          </Link>
          <button
            onClick={() => { setShowNovaEmpresa(true); setNovaEmpresaError('') }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nova Empresa
          </button>
          <button
            onClick={() => { setShowNovoAdmin(true); setNovoAdminError('') }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Admin
          </button>
        </div>
      </div>

      {/* Modal: Nova Empresa */}
      {showNovaEmpresa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Nova Empresa</h2>
              <button onClick={() => setShowNovaEmpresa(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dados da empresa</p>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Nome da empresa</label>
                <input value={novaEmpresaForm.name} onChange={e => setNovaEmpresaForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Minha Empresa Ltda."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Tipo de pessoa</label>
                  <select value={novaEmpresaForm.tipoPessoa} onChange={e => setNovaEmpresaForm(f => ({ ...f, tipoPessoa: e.target.value as 'JURIDICA' | 'FISICA', cnpj: '', cpf: '' }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer">
                    <option value="JURIDICA">Pessoa Jurídica</option>
                    <option value="FISICA">Pessoa Física</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">{novaEmpresaForm.tipoPessoa === 'JURIDICA' ? 'CNPJ' : 'CPF'}</label>
                  <input
                    value={novaEmpresaForm.tipoPessoa === 'JURIDICA' ? novaEmpresaForm.cnpj : novaEmpresaForm.cpf}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '')
                      if (novaEmpresaForm.tipoPessoa === 'JURIDICA') {
                        const v = raw.slice(0, 14).replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2')
                        setNovaEmpresaForm(f => ({ ...f, cnpj: v }))
                      } else {
                        const v = raw.slice(0, 11).replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2')
                        setNovaEmpresaForm(f => ({ ...f, cpf: v }))
                      }
                    }}
                    placeholder={novaEmpresaForm.tipoPessoa === 'JURIDICA' ? '00.000.000/0000-00' : '000.000.000-00'}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Plano</label>
                <select value={novaEmpresaForm.plan} onChange={e => setNovaEmpresaForm(f => ({ ...f, plan: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer">
                  <option value="FREE">FREE</option>
                  <option value="BASIC">BASIC</option>
                  <option value="PRO">PRO</option>
                </select>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Usuário responsável (Owner)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Nome</label>
                  <input value={novaEmpresaForm.adminName} onChange={e => setNovaEmpresaForm(f => ({ ...f, adminName: e.target.value }))}
                    placeholder="João Silva"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">E-mail</label>
                  <input value={novaEmpresaForm.adminEmail} onChange={e => setNovaEmpresaForm(f => ({ ...f, adminEmail: e.target.value }))}
                    type="email" placeholder="joao@empresa.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Senha</label>
                <input value={novaEmpresaForm.adminPassword} onChange={e => setNovaEmpresaForm(f => ({ ...f, adminPassword: e.target.value }))}
                  type="password" placeholder="Mínimo 8 caracteres"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              {novaEmpresaError && <p className="text-red-500 text-sm">{novaEmpresaError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowNovaEmpresa(false)}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                  Cancelar
                </button>
                <button onClick={submitNovaEmpresa} disabled={criandoEmpresa}
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium cursor-pointer transition-colors">
                  {criandoEmpresa ? 'Criando...' : 'Criar empresa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de empresas */}
      {!selectedEmpresa && (
        <>
          {/* Stats */}
          {!isLoading && (
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Total',      value: totalEmpresas, color: 'text-gray-800 dark:text-gray-100', bg: 'bg-white dark:bg-slate-800',           border: 'border-gray-200 dark:border-slate-700' },
                { label: 'Ativas',     value: ativas,        color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/10',   border: 'border-green-100 dark:border-green-900/30' },
                { label: 'Pendentes',  value: pendentes,     color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10',   border: 'border-amber-100 dark:border-amber-900/30' },
                { label: 'Bloqueadas', value: bloqueadas,    color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/10',       border: 'border-red-100 dark:border-red-900/30' },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} className={`${bg} border ${border} rounded-xl px-4 py-3`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filtros por status */}
          <div className="flex flex-wrap gap-2 mb-4">
            {([['', 'Todas'], ['PENDENTE', 'Pendentes'], ['ATIVA', 'Ativas'], ['BLOQUEADA', 'Bloqueadas']] as const).map(([s, l]) => (
              <button key={s} onClick={() => setFiltroStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empresa</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Documento</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plano</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cadastro</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {empresas.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <button onClick={() => abrirEmpresa(e)}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer">
                          {e.name} <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{e.cnpj ?? e.cpf ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[e.plan] ?? PLAN_COLORS['FREE']}`}>
                          {e.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[e.status]}`}>
                          {e.status === 'PENDENTE'  && <Clock        className="w-3 h-3" />}
                          {e.status === 'ATIVA'     && <CheckCircle2 className="w-3 h-3" />}
                          {e.status === 'BLOQUEADA' && <XCircle      className="w-3 h-3" />}
                          {STATUS_LABELS[e.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{formatDate(e.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {e.status !== 'ATIVA' && (
                            <button onClick={() => aprovar(e.id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg cursor-pointer transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                            </button>
                          )}
                          {e.status !== 'BLOQUEADA' && (
                            <button onClick={() => rejeitar(e.id)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 text-xs rounded-lg cursor-pointer transition-colors">
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
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-5 cursor-pointer transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar para empresas
          </button>

          {/* Card da empresa */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 mb-5">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                {editingEmpresaNome ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={empresaNomeDraft}
                      onChange={e => setEmpresaNomeDraft(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') editarEmpresa({ id: selectedEmpresa.id, name: empresaNomeDraft })
                        if (e.key === 'Escape') setEditingEmpresaNome(false)
                      }}
                      autoFocus
                      className="px-3 py-1.5 border border-blue-400 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 w-64"
                    />
                    <button
                      onClick={() => editarEmpresa({ id: selectedEmpresa.id, name: empresaNomeDraft })}
                      disabled={salvandoEmpresa || !empresaNomeDraft.trim()}
                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg cursor-pointer transition-colors"
                    >
                      {salvandoEmpresa ? '...' : 'Salvar'}
                    </button>
                    <button onClick={() => setEditingEmpresaNome(false)}
                      className="px-2 py-1.5 text-xs border border-gray-200 dark:border-slate-600 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/nome">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedEmpresa.name}</h2>
                    <button
                      onClick={() => { setEmpresaNomeDraft(selectedEmpresa.name); setEditingEmpresaNome(true) }}
                      className="opacity-0 group-hover/nome:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-500 transition-all cursor-pointer"
                      title="Editar nome da empresa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedEmpresa.cnpj ? `CNPJ: ${selectedEmpresa.cnpj}` : selectedEmpresa.cpf ? `CPF: ${selectedEmpresa.cpf}` : ''}
                  {' · '}Cadastro: {formatDate(selectedEmpresa.createdAt)}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                {selectedEmpresa.status !== 'ATIVA' && (
                  <button onClick={() => aprovar(selectedEmpresa.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg cursor-pointer transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> Aprovar
                  </button>
                )}
                {selectedEmpresa.status !== 'BLOQUEADA' && (
                  <button onClick={() => rejeitar(selectedEmpresa.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-sm rounded-lg cursor-pointer transition-colors">
                    <XCircle className="w-4 h-4" /> Bloquear
                  </button>
                )}
                {confirmDeleteEmpresa ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">Apagar tudo?</span>
                    <button
                      onClick={() => deletarEmpresa(selectedEmpresa.id)}
                      disabled={deletandoEmpresa}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {deletandoEmpresa ? 'Deletando...' : 'Confirmar'}
                    </button>
                    <button onClick={() => setConfirmDeleteEmpresa(false)}
                      className="px-3 py-1.5 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteEmpresa(true)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm rounded-lg cursor-pointer transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Deletar empresa
                  </button>
                )}
              </div>
            </div>

            {/* Status + Plano */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[selectedEmpresa.status]}`}>
                  {STATUS_LABELS[selectedEmpresa.status]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Plano:</span>
                {editingPlan ? (
                  <div className="flex items-center gap-2">
                    <select value={planDraft} onChange={e => setPlanDraft(e.target.value)}
                      className="text-xs border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 cursor-pointer">
                      <option value="FREE">FREE</option>
                      <option value="BASIC">BASIC</option>
                      <option value="PRO">PRO</option>
                    </select>
                    <button
                      disabled={savingPlan}
                      onClick={() => salvarPlano({ id: selectedEmpresa.id, plan: planDraft })}
                      className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded cursor-pointer transition-colors">
                      {savingPlan ? '...' : 'Salvar'}
                    </button>
                    <button onClick={() => setEditingPlan(false)}
                      className="text-xs px-2 py-1 border border-gray-200 dark:border-slate-600 rounded text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingPlan(true)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity ${PLAN_COLORS[selectedEmpresa.plan] ?? PLAN_COLORS['FREE']}`}>
                    {selectedEmpresa.plan}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Usuários da empresa */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Usuários</h3>
            <button
              onClick={() => { setShowAddUser(f => !f); setAddUserError('') }}
              className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer transition-colors"
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
                    type="password" placeholder="Mínimo 8 caracteres"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cargo</label>
                  <select value={addUserForm.role} onChange={e => setAddUserForm(f => ({ ...f, role: e.target.value as CompanyRole }))}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer">
                    <option value="CEO">Owner — Dono</option>
                    <option value="OWNER">Operador</option>
                    <option value="USER">Visualizador</option>
                  </select>
                </div>
              </div>
              {addUserError && <p className="text-red-500 text-xs mb-2">{addUserError}</p>}
              <button onClick={submitAddUser} disabled={adicionando}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg cursor-pointer transition-colors">
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
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">E-mail</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Papel</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {usuariosEmpresa.map((u) => {
                    const meta = ROLE_META[u.role] ?? ROLE_META['USER']
                    const isEditingThisUser = editingUser?.id === u.id
                    return (
                      <tr key={u.id} className={`group transition-colors ${isEditingThisUser ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/40'}`}>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {isEditingThisUser ? (
                            <input
                              value={editingUser.name}
                              onChange={e => setEditingUser(v => v ? { ...v, name: e.target.value } : v)}
                              className="w-full px-2 py-1 text-sm border border-blue-400 rounded-lg dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-300"
                            />
                          ) : u.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {isEditingThisUser ? (
                            <input
                              value={editingUser.email}
                              onChange={e => setEditingUser(v => v ? { ...v, email: e.target.value } : v)}
                              type="email"
                              className="w-full px-2 py-1 text-sm border border-blue-400 rounded-lg dark:bg-slate-700 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-300"
                            />
                          ) : u.email}
                        </td>
                        <td className="px-4 py-3">
                          {editingRole?.id === u.id ? (
                            <div className="flex items-center gap-2">
                              <select value={editingRole.role}
                                onChange={e => setEditingRole({ id: u.id, role: e.target.value as CompanyRole })}
                                className="text-xs border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 cursor-pointer">
                                {(['CEO', 'OWNER', 'USER'] as CompanyRole[]).map(r => (
                                  <option key={r} value={r}>{ROLE_META[r].label}</option>
                                ))}
                              </select>
                              <button onClick={() => alterarRole(editingRole)}
                                className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded cursor-pointer transition-colors">Salvar</button>
                              <button onClick={() => setEditingRole(null)}
                                className="text-xs px-2 py-1 border border-gray-200 dark:border-slate-600 rounded text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">Cancelar</button>
                            </div>
                          ) : (
                            <button onClick={() => setEditingRole({ id: u.id, role: u.role })}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity ${meta.color}`}>
                              {meta.icon} {meta.label}
                            </button>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          {isEditingThisUser ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => editarUsuario({ id: u.id, name: editingUser.name, email: editingUser.email })}
                                disabled={salvandoUsuario}
                                className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded cursor-pointer transition-colors"
                              >
                                {salvandoUsuario ? '...' : 'Salvar'}
                              </button>
                              <button onClick={() => setEditingUser(null)}
                                className="px-2 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                Cancelar
                              </button>
                            </div>
                          ) : confirmDeleteUser === u.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => removerUser(u.id)}
                                className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded cursor-pointer transition-colors">
                                Confirmar
                              </button>
                              <button onClick={() => setConfirmDeleteUser(null)}
                                className="px-2 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => { setEditingUser({ id: u.id, name: u.name, email: u.email }); setConfirmDeleteUser(null); setEditingRole(null) }}
                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded cursor-pointer transition-colors"
                                title="Editar usuário"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setConfirmDeleteUser(u.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded cursor-pointer transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

      {/* Modal: Novo Admin */}
      {showNovoAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 dark:text-white">Novo Administrador</h3>
              <button onClick={() => setShowNovoAdmin(false)} className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Cria um usuário com acesso total à plataforma (PLATFORM_ADMIN), sem vínculo com empresa.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Nome</label>
                <input value={novoAdminForm.name} onChange={e => setNovoAdminForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">E-mail</label>
                <input value={novoAdminForm.email} onChange={e => setNovoAdminForm(f => ({ ...f, email: e.target.value }))}
                  type="email" placeholder="admin@plataforma.com"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Senha</label>
                <input value={novoAdminForm.password} onChange={e => setNovoAdminForm(f => ({ ...f, password: e.target.value }))}
                  type="password" placeholder="Mínimo 8 caracteres"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              {novoAdminError && <p className="text-red-500 text-xs">{novoAdminError}</p>}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowNovoAdmin(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                  Cancelar
                </button>
                <button onClick={submitNovoAdmin} disabled={criandoAdmin}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg cursor-pointer transition-colors">
                  {criandoAdmin ? 'Criando...' : 'Criar Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
