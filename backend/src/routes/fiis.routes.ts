import { Router, Request, Response } from 'express'
import { supabaseAdmin } from '../services/supabase.service'
import { TICKERS_FIIS } from '../utils/tickers'
import * as yahooService from '../services/yahoo.service'

const router = Router()

// GET /api/fiis - listar FIIs (paginado, servido do Supabase)
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1
        const limit = parseInt(req.query.limit as string) || 12
        const offset = (page - 1) * limit

        // Contar total
        const { count, error: countError } = await supabaseAdmin
            .from('cotacoes_cache')
            .select('*', { count: 'exact', head: true })
            .eq('tipo', 'fii')

        if (countError) throw countError

        const total = count || 0
        const totalPages = Math.ceil(total / limit)

        // Buscar página
        const { data, error } = await supabaseAdmin
            .from('cotacoes_cache')
            .select('*')
            .eq('tipo', 'fii')
            .order('score', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) throw error

        // Mapear snake_case → camelCase
        const fiis = (data || []).map(row => ({
            ticker: row.ticker,
            nome: row.nome,
            preco: row.preco,
            variacao: row.variacao,
            variacaoPercent: row.variacao_percent,
            pvp: row.pvp,
            dy: row.dy,
            dyMensal: row.dy_mensal,
            vacancia: row.vacancia,
            score: row.score,
            segmento: row.segmento,
            marketCap: row.market_cap,
            atualizadoEm: row.atualizado_em
        }))

        res.json({
            success: true,
            data: fiis,
            total,
            page,
            totalPages,
            atualizadoEm: fiis[0]?.atualizadoEm || null
        })
    } catch (error: any) {
        console.error('Erro ao buscar FIIs do Supabase:', error.message)

        // Fallback p/ Yahoo Finance
        try {
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 12
            const total = TICKERS_FIIS.length
            const totalPages = Math.ceil(total / limit)
            const offset = (page - 1) * limit
            const pageTickers = TICKERS_FIIS.slice(offset, offset + limit)
            const fiis = await yahooService.buscarCotacoesBatch(pageTickers)
            res.json({ success: true, data: fiis, total, page, totalPages, fonte: 'yahoo-fallback' })
        } catch {
            res.status(500).json({ success: false, message: 'Erro ao buscar FIIs' })
        }
    }
})

export { router as fiisRoutes }
