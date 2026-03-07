import { Router, Request, Response } from 'express'
import { brapiService } from '../services/brapi.service'
import { supabaseAdmin } from '../services/supabase.service'

const router = Router()

/**
 * GET /api/carteira/evolucao
 * Retorna a evolução do patrimônio total do usuário no tempo
 * Query: userId=uuid&periodo=1mo|3mo|6mo|1y
 */
router.get('/evolucao', async (req: Request, res: Response) => {
    try {
        const { userId, periodo = '1mo' } = req.query

        if (!userId) {
            console.error('❌ [EVOLUCAO] userId ausente na requisição')
            return res.status(400).json({ success: false, message: 'userId é obrigatório' })
        }

        console.log(`📈 [EVOLUCAO] Iniciando para usuário ${userId} (${periodo})`)

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

                if (diffHours < 24) {
                    console.log(`✅ [EVOLUCAO] Servindo do cache (${diffHours.toFixed(1)}h)`)
                    return res.json({ success: true, data: cacheEntry.payload_json })
                }
            }
        } catch (e) {
            console.warn('⚠️ [EVOLUCAO] Erro ao consultar cache:', (e as any).message)
        }

        // 2. Buscar ativos do Supabase
        const { data: ativos, error: supabaseError } = await supabaseAdmin
            .from('carteira_ativos')
            .select('ticker, quantidade')
            .eq('usuario_id', userId)

        if (supabaseError) {
            console.error('❌ [EVOLUCAO] Erro ao buscar ativos no Supabase:', supabaseError)
            return res.status(500).json({ success: false, message: 'Erro interno no banco de dados' })
        }

        if (!ativos || ativos.length === 0) return res.json({ success: true, data: [] })

        const evolucaoPorData: Record<string, number> = {}
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        // 3. Buscar histórico Brapi
        for (const ativo of ativos) {
            try {
                process.stdout.write(`   - Buscando Brapi [${userId}]: ${ativo.ticker}... `)
                const history = await brapiService.buscarHistorico(ativo.ticker, periodo as string)

                if (history && history.length > 0) {
                    console.log(`✅ (${history.length} pts)`)
                    history.forEach((day: any) => {
                        const dateKey = new Date(day.date * 1000).toISOString().split('T')[0]
                        const valorNaData = (day.close || 0) * ativo.quantidade
                        evolucaoPorData[dateKey] = (evolucaoPorData[dateKey] || 0) + valorNaData
                    })
                } else {
                    console.log('⚠️ (Vazio)')
                }
            } catch (err) {
                console.log(`❌ Erro Brapi: ${(err as any).message}`)
            }
            await sleep(200)
        }

        // 4. Formatar dados
        const chartData = Object.entries(evolucaoPorData)
            .map(([date, value]) => ({
                data: date,
                patrimonio: value,
                label: new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            }))
            .sort((a, b) => a.data.localeCompare(b.data))

        // 5. Salvar Cache se houver dados
        if (chartData.length > 0) {
            supabaseAdmin.from('evolucao_cache').upsert({
                usuario_id: userId,
                periodo: periodo,
                payload_json: chartData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'usuario_id,periodo' }).then(({ error }) => {
                if (!error) console.log('💾 [EVOLUCAO] Cache atualizado para usuário ', userId)
            })
        }

        res.json({ success: true, data: chartData })
    } catch (error) {
        console.error('❌ [EVOLUCAO] Erro Crítico:', error)
        res.status(500).json({ success: false, message: 'Erro interno no servidor' })
    }
})

