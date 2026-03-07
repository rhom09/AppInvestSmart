import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { StatCard } from '@/components/StatCard'
import { useCarteiraResumo } from '@/hooks/useCarteiraResumo'
import { VariacaoBadge } from '@/components/VariacaoBadge'
import { ScoreBar } from '@/components/ScoreBar'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ModalAdicionarAtivo } from '@/components/ModalAdicionarAtivo'
import { formatMoeda, formatPercent, getVariacaoColor } from '@/utils/formatters'
import { calcularJurosCompostos } from '@/utils/calculators'
import { Plus, Trash2, RefreshCw } from 'lucide-react'

export const CarteiraPage = () => {
    const { resumo: carteira, loading, refresh: refreshPrices, removerItem, loadingPeriodo } = useCarteiraResumo()
    const [aporte, setAporte] = useState(500)
    const [taxa, setTaxa] = useState(1.0)
    const [meses, setMeses] = useState(24)
    const [modalAberto, setModalAberto] = useState(false)

    const projecao = calcularJurosCompostos({ aporteMensal: aporte, taxaMensal: taxa, meses, patrimonioInicial: carteira.totalAtual })
    const projecaoGrafico = projecao.filter((_, i) => i % 3 === 0 || i === projecao.length - 1)

    if (loading && !carteira.itens.length) return <LoadingSpinner text="Carregando carteira..." />

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Minha Carteira</h1>
                    <p className="text-text-secondary text-sm mt-1">Visão consolidada dos seus investimentos</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={refreshPrices}
                        disabled={loading}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-elevated border border-surface-border text-text-primary hover:bg-surface-border/50 transition-all disabled:opacity-50"
                        title="Atualizar preços"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setModalAberto(true)}
                        className="flex items-center gap-2 bg-primary text-bg-primary font-semibold py-2 px-4 rounded-xl hover:brightness-110 transition-all text-sm"
                    >
                        <Plus size={16} />
                        Adicionar Ativo
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    titulo="Patrimônio Total"
                    valor={formatMoeda(carteira.totalAtual)}
                    icon={<Plus size={18} className="rotate-45" />}
                    cor="green"
                />
                <StatCard
                    titulo="Rentabilidade Total"
                    valor={formatPercent(carteira.resultadoPercent)}
                    subvalor="desde a compra"
                    variacao={carteira.resultadoPercent}
                    cor={carteira.resultadoPercent >= 0 ? 'green' : 'red'}
                />
                {loadingPeriodo ? (
                    <div className="h-[132px] bg-bg-card rounded-3xl animate-pulse flex items-center justify-center border border-surface-border">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-3 w-20 bg-surface-border rounded" />
                            <div className="h-6 w-24 bg-surface-border rounded" />
                        </div>
                    </div>
                ) : (
                    <StatCard
                        titulo="Rentabilidade Mês"
                        valor={formatPercent(carteira.rendimentoMes)}
                        cor="blue"
                    />
                )}
                <StatCard
                    titulo="Rendimento Estimado"
                    valor={formatMoeda(carteira.dividendosMes)}
                    subvalor="estimativa mensal"
                    cor="yellow"
                />
            </div>

            {/* Portfolio Table + Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-surface-border">
                        <h2 className="font-semibold text-text-primary">Ativos na Carteira</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-border">
                                    {['Ativo', 'Qtd.', 'Preço Médio', 'Preço Atual', 'Resultado', '%', ''].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-text-muted">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {carteira.itens.map(item => (
                                    <tr key={item.id ?? item.ticker} className="border-b border-surface-border/50 hover:bg-bg-elevated transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-text-primary">{item.ticker}</p>
                                            <p className="text-xs text-text-muted">{item.tipo}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">{item.quantidade}</td>
                                        <td className="px-4 py-3 text-sm text-text-secondary">{formatMoeda(item.precoMedio)}</td>
                                        <td className="px-4 py-3 text-sm text-text-primary font-semibold">{formatMoeda(item.precoAtual)}</td>
                                        <td className="px-4 py-3">
                                            <p className={`text-sm font-semibold ${getVariacaoColor(item.resultado)}`}>
                                                {formatMoeda(item.resultado)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <VariacaoBadge variacao={item.resultadoPercent} size="sm" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => removerItem(item.supabaseId, item.id!)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
                                                title="Remover ativo"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <h2 className="font-semibold text-text-primary mb-4">Score da Carteira</h2>
                    <ScoreBar score={carteira.scoreCarteira} size="lg" />
                    <div className="mt-6 space-y-3">
                        <div className="flex justify-between text-sm">
                            <div className="flex flex-col">
                                <span className="text-text-secondary">Dividendos / Mês</span>
                                <span className="text-[10px] text-text-muted">estimativa</span>
                            </div>
                            <span className="text-primary font-semibold">{formatMoeda(carteira.dividendosMes)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Rentab. Mês</span>
                            <span className={`font-semibold ${getVariacaoColor(carteira.rendimentoMes)}`}>{formatPercent(carteira.rendimentoMes)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Rentab. Ano</span>
                            <span className={`font-semibold ${getVariacaoColor(carteira.rendimentoAno)}`}>{formatPercent(carteira.rendimentoAno)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Yield Calculator */}
            <div className="card">
                <h2 className="font-semibold text-text-primary mb-4">🧮 Calculadora de Projeção</h2>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-text-secondary mb-1 block">Aporte Mensal</label>
                            <input type="number" value={aporte} onChange={e => setAporte(Number(e.target.value))} className="input text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-text-secondary mb-1 block">Taxa Mensal (%)</label>
                            <input type="number" value={taxa} step="0.1" onChange={e => setTaxa(Number(e.target.value))} className="input text-sm" />
                        </div>
                        <div>
                            <label className="text-xs text-text-secondary mb-1 block">Período (meses)</label>
                            <input type="number" value={meses} onChange={e => setMeses(Number(e.target.value))} className="input text-sm" />
                        </div>
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                            <p className="text-xs text-text-muted mb-1">Patrimônio em {meses}m</p>
                            <p className="text-xl font-bold text-primary">{formatMoeda(projecao[projecao.length - 1]?.patrimonioTotal ?? 0)}</p>
                        </div>
                    </div>
                    <div className="lg:col-span-3">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={projecaoGrafico} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                <XAxis dataKey="mes" tick={{ fill: '#52607a', fontSize: 10 }} tickFormatter={v => `${v}m`} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#52607a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${((v ?? 0) / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0e1117', border: '1px solid #1e2535', borderRadius: '12px', color: '#e8eaf0' }}
                                    formatter={(v: number | undefined) => [formatMoeda(Number(v) || 0), '']}
                                />
                                <Bar dataKey="totalInvestido" fill="#1e2535" radius={[4, 4, 0, 0]} name="Total Investido" />
                                <Bar dataKey="rendimento" fill="#00e88f" radius={[4, 4, 0, 0]} name="Rendimento" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Add Asset Modal */}
            {modalAberto && <ModalAdicionarAtivo onClose={() => setModalAberto(false)} />}
        </div>
    )
}
