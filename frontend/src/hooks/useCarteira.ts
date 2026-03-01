import { useCarteiraStore } from '@/store/carteira.store'
import { useEffect } from 'react'

export const useCarteira = () => {
    const { carteira, loading, fetchCarteira, adicionarItem, removerItem } = useCarteiraStore()
    useEffect(() => { fetchCarteira() }, [fetchCarteira])
    return { carteira, loading, adicionarItem, removerItem }
}
