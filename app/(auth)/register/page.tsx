'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import type { TokenResponseDTO } from '@/types'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'

function maskCnpj(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function maskCpf(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

const schemaCnpj = z.object({
  tipoPessoa: z.literal('JURIDICA'),
  userName: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  enterpriseName: z.string().min(2, 'Nome da empresa obrigatório'),
  cnpj: z.string().refine(v => v.replace(/\D/g, '').length === 14, 'CNPJ deve ter 14 dígitos'),
  cpf: z.string().optional(),
})

const schemaCpf = z.object({
  tipoPessoa: z.literal('FISICA'),
  userName: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  enterpriseName: z.string().min(2, 'Nome / razão obrigatório'),
  cnpj: z.string().optional(),
  cpf: z.string().refine(v => v.replace(/\D/g, '').length === 11, 'CPF deve ter 11 dígitos'),
})

const schema = z.discriminatedUnion('tipoPessoa', [schemaCnpj, schemaCpf])
type Form = z.infer<typeof schema>

function Field({ label, name, type = 'text', placeholder, register, errors }: {
  label: string; name: 'userName' | 'email' | 'password' | 'enterpriseName'; type?: string; placeholder: string
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
      {errors[name] && <p className="text-red-400 text-xs mt-1">{String(errors[name]?.message ?? '')}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [tipoPessoa, setTipoPessoa] = useState<'JURIDICA' | 'FISICA'>('JURIDICA')

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { tipoPessoa: 'JURIDICA' },
  })

  function toggleTipo(tipo: 'JURIDICA' | 'FISICA') {
    setTipoPessoa(tipo)
    reset({ tipoPessoa: tipo, userName: '', email: '', password: '', enterpriseName: '', cnpj: '', cpf: '' })
    setError('')
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Form) => {
      const payload = {
        userName: data.userName,
        email: data.email,
        password: data.password,
        enterpriseName: data.enterpriseName,
        tipoPessoa: data.tipoPessoa,
        cnpj: data.tipoPessoa === 'JURIDICA' ? data.cnpj?.replace(/\D/g, '') : undefined,
        cpf: data.tipoPessoa === 'FISICA' ? data.cpf?.replace(/\D/g, '') : undefined,
      }
      return api.post<TokenResponseDTO>('/auth/register', payload).then(r => r.data)
    },
    onSuccess: (data, variables) => {
      if (data.emailPendente) {
        router.push(`/verificar-pendente?email=${encodeURIComponent(variables.email)}`)
      } else {
        router.push(`/verificar-pendente?email=${encodeURIComponent(variables.email)}&aprovacao=1`)
      }
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
            <Field label="Senha" name="password" type="password" placeholder="Mínimo 8 caracteres com número" register={register} errors={errors} />
            <Field
              label={tipoPessoa === 'JURIDICA' ? 'Nome da empresa' : 'Seu nome completo / razão social'}
              name="enterpriseName"
              placeholder={tipoPessoa === 'JURIDICA' ? 'Minha Empresa Ltda.' : 'João Silva MEI'}
              register={register}
              errors={errors}
            />

            {/* Toggle CNPJ / CPF */}
            <div>
              <div className="flex rounded-lg overflow-hidden border border-slate-700 mb-2">
                <button
                  type="button"
                  onClick={() => toggleTipo('JURIDICA')}
                  className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                    tipoPessoa === 'JURIDICA'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CNPJ
                </button>
                <button
                  type="button"
                  onClick={() => toggleTipo('FISICA')}
                  className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                    tipoPessoa === 'FISICA'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CPF
                </button>
              </div>

              {tipoPessoa === 'JURIDICA' ? (
                <>
                  <Controller name="cnpj" control={control} render={({ field }) => (
                    <input
                      {...field}
                      value={field.value ?? ''}
                      onChange={e => field.onChange(maskCnpj(e.target.value))}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                    />
                  )} />
                  {'cnpj' in errors && errors.cnpj && (
                    <p className="text-red-400 text-xs mt-1">{String(errors.cnpj?.message ?? '')}</p>
                  )}
                </>
              ) : (
                <>
                  <Controller name="cpf" control={control} render={({ field }) => (
                    <input
                      {...field}
                      value={field.value ?? ''}
                      onChange={e => field.onChange(maskCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                    />
                  )} />
                  {'cpf' in errors && errors.cpf && (
                    <p className="text-red-400 text-xs mt-1">{String(errors.cpf?.message ?? '')}</p>
                  )}
                </>
              )}
            </div>

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
