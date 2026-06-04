'use client'

import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import api from '@/lib/api'

const schema = z.object({
  novaSenha: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmar: z.string().min(1, 'Confirme a senha'),
}).refine((v) => v.novaSenha === v.confirmar, {
  message: 'As senhas não coincidem',
  path: ['confirmar'],
})
type Form = z.infer<typeof schema>

function ResetarSenhaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [erro, setErro] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: (data: Form) =>
      api.post('/auth/resetar-senha', { token, novaSenha: data.novaSenha }),
    onSuccess: () => {
      setTimeout(() => router.push('/login'), 2000)
    },
    onError: () => setErro('Token inválido ou expirado. Solicite um novo link.'),
  })

  if (!token) {
    return (
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <p className="text-red-400 text-sm mb-4">Link inválido. Token não encontrado.</p>
        <Link href="/esqueci-senha" className="text-blue-400 hover:text-blue-300 text-sm">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">Financeiro SaaS</h1>
        <p className="text-slate-400 text-sm mt-1">Gestão financeira para PMEs</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h2 className="text-lg font-semibold text-white mb-6">Nova senha</h2>

        {isSuccess ? (
          <div className="bg-green-900/40 border border-green-700 rounded-lg px-3 py-3 text-green-400 text-sm">
            Senha redefinida com sucesso! Redirecionando para o login...
          </div>
        ) : (
          <form onSubmit={handleSubmit((data) => { setErro(''); mutate(data) })} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nova senha</label>
              <input
                {...register('novaSenha')}
                type="password"
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
              />
              {errors.novaSenha && <p className="text-red-400 text-xs mt-1">{errors.novaSenha.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Confirmar senha</label>
              <input
                {...register('confirmar')}
                type="password"
                placeholder="Repita a senha"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
              />
              {errors.confirmar && <p className="text-red-400 text-xs mt-1">{errors.confirmar.message}</p>}
            </div>

            {erro && (
              <div className="bg-red-900/40 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {isPending ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>
        )}

        <p className="text-center text-slate-500 text-sm mt-6">
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetarSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Suspense fallback={
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
        </div>
      }>
        <ResetarSenhaContent />
      </Suspense>
    </div>
  )
}
