import { Router, Request, Response } from 'express'
import { brapiService } from '../services/brapi.service'
import { supabaseAdmin } from '../services/supabase.service'

const router = Router()

/**
 * GET /api/carteira/rentabilidade
 * Calcula a rentabilidade ponderada da carteira para um período (mes ou ano)
 * Query: tickers=ITUB4,WEGE3&weights=0.6,0.4&periodo=mes|ano
 */
router.get('/rentabilidade', async (req: Request, res: Response) => {
    // ... existing code ...
})

/**
 * GET /api/carteira/evolucao
 * Retorna a evolução do patrimônio total do usuário no tempo
 * Query: userId=uuid&periodo=1mo|3mo|6mo|1y
 */
router.get('/evolucao', async (req: Request, res: Response) => {
    try {
        const { userId, periodo = '1mo' } = req.query

        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId é obrigatório' })
        }

        console.log(`📈 [EVOLUCAO] Buscando ativos do usuário ${userId}`)

        // 1. Buscar ativos do Supabase
        const { data: ativos, error: supabaseError } = await supabaseAdmin
            .from('carteira_ativos')
            .select('ticker, quantidade')
            .eq('usuario_id', userId)

        if (supabaseError) {
            console.error('❌ [SUPABASE] Erro ao buscar ativos:', supabaseError)
            return res.status(500).json({ success: false, message: 'Erro ao buscar ativos na carteira' })
        }

        if (!ativos || ativos.length === 0) {
            return res.json({ success: true, data: [] })
        }

        console.log(`🔍 [EVOLUCAO] Calculando para ${ativos.length} ativos (Período: ${periodo})`)

        const evolucaoPorData: Record<string, number> = {}
        const PROMISES_PER_CHUNK = 5

        // 2. Buscar histórico para cada ticker
        for (let i = 0; i < ativos.length; i += PROMISES_PER_CHUNK) {
            const chunk = ativos.slice(i, i + PROMISES_PER_CHUNK)
            const chunkPromises = chunk.map(async (ativo) => {
                const history = await brapiService.buscarHistorico(ativo.ticker, periodo as string)
                return { ticker: ativo.ticker, quantidade: ativo.quantidade, history }
            })

            const results = await Promise.all(chunkPromises)

            results.forEach(({ quantidade, history }) => {
                if (!history) return

                history.forEach((day: any) => {
                    // Brapi historical data has 'date' as unix timestamp
                    const dateObj = new Date(day.date * 1000)
                    const dateKey = dateObj.toISOString().split('T')[0]

                    const valorNaData = (day.close || 0) * quantidade
                    evolucaoPorData[dateKey] = (evolucaoPorData[dateKey] || 0) + valorNaData
                })
            })
        }

        // 3. Converter para array formatado e ordenar
        const chartData = Object.entries(evolucaoPorData)
            .map(([date, value]) => ({
                data: date,
                patrimonio: value,
                // Nome amigável para o XAxis do Recharts (ex: 05/03)
                label: new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            }))
            .sort((a, b) => a.data.localeCompare(b.data))

        res.json({
            success: true,
            data: chartData
        })
    } catch (error) {
        console.error('❌ [EVOLUCAO] Erro catastrófico:', error)
        res.status(500).json({ success: false, message: 'Erro interno ao processar evolução patrimonial' })
    }
})
router.get('/rentabilidade', async (req: Request, res: Response) => {
    try {
        const { tickers, weights, periodo } = req.query

        if (!tickers || !weights) {
            return res.status(400).json({ success: false, message: 'Tickers e pesos são obrigatórios' })
        }

        const tickerList = (tickers as string).split(',')
        const weightList = (weights as string).split(',').map(Number)
        const range = periodo === 'ano' ? '1y' : '1mo'

        if (tickerList.length !== weightList.length) {
            return res.status(400).json({ success: false, message: 'Quantidade de tickers e pesos não coincide' })
        }

        console.log(`📊 [RENTABILIDADE] Calculando para ${tickerList.length} ativos (Período: ${periodo})`)

        const PROMISES_PER_CHUNK = 5
        const rentabilidades: number[] = []

        // Processar em chunks para respeitar limites da Brapi (mesma lógica do buscarVariosAtivos)
        for (let i = 0; i < tickerList.length; i += PROMISES_PER_CHUNK) {
            const chunk = tickerList.slice(i, i + PROMISES_PER_CHUNK)
            const chunkPromises = chunk.map(ticker => brapiService.buscarHistorico(ticker, range))
            const histories = await Promise.all(chunkPromises)

            histories.forEach((history, idx) => {
                const tickerIdx = i + idx
                if (!history || history.length < 2) {
                    rentabilidades[tickerIdx] = 0
                    return
                }

                // Brapi retorna do mais antigo para o mais novo
                const precoBase = history[0].close
                const precoAtual = history[history.length - 1].close

                if (precoBase > 0) {
                    const rentab = ((precoAtual - precoBase) / precoBase) * 100
                    rentabilidades[tickerIdx] = rentab
                } else {
                    rentabilidades[tickerIdx] = 0
                }
            })
        }

        // Média ponderada
        let rentabilidadeCarteira = 0
        const pesoTotal = weightList.reduce((acc, w) => acc + w, 0)

        if (pesoTotal > 0) {
            rentabilidadeCarteira = weightList.reduce((acc, weight, idx) => {
                return acc + (rentabilidades[idx] * (weight / pesoTotal))
            }, 0)
        }

        res.json({
            success: true,
            data: {
                periodo,
                rentabilidade: rentabilidadeCarteira,
                detalhes: tickerList.map((t, i) => ({ ticker: t, rentabilidade: rentabilidades[i], peso: weightList[i] }))
            }
        })
    } catch (error) {
        console.error('Erro ao calcular rentabilidade da carteira:', error)
        res.status(500).json({ success: false, message: 'Erro ao calcular rentabilidade' })
    }
})

export { router as carteiraRoutes }
