import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, TrendingUp, Building2, BarChart2, BookOpen, Settings, Lock } from 'lucide-react'
import { useUserStore } from '@/store/user.store'

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/carteira', label: 'Carteira', icon: Briefcase },
    { to: '/acoes', label: 'Ações', icon: TrendingUp },
    { to: '/fiis', label: 'FIIs', icon: Building2 },
    { to: '/etfs', label: 'ETFs', icon: BarChart2 },
    { to: '/renda-fixa', label: 'Renda Fixa', icon: Lock },
    { to: '/aprender', label: 'Aprender', icon: BookOpen },
    { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export const Sidebar = () => {
    const { usuario } = useUserStore()

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-bg-card border-r border-surface-border z-30 flex flex-col">
            {/* Logo */}
            <div className="px-6 py-5 border-b border-surface-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                        <span className="text-bg-primary font-black text-sm">IS</span>
                    </div>
                    <div>
                        <h1 className="text-text-primary font-bold text-base leading-none">InvestSmart</h1>
                        <span className="text-[10px] font-semibold text-primary/80 leading-none">BETA v2.0</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                <div className="space-y-1">
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* PRO Banner */}
            {usuario?.plano === 'FREE' && (
                <div className="mx-3 mb-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                    <p className="text-xs font-semibold text-text-primary mb-1">🚀 Upgrade para PRO</p>
                    <p className="text-[11px] text-text-secondary mb-3 leading-snug">Scores avançados de IA e análises exclusivas</p>
                    <NavLink to="/planos" className="btn-primary text-xs py-2 px-3 rounded-lg w-full block text-center">
                        Ver Planos
                    </NavLink>
                </div>
            )}

            {/* User info */}
            {usuario && (
                <div className="px-3 pb-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-border cursor-pointer transition-colors">
                        <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                            <span className="text-bg-primary font-bold text-sm">
                                {usuario.nome.charAt(0)}
                            </span>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-text-primary truncate">{usuario.nome}</p>
                            <p className="text-xs text-text-secondary truncate">{usuario.nivel}</p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    )
}
