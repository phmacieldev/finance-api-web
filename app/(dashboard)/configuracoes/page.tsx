'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, AlertCircle, User, Building2, Lock, ChevronRight } from 'lucide-react'
import api from '@/lib/api'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Perfil {
  id: string
  name: string
  email: string
  role: string
  enterpriseId: string
  enterpriseName: string
  cnpj: string
  plan: string
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const perfilSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
})

const senhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Informe a senha atual'),
  novaSenha: z.string().min(6, 'Nova senha deve ter ao menos 6 caracteres'),
  confirmar: z.string(),
}).refine((d) => d.novaSenha === d.confirmar, {
  message: 'As senhas não coincidem',
  path: ['confirmar'],
})

const empresaSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
})

type PerfilForm = z.infer<typeof perfilSchema>
type SenhaForm = z.infer<typeof senhaSchema>
type EmpresaForm = z.infer<typeof empresaSchema>

// ─── Componentes auxiliares ────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
        <Icon className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Field({ label, error, children }: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg
        bg-white dark:bg-slate-700 text-gray-900
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      {...props}
    />
  )
}

function Toast({ type, message, onClose }: {
  type: 'success' | 'error'
  message: string
  onClose: () => void
}) {
  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50
      ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success'
        ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
        : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  )
}

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuito',
  BASIC: 'Básico',
  PRO: 'Pro',
}

// ─── Seção: Dados pessoais ─────────────────────────────────────────────────────

function DadosPessoais({ perfil, onSuccess, onError }: {
  perfil: Perfil
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const qc = useQueryClient()

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { name: perfil.name, email: perfil.email },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: PerfilForm) => api.patch('/me', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['perfil'] })
      onSuccess('Dados atualizados com sucesso')
    },
    onError: (e: any) => onError(e.response?.data?.message ?? 'Erro ao atualizar dados'),
  })

  return (
    <SectionCard title="Dados pessoais" icon={User}>
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <Field label="Nome" error={errors.name?.message}>
          <Input {...register('name')} placeholder="Seu nome" />
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          <Input {...register('email')} type="email" placeholder="seu@email.com" />
        </Field>
        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-gray-400">
            Função: <span className="font-medium text-gray-600">{perfil.role === 'ADMIN' ? 'Administrador' : 'Usuário'}</span>
          </span>
          <button
            type="submit"
            disabled={!isDirty || isPending}
            className="ml-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500
              disabled:opacity-50 rounded-lg transition-colors"
          >
            {isPending ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </SectionCard>
  )
}

// ─── Seção: Alterar senha ──────────────────────────────────────────────────────

function AlterarSenha({ onSuccess, onError }: {
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SenhaForm>({
    resolver: zodResolver(senhaSchema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: SenhaForm) =>
      api.patch('/me/senha', { senhaAtual: data.senhaAtual, novaSenha: data.novaSenha }),
    onSuccess: () => {
      reset()
      onSuccess('Senha alterada com sucesso')
    },
    onError: (e: any) => onError(e.response?.data?.message ?? 'Erro ao alterar senha'),
  })

  return (
    <SectionCard title="Alterar senha" icon={Lock}>
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <Field label="Senha atual" error={errors.senhaAtual?.message}>
          <Input {...register('senhaAtual')} type="password" placeholder="••••••••" />
        </Field>
        <Field label="Nova senha" error={errors.novaSenha?.message}>
          <Input {...register('novaSenha')} type="password" placeholder="Mín. 6 caracteres" />
        </Field>
        <Field label="Confirmar nova senha" error={errors.confirmar?.message}>
          <Input {...register('confirmar')} type="password" placeholder="Repita a nova senha" />
        </Field>
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500
              disabled:opacity-50 rounded-lg transition-colors"
          >
            {isPending ? 'Alterando...' : 'Alterar senha'}
          </button>
        </div>
      </form>
    </SectionCard>
  )
}

// ─── Seção: Dados da empresa ───────────────────────────────────────────────────

function DadosEmpresa({ perfil, onSuccess, onError }: {
  perfil: Perfil
  onSuccess: (msg: string) => void
  onError: (msg: string) => void
}) {
  const qc = useQueryClient()
  const isAdmin = perfil.role === 'ADMIN'

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<EmpresaForm>({
    resolver: zodResolver(empresaSchema),
    defaultValues: { name: perfil.enterpriseName, cnpj: perfil.cnpj },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: EmpresaForm) => api.patch('/me/empresa', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['perfil'] })
      onSuccess('Dados da empresa atualizados')
    },
    onError: (e: any) => onError(e.response?.data?.message ?? 'Erro ao atualizar empresa'),
  })

  return (
    <SectionCard title="Dados da empresa" icon={Building2}>
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <Field label="Razão social" error={errors.name?.message}>
          <Input {...register('name')} placeholder="Nome da empresa" disabled={!isAdmin} />
        </Field>
        <Field label="CNPJ" error={errors.cnpj?.message}>
          <Input {...register('cnpj')} placeholder="00.000.000/0000-00" disabled={!isAdmin} />
        </Field>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Plano atual:</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
              ${perfil.plan === 'PRO'
                ? 'bg-blue-100 text-blue-700'
                : perfil.plan === 'BASIC'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600'}`}>
              {PLAN_LABELS[perfil.plan] ?? perfil.plan}
            </span>
          </div>
          {isAdmin && (
            <button
              type="submit"
              disabled={!isDirty || isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500
                disabled:opacity-50 rounded-lg transition-colors"
            >
              {isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
          )}
          {!isAdmin && (
            <span className="text-xs text-gray-400">Somente administradores podem editar</span>
          )}
        </div>
      </form>
    </SectionCard>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data: perfil, isLoading } = useQuery<Perfil>({
    queryKey: ['perfil'],
    queryFn: () => api.get<Perfil>('/me').then((r) => r.data),
  })

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie seus dados pessoais e da empresa</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : perfil ? (
        <div className="space-y-5">
          <DadosPessoais
            perfil={perfil}
            onSuccess={(m) => showToast('success', m)}
            onError={(m) => showToast('error', m)}
          />
          <AlterarSenha
            onSuccess={(m) => showToast('success', m)}
            onError={(m) => showToast('error', m)}
          />
          <DadosEmpresa
            perfil={perfil}
            onSuccess={(m) => showToast('success', m)}
            onError={(m) => showToast('error', m)}
          />
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-20">Não foi possível carregar o perfil</p>
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
