'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import Link from 'next/link'
import api from '@/lib/api'
import { TableSkeleton } from '@/components/TableSkeleton'
import { EmptyState } from '@/components/EmptyState'

interface AuditLog {
  id: string
  userId: string
  userEmail: string
  enterpriseId: string | null
  action: string
  entityType: string | null
  entityId: string | null
  createdAt: string
}

interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

const ACTION_LABELS: Record<string, string> = {
  USER_REGISTER: 'Registro',
  USER_LOGIN: 'Login',
  USER_LOGOUT: 'Logout',
  PASSWORD_RESET_REQUESTED: 'Reset de senha solicitado',
  PASSWORD_RESET_COMPLETED: 'Senha redefinida',
  EMAIL_VERIFICATION_RESENT: 'Verificação reenviada',
  USER_CREATED: 'Usuário criado',
  USER_UPDATED: 'Usuário atualizado',
  USER_DELETED: 'Usuário removido',
  PROFILE_UPDATED: 'Perfil atualizado',
  PASSWORD_CHANGED: 'Senha alterada',
  ENTERPRISE_UPDATED: 'Empresa atualizada',
  EXTRATO_IMPORTED: 'Extrato importado',
  EXTRATO_DELETED: 'Extrato removido',
  EXTRATO_BATCH_DELETED: 'Lote de importação cancelado',
  EXTRATO_CATEGORIA_UPDATED: 'Categoria atribuída',
  EXTRATO_CONTA_UPDATED: 'Conta atribuída',
  EXTRATO_CREATED: 'Extrato criado',
  EXTRATO_UPDATED: 'Extrato editado',
  CATEGORIA_CREATED: 'Categoria criada',
  CATEGORIA_DELETED: 'Categoria removida',
  CONTA_BANCARIA_CREATED: 'Conta bancária criada',
  CONTA_BANCARIA_DELETED: 'Conta bancária removida',
  ENTERPRISE_SWITCH: 'Troca de empresa',
  USER_MEMBER_ADDED: 'Membro adicionado',
  ENTERPRISE_APPROVED: 'Empresa aprovada',
  ENTERPRISE_REJECTED: 'Empresa rejeitada',
  ENTERPRISE_PLAN_UPDATED: 'Plano alterado',
  ENTERPRISE_DELETED: 'Empresa excluída',
}

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  USER_LOGOUT: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300',
  USER_REGISTER: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  USER_DELETED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  ENTERPRISE_APPROVED: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  ENTERPRISE_REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  ENTERPRISE_DELETED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  PASSWORD_RESET_REQUESTED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  PASSWORD_RESET_COMPLETED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  ENTERPRISE_SWITCH: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
}

const ALL_ACTIONS = Object.keys(ACTION_LABELS)

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AuditLogPage() {
  const [page, setPage] = useState(0)
  const [emailSearch, setEmailSearch] = useState('')
  const [emailFilter, setEmailFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const params = new URLSearchParams({ page: String(page), size: '50' })
  if (actionFilter) params.set('action', actionFilter)
  if (dateFrom) params.set('from', dateFrom)
  if (dateTo) params.set('to', dateTo)

  const { data, isLoading } = useQuery<Page<AuditLog>>({
    queryKey: ['audit-logs', page, actionFilter, dateFrom, dateTo],
    queryFn: () => api.get(`/audit-logs?${params}`).then(r => r.data),
    staleTime: 30_000,
  })

  const logs = data?.content ?? []
  const filteredLogs = emailFilter
    ? logs.filter(l => l.userEmail?.toLowerCase().includes(emailFilter.toLowerCase()))
    : logs
  const totalPages = data?.totalPages ?? 0

  function clearFilters() {
    setEmailSearch('')
    setEmailFilter('')
    setActionFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(0)
  }

  const hasFilters = emailFilter || actionFilter || dateFrom || dateTo

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/painel-admin"
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Audit Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Registro de todas as ações realizadas na plataforma
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          {/* Busca por email */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={emailSearch}
              onChange={e => setEmailSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setEmailFilter(emailSearch); setPage(0) } }}
              placeholder="Filtrar por e-mail (Enter)"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Filtro de ação */}
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(0) }}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-blue-400"
          >
            <option value="">Todas as ações</option>
            {ALL_ACTIONS.map(a => (
              <option key={a} value={a}>{ACTION_LABELS[a]}</option>
            ))}
          </select>

          {/* De */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">De</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(0) }}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Até */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Até</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(0) }}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-blue-400"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={10} cols={5} />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Nenhum registro encontrado"
            description="Tente ajustar os filtros ou aguarde novas ações na plataforma."
            action={hasFilters ? { label: 'Limpar filtros', onClick: clearFilters } : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-700/40">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 w-40">Data / Hora</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Usuário</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 w-56">Ação</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 w-32">Entidade</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                          {log.userEmail ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
                        }`}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {log.entityType ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-400 dark:text-slate-500 truncate max-w-xs block">
                          {log.entityId ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {data?.totalElements ?? 0} registros · página {(data?.number ?? 0) + 1} de {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
