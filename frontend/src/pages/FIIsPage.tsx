import { Search } from 'lucide-react'
import { useFIIs } from '@/hooks/useFIIs'
import { ScoreBar } from '@/components/ScoreBar'
import { VariacaoBadge } from '@/components/VariacaoBadge'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { formatMoeda, SEGMENTOS_FIIS, formatData } from '@/utils/formatters'
import { DIVIDENDOS_MOCK } from '@/data/mockData'

export const FIIsPage = () => {
    const { fiis, loading, busca, setBusca, segmento, setSegmento } = useFIIs()

    const proximosDividendos = DIVIDENDOS_MOCK.slice(0, 5)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary">FIIs Explorer</h1>
                <p className="text-text-secondary text-sm mt-1">Fundos de Investimento Imobiliário</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* FIIs Table */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar FII..." className="input pl-9 h-9 text-sm" />
                        </div>
                        <select value={segmento} onChange={e => setSegmento(e.target.value)} className="input h-9 text-sm appearance-none">
                            <option value="">Todos os Segmentos</option>
                            {Object.entries(SEGMENTOS_FIIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>

                    <div className="card p-0 overflow-hidden">
                        {loading ? <LoadingSpinner text="Carregando FIIs..." /> : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-surface-border">
                                            {['FII', 'Segmento', 'Preço', 'Var.', 'P/VP', 'DY 12m', 'DY Mensal', 'Score'].map(h => (
                                                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fiis.map(fii => (
                                            <tr key={fii.ticker} className="border-b border-surface-border/50 hover:bg-bg-elevated transition-colors cursor-pointer">
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-bold text-text-primary">{fii.ticker}</p>
                                                    <p className="text-xs text-text-muted truncate max-w-[120px]">{fii.nome}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="badge-blue text-[10px]">{SEGMENTOS_FIIS[fii.segmento] || fii.segmento}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-text-primary">{formatMoeda(fii.preco)}</td>
                                                <td className="px-4 py-3"><VariacaoBadge variacao={fii.variacaoPercent} size="sm" /></td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-sm font-semibold ${fii.pvp < 1 ? 'text-primary' : fii.pvp < 1.2 ? 'text-warning' : 'text-danger'}`}>
                                                        {fii.pvp.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-primary">{fii.dy.toFixed(1)}%</td>
                                                <td className="px-4 py-3 text-sm text-text-secondary">{fii.dyMensal.toFixed(2)}%</td>
                                                <td className="px-4 py-3 w-24"><ScoreBar score={fii.score} size="sm" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
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
