import type { ReactNode } from 'react'

interface StatCardProps {
    titulo: string
    valor: string | number
    subvalor?: string
    variacao?: number
    icon?: ReactNode
    cor?: 'green' | 'blue' | 'yellow' | 'red'
    descricao?: string
}

export const StatCard = ({ titulo, valor, subvalor, variacao, icon, cor = 'green', descricao }: StatCardProps) => {
    const corMap = {
        green: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
        blue: { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/20' },
        yellow: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
        red: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20' },
    }
    const c = corMap[cor]

    return (
        <div className={`card border ${c.border} bg-card-glow hover:${c.border.replace('/20', '/40')} transition-all duration-200`}>
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-text-secondary text-sm font-medium">{titulo}</p>
                    {descricao && <p className="text-text-muted text-xs">{descricao}</p>}
                </div>
                {icon && (
                    <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center ${c.text}`}>
                        {icon}
                    </div>
                )}
            </div>

            <div className="mt-2">
                <p className={`text-2xl font-bold ${c.text}`}>{valor}</p>

                <div className="flex items-center gap-2 mt-1">
                    {subvalor && <span className="text-text-secondary text-sm">{subvalor}</span>}
                    {variacao !== undefined && (
                        <span className={`text-xs font-semibold ${variacao >= 0 ? 'text-primary' : 'text-danger'}`}>
                            {variacao >= 0 ? '▲' : '▼'} {Math.abs(variacao).toFixed(2)}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
