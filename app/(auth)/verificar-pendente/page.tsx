'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'

export default function VerificarPendentePage() {
  const params = useSearchParams()
  const email = params.get('email') ?? ''
  const [reenviado, setReenviado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function reenviar() {
    if (!email) return
    setLoading(true)
    try {
      await api.post(`/auth/reenviar-verificacao?email=${encodeURIComponent(email)}`)
      setReenviado(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Verifique seu e-mail</h1>
        <p className="text-sm text-gray-500 mb-1">
          Enviamos um link de confirmação para:
        </p>
        <p className="text-sm font-medium text-gray-900 mb-4">{email}</p>
        <p className="text-xs text-gray-400 mb-6">
          Clique no link do e-mail para ativar sua conta e depois volte para fazer o login.
          Após a verificação, um administrador precisará aprovar o cadastro da sua empresa.
        </p>

        {reenviado ? (
          <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            E-mail reenviado com sucesso!
          </div>
        ) : (
          <button
            onClick={reenviar}
            disabled={loading}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            {loading ? 'Reenviando...' : 'Não recebeu? Reenviar e-mail'}
          </button>
        )}

        <div className="mt-4">
          <a href="/login" className="text-sm text-gray-400 hover:text-gray-600">
            Voltar ao login →
          </a>
        </div>
      </div>
    </div>
  )
}
