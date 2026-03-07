import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { TickerBar } from './TickerBar'
import { BottomNav } from './BottomNav'

export const Layout = () => {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-bg-primary flex">
            {/* Sidebar - Oculta via CSS md: no mobile */}
            <Sidebar isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

            {/* Main area */}
            <div className={`flex-1 flex flex-col min-h-screen relative w-full overflow-x-hidden md:ml-64 pb-16 md:pb-0`}>
                <TickerBar />
                <Navbar onMenuToggle={() => setMenuOpen(!menuOpen)} />
                <main className="flex-1 p-4 md:p-6 overflow-y-auto animate-fade-in no-scrollbar w-full max-w-full">
                    <Outlet />
                </main>
                <BottomNav />
            </div>
        </div>
    )
}
