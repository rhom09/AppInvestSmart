import { useState } from 'react'
import type { Ativo } from '@/types'
import { formatMoeda } from '@/utils/formatters'

interface Props {
    acoes: Ativo[]
    loading: boolean
    onSelectAtivo?: (ativo: Ativo) => void
}

type TabId = 'todas' | 'bluechips' | 'smallcaps' | 'dividendos'

const BLUE_CHIPS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'BBAS3', 'ABEV3', 'WEGE3', 'SUZB3']

const TABS: { id: TabId; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'bluechips', label: 'Blue Chips' },
    { id: 'smallcaps', label: 'Small Caps' },
    { id: 'dividendos', label: 'Dividendos' },
]

const ScoreBar = ({ score, cor }: { score: number; cor: string }) => (
    <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${score}%`, backgroundColor: cor }}
            />
        </div>
        <span className="text-xs font-bold w-6 text-right" style={{ color: cor }}>{score}</span>
    </div>
)

const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="py-3 px-4"><div className="h-4 bg-surface-border rounded w-16" /></td>
        <td className="py-3 px-4"><div className="h-4 bg-surface-border rounded w-8" /></td>
        <td className="py-3 px-4"><div className="h-4 bg-surface-border rounded w-12" /></td>
        <td className="py-3 px-4"><div className="h-4 bg-surface-border rounded w-8" /></td>
        <td className="py-3 px-4"><div className="h-4 bg-surface-border rounded w-8" /></td>
        <td className="py-3 px-4"><div className="h-4 bg-surface-border rounded w-24" /></td>
    </tr>
)

export const TabelaIndicadas = ({ acoes, loading, onSelectAtivo }: Props) => {
    const [activeTab, setActiveTab] = useState<TabId>('todas')

    const filtered = acoes.filter(a => {
        if (activeTab === 'bluechips') return BLUE_CHIPS.includes(a.ticker)
        if (activeTab === 'smallcaps') return !BLUE_CHIPS.includes(a.ticker) && a.marketCap < 50_000_000_000
        if (activeTab === 'dividendos') return a.dy > 6
        return true
    }).slice(0, 10)

    const getScoreCor = (score: number) => {
        if (score >= 80) return '#00e88f'
        if (score >= 65) return '#00b8ff'
        if (score >= 50) return '#f5c842'
        return '#ff4d6d'
    }

    return (
        <div className="card">
            {/* Header + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-text-primary font-semibold">📈 Ações Indicadas</h2>
                <div className="flex gap-1 bg-bg-elevated rounded-xl p-1 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-primary text-bg-primary'
                                : 'text-text-muted hover:text-text-primary'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-text-muted text-xs border-b border-surface-border">
                            <th className="text-left py-2 px-4">Ticker</th>
                            <th className="text-right py-2 px-4">Preço</th>
                            <th className="text-right py-2 px-4">P/L</th>
                            <th className="text-right py-2 px-4">DY</th>
                            <th className="text-right py-2 px-4">ROE</th>
                            <th className="text-left py-2 px-4 min-w-[140px]">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            : filtered.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-text-muted text-sm">
                                            Nenhum ativo encontrado nessa categoria
                                        </td>
                                    </tr>
                                )
                                : filtered.map(ativo => {
                                    const cor = getScoreCor(ativo.score)
                                    return (
                                        <tr
                                            key={ativo.ticker}
                                            onClick={() => onSelectAtivo?.(ativo)}
                                            className="border-b border-surface-border/50 hover:bg-bg-elevated cursor-pointer transition-colors group"
                                        >
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-bold text-text-primary group-hover:text-primary transition-colors">{ativo.ticker}</p>
                                                    <p className="text-[11px] text-text-muted truncate max-w-[120px]">{ativo.nome}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <p className="font-semibold text-text-primary">{formatMoeda(ativo.preco)}</p>
                                                <p className={`text-[11px] font-bold ${ativo.variacaoPercent >= 0 ? 'text-primary' : 'text-danger'}`}>
                                                    {ativo.variacaoPercent >= 0 ? '+' : ''}{(ativo.variacaoPercent ?? 0).toFixed(2)}%
                                                </p>
                                            </td>
                                            <td className="py-3 px-4 text-right text-text-secondary">{ativo.pl > 0 ? (ativo.pl ?? 0).toFixed(1) : '—'}</td>
                                            <td className="py-3 px-4 text-right">
                                                <span className="text-primary font-semibold">{(ativo.dy ?? 0).toFixed(1)}%</span>
                                            </td>
                                            <td className="py-3 px-4 text-right text-text-secondary">{ativo.roe > 0 ? `${(ativo.roe ?? 0).toFixed(1)}%` : '—'}</td>
                                            <td className="py-3 px-4">
                                                <ScoreBar score={ativo.score} cor={cor} />
                                            </td>
                                        </tr>
                                    )
                                })
                        }
                    </tbody>
                </table>
            </div>
        </div>
    )
}
