'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  Upload, X, FileText, FileSpreadsheet, Pencil,
  AlertTriangle, XCircle, CheckCircle2, Trash2, Filter
} from 'lucide-react'
import api from '@/lib/api'
import { formatCurrency, formatDate, monthName } from '@/lib/utils'
import { useMesSelecionado } from '@/hooks/useMesSelecionado'
import { MonthNav } from '@/components/MonthNav'
import type { Extrato, Categoria, ExtratoImportResult, PageResponse, ContaBancaria, Dashboard } from '@/types'

const ACCEPTED = '.csv,.xlsx,.xls'

// ─── Modal de resultado da importação ─────────────────────────────────────────

function ImportacaoModal({
  resultado,
  onConfirmar,
  onEditar,
  onCancelarLote,
}: {
  resultado: ExtratoImportResult
  onConfirmar: () => void
  onEditar: () => void
  onCancelarLote: () => void
}) {
  const { importados, duplicatasIgnoradas, erros, batchId } = resultado
  const podeDesfazer = importados > 0 && !!batchId
  const naoImportouNada = importados === 0

  const [cancelando, setCancelando] = useState(false)

  async function handleCancelar() {
    if (!batchId) return
    setCancelando(true)
    try {
      await api.delete(`/extratos/batch/${batchId}`)
      onCancelarLote()
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resultado da Importação</h2>
            <p className="text-sm text-gray-500 mt-0.5">Revise o que foi processado antes de confirmar</p>
          </div>
          <button
            onClick={onConfirmar}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3 p-6 pb-0">
          <MetricCard
            count={importados}
            label="Importados"
            color="green"
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          />
          <MetricCard
            count={duplicatasIgnoradas}
            label="Duplicatas"
            color="amber"
            icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          />
          <MetricCard
            count={erros}
            label="Erros"
            color="red"
            icon={<XCircle className="w-5 h-5 text-red-500" />}
          />
        </div>

        {/* Detalhes */}
        <div className="px-6 py-5 space-y-3">
          {importados > 0 && (
            <DetalheItem color="green" icon="✓">
              <strong>{importados}</strong> lançamento{importados !== 1 ? 's' : ''} novo{importados !== 1 ? 's' : ''}{' '}
              salvo{importados !== 1 ? 's' : ''} com sucesso no banco.
            </DetalheItem>
          )}
          {duplicatasIgnoradas > 0 && (
            <DetalheItem color="amber" icon="⚠">
              <strong>{duplicatasIgnoradas}</strong> registro{duplicatasIgnoradas !== 1 ? 's' : ''} já existia
              {duplicatasIgnoradas !== 1 ? 'm' : ''} no sistema e{' '}
              {duplicatasIgnoradas !== 1 ? 'foram ignorados' : 'foi ignorado'} para evitar duplicação.
            </DetalheItem>
          )}
          {erros > 0 && (
            <DetalheItem color="red" icon="✕">
              <strong>{erros}</strong> linha{erros !== 1 ? 's' : ''} não pôde
              {erros !== 1 ? 'ram' : ''} ser lida{erros !== 1 ? 's' : ''} — formato de data ou valor
              inválido. Verifique o arquivo e reimporte se necessário.
            </DetalheItem>
          )}
          {naoImportouNada && duplicatasIgnoradas === 0 && erros === 0 && (
            <DetalheItem color="red" icon="✕">
              Nenhum registro foi importado. Verifique se o arquivo contém dados válidos.
            </DetalheItem>
          )}
        </div>

        {/* Ações */}
        <div className="px-6 pb-6 flex items-center gap-3">
          {podeDesfazer && (
            <button
              onClick={handleCancelar}
              disabled={cancelando}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              {cancelando ? 'Desfazendo...' : 'Desfazer importação'}
            </button>
          )}

          <div className="flex gap-3 ml-auto">
            {importados > 0 && (
              <button
                onClick={onEditar}
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Editar registros
              </button>
            )}
            <button
              onClick={onConfirmar}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              {naoImportouNada ? 'Fechar' : 'Confirmar ✓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ count, label, color, icon }: {
  count: number
  label: string
  color: 'green' | 'amber' | 'red'
  icon: React.ReactNode
}) {
  const bg = { green: 'bg-green-50 border-green-200', amber: 'bg-amber-50 border-amber-200', red: 'bg-red-50 border-red-200' }
  const text = { green: 'text-green-700', amber: 'text-amber-700', red: 'text-red-700' }
  const num = { green: 'text-green-800', amber: 'text-amber-800', red: 'text-red-800' }
  const dim = count === 0 ? 'opacity-40' : ''

  return (
    <div className={`rounded-xl border p-4 text-center ${bg[color]} ${dim}`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <p className={`text-2xl font-bold ${num[color]}`}>{count}</p>
      <p className={`text-xs font-medium mt-0.5 ${text[color]}`}>{label}</p>
    </div>
  )
}

function DetalheItem({ color, icon, children }: {
  color: 'green' | 'amber' | 'red'
  icon: string
  children: React.ReactNode
}) {
  const styles = {
    green: 'bg-green-50 border-green-200 text-green-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  }
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm leading-relaxed ${styles[color]}`}>
      <span className="font-bold text-base leading-5 flex-shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

// ─── Saldo Anterior editável ───────────────────────────────────────────────────

interface SaldoAnteriorData { id?: string; mes: number; ano: number; valor: number }

function SaldoAnteriorCard({ mes, ano, fechamentoMesAnterior }: { mes: number; ano: number; fechamentoMesAnterior?: number }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data } = useQuery<SaldoAnteriorData>({
    queryKey: ['saldo-anterior', mes, ano],
    queryFn: () =>
      api.get<SaldoAnteriorData>(`/saldo-anterior?mes=${mes}&ano=${ano}`).then((r) => r.data),
  })

  const { mutate: salvar } = useMutation({
    mutationFn: (valor: number) => api.post('/saldo-anterior', { mes, ano, valor }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saldo-anterior'] })
      setEditing(false)
    },
  })

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function startEdit() {
    const v = data?.valor ?? 0
    // Exibe formatado em pt-BR para edição
    setInputVal(String(v).replace('.', ','))
    setEditing(true)
  }

  function save() {
    const num = parseFloat(inputVal.replace(/\./g, '').replace(',', '.'))
    if (!isNaN(num)) salvar(num)
    else setEditing(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setEditing(false)
  }

  const valor = data?.valor ?? 0

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-5 py-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500 mb-0.5">
          Saldo anterior — {monthName(mes).charAt(0).toUpperCase() + monthName(mes).slice(1)} {ano}
        </p>
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">R$</span>
            <input
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={save}
              onKeyDown={handleKey}
              placeholder="0,00"
              className="border border-blue-400 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <span className="text-xs text-gray-400">Enter para salvar · Esc para cancelar</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 group/saldo">
            <span className={`text-xl font-bold ${valor >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(valor)}
            </span>
            <button
              onClick={startEdit}
              className="opacity-0 group-hover/saldo:opacity-100 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-all"
              title="Editar saldo anterior"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="text-right hidden sm:block">
        <p className="text-xs text-gray-400">Saldo da conta<br />no início do mês</p>
        {fechamentoMesAnterior !== undefined && (
          <div className="mt-2 text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">Fechamento mês anterior</p>
            <p className={`text-sm font-semibold ${fechamentoMesAnterior >= 0 ? 'text-gray-700 dark:text-gray-200' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(fechamentoMesAnterior)}
            </p>
            {(data?.valor ?? 0) === 0 && (
              <button
                onClick={() => salvar(fechamentoMesAnterior)}
                className="mt-1 text-xs text-blue-500 hover:text-blue-700 hover:underline"
              >
                Usar como saldo inicial
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Célula de categoria com edição inline ─────────────────────────────────────

function CategoriaCell({
  extrato,
  categorias,
  onSave,
}: {
  extrato: Extrato
  categorias: Categoria[]
  onSave: (categoriaId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(extrato.categoriaId ?? '')
  const [aviso, setAviso] = useState('')
  const selectRef = useRef<HTMLSelectElement>(null)

  // Tipo esperado com base no sinal do valor
  const tipoEsperado: 'RECEITA' | 'DESPESA' | null =
    extrato.valor > 0 ? 'RECEITA' : extrato.valor < 0 ? 'DESPESA' : null

  const categoriasFiltradas = tipoEsperado
    ? categorias.filter((c) => c.tipo === tipoEsperado)
    : categorias

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setValue(extrato.categoriaId ?? '') }, [extrato.categoriaId])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (editing) { setAviso(''); selectRef.current?.focus() } }, [editing])

  function save() {
    const novoId = value.trim()
    if (novoId) {
      const cat = categorias.find((c) => c.id === novoId)
      if (cat && tipoEsperado && cat.tipo !== tipoEsperado) {
        setAviso(`Valor ${extrato.valor > 0 ? 'positivo' : 'negativo'} só aceita ${tipoEsperado}`)
        return
      }
      if (novoId !== extrato.categoriaId) onSave(novoId)
    }
    setEditing(false)
    setAviso('')
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); save() }
    if (e.key === 'Escape') { setValue(extrato.categoriaId ?? ''); setEditing(false); setAviso('') }
  }

  const cat = categorias.find((c) => c.id === extrato.categoriaId)

  if (editing) {
    return (
      <div>
        <select
          ref={selectRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); setAviso('') }}
          onBlur={save}
          onKeyDown={handleKey}
          className="text-xs border border-blue-400 rounded-lg px-2 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
        >
          <option value="">— sem categoria</option>
          {categoriasFiltradas.map((c) => (
            <option
              key={c.id}
              value={c.id}
              style={{
                backgroundColor: c.tipo === 'RECEITA' ? '#dcfce7' : '#fee2e2',
                color: c.tipo === 'RECEITA' ? '#166534' : '#991b1b',
              }}
            >
              {c.name}
            </option>
          ))}
        </select>
        {aviso && (
          <p className="text-xs text-red-500 mt-0.5 leading-tight">{aviso}</p>
        )}
        {tipoEsperado && (
          <p className="text-xs text-gray-400 mt-0.5">
            Apenas categorias de {tipoEsperado === 'RECEITA' ? 'receita' : 'despesa'}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group/cat min-w-0">
      {cat ? (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium truncate max-w-40 ${
            cat.tipo === 'RECEITA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
          title={cat.name}
        >
          {cat.name}
        </span>
      ) : (
        <span className="text-xs text-gray-300 italic">sem categoria</span>
      )}
      <button
        onClick={() => setEditing(true)}
        title="Editar categoria"
        className="opacity-0 group-hover/cat:opacity-100 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-400 hover:text-blue-500 transition-all flex-shrink-0"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Célula de conta bancária com edição inline ───────────────────────────────

function ContaCell({
  extrato,
  contas,
  onSave,
}: {
  extrato: Extrato
  contas: ContaBancaria[]
  onSave: (contaBancariaId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(extrato.contaBancariaId ?? '')
  const selectRef = useRef<HTMLSelectElement>(null)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setValue(extrato.contaBancariaId ?? '') }, [extrato.contaBancariaId])
  useEffect(() => { if (editing) selectRef.current?.focus() }, [editing])

  function save() {
    if (value !== extrato.contaBancariaId) onSave(value)
    setEditing(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); save() }
    if (e.key === 'Escape') { setValue(extrato.contaBancariaId ?? ''); setEditing(false) }
  }

  const conta = contas.find(c => c.id === extrato.contaBancariaId)

  const TIPO_COLORS: Record<string, string> = {
    CORRENTE:    'bg-blue-100 text-blue-700',
    POUPANCA:    'bg-green-100 text-green-700',
    INVESTIMENTO:'bg-purple-100 text-purple-700',
    OUTRO:       'bg-gray-100 text-gray-600',
  }

  if (editing) {
    return (
      <select
        ref={selectRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={handleKey}
        className="text-xs border border-blue-400 rounded-lg px-2 py-1.5 w-44 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
      >
        <option value="">— sem conta</option>
        {contas.map(c => (
          <option key={c.id} value={c.id}>{c.nome} — {c.banco}</option>
        ))}
      </select>
    )
  }

  return (
    <div className="flex items-center gap-1.5 group/conta min-w-0">
      {conta ? (
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium truncate max-w-36 ${TIPO_COLORS[conta.tipo] ?? 'bg-gray-100 text-gray-600'}`}
          title={`${conta.nome} — ${conta.banco}`}
        >
          {conta.nome}
        </span>
      ) : (
        <span className="text-xs text-gray-300 italic">sem conta</span>
      )}
      <button
        onClick={() => setEditing(true)}
        title="Editar conta"
        className="opacity-0 group-hover/conta:opacity-100 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-400 hover:text-blue-500 transition-all flex-shrink-0"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Ícone do arquivo ──────────────────────────────────────────────────────────

function FileIcon({ file }: { file: File }) {
  const isXlsx = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
  return isXlsx
    ? <FileSpreadsheet className="w-8 h-8 text-green-500 mx-auto mb-2" />
    : <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2" />
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function ExtratosPage() {
  const qc = useQueryClient()
  const nav = useMesSelecionado()
  const { mes, ano } = nav
  const [importMsg, setImportMsg] = useState<ExtratoImportResult | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState(0)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroConta, setFiltroConta] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [importContaBancariaId, setImportContaBancariaId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkCategoria, setBulkCategoria] = useState('')
  const [bulkConta, setBulkConta] = useState('')
  const [applyingBulk, setApplyingBulk] = useState(false)

  // Reset page and selection when filters/month change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(0); setSelectedIds(new Set()) }, [mes, ano, filtroCategoria, filtroTipo, filtroConta])

  const params = new URLSearchParams({ mes: String(mes), ano: String(ano), page: String(page), size: '50' })
  if (filtroCategoria) params.set('categoriaId', filtroCategoria)
  if (filtroTipo) params.set('tipo', filtroTipo)
  if (filtroConta) params.set('contaBancariaId', filtroConta)

  const { data: pageData, isLoading, isFetching } = useQuery({
    queryKey: ['extratos', mes, ano, page, filtroCategoria, filtroTipo, filtroConta],
    queryFn: () => api.get<PageResponse<Extrato>>(`/extratos?${params}`).then((r) => r.data),
    placeholderData: keepPreviousData,
  })
  const extratos = pageData?.content ?? []
  const totalPages = pageData?.totalPages ?? 1
  const totalElements = pageData?.totalElements ?? 0

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get<Categoria[]>('/categorias').then((r) => r.data),
  })

  const { data: contas = [] } = useQuery<ContaBancaria[]>({
    queryKey: ['contas-bancarias'],
    queryFn: () => api.get<ContaBancaria[]>('/contas-bancarias').then(r => r.data),
  })

  const { data: saldoAnteriorData } = useQuery<SaldoAnteriorData>({
    queryKey: ['saldo-anterior', mes, ano],
    queryFn: () =>
      api.get<SaldoAnteriorData>(`/saldo-anterior?mes=${mes}&ano=${ano}`).then((r) => r.data),
  })

  const { data: dashboardData } = useQuery<Dashboard>({
    queryKey: ['dashboard', mes, ano],
    queryFn: () => api.get<Dashboard>(`/dashboard?mes=${mes}&ano=${ano}`).then(r => r.data),
  })

  const hoje = new Date()
  const isCurrentMonth = mes === hoje.getMonth() + 1 && ano === hoje.getFullYear()
  const mesPrev = mes === 1 ? 12 : mes - 1
  const anoPrev = mes === 1 ? ano - 1 : ano

  const { data: dashboardMesAnterior } = useQuery<Dashboard>({
    queryKey: ['dashboard', mesPrev, anoPrev],
    queryFn: () => api.get<Dashboard>(`/dashboard?mes=${mesPrev}&ano=${anoPrev}`).then(r => r.data),
    enabled: isCurrentMonth,
  })

  const { mutate: importar, isPending: importing } = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const url = importContaBancariaId
        ? `/extratos/importar?contaBancariaId=${importContaBancariaId}`
        : '/extratos/importar'
      return api
        .post<ExtratoImportResult>(url, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    },
    onSuccess: (result) => {
      setSelectedFile(null)
      setShowImport(false)
      // Atualiza a lista e abre o modal de conferência
      qc.invalidateQueries({ queryKey: ['extratos'] })
      setImportMsg(result)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao importar arquivo.'
      setShowImport(false)
      setImportMsg({ importados: 0, duplicatasIgnoradas: 0, erros: 1, batchId: null, mensagem: msg })
    },
  })

  const { mutate: atribuirCategoria } = useMutation({
    mutationFn: ({ id, categoriaId }: { id: string; categoriaId: string }) =>
      api.patch(`/extratos/${id}/categoria`, { categoriaId }),
    onSuccess: (_, { id, categoriaId }) => {
      let eraSemCategoria = false
      for (const [, data] of qc.getQueriesData<PageResponse<Extrato>>({ queryKey: ['extratos'] })) {
        const found = data?.content?.find((e) => e.id === id)
        if (found) { eraSemCategoria = !found.categoriaId; break }
      }

      qc.setQueriesData<PageResponse<Extrato>>(
        { queryKey: ['extratos'], exact: false },
        (old) => old ? { ...old, content: old.content.map((e) => (e.id === id ? { ...e, categoriaId } : e)) } : old
      )

      if (eraSemCategoria) {
        qc.setQueryData<{ id: string }[]>(
          ['sem-categoria', mes, ano],
          (old) => old ? old.filter((e) => e.id !== id) : old
        )
        qc.setQueriesData<{ transacoesSemCategoria?: number }>(
          { queryKey: ['dashboard'], exact: false },
          (old) => old
            ? { ...old, transacoesSemCategoria: Math.max(0, (old.transacoesSemCategoria ?? 0) - 1) }
            : old
        )
      }
    },
  })

  const { mutate: atribuirConta } = useMutation({
    mutationFn: ({ id, contaBancariaId }: { id: string; contaBancariaId: string }) =>
      api.patch(`/extratos/${id}/conta-bancaria`, { contaBancariaId: contaBancariaId || null }),
    onSuccess: (_, { id, contaBancariaId }) => {
      qc.setQueriesData<PageResponse<Extrato>>(
        { queryKey: ['extratos'], exact: false },
        (old) => old ? { ...old, content: old.content.map(e => e.id === id ? { ...e, contaBancariaId: contaBancariaId || undefined } : e) } : old
      )
    },
  })

  const { mutate: deletarExtrato } = useMutation({
    mutationFn: (id: string) => api.delete(`/extratos/${id}`),
    onSuccess: () => {
      setConfirmDelete(null)
      qc.invalidateQueries({ queryKey: ['extratos'] })
      qc.invalidateQueries({ queryKey: ['sem-categoria'] })
    },
  })

  function isValidFile(f: File) {
    const n = f.name.toLowerCase()
    return n.endsWith('.csv') || n.endsWith('.xlsx') || n.endsWith('.xls')
  }

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && isValidFile(file)) setSelectedFile(file)
  }, [])

  const allPageIds = extratos.map(e => e.id)
  const allSelected = allPageIds.length > 0 && allPageIds.every(id => selectedIds.has(id))

  function toggleSelectAll() {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allSelected) allPageIds.forEach(id => next.delete(id))
      else allPageIds.forEach(id => next.add(id))
      return next
    })
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function applyBulkCategoria() {
    if (!bulkCategoria || selectedIds.size === 0) return
    setApplyingBulk(true)
    try {
      await Promise.all([...selectedIds].map(id =>
        api.patch(`/extratos/${id}/categoria`, { categoriaId: bulkCategoria })
      ))
      qc.invalidateQueries({ queryKey: ['extratos'] })
      qc.invalidateQueries({ queryKey: ['sem-categoria'] })
      setSelectedIds(new Set())
      setBulkCategoria('')
    } finally {
      setApplyingBulk(false)
    }
  }

  async function deletarSelecionados() {
    if (selectedIds.size === 0) return
    setApplyingBulk(true)
    try {
      await Promise.all([...selectedIds].map(id => api.delete(`/extratos/${id}`)))
      qc.invalidateQueries({ queryKey: ['extratos'] })
      qc.invalidateQueries({ queryKey: ['sem-categoria'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setSelectedIds(new Set())
    } finally {
      setApplyingBulk(false)
    }
  }

  async function applyBulkConta() {
    if (!bulkConta || selectedIds.size === 0) return
    setApplyingBulk(true)
    try {
      await Promise.all([...selectedIds].map(id =>
        api.patch(`/extratos/${id}/conta-bancaria`, { contaBancariaId: bulkConta || null })
      ))
      qc.invalidateQueries({ queryKey: ['extratos'] })
      setSelectedIds(new Set())
      setBulkConta('')
    } finally {
      setApplyingBulk(false)
    }
  }

  const totalEntradas = dashboardData?.totalEntradas ?? 0
  const totalSaidas = dashboardData?.totalSaidas ?? 0
  const saldoAtual = dashboardData?.saldoAtual ?? 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Extratos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Importe extratos bancários em CSV ou Excel</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav nav={nav} />
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" /> Importar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtrar:</span>
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-400 bg-white dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">Todos os tipos</option>
          <option value="RECEITA">Entradas</option>
          <option value="DESPESA">Saídas</option>
        </select>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-400 bg-white dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {contas.length > 0 && (
          <select
            value={filtroConta}
            onChange={(e) => setFiltroConta(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-400 bg-white dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">Todas as contas</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>{c.nome} — {c.banco}</option>
            ))}
          </select>
        )}
        {(filtroTipo || filtroCategoria || filtroConta) && (
          <button
            onClick={() => { setFiltroTipo(''); setFiltroCategoria(''); setFiltroConta('') }}
            className="text-xs text-blue-600 hover:underline"
          >
            Limpar filtros
          </button>
        )}
        {totalElements > 0 && (
          <span className="text-xs text-gray-400 ml-auto">{totalElements} lançamento{totalElements !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Saldo Anterior */}
      <div className="mb-4">
        <SaldoAnteriorCard
          mes={mes}
          ano={ano}
          fechamentoMesAnterior={isCurrentMonth ? dashboardMesAnterior?.saldoAtual : undefined}
        />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-500">Entradas no mês</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalEntradas)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-500">Saídas no mês</p>
          <p className="text-lg font-bold text-red-500">{formatCurrency(totalSaidas)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-xs text-gray-500">Saldo atual</p>
          <p className={`text-lg font-bold ${saldoAtual >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(saldoAtual)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">saldo anterior + entradas − saídas</p>
        </div>
      </div>

      {/* Modal de resultado da importação */}
      {importMsg && (
        <ImportacaoModal
          resultado={importMsg}
          onConfirmar={() => setImportMsg(null)}
          onEditar={() => setImportMsg(null)}
          onCancelarLote={() => {
            setImportMsg(null)
            qc.invalidateQueries({ queryKey: ['extratos'] })
          }}
        />
      )}

      {/* Barra de ação em massa — logo acima da tabela */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl flex-wrap">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
            {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="w-px h-5 bg-blue-200 dark:bg-blue-700 mx-1" />
          <div className="flex items-center gap-2">
            <select
              value={bulkCategoria}
              onChange={e => setBulkCategoria(e.target.value)}
              className="text-sm border border-blue-300 dark:border-blue-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Aplicar categoria...</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.tipo === 'RECEITA' ? 'Receita' : 'Despesa'})</option>
              ))}
            </select>
            <button
              onClick={applyBulkCategoria}
              disabled={!bulkCategoria || applyingBulk}
              className="px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              {applyingBulk ? '...' : 'Aplicar'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={bulkConta}
              onChange={e => setBulkConta(e.target.value)}
              className="text-sm border border-blue-300 dark:border-blue-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Aplicar banco...</option>
              {contas.map(c => (
                <option key={c.id} value={c.id}>{c.nome} — {c.banco}</option>
              ))}
            </select>
            <button
              onClick={applyBulkConta}
              disabled={!bulkConta || applyingBulk}
              className="px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              {applyingBulk ? '...' : 'Aplicar'}
            </button>
          </div>
          <div className="w-px h-5 bg-blue-200 dark:bg-blue-700 mx-1" />
          <button
            onClick={deletarSelecionados}
            disabled={applyingBulk}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir selecionados
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-blue-500 hover:text-blue-700 hover:underline whitespace-nowrap"
          >
            Limpar seleção
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : extratos.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center py-20 cursor-pointer border-2 border-dashed rounded-xl m-4 transition-colors ${
              dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => setShowImport(true)}
          >
            <Upload className="w-10 h-10 text-gray-300 mb-3" />
            <p className="font-medium text-gray-500">Nenhum lançamento</p>
            <p className="text-sm text-gray-400 mt-1">Clique ou arraste um arquivo CSV / XLSX aqui</p>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '1140px' }}>
              <colgroup>
                <col style={{ width: '40px' }} />
                <col style={{ width: '88px' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '116px' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '84px' }} />
              </colgroup>
              <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      title="Selecionar todos da página"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Lançamento</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Razão Social</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">CPF/CNPJ</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Categoria</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Conta</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {extratos.map((e) => (
                  <tr key={e.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/40 group align-top ${selectedIds.has(e.id) ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''}`}>
                    <td className="px-3 py-3 pt-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(e.id)}
                        onChange={() => toggleSelect(e.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400 whitespace-nowrap text-xs pt-3.5">{formatDate(e.data)}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300 leading-snug">
                      {e.tipoPagamento ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-slate-200 leading-snug font-medium">
                      {e.razaoSocial ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400 whitespace-nowrap text-xs pt-3.5">{e.cpfCnpj ?? '—'}</td>
                    <td className={`px-4 py-3 font-semibold text-right whitespace-nowrap tabular-nums pt-3.5 ${
                      e.valor >= 0 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {formatCurrency(e.valor)}
                    </td>
                    <td className="px-4 py-3">
                      <CategoriaCell
                        extrato={e}
                        categorias={categorias}
                        onSave={(categoriaId) => atribuirCategoria({ id: e.id, categoriaId })}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <ContaCell
                        extrato={e}
                        contas={contas}
                        onSave={(contaBancariaId) => atribuirConta({ id: e.id, contaBancariaId })}
                      />
                    </td>
                    <td className="px-3 py-3">
                      {confirmDelete === e.id ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => deletarExtrato(e.id)}
                            className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded whitespace-nowrap"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1 text-xs border border-gray-200 dark:border-slate-600 rounded text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 whitespace-nowrap"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(e.id)}
                          title="Excluir lançamento"
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                Página {page + 1} de {totalPages}
                {isFetching && <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* Modal de importação */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Importar Extrato</h3>
              <button onClick={() => { setShowImport(false); setSelectedFile(null) }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragging ? 'border-blue-500 bg-blue-50'
                  : selectedFile ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => fileRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              {selectedFile ? (
                <>
                  <FileIcon file={selectedFile} />
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {dragging ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">CSV · XLSX · XLS · max 10MB</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f) }}
              />
            </div>

            {contas.length > 0 && (
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">Associar à conta bancária</label>
                <select
                  value={importContaBancariaId}
                  onChange={e => setImportContaBancariaId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                >
                  <option value="">— Sem conta específica</option>
                  {contas.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} — {c.banco}</option>
                  ))}
                </select>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Suporta exportações de qualquer banco. Colunas detectadas automaticamente.
              Linhas de saldo e metadados são ignoradas.
            </p>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowImport(false); setSelectedFile(null) }}
                className="flex-1 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                disabled={!selectedFile || importing}
                onClick={() => selectedFile && importar(selectedFile)}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                {importing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Importando...
                  </span>
                ) : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
