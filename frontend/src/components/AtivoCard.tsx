import type { Ativo } from '@/types'
import { ScoreBar } from './ScoreBar'
import { VariacaoBadge } from './VariacaoBadge'
import { formatMoeda } from '@/utils/formatters'
import { TrendingUp } from 'lucide-react'

interface AtivoCardProps {
    ativo: Ativo
    onClick?: (ativo: Ativo) => void
    compact?: boolean
}

export const AtivoCard = ({ ativo, onClick, compact = false }: AtivoCardProps) => {
    return (
        <div
            className={`card hover:border-primary/30 hover:bg-bg-elevated cursor-pointer transition-all duration-200 group ${compact ? 'p-4' : 'p-5'}`}
            onClick={() => onClick?.(ativo)}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-surface-muted to-bg-elevated flex items-center justify-center border border-surface-border group-hover:border-primary/20 transition-colors">
                        <span className="text-xs font-bold text-text-primary">{ativo.ticker.slice(0, 2)}</span>
                    </div>
                    <div>
                        <h3 className="text-text-primary font-bold text-sm">{ativo.ticker}</h3>
                        <p className="text-text-muted text-xs truncate max-w-[120px]">{ativo.nome}</p>
                    </div>
                </div>
                <VariacaoBadge variacao={ativo.variacaoPercent} size="sm" />
            </div>

            {/* Price */}
            <div className="mb-3">
                <div className="text-xl font-bold text-text-primary">{formatMoeda(ativo.preco)}</div>
                {!compact && (
                    <div className="flex gap-4 mt-2">
                        <div>
                            <p className="text-[10px] text-text-muted">P/L</p>
                            <p className="text-xs font-semibold text-text-secondary">{ativo.pl > 0 ? (ativo.pl ?? 0).toFixed(1) : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-text-muted">DY</p>
                            <p className="text-xs font-semibold text-text-secondary">{(ativo.dy ?? 0).toFixed(1)}%</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-text-muted">ROE</p>
                            <p className="text-xs font-semibold text-text-secondary">{(ativo.roe ?? 0).toFixed(1)}%</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Score */}
            <div className="space-y-1.5">
                <ScoreBar score={ativo.score} size="sm" />
                {!compact && ativo.analise && (
                    <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed mt-2">
                        <TrendingUp size={10} className="inline mr-1 text-primary" />
                        {ativo.analise}
                    </p>
                )}
            </div>
        </div>
    )
}
