interface Fundamentals {
    pl?: number; pvp?: number; dy?: number
    roe?: number; margemLiquida?: number
}

export const scoreService = {
    calcularScore(fundamentals: Fundamentals): number {
        let score = 50

        const { pl = 0, pvp = 0, dy = 0, roe = 0, margemLiquida = 0 } = fundamentals

        if (pl > 0 && pl < 8) score += 15
        else if (pl < 15) score += 8
        else if (pl > 30) score -= 10

        if (pvp > 0 && pvp < 1.5) score += 10
        else if (pvp < 2.5) score += 5
        else if (pvp > 4) score -= 8

        if (roe > 20) score += 15
        else if (roe > 12) score += 8
        else if (roe < 5) score -= 10

        if (margemLiquida > 20) score += 10
        else if (margemLiquida > 10) score += 5
        else if (margemLiquida < 0) score -= 15

        if (dy > 8) score += 10
        else if (dy > 4) score += 5

        return Math.max(0, Math.min(100, Math.round(score)))
    },

    getRecomendacao(score: number): string {
        if (score >= 80) return 'COMPRA_FORTE'
        if (score >= 65) return 'COMPRA'
        if (score >= 50) return 'NEUTRO'
        if (score >= 35) return 'VENDA'
        return 'VENDA_FORTE'
    }
}
