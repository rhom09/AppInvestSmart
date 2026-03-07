import { useState, Fragment } from 'react'
import { Search, Bell, ChevronDown, Menu as MenuIcon, LogOut } from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { useUserStore } from '@/store/user.store'
import { logout as supabaseLogout } from '@/services/supabase'
import { useNavigate } from 'react-router-dom'

interface NavbarProps {
    onMenuToggle?: () => void
}

export const Navbar = ({ onMenuToggle }: NavbarProps) => {
    const { usuario, logout: storeLogout } = useUserStore()
    const [busca, setBusca] = useState('')
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabaseLogout()
        storeLogout()
        navigate('/login')
    }

    return (
        <header className="h-16 bg-bg-card border-b border-surface-border flex items-center px-4 md:px-6 gap-4 sticky top-0 z-20 w-full">
            {/* Mobile menu toggle - Oculto pois agora usamos BottomNav */}
            <button onClick={onMenuToggle} className="btn-ghost p-2 hidden">
                <MenuIcon size={20} />
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

                {/* User Dropdown */}
                {usuario && (
                    <Menu as="div" className="relative">
                        <Menu.Button className="flex items-center gap-2.5 hover:bg-surface-border px-2 py-1.5 rounded-xl transition-colors">
                            <div className="w-7 h-7 rounded-full bg-gradient-brand flex items-center justify-center">
                                <span className="text-bg-primary font-bold text-xs">{usuario.nome.charAt(0)}</span>
                            </div>
                            <span className="text-sm font-medium text-text-primary hidden sm:block">{usuario.nome.split(' ')[0]}</span>
                            <ChevronDown size={14} className="text-text-muted" />
                        </Menu.Button>

                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-bg-elevated border border-surface-border shadow-xl focus:outline-none overflow-hidden z-50">
                                <div className="p-1">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                onClick={handleLogout}
                                                className={`${active ? 'bg-danger/10 text-danger' : 'text-text-primary'
                                                    } group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors`}
                                            >
                                                <LogOut size={16} className="mr-3" />
                                                Sair da conta
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                )}
            </div>
        </header>
    )
}
