// ─── Calculadora de Juros Compostos ──────────────────────────────────
export interface ProjecaoParams {
    aporteMensal: number
    taxaMensal: number  // em % ao mês
    meses: number
    patrimonioInicial?: number
}

export interface ProjecaoPonto {
    mes: number
    patrimonioTotal: number
    totalInvestido: number
    rendimento: number
}

export const calcularJurosCompostos = (params: ProjecaoParams): ProjecaoPonto[] => {
    const { aporteMensal, taxaMensal, meses, patrimonioInicial = 0 } = params
    const taxa = taxaMensal / 100
    const resultado: ProjecaoPonto[] = []

    let patrimonio = patrimonioInicial
    let totalInvestido = patrimonioInicial

    for (let mes = 1; mes <= meses; mes++) {
        patrimonio = patrimonio * (1 + taxa) + aporteMensal
        totalInvestido += aporteMensal
        resultado.push({
            mes,
            patrimonioTotal: patrimonio,
            totalInvestido,
            rendimento: patrimonio - totalInvestido,
        })
    }
    return resultado
}

// ─── Cálculo de DY ───────────────────────────────────────────────────
export const calcularDY = (dividendo12m: number, preco: number): number =>
    preco > 0 ? (dividendo12m / preco) * 100 : 0

// ─── Cálculo de P/L ──────────────────────────────────────────────────
export const calcularPL = (preco: number, lpa: number): number =>
    lpa > 0 ? preco / lpa : 0

// ─── Cálculo de Resultado da Carteira ────────────────────────────────
export const calcularResultado = (precoMedio: number, precoAtual: number, quantidade: number) => {
    const totalInvestido = precoMedio * quantidade
    const totalAtual = precoAtual * quantidade
    const resultado = totalAtual - totalInvestido
    const resultadoPercent = totalInvestido > 0 ? (resultado / totalInvestido) * 100 : 0
    return { totalInvestido, totalAtual, resultado, resultadoPercent }
}

// ─── Score Simplificado InvestSmart ──────────────────────────────────
export interface FundamentosScore {
    pl: number
    pvp: number
    dy: number
    roe: number
    margemLiquida: number
    divLiquidaEbitda?: number
}

export const calcularScore = (f: FundamentosScore): number => {
    let score = 50

    // Valuation (P/L e P/VP)
    if (f.pl > 0 && f.pl < 8) score += 15
    else if (f.pl < 15) score += 8
    else if (f.pl > 30) score -= 10

    if (f.pvp > 0 && f.pvp < 1.5) score += 10
    else if (f.pvp < 2.5) score += 5
    else if (f.pvp > 4) score -= 8

    // Rentabilidade
    if (f.roe > 20) score += 15
    else if (f.roe > 12) score += 8
    else if (f.roe < 5) score -= 10

    if (f.margemLiquida > 20) score += 10
    else if (f.margemLiquida > 10) score += 5
    else if (f.margemLiquida < 0) score -= 15

    // Dividendos
    if (f.dy > 8) score += 10
    else if (f.dy > 4) score += 5

    return Math.max(0, Math.min(100, Math.round(score)))
}
