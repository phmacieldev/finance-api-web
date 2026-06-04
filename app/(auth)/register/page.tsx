'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import type { TokenResponseDTO } from '@/types'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'

const schema = z.object({
  userName: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  enterpriseName: z.string().min(2, 'Nome da empresa obrigatório'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
})
type Form = z.infer<typeof schema>

function Field({ label, name, type = 'text', placeholder, register, errors }: {
  label: string; name: keyof Form; type?: string; placeholder: string
  register: UseFormRegister<Form>; errors: FieldErrors<Form>
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
      />
      {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name]?.message}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Form) =>
      api.post<TokenResponseDTO>('/auth/register', data).then((r) => r.data),
    onSuccess: (data, variables) => {
      // Registration requires email verification — redirect to pending page
      router.push(`/verificar-pendente?email=${encodeURIComponent(variables.email)}`)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Erro ao cadastrar. Tente novamente.')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Financeiro SaaS</h1>
          <p className="text-slate-400 text-sm mt-1">Crie sua conta e empresa</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Criar conta</h2>

          <form onSubmit={handleSubmit((data) => { setError(''); mutate(data) })} className="space-y-4">
            <Field label="Seu nome" name="userName" placeholder="João Silva" register={register} errors={errors} />
            <Field label="E-mail" name="email" type="email" placeholder="seu@email.com" register={register} errors={errors} />
            <Field label="Senha" name="password" type="password" placeholder="Mínimo 8 caracteres" register={register} errors={errors} />
            <Field label="Nome da empresa" name="enterpriseName" placeholder="Minha Empresa Ltda." register={register} errors={errors} />
            <Field label="CNPJ" name="cnpj" placeholder="00.000.000/0001-00" register={register} errors={errors} />

            {error && (
              <div className="bg-red-900/40 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isPending ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
