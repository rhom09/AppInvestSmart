import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatPercent, getVariacaoBg } from '@/utils/formatters'

interface VariacaoBadgeProps {
    variacao: number
    variacaoPercent?: number
    showIcon?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export const VariacaoBadge = ({ variacao, variacaoPercent, showIcon = true, size = 'md' }: VariacaoBadgeProps) => {
    const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }
    const iconSize = { sm: 12, md: 14, lg: 16 }

    const pct = variacaoPercent ?? variacao
    const isZero = Math.abs(pct) < 0.001
    const isPositive = pct > 0
    const colorClass = getVariacaoBg(pct)
    const Icon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold ${textSize[size]} ${colorClass}`}>
            {showIcon && <Icon size={iconSize[size]} />}
            {formatPercent(pct)}
        </span>
    )
}
