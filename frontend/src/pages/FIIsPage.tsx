import { Search } from 'lucide-react'
import { useFIIs } from '@/hooks/useFIIs'
import { ScoreBar } from '@/components/ScoreBar'
import { VariacaoBadge } from '@/components/VariacaoBadge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatMoeda, SEGMENTOS_FIIS, formatData } from '@/utils/formatters'
import { DIVIDENDOS_MOCK } from '@/data/mockData'

export const FIIsPage = () => {
    const {
        fiis, loading, busca, setBusca, segmento, setSegmento,
        page, setPage, totalPages, total
    } = useFIIs()

    const proximosDividendos = DIVIDENDOS_MOCK.slice(0, 5)

    const renderPrice = (price: number) => {
        if (!price || price === 0) return '—'
        return formatMoeda(price)
    }

    const renderPercent = (val: number | null | undefined, suffix = '%') => {
        if (val === null || val === undefined || val === 0) return '—'
        return `${val.toFixed(2)}${suffix}`
    }

    const startIdx = (page - 1) * 12 + 1
    const endIdx = Math.min(page * 12, total)

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">FIIs Explorer</h1>
                    <p className="text-text-secondary text-sm mt-1">Fundos de Investimento Imobiliário</p>
                </div>
                {!loading && (
                    <p className="text-xs text-text-muted">
                        Exibindo <span className="text-text-primary font-medium">{startIdx}–{endIdx}</span> de <span className="text-text-primary font-medium">{total}</span> FIIs
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar FII..." className="input pl-9 h-10 text-sm" />
                        </div>
                        <select value={segmento} onChange={e => setSegmento(e.target.value)} className="input h-10 text-sm appearance-none min-w-[180px]">
                            <option value="">Todos os Segmentos</option>
                            {Object.entries(SEGMENTOS_FIIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="card p-5 animate-pulse">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-2">
                                            <div className="h-5 w-16 bg-bg-elevated rounded"></div>
                                            <div className="h-3 w-24 bg-bg-elevated rounded"></div>
                                        </div>
                                        <div className="h-6 w-12 bg-bg-elevated rounded-full"></div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-4 w-full bg-bg-elevated rounded"></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-8 bg-bg-elevated rounded"></div>
                                            <div className="h-8 bg-bg-elevated rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {fiis.map(fii => (
                                    <div key={fii.ticker} className="card p-5 hover:border-primary/30 transition-all cursor-pointer group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">{fii.ticker}</h3>
                                                <p className="text-xs text-text-muted truncate max-w-[150px]">{fii.nome}</p>
                                            </div>
                                            <VariacaoBadge variacao={fii.variacaoPercent} />
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">InvestSmart Score</span>
                                                <span className="text-xs font-bold text-text-primary">{fii.score}/100</span>
                                            </div>
                                            <ScoreBar score={fii.score} size="sm" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-border/50">
                                            <div>
                                                <p className="text-[10px] text-text-muted uppercase font-semibold">Preço Atual</p>
                                                <p className="text-base font-bold text-text-primary">{renderPrice(fii.preco)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-muted uppercase font-semibold">P/VP</p>
                                                <p className={`text-base font-bold ${!fii.pvp ? 'text-text-muted' : fii.pvp < 1 ? 'text-primary' : fii.pvp < 1.1 ? 'text-warning' : 'text-danger'}`}>
                                                    {renderPercent(fii.pvp, '')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-muted uppercase font-semibold">DY (12m)</p>
                                                <p className="text-base font-bold text-primary">{renderPercent(fii.dy)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-text-muted uppercase font-semibold">DY Mensal</p>
                                                <p className="text-base font-bold text-text-secondary">{renderPercent(fii.dyMensal)}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 flex items-center gap-2 border-t border-surface-border/30">
                                            <span className="badge-blue text-[10px] px-2 py-0.5">{SEGMENTOS_FIIS[fii.segmento as keyof typeof SEGMENTOS_FIIS] || fii.segmento || 'FII'}</span>
                                            {fii.vacancia !== undefined && (
                                                <span className="text-[10px] text-text-muted italic">Vacância: {fii.vacancia}%</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8">
                                    <button
                                        onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0) }}
                                        disabled={page === 1}
                                        className="btn-secondary h-9 w-9 p-0 flex items-center justify-center disabled:opacity-30"
                                    >
                                        &larr;
                                    </button>

                                    <div className="flex gap-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setPage(i + 1); window.scrollTo(0, 0) }}
                                                className={`h-9 w-9 rounded-xl text-sm font-medium transition-all ${page === i + 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-elevated text-text-secondary hover:bg-bg-elevated border border-surface-border'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0) }}
                                        disabled={page === totalPages}
                                        className="btn-secondary h-9 w-9 p-0 flex items-center justify-center disabled:opacity-30"
                                    >
                                        &rarr;
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Dividend Calendar Panel */}
                <div className="space-y-4">
                    <div className="card">
                        <h3 className="text-text-primary font-semibold mb-4">📅 Próximos Dividendos</h3>
                        <div className="space-y-3">
                            {proximosDividendos.map((d, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated">
                                    <div>
                                        <p className="text-sm font-bold text-text-primary">{d.ticker}</p>
                                        <p className="text-xs text-text-muted">Com: {formatData(d.dataCom)}</p>
                                        <p className="text-xs text-text-muted">Pag: {formatData(d.dataPagamento)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-primary">{formatMoeda(d.valor)}</p>
                                        <p className="text-xs text-text-muted">por cota</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
