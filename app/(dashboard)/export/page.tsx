'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, CheckCircle } from 'lucide-react'
import { currentAno, monthName } from '@/lib/utils'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { MonthNav } from '@/components/MonthNav'

const MESES = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: monthName(i + 1) }))
const ANOS = Array.from({ length: 5 }, (_, i) => currentAno() - i)

export default function ExportPage() {
  const nav = useMesSelecionado()
  const { mes, ano } = nav
  const [downloading, setDownloading] = useState<'csv' | 'xlsx' | null>(null)
  const [done, setDone] = useState<'csv' | 'xlsx' | null>(null)

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1'

  async function download(format: 'csv' | 'xlsx') {
    setDownloading(format)
    setDone(null)
    try {
      const Cookies = (await import('js-cookie')).default
      const token = Cookies.get('financeiro_token')
      const res = await fetch(`${API}/export/${format}?mes=${mes}&ano=${ano}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Erro ao exportar')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio_${String(mes).padStart(2, '0')}_${ano}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDone(format)
    } catch {
      alert('Erro ao baixar arquivo. Verifique se há dados para o período.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Exportar Relatório</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Baixe o relatório mensal em CSV ou Excel</p>
      </div>

      {/* Period Picker */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Período</h2>
          <MonthNav nav={nav} />
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mês</label>
            <select
              value={mes}
              onChange={(e) => nav.setMes(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 capitalize"
            >
              {MESES.map((m) => (
                <option key={m.value} value={m.value} className="capitalize">{m.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Ano</label>
            <select
              value={ano}
              onChange={(e) => nav.setAno(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              {ANOS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Download Options */}
      <div className="grid sm:grid-cols-2 gap-4">
        <ExportCard
          icon={<FileText className="w-8 h-8 text-blue-500" />}
          title="Extrato CSV"
          description="Arquivo CSV com todos os lançamentos do período. Compatível com Excel e planilhas."
          format="csv"
          loading={downloading === 'csv'}
          done={done === 'csv'}
          onDownload={() => download('csv')}
        />
        <ExportCard
          icon={<FileSpreadsheet className="w-8 h-8 text-green-500" />}
          title="Relatório Excel"
          description="Planilha XLSX com aba de detalhe e resumo mensal formatado com totais e categorias."
          format="xlsx"
          loading={downloading === 'xlsx'}
          done={done === 'xlsx'}
          onDownload={() => download('xlsx')}
        />
      </div>

      {/* Info */}
      <div className="mt-6 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">O relatório inclui:</p>
        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <li>• Todos os lançamentos do mês com data, tipo, razão social, valor e saldo</li>
          <li>• Categoria atribuída a cada lançamento</li>
          <li>• Resumo com total de entradas, saídas e saldo do período</li>
          <li>• Planilha XLSX com duas abas: Extrato Detalhado + Resumo Mensal</li>
        </ul>
      </div>
    </div>
  )
}

function ExportCard({ icon, title, description, format, loading, done, onDownload }: {
  icon: React.ReactNode
  title: string
  description: string
  format: string
  loading: boolean
  done: boolean
  onDownload: () => void
}) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-5">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{description}</p>
      <button
        onClick={onDownload}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          done
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white'
        }`}
      >
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Gerando...</>
        ) : done ? (
          <><CheckCircle className="w-4 h-4" /> Baixado!</>
        ) : (
          <><Download className="w-4 h-4" /> Baixar .{format.toUpperCase()}</>
        )}
      </button>
    </div>
  )
}
