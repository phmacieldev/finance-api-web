export interface TokenResponseDTO {
  token: string | null
  type: string | null
  refreshToken: string | null
  email: string
  role: string
  emailPendente: boolean
}

export interface Categoria {
  id: string
  name: string
  tipo: 'RECEITA' | 'DESPESA'
  dreCategoria?: string
}

export interface ContaBancaria {
  id: string
  nome: string
  banco: string
  tipo: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'OUTRO'
  ativa: boolean
}

export interface Extrato {
  id: string
  data: string
  tipoPagamento?: string
  razaoSocial?: string
  cpfCnpj?: string
  valor: number
  saldo?: number
  categoriaId?: string
  contaBancariaId?: string
  conciliado: boolean
  mes: number
  ano: number
}

export interface ExtratoImportResult {
  importados: number
  duplicatasIgnoradas: number
  erros: number
  batchId?: string | null
  mensagem: string
}

export interface Previsao {
  id: string
  descricao: string
  tipo: 'RECEITA' | 'DESPESA'
  valor: number
  frequencia: string
  dataInicio: string
  dataFim?: string
  diaRecorrencia?: number
  categoriaId?: string
  ativa: boolean
}

export interface FluxoDiario {
  data: string
  entradas: number
  saidas: number
  saldoDia: number
  saldoAcumulado: number
}

export interface TopCategoria {
  categoriaId: string
  nomeCategoria: string
  total: number
}

export interface Dashboard {
  mes: number
  ano: number
  totalEntradas: number
  totalSaidas: number
  saldoMes: number
  saldoAtual: number
  totalEntradasMesAnterior: number
  totalSaidasMesAnterior: number
  variacaoEntradas: number
  variacaoSaidas: number
  transacoesSemCategoria: number
  fluxoDiario: FluxoDiario[]
  topDespesas: TopCategoria[]
  topReceitas: TopCategoria[]
}

export interface ConciliacaoItem {
  data: string
  entradas: number
  saidas: number
  saldoDia: number
  saldoAcumulado: number
  entradasPrevistas: number
  saidasPrevistas: number
  varianciaEntradas: number
  varianciaSaidas: number
}

export interface ConciliacaoPeriodo {
  inicio: string
  fim: string
  totalEntradas: number
  totalSaidas: number
  saldoPeriodo: number
  totalEntradasPrevistas: number
  totalSaidasPrevistas: number
  varianciaTotalEntradas: number
  varianciaTotalSaidas: number
  itensDiarios: ConciliacaoItem[]
}

export interface DreCategoriaTotalDTO {
  nome: string
  valor: number
}

export interface DreLinha {
  label: string
  valor: number
  ehSubtotal: boolean
  categorias: DreCategoriaTotalDTO[]
}

export interface Dre {
  mes: number
  ano: number
  linhas: DreLinha[]
  lucroLiquido: number
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

export type CompanyRole = 'CEO' | 'OWNER' | 'USER'

export interface User {
  id: string
  name: string
  email: string
  role: CompanyRole | 'PLATFORM_ADMIN'
  enterpriseId: string
}

export interface AdminEnterprise {
  id: string
  name: string
  cnpj: string
  plan: string
  status: 'PENDENTE' | 'ATIVA' | 'BLOQUEADA'
  createdAt: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: CompanyRole
}

export interface RelatorioMensalItem {
  mes: number
  ano: number
  entradas: number
  saidas: number
  saldo: number
}

export interface RelatorioMensal {
  itens: RelatorioMensalItem[]
}

export const FREQUENCIAS = ['UNICA', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']

export const DRE_CATEGORIAS = [
  'RECEITA_BRUTA', 'DEDUCAO_RECEITA', 'CPV',
  'DESPESA_VENDAS', 'DESPESA_ADMINISTRATIVA',
  'DESPESA_FINANCEIRA', 'RECEITA_FINANCEIRA', 'IMPOSTO', 'OUTROS'
]
