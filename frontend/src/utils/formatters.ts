import dayjs from 'dayjs'

// ─── Números ──────────────────────────────────────────────────────────
export const formatMoeda = (valor: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)

export const formatNumero = (valor: number, casas = 2): string =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(valor)

export const formatPercent = (valor: number | undefined | null, casas = 2): string => {
    const v = Number(valor) || 0
    return `${v >= 0 ? '+' : ''}${formatNumero(v, casas)}%`
}

export const formatMillions = (valor: number): string => {
    const v = valor ?? 0
    if (v >= 1_000_000_000) return `R$ ${(v / 1_000_000_000).toFixed(1)}B`
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}K`
    return formatMoeda(v)
}

// ─── Datas ───────────────────────────────────────────────────────────
export const formatData = (data: string): string =>
    dayjs(data).format('DD/MM/YYYY')

export const formatDataHora = (data: string): string =>
    dayjs(data).format('DD/MM/YYYY HH:mm')

export const formatDataRelativa = (data: string): string => {
    const diff = dayjs().diff(dayjs(data), 'hour')
    if (diff < 1) return 'Agora'
    if (diff < 24) return `${diff}h atrás`
    if (diff < 168) return `${Math.floor(diff / 24)}d atrás`
    return formatData(data)
}

// ─── Score ───────────────────────────────────────────────────────────
export const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-primary'
    if (score >= 50) return 'text-warning'
    return 'text-danger'
}

export const getScoreBg = (score: number): string => {
    if (score >= 70) return 'bg-primary'
    if (score >= 50) return 'bg-warning'
    return 'bg-danger'
}

export const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excelente'
    if (score >= 70) return 'Bom'
    if (score >= 60) return 'Regular'
    if (score >= 50) return 'Fraco'
    return 'Ruim'
}

export const getVariacaoColor = (variacao: number | undefined | null): string => {
    const v = Number(variacao) || 0
    if (v > 0) return 'text-primary'
    if (v < 0) return 'text-danger'
    return 'text-text-muted'
}

export const getVariacaoBg = (variacao: number | undefined | null): string => {
    const v = Number(variacao) || 0
    if (v > 0) return 'bg-primary/10 text-primary'
    if (v < 0) return 'bg-danger/10 text-danger'
    return 'bg-surface-border/30 text-text-muted'
}

// ─── Setores ─────────────────────────────────────────────────────────
export const SETORES: Record<string, string> = {
    FINANCEIRO: 'Financeiro',
    ENERGIA: 'Energia Elétrica',
    PETROLEO: 'Petróleo & Gás',
    MINERACAO: 'Mineração',
    VAREJO: 'Varejo',
    TECNOLOGIA: 'Tecnologia',
    SAUDE: 'Saúde',
    TELECOMUNICACOES: 'Telecomunicações',
    AGRO: 'Agronegócio',
    CONSTRUCAO: 'Construção',
    TRANSPORTE: 'Transporte',
    INDUSTRIA: 'Indústria',
    OUTROS: 'Outros',
}

export const SEGMENTOS_FIIS: Record<string, string> = {
    LOGISTICA: 'Logística',
    CORPORATIVO: 'Corporativo',
    SHOPPING: 'Shopping',
    HIBRIDO: 'Híbrido',
    DESENVOLVIMENTO: 'Desenvolvimento',
    RECEBIVEL: 'Recebíveis',
    HOTEL: 'Hotel',
    EDUCACIONAL: 'Educacional',
    OUTROS: 'Outros',
}
