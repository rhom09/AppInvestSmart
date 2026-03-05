import { useEffect, useState, useCallback } from 'react'
import { useCarteiraStore } from '@/store/carteira.store'
import { useAuth } from '@/hooks/useAuth'
import { getCarteira } from '@/services/carteira.service'
import type { ItemCarteira, ResumoCarteira } from '@/types'
import { api } from '@/services/api'

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

const buildResumo = (itens: ItemCarteira[], tickerData: Record<string, any> = {}): ResumoCarteira => {
    // Processar cada item com dados de cotação atual
    const itensProcessados = itens.map(item => {
        const cotacao = tickerData[item.ticker]
        if (!cotacao) return item

        const precoAtual = cotacao.preco || item.precoMedio
        const totalAtual = precoAtual * item.quantidade
        const totalInvestido = item.precoMedio * item.quantidade
        const resultado = totalAtual - totalInvestido
        const resultadoPercent = totalInvestido > 0 ? (resultado / totalInvestido) * 100 : 0

        return {
            ...item,
            precoAtual,
            totalAtual,
            totalInvestido, // recalculado por segurança
            resultado,
            resultadoPercent
        }
    })

    const totalInvestido = itensProcessados.reduce((s, i) => s + i.totalInvestido, 0)
    const totalAtual = itensProcessados.reduce((s, i) => s + i.totalAtual, 0)

    // Calculate Score based on weighted average of individual asset scores (weighted by totalAtual)
    let somaPesos = 0
    let somaScoresPonderados = 0

    itensProcessados.forEach(item => {
        const score = tickerData[item.ticker]?.score || 0
        if (score > 0) {
            somaScoresPonderados += score * item.totalAtual
            somaPesos += item.totalAtual
        }
    })

    const scoreCarteira = somaPesos > 0 ? Math.round(somaScoresPonderados / somaPesos) : 0

    return {
        ...EMPTY_CARTEIRA,
        itens: itensProcessados,
        totalInvestido,
        totalAtual,
        scoreCarteira,
        resultado: totalAtual - totalInvestido,
        resultadoPercent: totalInvestido > 0
            ? ((totalAtual - totalInvestido) / totalInvestido) * 100
            : 0,
    }
}

export const useCarteira = () => {
    const { user } = useAuth()
    const { adicionarItem: localAdicionarItem, removerItem: localRemoverItem } = useCarteiraStore()
    const [carteira, setCarteira] = useState<ResumoCarteira>(EMPTY_CARTEIRA)
    const [loading, setLoading] = useState(false)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const fetchFromSupabase = useCallback(async (userId: string) => {
        setLoading(true)
        try {
            const rows = await getCarteira(userId)
            const rawItens: ItemCarteira[] = rows.map(row => ({
                id: row.id ?? crypto.randomUUID(),
                supabaseId: row.id,
                ticker: row.ticker,
                tipo: row.tipo || 'Ação',
                quantidade: row.quantidade,
                precoMedio: row.preco_medio,
                precoAtual: row.preco_medio, // fallback inicial
                totalInvestido: row.quantidade * row.preco_medio,
                totalAtual: row.quantidade * row.preco_medio,
                resultado: 0,
                resultadoPercent: 0
            }))

            if (rawItens.length === 0) {
                setCarteira(EMPTY_CARTEIRA)
                setLastUpdate(new Date())
                return
            }

            // Buscar cotações e scores em massa
            const tickersUnicos = Array.from(new Set(rawItens.map(i => i.ticker)))
            const { data: quoteRes } = await api.get(`/cotacoes?tickers=${tickersUnicos.join(',')}`)

            if (quoteRes.success && quoteRes.data) {
                setCarteira(buildResumo(rawItens, quoteRes.data))
                setLastUpdate(new Date())
            } else {
                setCarteira(buildResumo(rawItens))
            }
        } catch (e) {
            console.error('Erro ao buscar carteira:', e)
            setCarteira(EMPTY_CARTEIRA)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (user?.id) {
            fetchFromSupabase(user.id)
        }
    }, [user?.id, fetchFromSupabase])

    const refreshPrices = useCallback(() => {
        if (user?.id) fetchFromSupabase(user.id)
    }, [user?.id, fetchFromSupabase])

    const adicionarItem = useCallback((item: ItemCarteira) => {
        localAdicionarItem(item)
        if (user?.id) {
            fetchFromSupabase(user.id)
        }
    }, [user?.id, localAdicionarItem, fetchFromSupabase])

    const removerItem = useCallback(async (supabaseId: string | undefined, itemId: string) => {
        await localRemoverItem(supabaseId, itemId)
        if (user?.id) {
            fetchFromSupabase(user.id)
        }
    }, [user?.id, localRemoverItem, fetchFromSupabase])

    return { carteira, loading, lastUpdate, refreshPrices, adicionarItem, removerItem }
}
