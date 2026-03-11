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

        // Default: Refresh de tudo (CUIDADO: pode dar rate limit)
        const result = await atualizarCotacoesCache()
        res.json(result)
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
