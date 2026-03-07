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

const buildResumo = (
    itens: ItemCarteira[],
    tickerData: Record<string, any> = {},
    rendimentoMes: number = 0,
    rendimentoAno: number = 0
): ResumoCarteira => {
    // 1. Processar cada item com dados de cotação atual e nome
    const itensComPreco = itens.map(item => {
        const cotacao = tickerData[item.ticker]

        const nome = cotacao?.nome || item.nome || item.ticker
        const precoAtual = cotacao?.preco || item.precoMedio
        const totalAtual = precoAtual * item.quantidade
        const totalInvestido = item.precoMedio * item.quantidade
        const resultado = totalAtual - totalInvestido
        const resultadoPercent = totalInvestido > 0 ? (resultado / totalInvestido) * 100 : 0

        const dy = cotacao?.dy || 0
        const dividendosMes = (dy / 100 / 12) * totalAtual

        console.log(`[DEBUG] Dividendos ${item.ticker}: DY=${dy}, Preço=${precoAtual}, Qtd=${item.quantidade}, Mensal=R$${dividendosMes.toFixed(2)}`)

        return {
            ...item,
            nome,
            precoAtual,
            totalAtual,
            totalInvestido,
            resultado,
            resultadoPercent,
            dy,
            dividendosMes
        }
    })

    const totalInvestido = itensComPreco.reduce((s, i) => s + i.totalInvestido, 0)
    const totalAtual = itensComPreco.reduce((s, i) => s + i.totalAtual, 0)
    const dividendosMes = itensComPreco.reduce((s, i) => s + (i.dividendosMes || 0), 0)

    const resultadoTotal = totalAtual - totalInvestido
    const resultadoPercent = totalInvestido > 0 ? (resultadoTotal / totalInvestido) * 100 : 0

    // Para evitar histórico lento, usamos o resultado total da carteira como base
    const finalRendimentoMes = rendimentoMes !== 0 ? rendimentoMes : resultadoPercent
    const finalRendimentoAno = rendimentoAno !== 0 ? rendimentoAno : resultadoPercent

    // 2. Calcular percentual de cada ativo na carteira e score ponderado
    let somaPesos = 0
    let somaScoresPonderados = 0

    const itensProcessados = itensComPreco.map(item => {
        const score = tickerData[item.ticker]?.score || 0
        if (score > 0) {
            somaScoresPonderados += score * item.totalAtual
            somaPesos += item.totalAtual
        }

        return {
            ...item,
            percentCarteira: totalAtual > 0 ? (item.totalAtual / totalAtual) * 100 : 0
        }
    })

    const scoreCarteira = somaPesos > 0 ? Math.round(somaScoresPonderados / somaPesos) : 0

    return {
        ...EMPTY_CARTEIRA,
        itens: itensProcessados,
        totalInvestido,
        totalAtual,
        rendimentoMes: finalRendimentoMes,
        rendimentoAno: finalRendimentoAno,
        dividendosMes,
        scoreCarteira,
        resultado: resultadoTotal,
        resultadoPercent,
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
            const rawItens: ItemCarteira[] = rows.map(row => {
                // Mapear tipo do banco para o enum do ItemCarteira
                let tipo: 'ACAO' | 'FII' | 'ETF' | 'RENDA_FIXA' | 'CRIPTO' = 'ACAO'
                const rawTipo = (row.tipo || '').toUpperCase()
                if (rawTipo.includes('FII')) tipo = 'FII'
                else if (rawTipo.includes('ETF')) tipo = 'ETF'
                else if (rawTipo.includes('CRIP')) tipo = 'CRIPTO'
                else if (rawTipo.includes('RENDA') || rawTipo.includes('FIXA')) tipo = 'RENDA_FIXA'

                return {
                    id: row.id ?? crypto.randomUUID(),
                    supabaseId: row.id,
                    ticker: row.ticker,
                    nome: row.ticker, // Nome inicial é o ticker, buildResumo atualizará com Brapi
                    tipo,
                    quantidade: row.quantidade,
                    precoMedio: row.preco_medio,
                    precoAtual: row.preco_medio,
                    totalInvestido: row.quantidade * row.preco_medio,
                    totalAtual: row.quantidade * row.preco_medio,
                    resultado: 0,
                    resultadoPercent: 0,
                    percentCarteira: 0 // Será calculado em buildResumo
                }
            })

            if (rawItens.length === 0) {
                setCarteira(EMPTY_CARTEIRA)
                setLastUpdate(new Date())
                return
            }

            // Buscar cotações e scores em massa
            const tickersUnicos = Array.from(new Set(rawItens.map(i => i.ticker)))
            const { data: quoteRes } = await api.get(`/cotacoes?tickers=${tickersUnicos.join(',')}`)

            if (quoteRes.success && quoteRes.data) {
                // Cálculo de Rendimento baseado no Preço Médio (Total) para evitar chamadas de histórico
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
