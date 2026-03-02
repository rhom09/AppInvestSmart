import { Router } from 'express'
import { brapiService } from '../services/brapi.service'
import { scoreService } from '../services/score.service'

const router = Router()

// GET /api/acoes - listar todas as ações
router.get('/', async (_req, res) => {
    try {
        const acoes = await brapiService.listarAtivos()
        res.json({ success: true, data: acoes, total: acoes.length })
    } catch (error) {
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
        const score = scoreService.calcularScore(ativo)
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
        const indices = await brapiService.buscarIndices()
        res.json({ success: true, data: indices })
    } catch {
        res.status(500).json({ success: false, message: 'Erro ao buscar índices' })
    }
})

export { router as acoesRoutes }
