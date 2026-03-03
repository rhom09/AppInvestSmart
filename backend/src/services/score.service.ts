// ============================================================
// score.service.ts — Algoritmo de score de ativos InvestSmart
// Cada indicador é normalizado (0-10) e multiplicado pelo peso
// ============================================================

// ─── Interfaces ──────────────────────────────────────────────
export interface AtivoData {
    ticker?: string
    pl?: number
    pvp?: number
    dy?: number
    roe?: number
    margemLiquida?: number
}

export interface FIIData {
    ticker?: string
    pvp?: number
    dy?: number
    vacancia?: number
    liquidez?: number
    segmento?: string
}

export interface ScoreLabel {
    label: string
    cor: string
}

export interface ScoreResult {
    score: number
    label: string
    cor: string
}

// ─── Normalizações para Ações ────────────────────────────────

export const normalizarPL = (pl: number): number => {
    if (pl <= 0) return 0
    if (pl < 8) return 10   // muito barato
    if (pl < 15) return 8   // barato
    if (pl < 25) return 5   // justo
    if (pl <= 40) return 2  // caro
    return 0                // muito caro
}

export const normalizarPVP = (pvp: number): number => {
    if (pvp <= 0) return 0
    if (pvp <= 1) return 10
    if (pvp <= 1.5) return 7
    if (pvp <= 2.5) return 4
    return 1
}

export const normalizarDY = (dy: number): number => {
    if (dy <= 0) return 0
    if (dy <= 3) return 3
    if (dy <= 6) return 6
    if (dy <= 10) return 9
    return 10
}

export const normalizarROE = (roe: number): number => {
    if (roe <= 0) return 0
    if (roe <= 8) return 3
    if (roe <= 15) return 6
    if (roe <= 25) return 9
    return 10
}

export const normalizarMargemLiquida = (margem: number): number => {
    if (margem < 0) return 0
    if (margem <= 5) return 3
    if (margem <= 15) return 6
    if (margem <= 30) return 9
    return 10
}

// ─── Normalizações para FIIs ─────────────────────────────────

export const normalizarDYMensal = (dyMensal: number): number => {
    if (dyMensal < 0.6) return 0
    if (dyMensal <= 0.8) return 5
    if (dyMensal <= 1.0) return 8
    return 10
}

export const normalizarPVPFii = (pvp: number): number => {
    if (pvp > 1.2) return 0
    if (pvp >= 1.0) return 5
    if (pvp >= 0.9) return 8
    return 10
}

export const normalizarVacancia = (vacancia: number): number => {
    if (vacancia > 15) return 0
    if (vacancia > 10) return 3
    if (vacancia > 5) return 6
    if (vacancia >= 2) return 8
    return 10
}

export const normalizarLiquidez = (liquidez: number): number => {
    if (liquidez < 100_000) return 0
    if (liquidez <= 500_000) return 4
    if (liquidez <= 1_000_000) return 7
    return 10
}

// ─── Labels ──────────────────────────────────────────────────

export const obterScoreLabel = (score: number): ScoreLabel => {
    if (score >= 80) return { label: 'Excelente', cor: '#00e88f' }
    if (score >= 65) return { label: 'Bom', cor: '#00b8ff' }
    if (score >= 50) return { label: 'Neutro', cor: '#f5c842' }
    return { label: 'Evitar', cor: '#ff4d6d' }
}

// ─── Cálculo de Score: Ação ──────────────────────────────────

export const calcularScoreAcao = (ativo: AtivoData): ScoreResult => {
    const pl = ativo.pl ?? 0
    const pvp = ativo.pvp ?? 0
    const dy = ativo.dy ?? 0
    const roe = ativo.roe ?? 0
    const marg = ativo.margemLiquida ?? 0

    const scoreTotal = Math.round(Math.max(0, Math.min(100, (
        normalizarPL(pl) * 0.25 +
        normalizarPVP(pvp) * 0.15 +
        normalizarDY(dy) * 0.30 +
        normalizarROE(roe) * 0.20 +
        normalizarMargemLiquida(marg) * 0.10
    ) * 10)))

    const { label, cor } = obterScoreLabel(scoreTotal)
    return { score: scoreTotal, label, cor }
}

// ─── Cálculo de Score: FII ───────────────────────────────────

export const calcularScoreFII = (fii: FIIData): ScoreResult => {
    const dyMes = fii.dy ? fii.dy / 12 : 0
    const pvp = fii.pvp ?? 0
    const vacancia = fii.vacancia ?? 0
    const liquidez = fii.liquidez ?? 1_000_000

    const scoreTotal = Math.round(Math.max(0, Math.min(100, (
        normalizarDYMensal(dyMes) * 0.35 +
        normalizarPVPFii(pvp) * 0.25 +
        normalizarVacancia(vacancia) * 0.25 +
        normalizarLiquidez(liquidez) * 0.15
    ) * 10)))

    const { label, cor } = obterScoreLabel(scoreTotal)
    return { score: scoreTotal, label, cor }
}

// ─── Ranking ─────────────────────────────────────────────────

export const rankearAtivos = <T extends AtivoData | FIIData>(ativos: T[]): (T & ScoreResult)[] => {
    return ativos
        .map(ativo => {
            const isFii = (ativo as FIIData).vacancia !== undefined
                || (ativo as FIIData).liquidez !== undefined
                || ativo.ticker?.endsWith('11')
                || ('segmento' in ativo)
            const result = isFii
                ? calcularScoreFII(ativo as FIIData)
                : calcularScoreAcao(ativo as AtivoData)
            return { ...ativo, ...result }
        })
        .sort((a, b) => b.score - a.score)
}

// ─── Facade de retrocompatibilidade (rotas existentes) ───────

export const scoreService = {
    calcularScore(fundamentals: any): number {
        const isFii = fundamentals.ticker?.endsWith('11')
            || !!fundamentals.segmento
            || fundamentals.vacancia !== undefined
        return isFii
            ? calcularScoreFII(fundamentals).score
            : calcularScoreAcao(fundamentals).score
    },

    getRecomendacao(score: number): string {
        return obterScoreLabel(score).label.toUpperCase().replace(' ', '_')
    }
}
