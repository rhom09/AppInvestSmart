import { Router, Request, Response } from 'express'
import { brapiService } from '../services/brapi.service'

const router = Router()

/**
 * GET /api/carteira/rentabilidade
 * Calcula a rentabilidade ponderada da carteira para um período (mes ou ano)
 * Query: tickers=ITUB4,WEGE3&weights=0.6,0.4&periodo=mes|ano
 */
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
