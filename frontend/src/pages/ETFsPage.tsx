import { BarChart2 } from 'lucide-react'
import { VariacaoBadge } from '@/components/VariacaoBadge'
import { ETFS_MOCK } from '@/data/mockData'
import { formatMoeda, formatMillions } from '@/utils/formatters'

export const ETFsPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">ETFs</h1>
                <p className="text-text-secondary text-sm mt-1">Exchange Traded Funds disponíveis na B3</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ETFS_MOCK.map(etf => (
                    <div key={etf.ticker} className="card hover:border-secondary/30 transition-all cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                                    <BarChart2 size={18} className="text-secondary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-primary">{etf.ticker}</h3>
                                    <p className="text-xs text-text-muted">{etf.indiceReferencia}</p>
                                </div>
                            </div>
                            <VariacaoBadge variacao={etf.variacaoPercent} size="sm" />
                        </div>

                        <p className="text-text-secondary text-sm mb-4 line-clamp-1">{etf.nome}</p>

                        <div className="text-2xl font-bold text-text-primary mb-4">{formatMoeda(etf.preco)}</div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-bg-elevated rounded-lg p-2 text-center">
                                <p className="text-[10px] text-text-muted">DY</p>
                                <p className="text-xs font-bold text-primary">{etf.dy.toFixed(1)}%</p>
                            </div>
                            <div className="bg-bg-elevated rounded-lg p-2 text-center">
                                <p className="text-[10px] text-text-muted">P/L</p>
                                <p className="text-xs font-bold text-text-secondary">{etf.pl > 0 ? etf.pl.toFixed(1) : 'N/A'}</p>
                            </div>
                            <div className="bg-bg-elevated rounded-lg p-2 text-center">
                                <p className="text-[10px] text-text-muted">Patrim.</p>
                                <p className="text-xs font-bold text-text-secondary">{formatMillions(etf.patrimonio)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
