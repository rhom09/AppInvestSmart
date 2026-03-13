import { useState, useEffect } from 'react'
import { isMercadoAberto } from '@/utils/market'

export const MarketStatusBadge = () => {
    const [aberto, setAberto] = useState(isMercadoAberto())

    useEffect(() => {
        const interval = setInterval(() => {
            setAberto(isMercadoAberto())
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-full
            bg-bg-elevated whitespace-nowrap
            border transition-colors duration-500
            ${aberto
                ? 'border-primary shadow-[0_0_8px_rgba(0,232,143,0.25)]'
                : 'border-danger shadow-[0_0_8px_rgba(255,71,87,0.2)]'
            }
        `}>
            <span className={`
                w-1.5 h-1.5 rounded-full
                ${aberto ? 'bg-primary animate-pulse' : 'bg-danger'}
            `} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${aberto ? 'text-primary' : 'text-danger'}`}>
                {aberto ? 'Mercado aberto' : 'Mercado fechado'}
            </span>
        </div>
    )
}
