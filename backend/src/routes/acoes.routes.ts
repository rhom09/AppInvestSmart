import { Router, Request, Response } from 'express'
import { brapiService, TICKERS_ACOES } from '../services/brapi.service'
import { scoreService } from '../services/score.service'
import { bcbService } from '../services/bcb.service'
import { awesomeService } from '../services/awesome.service'
import { supabaseAdmin } from '../services/supabase.service'

const router = Router()

// GET /api/acoes - listar todas as ações (paginado, servido do Supabase)
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 20
        const offset = (page - 1) * limit

        // Contar total
        const { count, error: countError } = await supabaseAdmin
            .from('cotacoes_cache')
            .select('*', { count: 'exact', head: true })
            .eq('tipo', 'acao')

        if (countError) throw countError

        const total = count || 0
        const totalPages = Math.ceil(total / limit)

        // Buscar página
        const { data, error } = await supabaseAdmin
            .from('cotacoes_cache')
            .select('*')
            .eq('tipo', 'acao')
            .order('score', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) throw error

        // Mapear snake_case → camelCase para manter compatibilidade com o frontend
        const acoes = (data || []).map(row => ({
            ticker: row.ticker,
            nome: row.nome,
            preco: row.preco,
            variacao: row.variacao,
            variacaoPercent: row.variacao_percent,
            pl: row.pl,
            pvp: row.pvp,
            dy: row.dy,
            roe: row.roe,
            margemLiquida: row.margem_liquida,
            score: row.score,
            setor: row.setor,
            segmento: row.segmento,
            marketCap: row.market_cap,
            atualizadoEm: row.atualizado_em
        }))

        res.json({
            success: true,
            data: acoes,
            total,
            page,
            totalPages,
            atualizadoEm: acoes[0]?.atualizadoEm || null
        })
    } catch (error: any) {
        console.error('Erro ao buscar ações do Supabase:', error.message)

        // Fallback: tentar buscar da Brapi caso Supabase falhe
        try {
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 20
            const total = TICKERS_ACOES.length
            const totalPages = Math.ceil(total / limit)
            const offset = (page - 1) * limit
            const pageTickers = TICKERS_ACOES.slice(offset, offset + limit)
            const acoes = await brapiService.buscarVariosAtivos(pageTickers)
            res.json({ success: true, data: acoes, total, page, totalPages, fonte: 'brapi-fallback' })
        } catch {
            res.status(500).json({ success: false, message: 'Erro ao buscar ações' })
        }
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
