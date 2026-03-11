import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { BottomNav } from './BottomNav'
import { MarketBar } from './MarketBar'
import { useUserStore } from '@/store/user.store'

export const Layout = () => {
    const [menuOpen, setMenuOpen] = useState(false)
    const { usuario } = useUserStore()

    return (
        <div className="min-h-screen bg-bg-primary flex">
            {/* Sidebar - Oculta via CSS md: no mobile */}
            <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

            {/* Main area */}
            <div className={`flex-1 flex flex-col min-h-screen relative w-full overflow-x-hidden md:ml-64 pb-16 md:pb-0`}>
                <Navbar onMenuToggle={() => setMenuOpen(!menuOpen)} />
                {usuario && <MarketBar />}
                <main className="flex-1 p-4 md:p-6 overflow-y-auto animate-fade-in no-scrollbar w-full max-w-full">
                    <Outlet />
                </main>
                <BottomNav />
            </div>
        </div>
    )
}
