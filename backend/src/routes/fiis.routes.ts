import { Router, Request, Response } from 'express'
import { brapiService, TICKERS_FIIS } from '../services/brapi.service'

const router = Router()


// GET /api/fiis - listar FIIs (paginado)
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 12

        const total = TICKERS_FIIS.length
        const totalPages = Math.ceil(total / limit)
        const offset = (page - 1) * limit
        const pageTickers = TICKERS_FIIS.slice(offset, offset + limit)

        if (pageTickers.length === 0) {
            return res.json({ success: true, data: [], total, page, totalPages })
        }

        // Busca os FIIs da página (o serviço já trata o rate limit com chunks e delay)
        const fiis = await brapiService.buscarVariosAtivos(pageTickers)

        res.json({
            success: true,
            data: fiis,
            total,
            page,
            totalPages
        })
    } catch (error) {
        console.error('Erro ao buscar FIIs paginados:', error)
        res.status(500).json({ success: false, message: 'Erro ao buscar FIIs' })
    }
})

export { router as fiisRoutes }
