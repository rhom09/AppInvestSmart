import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatPercent } from '@/utils/formatters'

interface VariacaoBadgeProps {
    variacao: number
    variacaoPercent?: number
    showIcon?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export const VariacaoBadge = ({ variacao, variacaoPercent, showIcon = true, size = 'md' }: VariacaoBadgeProps) => {
    const isPositive = variacao >= 0
    const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }
    const iconSize = { sm: 12, md: 14, lg: 16 }

    const pct = variacaoPercent ?? variacao
    const colorClass = isPositive ? 'text-primary bg-primary/10' : 'text-danger bg-danger/10'
    const Icon = isPositive ? TrendingUp : TrendingDown

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold ${textSize[size]} ${colorClass}`}>
            {showIcon && <Icon size={iconSize[size]} />}
            {formatPercent(pct)}
        </span>
    )
}
