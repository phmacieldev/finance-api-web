import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 w-full max-w-md text-center">
        <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-7 h-7 text-slate-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <p className="text-slate-400 text-sm mb-6">
          A página que você procura não existe ou foi movida.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  )
}
