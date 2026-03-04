import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { useAcoes } from '@/hooks/useAcoes'
import { ScoreBar } from '@/components/ScoreBar'
import { VariacaoBadge } from '@/components/VariacaoBadge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatMoeda, formatMillions, SETORES } from '@/utils/formatters'
import type { Ativo } from '@/types'

export const AcoesPage = () => {
    const { acoes, loading, busca, setBusca, setor, setSetor } = useAcoes()
    const [selected, setSelected] = useState<Ativo | null>(null)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Listagem de Ações</h1>
                    <p className="text-text-secondary text-sm mt-1">{acoes.length} ativos encontrados</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Table */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Filters */}
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar ticker ou nome..." className="input pl-9 h-9 text-sm" />
                        </div>
                        <div className="relative">
                            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <select value={setor} onChange={e => setSetor(e.target.value)} className="input pl-9 h-9 text-sm pr-4 appearance-none">
                                <option value="">Todos os Setores</option>
                                {Object.entries(SETORES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="card p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            {loading ? <LoadingSpinner text="Carregando ativos..." /> : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-surface-border">
                                            {['Ticker', 'Preço', 'Var.', 'P/L', 'DY', 'ROE', 'Score'].map(h => (
                                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {acoes.map(ativo => (
                                            <tr
                                                key={ativo.ticker}
                                                onClick={() => setSelected(ativo)}
                                                className={`border-b border-surface-border/50 hover:bg-bg-elevated cursor-pointer transition-colors ${selected?.ticker === ativo.ticker ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="text-sm font-bold text-text-primary">{ativo.ticker}</p>
                                                        <p className="text-xs text-text-muted truncate max-w-[120px]">{ativo.nome}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-text-primary">{formatMoeda(ativo.preco)}</td>
                                                <td className="px-4 py-3"><VariacaoBadge variacao={ativo.variacaoPercent} size="sm" /></td>
                                                <td className="px-4 py-3 text-sm text-text-secondary">{ativo.pl > 0 ? (ativo.pl ?? 0).toFixed(1) : 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-text-secondary">{(ativo.dy ?? 0).toFixed(1)}%</td>
                                                <td className="px-4 py-3 text-sm text-text-secondary">{(ativo.roe ?? 0).toFixed(1)}%</td>
                                                <td className="px-4 py-3 w-24">
                                                    <ScoreBar score={ativo.score} size="sm" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Analysis Panel */}
                <div className="space-y-4">
                    {selected ? (
                        <div className="card space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-text-primary">{selected.ticker}</h3>
                                    <p className="text-text-muted text-sm">{selected.nome}</p>
                                </div>
                                <VariacaoBadge variacao={selected.variacaoPercent} />
                            </div>

                            <div className="text-2xl font-bold text-text-primary">{formatMoeda(selected.preco)}</div>

                            <div>
                                <p className="text-xs font-semibold text-text-muted mb-2">Score InvestSmart</p>
                                <ScoreBar score={selected.score} size="lg" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { l: 'P/L', v: selected.pl > 0 ? (selected.pl ?? 0).toFixed(1) : 'N/A' },
                                    { l: 'P/VP', v: (selected.pvp ?? 0).toFixed(2) },
                                    { l: 'DY 12m', v: `${(selected.dy ?? 0).toFixed(1)}%` },
                                    { l: 'ROE', v: `${(selected.roe ?? 0).toFixed(1)}%` },
                                    { l: 'Marg. Liq.', v: `${(selected.margemLiquida ?? 0).toFixed(1)}%` },
                                    { l: 'Market Cap', v: formatMillions(selected.marketCap) },
                                ].map(({ l, v }) => (
                                    <div key={l} className="bg-bg-elevated rounded-xl p-3">
                                        <p className="text-[11px] text-text-muted">{l}</p>
                                        <p className="text-sm font-bold text-text-primary mt-0.5">{v}</p>
                                    </div>
                                ))}
                            </div>

                            {selected.analise && (
                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                                    <p className="text-[11px] font-semibold text-primary mb-1">💡 Análise InvestSmart</p>
                                    <p className="text-xs text-text-secondary leading-relaxed">{selected.analise}</p>
                                </div>
                            )}

                            <button className="btn-primary w-full">Adicionar à Carteira</button>
                        </div>
                    ) : (
                        <div className="card flex flex-col items-center justify-center py-16 text-center">
                            <p className="text-4xl mb-3">📊</p>
                            <p className="text-text-secondary text-sm">Selecione um ativo para ver a análise completa</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
