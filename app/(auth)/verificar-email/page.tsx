'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { saveToken } from '@/lib/auth'

export default function VerificarEmailPage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMsg('Token inválido ou ausente.'); return }

    api.get(`/auth/verificar-email?token=${token}`)
      .then(r => {
        const data = r.data as { token?: string }
        if (data.token) saveToken(data.token)
        setStatus('success')
        setTimeout(() => router.push('/dashboard'), 2500)
      })
      .catch(err => {
        setStatus('error')
        setMsg(err.response?.data?.message ?? 'Token inválido ou expirado.')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-lg font-semibold text-gray-900">Verificando e-mail...</h1>
            <p className="text-sm text-gray-500 mt-1">Aguarde um momento</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-gray-900">E-mail confirmado!</h1>
            <p className="text-sm text-gray-500 mt-1">Redirecionando para o dashboard...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-gray-900">Falha na verificação</h1>
            <p className="text-sm text-gray-500 mt-1">{msg}</p>
            <a
              href="/login"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg"
            >
              Ir para o login
            </a>
          </>
        )}
      </div>
    </div>
  )
}
