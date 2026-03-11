import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatMoeda } from '@/utils/formatters'

interface MarketIndex {
    ticker: string
    name: string
    close: number
    variation: number
}

// Mock fallback that includes IFIX and CDI if the API doesn't return them
const FALLBACK_EXTRAS: MarketIndex[] = [
    { ticker: 'IFIX', name: 'IFIX', close: 3142.50, variation: 0.15 },
    { ticker: 'CDI', name: 'CDI', close: 10.65, variation: 0.00 },
]

export const MarketBar = () => {
    const [indices, setIndices] = useState<MarketIndex[]>([])

    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const { data } = await api.get('/acoes/market/indices')
                if (data.success && data.data?.length) {
                    const existing: MarketIndex[] = data.data
                    // Inject IFIX / CDI if the backend didn't return them
                    const hasFix = existing.some(i => i.ticker === 'IFIX')
                    const hasCdi = existing.some(i => i.ticker === 'CDI')
                    const extras = FALLBACK_EXTRAS.filter(e =>
                        (e.ticker === 'IFIX' && !hasFix) ||
                        (e.ticker === 'CDI' && !hasCdi)
                    )
                    setIndices([...existing, ...extras])
                } else {
                    setIndices(FALLBACK_EXTRAS)
                }
            } catch {
                setIndices(FALLBACK_EXTRAS)
            }
        }

        fetchIndices()
        const dataTimer = setInterval(fetchIndices, 60_000)
        return () => clearInterval(dataTimer)
    }, [])

    if (indices.length === 0) return null

    return (
        <div className="flex items-center gap-4 md:gap-6 overflow-x-auto no-scrollbar py-2 px-4 bg-bg-card border-b border-surface-border w-full">
            {indices.map(index => {
                const isPositive = index.variation > 0
                const isNegative = index.variation < 0
                const isRate = ['SELIC', 'IPCA', 'CDI'].includes(index.ticker)
                const isUSD = index.ticker === 'USD'
                const value = isRate
                    ? `${(index.close ?? 0).toFixed(2)}%`
                    : isUSD
                        ? formatMoeda(index.close ?? 0)
                        : formatMoeda(index.close ?? 0).replace('R$', '').trim()

                return (
                    <div key={index.ticker} className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                        <span className="text-[11px] font-bold text-text-muted">{index.name}</span>
                        <span className="text-[11px] font-semibold text-text-primary">{value}</span>
                        <div className={`flex items-center gap-0.5 text-[10px] font-bold ${isPositive ? 'text-primary' : isNegative ? 'text-danger' : 'text-text-muted'
                            }`}>
                            {isPositive
                                ? <TrendingUp size={9} />
                                : isNegative
                                    ? <TrendingDown size={9} />
                                    : <Minus size={9} />}
                            <span>{(Math.abs(index.variation ?? 0)).toFixed(2)}%</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
