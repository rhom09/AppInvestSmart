import { useEffect, useState } from 'react'
import { isMercadoAberto } from '@/utils/market'

interface MarketStatusBadgeProps {
    className?: string
}

export const MarketStatusBadge = ({ className = '' }: MarketStatusBadgeProps) => {
    const [mercadoAberto, setMercadoAberto] = useState(isMercadoAberto())

    useEffect(() => {
        const interval = setInterval(() => {
            setMercadoAberto(isMercadoAberto())
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className={`flex items-center gap-1.5 text-[11px] font-bold rounded-full px-2.5 py-1 whitespace-nowrap flex-shrink-0 transition-all ${mercadoAberto
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'bg-danger/10 text-danger border border-danger/20'
            } ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${mercadoAberto ? 'bg-primary animate-pulse' : 'bg-danger'}`} />
            {mercadoAberto ? 'Mercado aberto' : 'Mercado fechado'}
        </div>
    )
}
