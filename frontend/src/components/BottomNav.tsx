import { NavLink } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Building2, Briefcase, Bell } from 'lucide-react'

const BOTTOM_ITEMS = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/acoes', label: 'Ações', icon: TrendingUp },
    { to: '/fiis', label: 'FIIs', icon: Building2 },
    { to: '/carteira', label: 'Carteira', icon: Briefcase },
    { to: '/alertas', label: 'Alertas', icon: Bell },
]

export const BottomNav = () => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0e1120] border-t border-surface-border z-50 flex items-center justify-around md:hidden px-2">
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
        </nav>
    )
}
