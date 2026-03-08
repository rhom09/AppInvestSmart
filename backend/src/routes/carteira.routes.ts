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

        console.log(`\n🔍 [EVOLUCAO] ===== Nova requisição =====`)
        console.log(`🔍 [EVOLUCAO] userId: ${userId || 'NÃO INFORMADO'}`)
        console.log(`🔍 [EVOLUCAO] periodo: ${periodo}`)
        console.log(`🔍 [EVOLUCAO] query params completos:`, JSON.stringify(req.query))

        if (!userId) {
            console.log(`❌ [EVOLUCAO] userId ausente — retornando 400`)
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
                console.log(`💾 [EVOLUCAO] Cache encontrado — idade: ${diffHours.toFixed(2)}h — payload length: ${JSON.stringify(cacheEntry.payload_json)?.length}`)

                // FORCE CACHE BYPASS TO FLUSH OLD WEEKLY/MONTHLY DATA
                if (diffHours < -1) { // Forced false condition to bypass cache
                    const cachedResponse = cacheEntry.payload_json

                    // Suporta tanto o formato antigo (array) quanto o novo (objeto { data, aviso })
                    if (Array.isArray(cachedResponse)) {
                        console.log(`✅ [EVOLUCAO] Retornando do cache (formato antigo) — ${cachedResponse.length} pontos`)
                        return res.json({ success: true, data: cachedResponse })
                    } else {
                        console.log(`✅ [EVOLUCAO] Retornando do cache — ${cachedResponse.data?.length ?? 0} pontos`)
                        return res.json({ success: true, data: cachedResponse.data, aviso: cachedResponse.aviso })
                    }
                } else {
                    console.log(`🕐 [EVOLUCAO] Cache forçosamente expirado (${diffHours.toFixed(2)}h) — buscando dados frescos`)
                }
            } else {
                console.log(`💾 [EVOLUCAO] Nenhum cache encontrado para userId=${userId} periodo=${periodo}`)
            }
        } catch (e) {
            console.warn('⚠️ [EVOLUCAO] Erro cache:', (e as any).message)
        }

        // 2. Buscar ativos
        const { data: ativos, error: supabaseError } = await supabaseAdmin
            .from('carteira_ativos')
            .select('ticker, quantidade, data_compra')
            .eq('user_id', userId)

        console.log(`📦 [EVOLUCAO] Supabase error: ${supabaseError?.message || 'nenhum'}`)
        console.log(`📦 [EVOLUCAO] Ativos encontrados no Supabase: ${ativos?.length ?? 0}`)

        let oldestPurchaseDate = new Date()

        if (ativos && ativos.length > 0) {
            ativos.forEach(a => {
                console.log(`   - ${a.ticker} (qtd: ${a.quantidade}, data_compra: ${a.data_compra})`)
                if (a.data_compra) {
                    const dt = new Date(a.data_compra)
                    if (dt < oldestPurchaseDate) {
                        oldestPurchaseDate = dt
                    }
                }
            })
        }

        if (supabaseError || !ativos) {
            console.log(`❌ [EVOLUCAO] Erro Supabase — abortando`)
            return res.status(500).json({ success: false, message: 'Erro no banco' })
        }
        if (ativos.length === 0) {
            console.log(`⚠️ [EVOLUCAO] Nenhum ativo na carteira — retornando []`)
            return res.json({ success: true, data: [] })
        }

        // Truncate time info from oldest purchase date for comparison
        oldestPurchaseDate.setHours(0, 0, 0, 0)
        console.log(`📅 [EVOLUCAO] Data de compra mais antiga: ${oldestPurchaseDate.toISOString()}`)

        const evolucaoPorData: Record<string, number> = {}
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        // 3. Buscar histórico
        console.log(`🌐 [EVOLUCAO] Buscando histórico Brapi para ${ativos.length} ativos...`)

        let truncated = false

        for (const ativo of ativos) {
            try {
                console.log(`  → [BRAPI] Buscando ${ativo.ticker} periodo=${periodo}...`)
                const history = await brapiService.buscarHistorico(ativo.ticker, periodo as string)
                console.log(`  ← [BRAPI] ${ativo.ticker}: ${history?.length ?? 0} pontos retornados`)
                if (history && history.length > 0) {
                    console.log(`     Primeiro: date=${history[0].date} close=${history[0].close}`)
                    console.log(`     Último:   date=${history[history.length - 1].date} close=${history[history.length - 1].close}`)
                    history.forEach((day: any) => {
                        const dayDate = new Date(day.date * 1000)

                        if (dayDate < oldestPurchaseDate) {
                            truncated = true
                            return // Skip dates before oldest purchase
                        }

                        const dateKey = dayDate.toISOString().split('T')[0]
                        evolucaoPorData[dateKey] = (evolucaoPorData[dateKey] || 0) + (day.close || 0) * ativo.quantidade
                    })
                } else {
                    console.warn(`  ⚠️ [BRAPI] ${ativo.ticker}: histórico vazio ou null`)
                }
            } catch (err: any) {
                console.error(`  ❌ [BRAPI] ${ativo.ticker}: ERRO — ${err.message}`)
            }
            await sleep(200)
        }

        const aviso = truncated ? `Exibindo desde ${oldestPurchaseDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}, data da primeira compra` : undefined

        const chartData = Object.entries(evolucaoPorData)
            .map(([date, value]) => ({
                data: date,
                patrimonio: value,
                label: new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
            }))
            .sort((a, b) => a.data.localeCompare(b.data))

        console.log(`📊 [EVOLUCAO] chartData gerado: ${chartData.length} pontos`)
        if (chartData.length > 0) {
            console.log(`   Primeiro: ${chartData[0].data} | R$ ${chartData[0].patrimonio.toFixed(2)}`)
            console.log(`   Último:   ${chartData[chartData.length - 1].data} | R$ ${chartData[chartData.length - 1].patrimonio.toFixed(2)}`)
        } else {
            console.warn(`⚠️ [EVOLUCAO] chartData vazio — nada para exibir no gráfico`)
        }

        if (chartData.length > 0) {
            const { error: upsertError } = await supabaseAdmin.from('evolucao_cache').upsert({
                usuario_id: userId,
                periodo: periodo,
                payload_json: { data: chartData, aviso },
                updated_at: new Date().toISOString()
            }, { onConflict: 'usuario_id,periodo' })

            if (upsertError) {
                console.error('💾 [EVOLUCAO] Erro ao salvar cache:', upsertError)
            } else {
                console.log('💾 [EVOLUCAO] Cache atualizado para usuário ', userId)
            }
        }

        console.log(`✅ [EVOLUCAO] Retornando ${chartData.length} pontos\n`)
        res.json({ success: true, data: chartData, aviso })
    } catch (error: any) {
        console.error(`❌ [EVOLUCAO] Erro inesperado:`, error.message || error)
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
