import { getScoreColor, getScoreBg } from '@/utils/formatters'

interface ScoreBarProps {
    score: number
    showLabel?: boolean
    size?: 'sm' | 'md' | 'lg'
    animated?: boolean
}

export const ScoreBar = ({ score, showLabel = true, size = 'md', animated = true }: ScoreBarProps) => {
    const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' }
    const colorClass = getScoreBg(score)

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-text-secondary">Score</span>
                    <span className={`text-sm font-bold ${getScoreColor(score)}`}>{score > 0 ? score : '—'}</span>
                </div>
            )}
            <div className={`w-full bg-surface-border rounded-full overflow-hidden ${heights[size]}`}>
                <div
                    className={`${heights[size]} rounded-full ${colorClass} ${animated ? 'transition-all duration-700 ease-out' : ''}`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    )
}
