'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 w-full max-w-md text-center">
        <div className="w-14 h-14 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">Algo deu errado</h1>
        <p className="text-slate-400 text-sm mb-6">
          Ocorreu um erro inesperado. Tente novamente ou volte para o início.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Ir para o início
          </a>
        </div>
        {error.digest && (
          <p className="text-slate-600 text-xs mt-4">Código: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
