import { useState, useEffect } from 'react'
import { isMercadoAberto } from '@/utils/market'

export const MarketStatusBadge = () => {
    const [aberto, setAberto] = useState(isMercadoAberto())

    useEffect(() => {
        const interval = setInterval(() => {
            setAberto(isMercadoAberto())
        }, 60000) // Verifica a cada minuto
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-elevated border border-surface-border whitespace-nowrap">
            <span className={`w-1.5 h-1.5 rounded-full ${aberto ? 'bg-primary animate-pulse' : 'bg-danger'}`} />
            <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider">
                {aberto ? 'Mercado aberto' : 'Mercado fechado'}
            </span>
        </div>
    )
}
