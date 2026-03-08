import { Router, Request, Response } from 'express'
import { brapiService, TICKERS_ACOES } from '../services/brapi.service'
import { scoreService } from '../services/score.service'
import { bcbService } from '../services/bcb.service'
import { awesomeService } from '../services/awesome.service'

const router = Router()


function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

// GET /api/acoes - listar todas as ações (paginado)
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 20

        const total = TICKERS_ACOES.length
        const totalPages = Math.ceil(total / limit)
        const offset = (page - 1) * limit
        const pageTickers = TICKERS_ACOES.slice(offset, offset + limit)

        if (pageTickers.length === 0) {
            return res.json({ success: true, data: [], total, page, totalPages })
        }

        // Batch fetching - Reduzido para 1 pois o plano Free do Brapi limita a 1 ticker por request
        const chunks = chunkArray(pageTickers, 1)
        const batchResults = await Promise.all(
            chunks.map(chunk => brapiService.buscarVariosAtivos(chunk))
        )

        const acoes = batchResults.flat()

        res.json({
            success: true,
            data: acoes,
            total,
            page,
            totalPages
        })
    } catch (error) {
        console.error('Erro ao buscar ações paginadas:', error)
        res.status(500).json({ success: false, message: 'Erro ao buscar ações' })
    }
})

// GET /api/acoes/:ticker - detalhes de uma ação
router.get('/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params
        const ativo = await brapiService.buscarAtivo(ticker.toUpperCase())
        if (!ativo) {
            return res.status(404).json({ success: false, message: 'Ativo não encontrado' })
        }
        const score = ativo.score ?? scoreService.calcularScore(ativo)
        return res.json({ success: true, data: { ...ativo, score } })
    } catch {
        return res.status(500).json({ success: false, message: 'Erro ao buscar ativo' })
    }
})

// GET /api/acoes/:ticker/historico - histórico de preços
router.get('/:ticker/historico', async (req, res) => {
    try {
        const { ticker } = req.params
        const { periodo = '1mo' } = req.query
        const historico = await brapiService.buscarHistorico(ticker.toUpperCase(), String(periodo))
        return res.json({ success: true, data: historico })
    } catch {
        return res.status(500).json({ success: false, message: 'Erro ao buscar histórico' })
    }
})

// GET /api/acoes/market/indices - índices de mercado
router.get('/market/indices', async (_req, res) => {
    try {
        const [indices, ipca, selic, cdi, dolar] = await Promise.all([
            brapiService.buscarIndices(),
            bcbService.buscarIPCA12m(),
            bcbService.buscarSelic(),
            bcbService.buscarCDI(),
            awesomeService.buscarDolar()
        ])

        const completeIndices = [
            ...indices,
            { ticker: 'SELIC', name: 'SELIC', close: selic, variation: 0 },
            { ticker: 'CDI', name: 'CDI', close: cdi, variation: 0 },
            { ticker: 'IPCA', name: 'IPCA (12m)', close: ipca, variation: 0 },
            dolar
        ]

        res.json({ success: true, data: completeIndices })
    } catch {
        res.status(500).json({ success: false, message: 'Erro ao buscar índices' })
    }
})

// GET /api/acoes/:ticker/score-historico - histórico de scores
router.get('/:ticker/score-historico', async (req, res) => {
    try {
        const { ticker } = req.params
        // Neste exemplo o Supabase é importado caso não criemos um arquivo service, ou usamos fetch
        // Mas o correto é usar nosso supabase.service criado recentemente:
        const { supabaseAdmin } = await import('../services/supabase.service')

        const trintaDiasAtras = new Date()
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

        const { data, error } = await supabaseAdmin
            .from('scores_diarios')
            .select('data, score, preco')
            .eq('ticker', ticker.toUpperCase())
            .gte('data', trintaDiasAtras.toISOString().split('T')[0])
            .order('data', { ascending: true })

        if (error) throw error

        return res.json({ success: true, data })
    } catch (err: any) {
        console.error('Erro em /score-historico:', err.message || err)
        return res.status(500).json({ success: false, message: 'Erro ao buscar histórico de score' })
    }
})

export { router as acoesRoutes }
