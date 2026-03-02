import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatMoeda, formatPercent } from '@/utils/formatters'

interface MarketIndex {
    ticker: string
    name: string
    close: number
    variation: number
}

export const MarketBar = () => {
    const [indices, setIndices] = useState<MarketIndex[]>([])

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const { data } = await api.get('/acoes/market/indices')
                if (data.success) {
                    setIndices(data.data)
                }
            } catch (error) {
                console.error('Erro ao buscar índices de mercado', error)
            }
        }

        fetchIndices()
        const interval = setInterval(fetchIndices, 60000) // 1 min update
        return () => clearInterval(interval)
    }, [])

    if (indices.length === 0) return null

    return (
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-2 px-4 bg-bg-card border-b border-surface-border">
            {indices.map(index => {
                const isPositive = index.variation > 0
                const isNegative = index.variation < 0
                return (
                    <div key={index.ticker} className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-xs font-bold text-text-primary">{index.name}</span>
                        <span className="text-xs font-semibold text-text-secondary">
                            {index.ticker === 'SELIC' ? `${index.close.toFixed(2)}%` : formatMoeda(index.close).replace('R$', '').trim()}
                        </span>
                        <div className={`flex items-center gap-0.5 text-[10px] font-bold ${isPositive ? 'text-primary' : isNegative ? 'text-danger' : 'text-text-muted'}`}>
                            {isPositive ? <TrendingUp size={10} /> : isNegative ? <TrendingDown size={10} /> : <Minus size={10} />}
                            <span>{Math.abs(index.variation).toFixed(2)}%</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
