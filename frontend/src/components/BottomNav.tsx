import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Building2, Briefcase, Plus, BarChart2, Lock, Bell, Calculator, Scale, X } from 'lucide-react'

const BOTTOM_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/carteira', label: 'Carteira', icon: Briefcase },
    { to: '/acoes', label: 'Ações', icon: TrendingUp },
    { to: '/fiis', label: 'FIIs', icon: Building2 },
]

const DRAWER_ITEMS = [
    { to: '/etfs', label: 'ETFs', icon: BarChart2 },
    { to: '/renda-fixa', label: 'Renda Fixa', icon: Lock },
    { to: '/alertas', label: 'Alertas', icon: Bell },
    { to: '/calculadora', label: 'Calculadora', icon: Calculator },
    { to: '/comparador', label: 'Comparador', icon: Scale },
]

export const BottomNav = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <div className="flex md:hidden">
            {/* Nav Bar */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0e1120] border-t border-surface-border z-50 flex items-center justify-around px-2">
                {BOTTOM_ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${isActive ? 'text-[#00e88f]' : 'text-[#5a6080]'
                            }`
                        }
                    >
                        <Icon size={20} />
                        <span className="text-[10px] font-medium">{label}</span>
                    </NavLink>
                ))}

                {/* Mais Button */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${isMenuOpen ? 'text-[#00e88f]' : 'text-[#5a6080]'}`}
                >
                    <Plus size={20} />
                    <span className="text-[10px] font-medium">Mais</span>
                </button>
            </nav>

            {/* Bottom Drawer */}
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="fixed bottom-0 left-0 right-0 bg-[#0e1120] border-t border-surface-border z-[70] rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-text-primary font-bold text-lg">Menu Extra</h2>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 rounded-xl bg-surface-border/30 text-text-secondary"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            {DRAWER_ITEMS.map(({ to, label, icon: Icon }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex flex-col items-center gap-2 text-center transition-colors ${isActive ? 'text-[#00e88f]' : 'text-text-secondary'}`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-surface-border/20 ${isActive ? 'bg-[#00e88f]/10 text-[#00e88f]' : ''}`}>
                                                <Icon size={24} />
                                            </div>
                                            <span className="text-[11px] font-semibold leading-tight">{label}</span>
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
