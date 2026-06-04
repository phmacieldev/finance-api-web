'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { saveToken, saveRefreshToken } from '@/lib/auth'
import { clearMesSelecionado } from '@/hooks/useMesSelecionado'
import { queryClient } from '@/lib/queryClient'
import type { TokenResponseDTO } from '@/types'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})
type Form = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Form) =>
      api.post<TokenResponseDTO>('/auth/login', data).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.clear()
      if (data.token) saveToken(data.token)
      if (data.refreshToken) saveRefreshToken(data.refreshToken)
      clearMesSelecionado()
      router.push(data.role === 'PLATFORM_ADMIN' ? '/painel-admin' : '/dashboard')
    },
    onError: (err: unknown) => {
      const msg: string = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? ''
      if (msg.includes('verificado')) {
        setError('E-mail não verificado. Verifique sua caixa de entrada.')
      } else if (msg.includes('aprovação')) {
        setError('Empresa aguardando aprovação pelo administrador da plataforma.')
      } else if (msg.includes('bloqueada')) {
        setError('Empresa bloqueada. Entre em contato com o suporte.')
      } else {
        setError('E-mail ou senha incorretos.')
      }
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Financeiro SaaS</h1>
          <p className="text-slate-400 text-sm mt-1">Gestão financeira para PMEs</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Entrar</h2>

          <form onSubmit={handleSubmit((data) => { setError(''); mutate(data) })} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">E-mail</label>
              <input
                {...register('email')}
                type="email"
                placeholder="seu@email.com"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Senha</label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
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
              {isPending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-4">
            <Link href="/esqueci-senha" className="text-slate-400 hover:text-slate-300">
              Esqueci minha senha
            </Link>
          </p>

          <p className="text-center text-slate-500 text-sm mt-2">
            Não tem conta?{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300">
              Criar empresa
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
