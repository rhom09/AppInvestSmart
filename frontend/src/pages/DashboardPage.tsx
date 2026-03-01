import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { StatCard } from '@/components/StatCard'
import { AtivoCard } from '@/components/AtivoCard'
import { Wallet, TrendingUp, Star, DollarSign } from 'lucide-react'
import { useCarteiraStore } from '@/store/carteira.store'
import { ACOES_MOCK, HISTORICO_PATRIMONIAL } from '@/data/mockData'
import { formatMoeda, formatPercent } from '@/utils/formatters'
import { useUserStore } from '@/store/user.store'

const COLORS = ['#00e88f', '#00b8ff', '#f0a500', '#ff4d6d', '#a78bfa']

const formatTooltip = (value: number) => [formatMoeda(value), 'Patrimônio']

export const DashboardPage = () => {
    const { carteira } = useCarteiraStore()
    const { usuario } = useUserStore()

    const composicao = carteira.itens.map((item, i) => ({
        name: item.ticker,
        value: item.totalAtual,
        color: COLORS[i % COLORS.length],
    }))

    const destaques = ACOES_MOCK.filter(a => a.score >= 70).slice(0, 4)

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        Bem-vindo, {usuario?.nome.split(' ')[0]} 👋
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">Aqui está o resumo dos seus investimentos hoje.</p>
                </div>
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2">
                    <Star size={14} className="text-primary fill-primary" />
                    <span className="text-sm font-semibold text-primary">Score: {carteira.scoreCarteira}/100</span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    titulo="Patrimônio Total"
                    valor={formatMoeda(carteira.totalAtual)}
                    variacao={carteira.rendimentoMes}
                    icon={<Wallet size={18} />}
                    cor="green"
                />
                <StatCard
                    titulo="Resultado Total"
                    valor={formatMoeda(carteira.resultado)}
                    subvalor={formatPercent(carteira.resultadoPercent)}
                    variacao={carteira.resultadoPercent}
                    icon={<TrendingUp size={18} />}
                    cor={carteira.resultado >= 0 ? 'green' : 'red'}
                />
                <StatCard
                    titulo="Rentabilidade Mês"
                    valor={formatPercent(carteira.rendimentoMes)}
                    icon={<TrendingUp size={18} />}
                    cor="blue"
                />
                <StatCard
                    titulo="Dividendos Mês"
                    valor={formatMoeda(carteira.dividendosMes)}
                    descricao="Projetado"
                    icon={<DollarSign size={18} />}
                    cor="yellow"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evolução Patrimonial */}
                <div className="lg:col-span-2 card">
                    <h2 className="text-text-primary font-semibold mb-4">Evolução Patrimonial</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={HISTORICO_PATRIMONIAL} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                            <defs>
                                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00e88f" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00e88f" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="mes" tick={{ fill: '#52607a', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#52607a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0e1117', border: '1px solid #1e2535', borderRadius: '12px', color: '#e8eaf0' }}
                                formatter={formatTooltip}
                            />
                            <Area type="monotone" dataKey="valor" stroke="#00e88f" strokeWidth={2} fill="url(#gradGreen)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Composição */}
                <div className="card">
                    <h2 className="text-text-primary font-semibold mb-4">Composição</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={composicao} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                                {composicao.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0e1117', border: '1px solid #1e2535', borderRadius: '12px', color: '#e8eaf0' }}
                                formatter={(v: number) => [formatMoeda(v), '']}
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
                                <span className="text-text-primary font-medium">{((item.value / carteira.totalAtual) * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ativos em Destaque */}
            <div>
                <h2 className="text-text-primary font-semibold mb-4">⭐ Ativos em Destaque</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {destaques.map(ativo => (
                        <AtivoCard key={ativo.ticker} ativo={ativo} />
                    ))}
                </div>
            </div>
        </div>
    )
}
