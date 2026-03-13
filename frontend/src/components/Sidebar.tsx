import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, TrendingUp, Building2, BarChart2, BookOpen, Settings, Lock } from 'lucide-react'
import { useUserStore } from '@/store/user.store'

// Movemos os itens para dentro do componente para reagir ao state do usuário

interface SidebarProps {
    isOpen?: boolean
    onClose?: () => void
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { usuario } = useUserStore()

    const navItems = [
        { to: '/dashboard', label: usuario ? 'Dashboard' : 'Visão Geral', icon: LayoutDashboard },
        { to: '/carteira', label: 'Carteira', icon: Briefcase, locked: !usuario },
        { to: '/acoes', label: 'Ações', icon: TrendingUp },
        { to: '/fiis', label: 'FIIs', icon: Building2 },
        { to: '/etfs', label: 'ETFs', icon: BarChart2 },
        { to: '/renda-fixa', label: 'Renda Fixa', icon: Lock },
        { to: '/aprender', label: 'Aprender', icon: BookOpen },
        { to: '/configuracoes', label: 'Configurações', icon: Settings },
    ]

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            <aside className={`fixed left-0 top-0 h-full w-64 bg-bg-card border-r border-surface-border z-50 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} hidden md:flex`}>
                {/* Logo */}
                <div className="px-6 py-5 border-b border-surface-border">
                    <div className="flex items-center gap-2">
                        <img src="/logo-32.png" className="w-8 h-8" alt="InvestSmart" />
                        <div>
                            <h1 className="text-text-primary font-bold text-base leading-none flex items-center gap-1">
                                InvestSmart
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block mb-0.5" />
                            </h1>
                            <span className="text-[10px] font-semibold text-primary/80 leading-none">BETA v2.0</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                    <div className="space-y-1">
                        {navItems.map(({ to, label, icon: Icon, locked }) => (
                            <NavLink
                                key={to}
                                to={to}
                                onClick={() => {
                                    if (window.innerWidth < 768 && onClose) onClose()
                                }}
                                className={({ isActive }) =>
                                    `nav-link ${isActive ? 'active' : ''}`
                                }
                            >
                                <Icon size={18} />
                                {label}
                                {locked && <Lock size={12} className="ml-auto opacity-50" />}
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
        </>
    )
}
