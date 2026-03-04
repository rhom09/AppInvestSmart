import { useEffect, useState } from 'react'
import type { Ativo } from '@/types'
import { TrendingUp, Zap, ThumbsUp } from 'lucide-react'
import { formatMoeda } from '@/utils/formatters'

interface Props {
    acoes: Ativo[]
    loading: boolean
}

// Animates a number from 0 → target in ~1.5s
const useCounter = (target: number, active: boolean) => {
    const [value, setValue] = useState(0)
    useEffect(() => {
        if (!active || target === 0) return
        let start = 0
        const duration = 1500
        const step = 16
        const increment = target / (duration / step)
        const timer = setInterval(() => {
            start += increment
            if (start >= target) { setValue(target); clearInterval(timer) }
            else setValue(Math.round(start))
        }, step)
        return () => clearInterval(timer)
    }, [target, active])
    return value
}

// Skeleton while loading
const Skeleton = () => (
    <div className="card animate-pulse">
        <div className="h-4 bg-surface-border rounded w-1/3 mb-4" />
        <div className="flex gap-6">
            <div className="flex-1 space-y-3">
                <div className="h-6 bg-surface-border rounded w-1/2" />
                <div className="h-4 bg-surface-border rounded w-full" />
                <div className="h-4 bg-surface-border rounded w-3/4" />
            </div>
            <div className="w-24 h-24 bg-surface-border rounded-2xl" />
        </div>
    </div>
)

export const SpotlightAcao = ({ acoes, loading }: Props) => {
    const destaque = acoes.length > 0
        ? [...acoes].sort((a, b) => b.score - a.score)[0]
        : null

    const animScore = useCounter(destaque?.score ?? 0, !!destaque)
    const animDY = useCounter((destaque?.dy ?? 0) * 10, !!destaque)
    const animROE = useCounter((destaque?.roe ?? 0) * 10, !!destaque)

    if (loading) return <Skeleton />
    if (!destaque) return null

    const isForteBuy = destaque.score >= 80
    const isBoaBuy = destaque.score >= 65

    return (
        <div className="card border border-primary/20 relative overflow-hidden">
            {/* Glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

            <div className="relative">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">⭐ Destaque do Dia</p>
                    {isForteBuy ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold bg-primary/15 text-primary border border-primary/30 rounded-full px-3 py-1">
                            <Zap size={11} className="fill-primary" /> FORTE OPORTUNIDADE
                        </span>
                    ) : isBoaBuy ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold bg-blue-400/15 text-blue-400 border border-blue-400/30 rounded-full px-3 py-1">
                            <ThumbsUp size={11} /> BOA ENTRADA
                        </span>
                    ) : null}
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="text-2xl font-black text-text-primary">{destaque.ticker}</h2>
                        <p className="text-sm text-text-muted mb-3">{destaque.nome}</p>

                        <div className="flex flex-wrap gap-4">
                            <div>
                                <p className="text-[10px] text-text-muted uppercase">Preço</p>
                                <p className="text-lg font-bold text-text-primary">{formatMoeda(destaque.preco)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-text-muted uppercase">DY</p>
                                <p className="text-lg font-bold text-primary">{((animDY ?? 0) / 10).toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-text-muted uppercase">ROE</p>
                                <p className="text-lg font-bold text-text-primary">{((animROE ?? 0) / 10).toFixed(1)}%</p>
                            </div>
                        </div>

                        {destaque.analise && (
                            <p className="text-xs text-text-secondary mt-3 leading-relaxed line-clamp-2">{destaque.analise}</p>
                        )}
                    </div>

                    {/* Score circle */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
                        <TrendingUp size={14} className="text-primary mb-1" />
                        <span className="text-2xl font-black text-primary">{animScore}</span>
                        <span className="text-[9px] text-text-muted">SCORE</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