/**
 * GET /api/carteira/rentabilidade-periodo
 * Calcula a rentabilidade ponderada de uma lista de ativos em um período (mes|ano)
 * Usa Brapi para histórico e cotação atual. Cache de 6h.
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

        console.log(`📊 [RENT-PERIODO] Iniciando para usuário ${userId} (${periodo})`)

        // 1. Verificar Cache (6 horas)
        try {
            const { data: cacheEntry } = await supabaseAdmin
                .from('evolucao_cache')
                .select('*')
                .eq('usuario_id', userId)
                .eq('periodo', periodKey)
                .maybeSingle()

            if (cacheEntry) {
                const lastUpdated = new Date(cacheEntry.updated_at)
                const diffHours = (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
                if (diffHours < 6) {
                    console.log(`✅ [RENT-PERIODO] Cache atingido (${diffHours.toFixed(1)}h)`)
                    return res.json({ success: true, data: cacheEntry.payload_json })
                }
            }
        } catch (e) {
            console.warn('⚠️ [RENT-PERIODO] Erro cache:', (e as any).message)
        }

        // 2. Buscar cotações atuais (Bulk)
        const currentQuotes = await brapiService.buscarVariosAtivos(tickerList)

        let rentabilidadeAcumulada = 0
        let pesoTotalValido = 0
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        // 3. Calcular para cada ativo
        for (let i = 0; i < tickerList.length; i++) {
            const ticker = tickerList[i]
            const qtd = quantityList[i]
            const quote = currentQuotes.find(q => q.symbol === ticker)
            const precoAtual = quote?.regularMarketPrice || 0

            console.log(`   - [${ticker}] Preço Atual: ${precoAtual}, Qtd: ${qtd}`)

            if (precoAtual === 0) {
                console.warn(`   ⚠️ [${ticker}] Preço atual zero, pulando...`)
                continue
            }

            const valorPosicao = precoAtual * qtd

            try {
                const history = await brapiService.buscarHistorico(ticker, brapiPeriod)
                console.log(`   - [${ticker}] Histórico recebido: ${history?.length || 0} pontos`)

                if (history && history.length > 0) {
                    const first = history[0]
                    const last = history[history.length - 1]
                    const pPrimeiro = first.close || first.open
                    const pUltimo = last.close || last.open
                    const dPrimeiro = new Date(first.date * 1000).toISOString().split('T')[0]
                    const dUltimo = new Date(last.date * 1000).toISOString().split('T')[0]

                    console.log(`   - [${ticker}] P_Inicio(0) em ${dPrimeiro}: ${pPrimeiro}`)
                    console.log(`   - [${ticker}] P_Fim(last) em ${dUltimo}: ${pUltimo}`)

                    const precoInicio = pPrimeiro
                    if (precoInicio > 0) {
                        const variacao = ((precoAtual - precoInicio) / precoInicio) * 100
                        console.log(`   - [${ticker}] Variação: ${variacao.toFixed(2)}%`)
                        rentabilidadeAcumulada += variacao * valorPosicao
                        pesoTotalValido += valorPosicao
                    }
                } else {
                    console.warn(`   ⚠️ [${ticker}] Histórico vazio para ${ticker}`)
                }
            } catch (err) {
                console.error(`   ❌ [${ticker}] Erro histórico:`, (err as any).message)
            }
            await sleep(200) // Delay para evitar bloqueio Brapi
        }

        const rentabilidadeFinal = pesoTotalValido > 0 ? (rentabilidadeAcumulada / pesoTotalValido) : 0
        console.log(`🎯 [RENT-PERIODO] Resultado Final: ${rentabilidadeFinal}% (Peso Total: ${pesoTotalValido})`)
        const result = { rentabilidade: rentabilidadeFinal }

        // 4. Salvar Cache
        supabaseAdmin.from('evolucao_cache').upsert({
            usuario_id: userId,
            periodo: periodKey,
            payload_json: result,
            updated_at: new Date().toISOString()
        }, { onConflict: 'usuario_id,periodo' }).then(() => {
            console.log(`💾 [RENT-PERIODO] Cache salvo para usuário ${userId}`)
        })

        res.json({ success: true, data: result })
    } catch (error) {
        console.error('❌ [RENT-PERIODO] Erro:', error)
        res.status(500).json({ success: false, message: 'Erro interno no cálculo' })
    }
})

export { router as carteiraRoutes }
