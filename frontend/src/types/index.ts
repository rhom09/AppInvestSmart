// ─── Ativo (Ações / Geral) ──────────────────────────────────────────
export interface Ativo {
    ticker: string
    nome: string
    setor: string
    preco: number
    variacao: number
    variacaoPercent: number
    score: number
    pl: number
    pvp: number
    dy: number
    roe: number
    receita: number
    divLiquida: number
    margemLiquida: number
    ebitda: number
    volume: number
    marketCap: number
    logo?: string
    analise?: string
}

export interface VariacaoHistorica {
    data: string
    preco: number
    variacao: number
}

// ─── FII ────────────────────────────────────────────────────────────
export interface FII {
    ticker: string
    nome: string
    segmento: string
    preco: number
    variacao: number
    variacaoPercent: number
    score: number
    pvp: number
    dy: number
    dyMensal: number
    ffoCotaAnual: number
    numCotas: number
    patrimonio: number
    vacancia: number
    numImoveis: number
    gestora?: string
    proximoDividendo?: DividendoEvento
}

export interface DividendoEvento {
    ticker: string
    valor: number
    dataCom: string
    dataPagamento: string
}

// ─── ETF ────────────────────────────────────────────────────────────
export interface ETF {
    ticker: string
    nome: string
    indiceReferencia: string
    preco: number
    variacao: number
    variacaoPercent: number
    dy: number
    pl: number
    patrimonio: number
    volume: number
}

// ─── Renda Fixa ─────────────────────────────────────────────────────
export interface RendaFixa {
    id: string
    tipo: 'CDB' | 'LCI' | 'LCA' | 'TESOURO' | 'CRI' | 'CRA' | 'DEBENTURE'
    emissor: string
    nome: string
    taxa: number
    indexador: 'CDI' | 'IPCA' | 'SELIC' | 'PRE'
    vencimento: string
    investimentoMinimo: number
    liquidez: string
    risco: 'BAIXO' | 'MEDIO' | 'ALTO'
}

// ─── Carteira ───────────────────────────────────────────────────────
export interface ItemCarteira {
    id?: string          // local uuid for zustand keying
    supabaseId?: string  // row id from carteira_ativos table
    ticker: string
    nome: string
    tipo: 'ACAO' | 'FII' | 'ETF' | 'RENDA_FIXA' | 'CRIPTO'
    quantidade: number
    precoMedio: number
    precoAtual: number
    totalInvestido: number
    totalAtual: number
    resultado: number
    resultadoPercent: number
    percentCarteira: number
    dy?: number
    score?: number
}

export interface ResumoCarteira {
    totalInvestido: number
    totalAtual: number
    resultado: number
    resultadoPercent: number
    rendimentoMes: number
    rendimentoAno: number
    dividendosMes: number
    scoreCarteira: number
    itens: ItemCarteira[]
}

// ─── Usuário ─────────────────────────────────────────────────────────
export interface Usuario {
    id: string
    nome: string
    email: string
    avatar?: string
    plano: 'FREE' | 'PRO' | 'EXPERT'
    perfil: 'CONSERVADOR' | 'MODERADO' | 'ARROJADO'
    nivel: string
}

// ─── Notícia ─────────────────────────────────────────────────────────
export interface Noticia {
    id: string
    titulo: string
    resumo: string
    fonte: string
    url: string
    publicadoEm: string
    tickers?: string[]
    sentimento?: 'POSITIVO' | 'NEUTRO' | 'NEGATIVO'
}

// ─── Score ────────────────────────────────────────────────────────────
export interface ScoreDetalhado {
    ticker: string
    score: number
    scoreValuation: number
    scroeRentabilidade: number
    scoreEndividamento: number
    scoreDividendos: number
    scoreMomento: number
    recomendacao: 'COMPRA_FORTE' | 'COMPRA' | 'NEUTRO' | 'VENDA' | 'VENDA_FORTE'
}

// ─── API Responses ────────────────────────────────────────────────────
export interface ApiResponse<T> {
    data: T
    success: boolean
    message?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
}
