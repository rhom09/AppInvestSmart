import { Router, Request, Response } from 'express'
import { brapiService } from '../services/brapi.service'
import { bcbService } from '../services/bcb.service'
import { awesomeService } from '../services/awesome.service'

const router = Router()

/**
 * GET /api/mercado/indices
 * Retorna os principais índices de mercado: IBOVESPA, SELIC, IPCA, Dólar, CDI, IFIX
 */
router.get('/indices', async (_req: Request, res: Response) => {
    try {
        const [indices, ipca, selic, cdi, dolar] = await Promise.all([
            brapiService.buscarIndices(),
            bcbService.buscarIPCA12m(),
            bcbService.buscarSelicReal(),
            bcbService.buscarCDI(),
            awesomeService.buscarDolar()
        ])

        // Mapeamos os índices para o formato final solicitado
        const result = [
            indices.find(i => i.ticker === 'IBOV') || { ticker: 'IBOV', name: 'IBOVESPA', close: 0, variation: 0 },
            indices.find(i => i.ticker === 'IFIX') || { ticker: 'IFIX', name: 'IFIX', close: 0, variation: 0 },
            { ticker: 'SELIC', name: 'SELIC', close: selic, variation: 0 },
            { ticker: 'CDI', name: 'CDI', close: cdi, variation: 0 },
            { ticker: 'IPCA', name: 'IPCA (12m)', close: ipca, variation: 0 },
            dolar
        ]

        res.json({ success: true, data: result })
    } catch (error) {
        console.error('Erro ao buscar índices de mercado:', error)
        res.status(500).json({ success: false, message: 'Erro ao buscar índices' })
    }
})

export { router as mercadoRoutes }
