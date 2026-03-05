import { Router, Request, Response } from 'express'
import { brapiService } from '../services/brapi.service'

const router = Router()

// GET /api/cotacoes?tickers=ITUB4,BBAS3,WEGE3
router.get('/', async (req: Request, res: Response) => {
    try {
        const tickersQuery = req.query.tickers as string
        if (!tickersQuery) {
            return res.status(400).json({ success: false, message: 'Parâmetro tickers é obrigatório' })
        }

        const tickersArray = tickersQuery.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)

        if (tickersArray.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum ticker válido fornecido' })
        }

        // Utiliza o método buscarVariosAtivos que já trata paginação/chunks limitados a 5 
        // pela API Brapi e já acopla Score e info do Fundamentus!
        const resultados = await brapiService.buscarVariosAtivos(tickersArray)

        // Converter array para um Map/Record para facilitar no frontend O(1)
        const cotacoesMap = resultados.reduce((acc: Record<string, any>, ativo: any) => {
            if (ativo && ativo.ticker) {
                acc[ativo.ticker] = {
                    preco: ativo.preco,
                    variacao: ativo.variacao,
                    variacaoPercent: ativo.variacaoPercent,
                    score: ativo.score,
                    nome: ativo.nome
                }
            }
            return acc
        }, {})

        res.json({ success: true, data: cotacoesMap })

    } catch (error) {
        console.error('Erro ao buscar cotações em massa:', error)
        res.status(500).json({ success: false, message: 'Erro ao buscar cotações' })
    }
})

export { router as cotacoesRoutes }
