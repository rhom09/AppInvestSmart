import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'
import { getCarteira } from '@/services/carteira.service'
import { useAuth } from '@/hooks/useAuth'
import type { ItemCarteira, ResumoCarteira } from '@/types'

export const useCarteiraResumo = () => {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [loadingPeriodo, setLoadingPeriodo] = useState(false)
    const [resumo, setResumo] = useState<ResumoCarteira>({
        totalInvestido: 0,
        totalAtual: 0,
        resultado: 0,
        resultadoPercent: 0,
        rendimentoMes: 0,
        rendimentoAno: 0,
        dividendosMes: 0,
        scoreCarteira: 0,
        itens: []
    })

    const fetchResumo = useCallback(async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            console.log(`🔍 [useCarteiraResumo] Buscando ativos para user: ${user.id}`)
            const ativosRow = await getCarteira(user.id)

            if (!ativosRow || ativosRow.length === 0) {
                setResumo({
                    totalInvestido: 0,
                    totalAtual: 0,
                    resultado: 0,
                    resultadoPercent: 0,
                    rendimentoMes: 0,
                    rendimentoAno: 0,
                    dividendosMes: 0,
                    scoreCarteira: 0,
                    itens: []
                })
                setLoading(false)
                return
            }

            // 1. Buscar cotações atuais
            const tickers = ativosRow.map(a => a.ticker)
            const { data: quoteRes } = await api.get(`/cotacoes?tickers=${tickers.join(',')}`)
            const quotes = quoteRes.data || {}

            let totalInvestido = 0
            let totalAtual = 0
            let somaDividendosEstimados = 0

            const itens: ItemCarteira[] = ativosRow.map(ativo => {
                const quoteInfo = quotes[ativo.ticker]
                const precoAtual = quoteInfo?.preco || ativo.preco_medio
                const posicaoInvestida = ativo.quantidade * ativo.preco_medio
                const posicaoAtual = ativo.quantidade * precoAtual

                totalInvestido += posicaoInvestida
                totalAtual += posicaoAtual

                // Cálculo simples de dividendos se DY disponível
                const dy = quoteInfo?.dy || 0
                if (dy > 0) {
                    somaDividendosEstimados += (dy / 100 / 12) * posicaoAtual
                }

                return {
                    supabaseId: ativo.id,
                    ticker: ativo.ticker,
                    nome: quoteInfo?.nome || ativo.ticker,
                    tipo: (ativo.tipo || 'acao').toUpperCase() as any,
                    quantidade: ativo.quantidade,
                    precoMedio: ativo.preco_medio,
                    precoAtual,
                    totalInvestido: posicaoInvestida,
                    totalAtual: posicaoAtual,
                    resultado: posicaoAtual - posicaoInvestida,
                    resultadoPercent: posicaoInvestida > 0 ? ((posicaoAtual - posicaoInvestida) / posicaoInvestida) * 100 : 0,
                    percentCarteira: 0,
                    dy
                }
            })

            itens.forEach(item => {
                item.percentCarteira = totalAtual > 0 ? (item.totalAtual / totalAtual) * 100 : 0
            })

            const resultado = totalAtual - totalInvestido
            const resultadoPercent = totalInvestido > 0 ? (resultado / totalInvestido) * 100 : 0

            setResumo(prev => ({
                ...prev,
                totalInvestido,
                totalAtual,
                resultado,
                resultadoPercent,
                rendimentoMes: resultadoPercent, // Pre-warm com rentabilidade total
                rendimentoAno: resultadoPercent, // Pre-warm com rentabilidade total
                dividendosMes: somaDividendosEstimados,
                itens
            }))

            // 2. Disparar Rentabilidades de Período (Assíncrono)
            fetchRentabilidadesPeriodo(user.id, itens)

        } catch (error) {
            console.error('❌ [useCarteiraResumo] Erro:', error)
        } finally {
            setLoading(false)
        }
    }, [user?.id])

    const fetchRentabilidadesPeriodo = async (userId: string, itens: ItemCarteira[]) => {
        if (itens.length === 0) return
        setLoadingPeriodo(true)
        try {
            const tickers = itens.map(i => i.ticker).join(',')
            const quantities = itens.map(i => i.quantidade).join(',')

            const [resMes, resAno] = await Promise.all([
                api.get(`/carteira/rentabilidade-periodo?tickers=${tickers}&quantities=${quantities}&periodo=mes&userId=${userId}`),
                api.get(`/carteira/rentabilidade-periodo?tickers=${tickers}&quantities=${quantities}&periodo=ano&userId=${userId}`)
            ])

            setResumo(prev => ({
                ...prev,
                rendimentoMes: resMes.data?.success ? resMes.data.data.rentabilidade : 0,
                rendimentoAno: resAno.data?.success ? resAno.data.data.rentabilidade : 0
            }))
        } catch (err) {
            console.warn('⚠️ [useCarteiraResumo] Falha ao carregar rentabilidades temporais')
        } finally {
            setLoadingPeriodo(false)
        }
    }

    const removerItem = useCallback(async (supabaseId: string | undefined, itemId: string) => {
        if (!supabaseId) return
        try {
            await api.delete(`/carteira/item/${supabaseId}`)
            fetchResumo()
        } catch (err) {
            console.error('Erro ao remover item:', err)
        }
    }, [fetchResumo])

    useEffect(() => {
        fetchResumo()
    }, [fetchResumo])

    return { resumo, loading, loadingPeriodo, refresh: fetchResumo, removerItem }
}
