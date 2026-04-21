import { Router } from 'express'
import { executarAtualizacaoMercado, atualizarCotacoesCache } from '../cron/market-update.cron'
import { cacheService } from '../services/cache.service'

const adminRoutes = Router()

// Middleware de autenticação simples pro admin
adminRoutes.use((req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.key
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ success: false, message: 'Não autorizado. Forneça uma API_KEY válida.' })
    }
    next()
})

// POST /api/admin/atualizar - atualizar scores e indicados
adminRoutes.post('/atualizar', async (req, res) => {
    try {
        const resultado = await executarAtualizacaoMercado()
        if (resultado.success) {
            return res.json(resultado)
        } else {
            return res.status(500).json(resultado)
        }
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message })
    }
})

// POST /api/admin/refresh-cotacoes - popular/atualizar cotacoes_cache no Supabase
adminRoutes.post('/refresh-cotacoes', async (req, res) => {
    const { modo, grupo, tickers } = req.query as any

    try {
        console.log(`🔄 [ADMIN] Refresh manual disparado. Modo: ${modo || 'padrão'}, Grupo: ${grupo || 'N/A'}, Tickers: ${tickers || 'N/A'}`)

        // Modo SEED: Carga completa em grupos (Assíncrona para não dar timeout)
        if (modo === 'seed') {
            const { modoSeedRefresh } = require('../cron/market-update.cron')
            modoSeedRefresh() // Roda em background
            return res.json({
                success: true,
                message: '🚀 Modo SEED iniciado em background. Acompanhe os logs do servidor (~20-30 min).'
            })
        }

        // Tickers específicos (?tickers=VALE3,PETR4)
        if (tickers) {
            const tickerList = tickers.split(',').map((t: string) => t.trim().toUpperCase())
            const result = await atualizarCotacoesCache(tickerList)
            return res.json(result)
        }

        // Grupo específico (?grupo=0)
        if (grupo !== undefined) {
            const { GRUPOS } = require('../cron/market-update.cron')
            const index = parseInt(grupo)
            if (isNaN(index) || index < 0 || index >= GRUPOS.length) {
                return res.status(400).json({ error: `Grupo inválido. Use de 0 a ${GRUPOS.length - 1}` })
            }
            const result = await atualizarCotacoesCache(GRUPOS[index])
            return res.json(result)
        }

        // Default: Refresh de tudo com logs detalhados de progresso
        console.log(`🚀 [ADMIN] Iniciando refresh completo de todos os ativos...`)
        const inicioTotal = Date.now()

        // Importar aqui para evitar circular dependencies
        const { TODOS_TICKERS, chunkArray } = require('../cron/market-update.cron')
        const { buscarCotacoesBatch } = require('../services/yahoo.service')
        const { fundamentusService } = require('../services/fundamentus.service')
        const { supabaseAdmin } = require('../services/supabase.service')
        const { scoreService } = require('../services/score.service')
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        const uniqueAcoes = [...new Set(TODOS_TICKERS.filter((t: string) =>
            require('../utils/tickers').TICKERS_ACOES.includes(t)))]
        const uniqueFIIs = [...new Set(TODOS_TICKERS.filter((t: string) =>
            require('../utils/tickers').TICKERS_FIIS.includes(t)))]
        const allTickersToFetch = [...uniqueAcoes, ...uniqueFIIs]

        console.log(`📊 Total de ativos para processar: ${allTickersToFetch.length}`)

        // Pre-fetch Fundamentus para DY, PVP, ROE etc. (como Yahoo não tem tudo perfeitamente para FIIs)
        console.log(`🔍 [ADMIN] Pré-buscando dados fundamentais...`)
        const fundAcoes = await fundamentusService.scrapingAcoes()
        const fundFIIs = await fundamentusService.scrapingFIIs()

        let successCount = 0
        let failCount = 0
        let processedCount = 0

        // Fetch batch (Yahoo Finance supports large arrays, but we can do it in one go if < 500)
        const lotes = chunkArray(allTickersToFetch, 50)
        const totalLotes = lotes.length

        for (let i = 0; i < lotes.length; i++) {
            const lote = lotes[i]
            const loteInicio = Date.now()

            console.log(`📦 [ADMIN] Processando lote ${i + 1}/${totalLotes} (${lote.length} ativos)...`)

            const cotacoes = await buscarCotacoesBatch(lote)

            for (const c of cotacoes) {
                const isFii = uniqueFIIs.includes(c.ticker)
                const fundAcao = fundAcoes.find((a: any) => a.ticker === c.ticker)
                const fundFII = fundFIIs.find((f: any) => f.ticker === c.ticker)

                // ANTES de fazer o upsert na cotacoes_cache, verificar:
                if (!c || c.preco == null || c.preco <= 0) {
                    console.log(`[ADMIN SKIP] ${c.ticker} sem preço válido (${c?.preco}), mantendo cache anterior`)
                    continue
                }

                // Combinar Yahoo + Fundamentus
                const mappedData = {
                    ticker: c.ticker,
                    nome: c.nome,
                    preco: c.preco,
                    variacao: c.variacao,
                    variacao_percent: c.variacaoPercent,
                    pl: isFii ? null : (fundAcao ? fundAcao.pl : c.pl),
                    pvp: fundAcao ? fundAcao.pvp : (fundFII ? fundFII.pvp : c.pvp),
                    dy: fundAcao ? fundAcao.dy : (fundFII ? fundFII.dy : c.dy),
                    roe: isFii ? null : (fundAcao ? fundAcao.roe : c.roe),
                    margem_liquida: isFii ? null : (fundAcao ? fundAcao.margemLiquida : c.margemLiquida),
                    dy_mensal: isFii ? (fundFII ? fundFII.dy / 12 : (c.dy ? c.dy / 12 : null)) : null,
                    vacancia: isFii ? (fundFII ? fundFII.vacancia : null) : null,
                    setor: !isFii ? (require('../cron/market-update.cron').MAP_SETORES[c.ticker] || 'OUTROS') : null,
                    segmento: isFii ? (require('../cron/market-update.cron').MAP_SEGMENTOS[c.ticker] || fundFII?.segmento || 'OUTROS') : null,
                    market_cap: c.marketCap,
                    tipo: isFii ? 'fii' : 'acao'
                }

                const score = scoreService.calcularScore({
                    ...mappedData,
                    variacaoPercent: mappedData.variacao_percent,
                    margemLiquida: mappedData.margem_liquida,
                    dyMensal: mappedData.dy_mensal,
                    marketCap: mappedData.market_cap
                })

                const finalData = {
                    ...mappedData,
                    score,
                    atualizado_em: new Date().toISOString()
                }

                const { error } = await supabaseAdmin.from('cotacoes_cache').upsert(finalData, { onConflict: 'ticker' })
                if (error) {
                    console.error(`❌ [ADMIN] Erro ao salvar ${c.ticker}:`, error.message)
                    failCount++
                } else {
                    successCount++
                }

                processedCount++

                // Log de progresso a cada 10 ativos processados
                if (processedCount % 10 === 0) {
                    const progresso = Math.round((processedCount / allTickersToFetch.length) * 100)
                    const decorrido = (Date.now() - inicioTotal) / 1000
                    const estimadoTotal = (decorrido / processedCount) * allTickersToFetch.length
                    const restante = estimadoTotal - decorrido

                    console.log(`📈 [ADMIN] Progresso: ${processedCount}/${allTickersToFetch.length} (${progresso}%) - ` +
                               `Decorridos: ${decorrido.toFixed(1)}s - Estimado restante: ${restante.toFixed(1)}s`)
                }
            }

            const loteFim = Date.now()
            const loteDuracao = ((loteFim - loteInicio) / 1000).toFixed(1)
            console.log(`✅ [ADMIN] Lote ${i + 1}/${totalLotes} concluído em ${loteDuracao}s`)

            // Delay entre lotes (exceto no último)
            if (i < lotes.length - 1) {
                console.log(`⏳ [ADMIN] Aguardando 1s antes do próximo lote...`)
                await sleep(1000) // 1s entre lotes de 50
            }
        }

        const fimTotal = Date.now()
        const tempoTotal = ((fimTotal - inicioTotal) / 1000).toFixed(1)
        const logMsg = `✅ [ADMIN] Refresh completo concluído: ${successCount} salvos, ${failCount} falhas em ${tempoTotal}s`
        console.log(logMsg)

        return res.json({
            success: true,
            message: logMsg,
            saved: successCount,
            failed: failCount,
            total_processed: processedCount,
            duration_seconds: parseFloat(tempoTotal)
        })

    } catch (error: any) {
        console.error('❌ Erro no refresh manual:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

// DELETE /api/admin/limpar-cache - limpar cache em memória
adminRoutes.delete('/limpar-cache', (req, res) => {
    try {
        cacheService.flush()
        console.log('🧹 [ADMIN] Cache global limpo via dashboard/api')
        return res.json({ success: true, message: 'Cache em memória limpo com sucesso' })
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message })
    }
})

export { adminRoutes }
