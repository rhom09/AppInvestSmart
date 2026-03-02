import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { MarketBar } from './MarketBar'

export const Layout = () => {
    return (
        <div className="min-h-screen bg-bg-primary flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Main area */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen relative">
                <MarketBar />
                <Navbar />
                <main className="flex-1 p-6 overflow-y-auto animate-fade-in no-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
