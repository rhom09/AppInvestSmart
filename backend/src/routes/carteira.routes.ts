import { Router, Request, Response } from 'express'
import { brapiService } from '../services/brapi.service'
import { supabaseAdmin } from '../services/supabase.service'

const router = Router()

/**
 * GET /api/carteira/evolucao
 * Retorna a evolução do patrimônio total do usuário no tempo
 */
router.get('/evolucao', async (req: Request, res: Response) => {
    try {
        const { userId, periodo = '1mo' } = req.query

        if (!userId) {
            return res.status(400).json({ success: false, message: 'userId é obrigatório' })
        }

        // 1. Verificar Cache
        try {
            const { data: cacheEntry } = await supabaseAdmin
                .from('evolucao_cache')
                .select('*')
                .eq('usuario_id', userId)
                .eq('periodo', periodo)
                .maybeSingle()

            if (cacheEntry) {
                const lastUpdated = new Date(cacheEntry.updated_at)
                const diffHours = (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
                if (diffHours < 24) return res.json({ success: true, data: cacheEntry.payload_json })
            }
        } catch (e) {
            console.warn('⚠️ [EVOLUCAO] Erro cache:', (e as any).message)
        }

        // 2. Buscar ativos
        const { data: ativos, error: supabaseError } = await supabaseAdmin
            .from('carteira_ativos')
            .select('ticker, quantidade')
            .eq('usuario_id', userId)

        if (supabaseError || !ativos) return res.status(500).json({ success: false, message: 'Erro no banco' })
        if (ativos.length === 0) return res.json({ success: true, data: [] })

        const evolucaoPorData: Record<string, number> = {}
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        // 3. Buscar histórico
        for (const ativo of ativos) {
            try {
                const history = await brapiService.buscarHistorico(ativo.ticker, periodo as string)
                if (history && history.length > 0) {
                    history.forEach((day: any) => {
                        const dateKey = new Date(day.date * 1000).toISOString().split('T')[0]
                        evolucaoPorData[dateKey] = (evolucaoPorData[dateKey] || 0) + (day.close || 0) * ativo.quantidade
                    })
                }
            } catch (err) {
                console.warn(`Erro Brapi ${ativo.ticker}`)
            }
            await sleep(200)
        }

        const chartData = Object.entries(evolucaoPorData)
            .map(([date, value]) => ({
                data: date,
                patrimonio: value,
                label: new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            }))
            .sort((a, b) => a.data.localeCompare(b.data))

        if (chartData.length > 0) {
            const { error: upsertError } = await supabaseAdmin.from('evolucao_cache').upsert({
                usuario_id: userId,
                periodo: periodo,
                payload_json: chartData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'usuario_id,periodo' })

            if (upsertError) {
                console.error('💾 [EVOLUCAO] Erro ao salvar cache:', upsertError)
            } else {
                console.log('💾 [EVOLUCAO] Cache atualizado para usuário ', userId)
            }
        }

        res.json({ success: true, data: chartData })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno' })
    }
})

/**
 * GET /api/carteira/rentabilidade-periodo
 */
router.get('/rentabilidade-periodo', async (req: Request, res: Response) => {
    try {
        const { tickers, quantities, periodo, userId } = req.query

        if (!tickers || !quantities || !periodo || !userId) {
            return res.status(400).json({ success: false, message: 'Parâmetros incompletos' })
        }

        const tickerList = (tickers as string).split(',')
        const quantityList = (quantities as string).split(',').map(Number)
        const periodKey = `rent_${periodo}`
        const brapiPeriod = periodo === 'ano' ? '1y' : '1mo'

        // 1. Verificar Cache (6 horas)
        try {
            const { data: cacheEntry } = await supabaseAdmin
                .from('evolucao_cache')
                .select('*')
                .eq('usuario_id', userId)
                .eq('periodo', periodKey)
                .maybeSingle()

            if (cacheEntry && !(userId as string).includes('debug')) {
                const lastUpdated = new Date(cacheEntry.updated_at)
                const diffHours = (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
                if (diffHours < 6) return res.json({ success: true, data: cacheEntry.payload_json })
            }
        } catch (e) { }

        // 2. Buscar cotações
        const currentQuotes = await brapiService.buscarVariosAtivos(tickerList)
        let rentabilidadeAcumulada = 0
        let pesoTotalValido = 0
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        // 3. Calcular
        for (let i = 0; i < tickerList.length; i++) {
            const ticker = tickerList[i]
            const qtd = quantityList[i]
            const quote = currentQuotes.find(q => q.ticker === ticker)
            const precoAtual = quote?.preco || 0

            if (precoAtual === 0) continue
            const valorPosicao = precoAtual * qtd

            try {
                const history = await brapiService.buscarHistorico(ticker, brapiPeriod)
                if (history && history.length > 0) {
                    const precoInicio = history[0].close || history[0].open
                    if (precoInicio > 0) {
                        const variacao = ((precoAtual - precoInicio) / precoInicio) * 100
                        rentabilidadeAcumulada += variacao * valorPosicao
                        pesoTotalValido += valorPosicao
                    }
                }
            } catch (err) { }
            await sleep(200)
        }

        const rentabilidadeFinal = pesoTotalValido > 0 ? (rentabilidadeAcumulada / pesoTotalValido) : 0
        const result = { rentabilidade: rentabilidadeFinal }

        // 4. Salvar Cache
        if (!(userId as string).includes('debug')) {
            const { error: upsertError } = await supabaseAdmin.from('evolucao_cache').upsert({
                usuario_id: userId,
                periodo: periodKey,
                payload_json: result,
                updated_at: new Date().toISOString()
            }, { onConflict: 'usuario_id,periodo' })

            if (upsertError) {
                console.error(`💾 [RENT-PERIODO] Erro cache usuário ${userId}:`, upsertError)
            } else {
                console.log(`💾 [RENT-PERIODO] Cache salvo para usuário ${userId}`)
            }
        }

        res.json({ success: true, data: result })
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno' })
    }
})

export { router as carteiraRoutes }
