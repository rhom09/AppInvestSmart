import { Fragment } from 'react'
import { Bell, ChevronDown, Menu as MenuIcon, LogOut } from 'lucide-react'
import { Menu, Transition } from '@headlessui/react'
import { useUserStore } from '@/store/user.store'
import { supabase, logout as supabaseLogout, loginComGoogle } from '@/services/supabase'
import { useNavigate } from 'react-router-dom'
import { GlobalSearch } from '@/components/GlobalSearch'

interface NavbarProps {
    onMenuToggle?: () => void
}

export const Navbar = ({ onMenuToggle }: NavbarProps) => {
    const { usuario, logout: storeLogout } = useUserStore()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabaseLogout()
        storeLogout()
        navigate('/dashboard')
    }

    const handleGoogleLogin = async () => {
        alert('🔄 Botão de Login clicado!')
        console.error('🔄 [AUTH] Clicou no botão de login da Navbar')
        await loginComGoogle()
    }

    return (
        <header className="h-16 bg-bg-card border-b border-surface-border flex items-center px-4 md:px-6 gap-4 sticky top-0 z-20 w-full">
            {/* Mobile menu toggle - Oculto pois agora usamos BottomNav */}
            <button onClick={onMenuToggle} className="btn-ghost p-2 hidden">
                <MenuIcon size={20} />
            </button>

            {/* Search */}
            <GlobalSearch />

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

                {/* User Dropdown ou Login */}
                {!usuario ? (
                    <button onClick={handleGoogleLogin} className="btn-outline text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 border-surface-border">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Entrar com Google
                    </button>
                ) : (
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
                                    <div className="px-3 py-2 border-b border-surface-border mb-1">
                                        <p className="text-sm font-medium text-text-primary truncate">{usuario.nome}</p>
                                        <p className="text-xs text-text-secondary truncate">{usuario.email}</p>
                                    </div>
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
