import { useState } from 'react'
import { Search, Bell, ChevronDown, Menu } from 'lucide-react'
import { useUserStore } from '@/store/user.store'

interface NavbarProps {
    onMenuToggle?: () => void
}

export const Navbar = ({ onMenuToggle }: NavbarProps) => {
    const { usuario } = useUserStore()
    const [busca, setBusca] = useState('')

    return (
        <header className="h-16 bg-bg-card border-b border-surface-border flex items-center px-6 gap-4 sticky top-0 z-20">
            {/* Mobile menu toggle */}
            <button onClick={onMenuToggle} className="btn-ghost p-2 lg:hidden">
                <Menu size={20} />
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    placeholder="Buscar ativo, ticker, FII..."
                    className="input pl-9 h-9 text-sm"
                />
            </div>

            <div className="flex items-center gap-3 ml-auto">
                {/* Notifications */}
                <button className="btn-ghost p-2 relative">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
                </button>

                {/* Plan badge */}
                {usuario && (
                    <span className={`badge-${usuario.plano === 'FREE' ? 'yellow' : 'green'} text-xs`}>
                        {usuario.plano}
                    </span>
                )}

                {/* User */}
                {usuario && (
                    <button className="flex items-center gap-2.5 hover:bg-surface-border px-2 py-1.5 rounded-xl transition-colors">
                        <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center">
                            <span className="text-bg-primary font-bold text-xs">{usuario.nome.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-text-primary hidden sm:block">{usuario.nome.split(' ')[0]}</span>
                        <ChevronDown size={14} className="text-text-muted" />
                    </button>
                )}
            </div>
        </header>
    )
}
