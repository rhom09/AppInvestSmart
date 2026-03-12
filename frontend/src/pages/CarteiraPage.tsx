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
import { Plus, Trash2, RefreshCw, Wallet, TrendingUp, DollarSign, Lock } from 'lucide-react'
import { InfoTooltip } from '@/components/InfoTooltip'
import { useUserStore } from '@/store/user.store'
import { useNavigate } from 'react-router-dom'
import { supabase, loginComGoogle } from '@/services/supabase'

export const CarteiraPage = () => {
    const { usuario } = useUserStore()
    const navigate = useNavigate()
    const { resumo: carteira, loading, refresh: refreshPrices, removerItem, loadingPeriodo } = useCarteiraResumo()
    const [aporte, setAporte] = useState(500)
    const [taxa, setTaxa] = useState(1.0)
    const [meses, setMeses] = useState(24)
    const [modalAberto, setModalAberto] = useState(false)

    const projecao = calcularJurosCompostos({ aporteMensal: aporte, taxaMensal: taxa, meses, patrimonioInicial: carteira.totalAtual })
    const projecaoGrafico = projecao.filter((_, i) => i % 3 === 0 || i === projecao.length - 1)

    const handleGoogleLogin = () => loginComGoogle()

    if (!usuario) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in px-4">
                <div className="bg-bg-card border border-surface-border p-8 md:p-10 rounded-2xl max-w-md w-full shadow-lg">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Sua carteira está te esperando</h2>
                    <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                        Faça login com Google para adicionar ativos e acompanhar seus investimentos
                    </p>
                    <div className="flex flex-col gap-3">
                        <button onClick={handleGoogleLogin} className="w-full bg-primary text-bg-primary font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all">
                            <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Entrar com Google
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="w-full btn-outline py-3 px-4 rounded-xl font-semibold border-surface-border text-text-primary hover:bg-surface-border transition-all">
                            Voltar
                        </button>
                    </div>
                </div>
            </div>
        )
    }

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
                    icon={<Wallet size={18} />}
                    cor="green"
                />
                <StatCard
                    titulo="Rentabilidade Total"
                    valor={formatPercent(carteira.resultadoPercent)}
                    subvalor="desde a compra"
                    variacao={carteira.resultadoPercent}
                    icon={<TrendingUp size={18} />}
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
                    valor={carteira.rendimentoMes !== null ? formatPercent(carteira.rendimentoMes) : '—'}
                    icon={<TrendingUp size={18} />}
                    info={carteira.rendimentoMes !== null ? "Variação média dos seus ativos no mercado nos últimos 30 dias" : "Disponível em breve"}
                    cor="blue"
                />
                )}
                <StatCard
                    titulo="Rendimento Estimado"
                    valor={formatMoeda(carteira.dividendosMes)}
                    subvalor="estimativa mensal"
                    icon={<DollarSign size={18} />}
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
                    <div className="flex items-center gap-2 mb-4">
                        <h2 className="font-semibold text-text-primary">Score da Carteira</h2>
                        <InfoTooltip text="Média ponderada dos scores individuais dos seus ativos, baseada em indicadores fundamentalistas como P/L, DY e ROE" />
                    </div>
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
                            <div className="flex items-center gap-1">
                                <span className="text-text-secondary">Rentab. Mês</span>
                                <InfoTooltip text={carteira.rendimentoMes !== null ? "Variação média dos seus ativos no mercado nos últimos 30 dias" : "Disponível em breve"} />
                            </div>
                            <span className={`font-semibold ${carteira.rendimentoMes !== null ? getVariacaoColor(carteira.rendimentoMes) : 'text-text-muted'}`}>
                                {carteira.rendimentoMes !== null ? formatPercent(carteira.rendimentoMes) : '—'}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <div className="flex items-center gap-1">
                                <span className="text-text-secondary">Rentab. Ano</span>
                                <InfoTooltip text={carteira.rendimentoAno !== null ? "Variação média dos seus ativos no mercado nos últimos 12 meses. Não representa o seu lucro pessoal — para isso, veja a Rentabilidade Total" : "Disponível em breve"} />
                            </div>
                            <span className={`font-semibold ${carteira.rendimentoAno !== null ? getVariacaoColor(carteira.rendimentoAno) : 'text-text-muted'}`}>
                                {carteira.rendimentoAno !== null ? formatPercent(carteira.rendimentoAno) : '—'}
                            </span>
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
                            <BarChart data={projecaoGrafico} margin={{ top: 5, right: 5, bottom: 5, left: 5 }} style={{ outline: 'none' }}>
                                <XAxis dataKey="mes" tick={{ fill: '#52607a', fontSize: 10 }} tickFormatter={v => `${v}m`} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#52607a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${((v ?? 0) / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e2438',
                                        border: '1px solid #2a3050',
                                        borderRadius: '8px',
                                        color: '#e8eaf2'
                                    }}
                                    itemStyle={{ color: '#e8eaf2' }}
                                    labelStyle={{ color: '#e8eaf2' }}
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
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
