'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/lib/api'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})
type Form = z.infer<typeof schema>

export default function EsqueciSenhaPage() {
  const [enviado, setEnviado] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (data: Form) => api.post('/auth/esqueci-senha', data),
    onSuccess: () => setEnviado(true),
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Financeiro SaaS</h1>
          <p className="text-slate-400 text-sm mt-1">Gestão financeira para PMEs</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-white mb-2">Esqueci minha senha</h2>

          {enviado ? (
            <div className="space-y-4">
              <div className="bg-green-900/40 border border-green-700 rounded-lg px-3 py-3 text-green-400 text-sm">
                Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
              </div>
              <p className="text-center text-slate-500 text-sm">
                <Link href="/login" className="text-blue-400 hover:text-blue-300">
                  Voltar ao login
                </Link>
              </p>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-sm mb-6">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
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

                {isError && (
                  <div className="bg-red-900/40 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm">
                    Erro ao enviar. Tente novamente.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isPending ? 'Enviando...' : 'Enviar link de redefinição'}
                </button>
              </form>

              <p className="text-center text-slate-500 text-sm mt-6">
                <Link href="/login" className="text-blue-400 hover:text-blue-300">
                  Voltar ao login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
