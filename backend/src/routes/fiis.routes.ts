import { Router, Request, Response } from 'express'
import { brapiService, TICKERS_FIIS } from '../services/brapi.service'

const router = Router()

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

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

        // Batch fetching in chunks of 8 for FIIs
        const chunks = chunkArray(pageTickers, 8)
        const batchResults = await Promise.all(
            chunks.map(chunk => brapiService.buscarVariosAtivos(chunk))
        )

        const fiis = batchResults.flat()

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
