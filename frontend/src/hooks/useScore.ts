import { useState, useCallback } from 'react'
import { calcularScore, type FundamentosScore } from '@/utils/calculators'

export const useScore = () => {
    const [scores, setScores] = useState<Record<string, number>>({})

    const getScore = useCallback((ticker: string, fundamentals: FundamentosScore): number => {
        if (scores[ticker] !== undefined) return scores[ticker]
        const score = calcularScore(fundamentals)
        setScores(prev => ({ ...prev, [ticker]: score }))
        return score
    }, [scores])

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excelente'
        if (score >= 70) return 'Bom'
        if (score >= 60) return 'Regular'
        if (score >= 50) return 'Fraco'
        return 'Ruim'
    }

    return { getScore, getScoreLabel, scores }
}
