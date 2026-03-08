import { useState, useEffect } from 'react'
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { StatCard } from '@/components/StatCard'
import { SpotlightAcao } from '@/components/SpotlightAcao'
import { TabelaIndicadas } from '@/components/TabelaIndicadas'
import { Wallet, TrendingUp, Star, DollarSign, X, ExternalLink, Radio, Layout } from 'lucide-react'
import { useCarteiraResumo } from '@/hooks/useCarteiraResumo'
import { useAcoes } from '@/hooks/useAcoes'
import { useFIIs } from '@/hooks/useFIIs'
import { useNoticias } from '@/hooks/useNoticias'
import { api } from '@/services/api'
import { formatMoeda, formatPercent, getVariacaoColor } from '@/utils/formatters'
import { useUserStore } from '@/store/user.store'
import { TruncatedName } from '@/components/TruncatedName'
import type { Ativo } from '@/types'

const COLORS = ['#00e88f', '#00b8ff', '#f0a500', '#ff4d6d', '#a78bfa']

const formatTooltip = (value: any) => [formatMoeda(Number(value) || 0), 'Patrimônio']

// ─── Componentes Auxiliares ──────────────────────────────────
const ChartSkeleton = () => (
    <div className="animate-pulse space-y-4">
        <div className="flex justify-between items-center mb-4">
            <div className="h-5 bg-surface-border rounded w-40" />
            <div className="h-8 bg-surface-border rounded w-48" />
        </div>
        <div className="h-[220px] bg-surface-border/50 rounded-2xl w-full" />
    </div>
)

const EmptyChartState = () => (
    <div className="h-[220px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-surface-border rounded-2xl bg-bg-elevated/30">
        <div className="w-12 h-12 rounded-full bg-surface-border/30 flex items-center justify-center mb-3 text-text-muted">
            <Layout size={24} />
        </div>
        <h3 className="text-text-primary font-bold text-sm">Sem evolução patrimonial</h3>
        <p className="text-text-muted text-xs mt-1 max-w-[200px]">
            Adicione ativos à sua carteira para ver a evolução patrimonial.
        </p>
    </div>
)

