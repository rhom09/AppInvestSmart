import { useEffect, useState, useCallback } from 'react'
import { useCarteiraStore } from '@/store/carteira.store'
import { useAuth } from '@/hooks/useAuth'
import { getCarteira, toItemCarteira } from '@/services/carteira.service'
import type { ItemCarteira, ResumoCarteira } from '@/types'

const EMPTY_CARTEIRA: ResumoCarteira = {
    totalInvestido: 0,
    totalAtual: 0,
    resultado: 0,
    resultadoPercent: 0,
    rendimentoMes: 0,
    rendimentoAno: 0,
    dividendosMes: 0,
    scoreCarteira: 0,
    itens: [],
}

const buildResumo = (itens: ItemCarteira[]): ResumoCarteira => {
    const totalInvestido = itens.reduce((s, i) => s + i.totalInvestido, 0)
    const totalAtual = itens.reduce((s, i) => s + i.totalAtual, 0)
    return {
        ...EMPTY_CARTEIRA,
        itens,
        totalInvestido,
        totalAtual,
        resultado: totalAtual - totalInvestido,
        resultadoPercent: totalInvestido > 0
            ? ((totalAtual - totalInvestido) / totalInvestido) * 100
            : 0,
    }
}

export const useCarteira = () => {
    const { user } = useAuth()
    const { carteira: localCarteira, adicionarItem: localAdicionarItem, removerItem: localRemoverItem } = useCarteiraStore()
    const [carteira, setCarteira] = useState<ResumoCarteira>(EMPTY_CARTEIRA)
    const [loading, setLoading] = useState(false)

    const fetchFromSupabase = useCallback(async (userId: string) => {
        setLoading(true)
        try {
            const rows = await getCarteira(userId)
            const itens: ItemCarteira[] = rows.map(row => ({
                ...toItemCarteira(row, row.preco_medio),
                id: row.id ?? crypto.randomUUID(),
                supabaseId: row.id,
            }))
            setCarteira(buildResumo(itens))
        } catch (e) {
            console.error('Erro ao buscar carteira do Supabase:', e)
            setCarteira(EMPTY_CARTEIRA)
        } finally {
            setLoading(false)
        }
    }, [])

    // Re-fetch whenever the logged-in user changes (login / logout)
    useEffect(() => {
        if (user?.id) {
            fetchFromSupabase(user.id)
        } else {
            setCarteira(localCarteira)
        }
    }, [user?.id, fetchFromSupabase]) // eslint-disable-line react-hooks/exhaustive-deps

    // Wrapped adicionarItem: also updates local displayed state
    const adicionarItem = useCallback((item: ItemCarteira) => {
        localAdicionarItem(item)
        if (user?.id) {
            // Re-fetch from Supabase to get the authoritative list
            fetchFromSupabase(user.id)
        } else {
            setCarteira(prev => buildResumo([...prev.itens, item]))
        }
    }, [user?.id, localAdicionarItem, fetchFromSupabase])

    // Wrapped removerItem: also updates local displayed state after deletion
    const removerItem = useCallback(async (supabaseId: string | undefined, itemId: string) => {
        await localRemoverItem(supabaseId, itemId)
        if (user?.id) {
            fetchFromSupabase(user.id)
        } else {
            setCarteira(prev => buildResumo(prev.itens.filter(i => i.id !== itemId)))
        }
    }, [user?.id, localRemoverItem, fetchFromSupabase])

    return { carteira, loading, adicionarItem, removerItem }
}