// ─── Painel lateral de detalhes ─────────────────────────────
const DetalhePanel = ({ ativo, onClose }: { ativo: Ativo; onClose: () => void }) => {
    // ... rest of DetalhePanel ...
    const getScoreCor = (s: number) => s >= 80 ? '#00e88f' : s >= 65 ? '#00b8ff' : s >= 50 ? '#f5c842' : '#ff4d6d'
    const getScoreLabel = (s: number) => s >= 80 ? 'Excelente' : s >= 65 ? 'Bom' : s >= 50 ? 'Neutro' : 'Evitar'
    const cor = getScoreCor(ativo.score)

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="w-full max-w-md bg-bg-card border-l border-surface-border flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-surface-border flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-text-primary">{ativo.ticker}</h2>
                        <p className="text-sm text-text-muted">{ativo.nome}</p>
                    </div>
                    <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Score Badge */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-elevated border border-surface-border">
                        <div>
                            <p className="text-xs text-text-muted mb-1">Score InvestSmart</p>
                            <p className="text-3xl font-black" style={{ color: cor }}>{ativo.score}</p>
                            <p className="text-sm font-semibold" style={{ color: cor }}>{getScoreLabel(ativo.score)}</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border" style={{ borderColor: `${cor}40`, backgroundColor: `${cor}15` }}>
                            <TrendingUp size={28} style={{ color: cor }} />
                        </div>
                    </div>

                    {/* Price */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-bg-elevated">
                            <p className="text-[11px] text-text-muted mb-1">Preço Atual</p>
                            <p className="text-lg font-bold text-text-primary">{formatMoeda(ativo.preco)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-bg-elevated">
                            <p className="text-[11px] text-text-muted mb-1">Variação</p>
                            <p className={`text-lg font-bold ${getVariacaoColor(ativo.variacaoPercent)}`}>
                                {formatPercent(ativo.variacaoPercent)}
                            </p>
                        </div>
                    </div>

                    {/* Fundamentals */}
                    <div>
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Indicadores</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'P/L', value: ativo.pl > 0 ? (ativo.pl ?? 0).toFixed(1) : '—' },
                                { label: 'P/VP', value: ativo.pvp > 0 ? (ativo.pvp ?? 0).toFixed(2) : '—' },
                                { label: 'DY', value: `${(ativo.dy ?? 0).toFixed(1)}%` },
                                { label: 'ROE', value: ativo.roe > 0 ? `${(ativo.roe ?? 0).toFixed(1)}%` : '—' },
                                { label: 'Margem Liq.', value: ativo.margemLiquida > 0 ? `${(ativo.margemLiquida ?? 0).toFixed(1)}%` : '—' },
                                { label: 'Setor', value: ativo.setor },
                            ].map(({ label, value }) => (
                                <div key={label} className="p-3 rounded-xl bg-bg-elevated">
                                    <p className="text-[10px] text-text-muted">{label}</p>
                                    <p className="text-sm font-semibold text-text-primary mt-0.5">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Analysis */}
                    {ativo.analise && (
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                            <p className="text-xs text-text-muted mb-2 font-semibold">📊 Análise</p>
                            <p className="text-sm text-text-secondary leading-relaxed">{ativo.analise}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Top FIIs cards ──────────────────────────────────────────
const FIICard = ({ fii }: { fii: any }) => {
    const getScoreCor = (s: number) => s >= 80 ? '#00e88f' : s >= 65 ? '#00b8ff' : s >= 50 ? '#f5c842' : '#ff4d6d'
    const cor = getScoreCor(fii.score)
    return (
        <div className="card hover:border-primary/30 border border-surface-border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
            <div className="flex items-start justify-between mb-3 min-w-0">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-text-primary">{fii.ticker}</p>
                    <TruncatedName name={fii.nome} className="text-[11px] text-text-muted" />
                </div>
                <span className="text-xs font-bold shrink-0 ml-2" style={{ color: cor }}>{fii.score}</span>
            </div>
            <div className="flex justify-between text-xs">
                <div>
                    <p className="text-text-muted">DY 12m</p>
                    <p className="font-semibold text-primary">{(fii.dy ?? 0).toFixed(1)}%</p>
                </div>
                <div>
                    <p className="text-text-muted">P/VP</p>
                    <p className="font-semibold text-text-primary">{(fii.pvp ?? 0).toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-text-muted">Preço</p>
                    <p className="font-semibold text-text-primary">{formatMoeda(fii.preco)}</p>
                </div>
            </div>
            <div className="mt-3 h-1 bg-surface-border rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${fii.score}%`, backgroundColor: cor }} />
            </div>
        </div>
    )
}

const CardSkeleton = () => (
    <div className="card animate-pulse space-y-3 h-[132px]">
        <div className="flex justify-between">
            <div className="h-4 bg-surface-border rounded w-24" />
            <div className="h-9 w-9 bg-surface-border rounded-xl" />
        </div>
        <div className="h-8 bg-surface-border rounded w-32" />
        <div className="h-3 bg-surface-border rounded w-20" />
    </div>
)

// ─── Main Page ───────────────────────────────────────────────
export const DashboardPage = () => {
    const { resumo: carteira, loading: loadingCarteira, loadingPeriodo } = useCarteiraResumo()
    const { usuario } = useUserStore()
    const { acoes, loading: loadingAcoes } = useAcoes()
    const { fiis, loading: loadingFIIs } = useFIIs()
    const { noticias, loading: loadingNoticias } = useNoticias()

    const [selectedAtivo, setSelectedAtivo] = useState<Ativo | null>(null)
    const [evolucao, setEvolucao] = useState<any[]>([])
    const [isLoadingEvolucao, setIsLoadingEvolucao] = useState(true)
    const [avisoEvolucao, setAvisoEvolucao] = useState<string | null>(null)

    // Efeito para carregar evolução
    const [periodo, setPeriodo] = useState('1mo')

    useEffect(() => {
        const fetchEvolucao = async () => {
            if (!usuario?.id) return
            setIsLoadingEvolucao(true)
            try {
                const { data: res } = await api.get(`/carteira/evolucao?userId=${usuario.id}&periodo=${periodo}`)
                if (res.success) {
                    setEvolucao(res.data)
                    setAvisoEvolucao(res.aviso || null)
                }
            } catch (error) {
                console.error('Erro ao buscar evolução patrimonial:', error)
            } finally {
                setIsLoadingEvolucao(false)
            }
        }

        fetchEvolucao()
    }, [usuario?.id, periodo])

    const composicao = (carteira.itens || []).map((item, i) => ({
        name: item.ticker,
        value: item.totalAtual,
        color: COLORS[i % COLORS.length],
    }))

    const topFIIs = [...fiis].sort((a, b) => b.score - a.score).slice(0, 6)

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Detalhe Panel */}
            {selectedAtivo && (
                <DetalhePanel ativo={selectedAtivo} onClose={() => setSelectedAtivo(null)} />
            )}

            {/* Welcome header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        Bem-vindo, {usuario?.nome.split(' ')[0]} 👋
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">Aqui está o resumo dos seus investimentos hoje.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loadingCarteira ? (
                    Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
                ) : (
                    <>
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
                        {loadingPeriodo ? <CardSkeleton /> : (
                            <StatCard
                                titulo="Rentabilidade Mês"
                                valor={formatPercent(carteira.rendimentoMes)}
                                icon={<TrendingUp size={18} />}
                                info="Variação média dos seus ativos no mercado nos últimos 30 dias"
                                cor="blue"
                            />
                        )}
                        <StatCard
                            titulo="Dividendos Mês"
                            valor={formatMoeda(carteira.dividendosMes)}
                            subvalor="estimativa"
                            icon={<DollarSign size={18} />}
                            cor="yellow"
                        />
                    </>
                )}
            </div>

            {/* Spotlight + Chart Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Spotlight */}
                <div className="xl:col-span-1">
                    <SpotlightAcao acoes={acoes} loading={loadingAcoes} />
                </div>

                {/* Evolução Patrimonial */}
                <div className="xl:col-span-2 card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-text-primary font-semibold">Evolução Patrimonial</h2>
                        <div className="flex items-center bg-bg-elevated p-1 rounded-xl border border-surface-border">
                            {[
                                { id: '1mo', label: '1M' },
                                { id: '3mo', label: '3M' },
                                { id: '6mo', label: '6M' },
                                { id: '1y', label: '1A' },
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPeriodo(p.id)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${periodo === p.id
                                        ? 'bg-bg-card text-primary shadow-sm border border-surface-border'
                                        : 'text-text-muted hover:text-text-primary'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoadingEvolucao ? (
                        <ChartSkeleton />
                    ) : evolucao.length === 0 ? (
                        <div className="h-[220px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-surface-border rounded-2xl bg-bg-elevated/30">
                            <div className="w-12 h-12 rounded-full bg-surface-border/30 flex items-center justify-center mb-3 text-text-muted">
                                <Layout size={24} />
                            </div>
                            <h3 className="text-text-primary font-bold text-sm">Histórico indisponível</h3>
                            <p className="text-text-muted text-xs mt-1 max-w-[200px]">
                                Histórico disponível após 7 dias com ativos na carteira.
                            </p>
                        </div>
                    ) : (
                        // ... rest of chart ...
                        <div>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={evolucao} margin={{ top: 5, right: 5, bottom: 5, left: 5 }} style={{ outline: 'none' }}>
                                    <defs>
                                        <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00e88f" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00e88f" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fill: '#52607a', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        tick={{ fill: '#52607a', fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={v => formatMoeda(v).replace('R$', '').trim()}
                                        width={60}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e2438',
                                            border: '1px solid #2a3050',
                                            borderRadius: '8px',
                                            color: '#e8eaf2'
                                        }}
                                        itemStyle={{ color: '#e8eaf2' }}
                                        labelStyle={{ color: '#e8eaf2' }}
                                        formatter={formatTooltip}
                                    />
                                    <Area type="monotone" dataKey="patrimonio" stroke="#00e88f" strokeWidth={2} fill="url(#gradGreen)" />
                                </AreaChart>
                            </ResponsiveContainer>
                            {avisoEvolucao && (
                                <p className="text-center text-[11px] text-text-muted italic mt-2">
                                    {avisoEvolucao}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabela de Ações */}
            <TabelaIndicadas
                acoes={acoes}
                loading={loadingAcoes}
                onSelectAtivo={setSelectedAtivo}
            />

            {/* Feed de Notícias */}
            <div className="card">
                <div className="flex items-center gap-2 mb-4">
                    <Radio size={16} className="text-primary" />
                    <h2 className="text-text-primary font-semibold">Últimas Notícias</h2>
                </div>
                {loadingNoticias ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="animate-pulse flex gap-3 py-3 border-b border-surface-border/50">
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-surface-border rounded w-3/4" />
                                    <div className="h-3 bg-surface-border rounded w-1/2" />
                                </div>
                                <div className="h-5 w-16 bg-surface-border rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="divide-y divide-surface-border/50">
                        {noticias.map((noticia) => {
                            const sentColor = noticia.sentimento === 'POSITIVO'
                                ? 'bg-primary/10 text-primary'
                                : noticia.sentimento === 'NEGATIVO'
                                    ? 'bg-danger/10 text-danger'
                                    : 'bg-text-muted/10 text-text-muted'
                            const sentLabel = noticia.sentimento === 'POSITIVO' ? 'Positivo'
                                : noticia.sentimento === 'NEGATIVO' ? 'Negativo' : 'Neutro'
                            const ago = (() => {
                                const diff = (Date.now() - new Date(noticia.publicadoEm).getTime()) / 60000
                                return diff < 60 ? `${Math.round(diff)}min atrás` : `${Math.round(diff / 60)}h atrás`
                            })()
                            return (
                                <a
                                    key={noticia.id}
                                    href={noticia.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-3 py-3 hover:bg-bg-elevated transition-colors rounded-xl px-2 -mx-2 group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors leading-snug line-clamp-2">
                                            {noticia.titulo}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] text-text-muted">{noticia.fonte}</span>
                                            <span className="text-[11px] text-text-muted">·</span>
                                            <span className="text-[11px] text-text-muted">{ago}</span>
                                            {noticia.tickers && noticia.tickers.length > 0 && (
                                                <>
                                                    <span className="text-[11px] text-text-muted">·</span>
                                                    {noticia.tickers.map(t => (
                                                        <span key={t} className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1">{t}</span>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sentColor}`}>{sentLabel}</span>
                                        <ExternalLink size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </a>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* FIIs em destaque + Composição */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Top FIIs */}
                <div className="xl:col-span-2">
                    <h2 className="text-text-primary font-semibold mb-4">🏢 Top FIIs por Score</h2>
                    {loadingFIIs ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="card animate-pulse h-28">
                                    <div className="h-4 bg-surface-border rounded mb-3 w-1/2" />
                                    <div className="h-3 bg-surface-border rounded mb-4 w-3/4" />
                                    <div className="h-3 bg-surface-border rounded w-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {topFIIs.map(fii => <FIICard key={fii.ticker} fii={fii} />)}
                        </div>
                    )}
                </div>

                {/* Composição */}
                <div className="card">
                    <h2 className="text-text-primary font-semibold mb-4">Composição</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart style={{ outline: 'none' }}>
                            <Pie data={composicao} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                                {composicao.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e2438',
                                    border: '1px solid #2a3050',
                                    borderRadius: '8px',
                                    color: '#e8eaf2'
                                }}
                                itemStyle={{ color: '#e8eaf2' }}
                                labelStyle={{ color: '#e8eaf2' }}
                                formatter={(v: any) => [formatMoeda(Number(v) || 0), '']}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-3">
                        {composicao.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-text-secondary">{item.name}</span>
                                </div>
                                <span className="text-text-primary font-medium">{(((item.value ?? 0) / (carteira.totalAtual || 1)) * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
