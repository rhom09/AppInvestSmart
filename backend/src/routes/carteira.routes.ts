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
            console.error('❌ [EVOLUCAO] userId ausente')
            return res.status(400).json({ success: false, message: 'userId é obrigatório' })
        }

        console.log(`📈 [EVOLUCAO] Iniciando para usuário ${userId} (${periodo})`)

        // 1. Verificar Cache
        try {
            const { data: cacheEntry, error: cacheError } = await supabaseAdmin
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
            console.warn('⚠️ [EVOLUCAO] Ignorando falha no cache:', (e as any).message)
        }

        // 2. Buscar ativos
        const { data: ativos, error: supabaseError } = await supabaseAdmin
            .from('carteira_ativos')
            .select('ticker, quantidade')
            .eq('usuario_id', userId)

        if (supabaseError) {
            console.error('❌ [EVOLUCAO] Erro Supabase:', supabaseError)
            return res.status(500).json({ success: false, message: 'Erro ao buscar ativos' })
        }

        if (!ativos || ativos.length === 0) return res.json({ success: true, data: [] })

        const evolucaoPorData: Record<string, number> = {}
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        // 3. Buscar histórico
        for (const ativo of ativos) {
            try {
                process.stdout.write(`   - Buscando Brapi: ${ativo.ticker}... `)
                const history = await brapiService.buscarHistorico(ativo.ticker, periodo as string)

                if (history && history.length > 0) {
                    console.log(`✅ (${history.length} pts)`)
                    history.forEach((day: any) => {
                        const dateObj = new Date(day.date * 1000)
                        const dateKey = dateObj.toISOString().split('T')[0]
                        const valorNaData = (day.close || 0) * ativo.quantidade
                        evolucaoPorData[dateKey] = (evolucaoPorData[dateKey] || 0) + valorNaData
                    })
                } else {
                    console.log('⚠️ (Vazio)')
                }
            } catch (err) {
                console.log(`❌ Erro: ${(err as any).message}`)
            }
            await sleep(200)
        }

        // 4. Formatar e Garantir 2 pontos
        let chartData = Object.entries(evolucaoPorData)
            .map(([date, value]) => ({
                data: date,
                patrimonio: value,
                label: new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            }))
            .sort((a, b) => a.data.localeCompare(b.data))

        if (chartData.length === 1) {
            const unico = chartData[0]
            const dataBase = new Date(new Date(unico.data).getTime() - (24 * 60 * 60 * 1000)).toISOString().split('T')[0]
            chartData.unshift({
                data: dataBase,
                patrimonio: unico.patrimonio,
                label: new Date(dataBase + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            })
        }

        // 5. Salvar Cache
        if (chartData.length > 0) {
            supabaseAdmin.from('evolucao_cache').upsert({
                usuario_id: userId,
                periodo: periodo,
                payload_json: chartData,
                updated_at: new Date().toISOString()
            }, { onConflict: 'usuario_id,periodo' }).then(({ error }) => {
                if (!error) console.log('💾 [EVOLUCAO] Cache atualizado.')
            })
        }

        res.json({ success: true, data: chartData })
    } catch (error) {
        console.error('❌ [EVOLUCAO] Erro:', error)
        res.status(500).json({ success: false, message: 'Erro interno' })
    }
})

/**
 * GET /api/carteira/rentabilidade-v2
 * Calcula rentabilidade real (Mês ou Ano) baseada no primeiro preço do período com CACHE
 * Query: userId=uuid&periodo=1mo|1y
 */
router.get('/rentabilidade-v2', async (req: Request, res: Response) => {
    try {
        const { userId, periodo = '1mo' } = req.query
        if (!userId) return res.status(400).json({ success: false, message: 'userId obrigatório' })

        console.log(`📊 [RENTABILIDADE-V2] Verificando para ${userId} (${periodo})`)

        const cacheKey = `rent_${periodo}`
        const cacheLimit = periodo === '1mo' ? 6 : 12

        // 1. Verificar Cache
        try {
            const { data: cacheEntry } = await supabaseAdmin
                .from('evolucao_cache')
                .select('*')
                .eq('usuario_id', userId)
                .eq('periodo', cacheKey)
                .maybeSingle()

            if (cacheEntry) {
                const lastUpdated = new Date(cacheEntry.updated_at)
                const diffHours = (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
                if (diffHours < cacheLimit) {
                    console.log(`✅ [RENTABILIDADE-V2] Cache atingido (${diffHours.toFixed(1)}h)`)
                    return res.json({ success: true, data: cacheEntry.payload_json })
                }
            }
        } catch (e) {
            console.warn('⚠️ [RENTABILIDADE-V2] Erro cache:', (e as any).message)
        }

        // 2. Buscar ativos
        const { data: ativos, error: supabaseError } = await supabaseAdmin
            .from('carteira_ativos')
            .select('ticker, quantidade')
            .eq('usuario_id', userId)

        if (supabaseError || !ativos || ativos.length === 0) {
            return res.json({ success: true, data: { rentabilidade: 0 } })
        }

        console.log(`🔄 [RENTABILIDADE-V2] Calculando real...`)

        // 3. Buscar cotações atuais (bulk)
        const tickers = ativos.map(a => a.ticker)
        const cotacoes = await brapiService.buscarVariosAtivos(tickers)

        let valorTotalCarteira = 0
        let rentabilidadeAcumulada = 0
        let pesoTotalValido = 0

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        for (const ativo of ativos) {
            const cotacao = cotacoes.find(c => c.symbol === ativo.ticker)
            const precoAtual = cotacao?.regularMarketPrice || 0
            const valorAtivo = precoAtual * ativo.quantidade
            valorTotalCarteira += valorAtivo

            try {
                const history = await brapiService.buscarHistorico(ativo.ticker, periodo as string)
                if (history && history.length > 0) {
                    // Preço de 30 dias/1 ano atrás (primeiro do array Brapi)
                    const precoBase = history[0].close || history[0].open
                    if (precoBase > 0) {
                        const variation = ((precoAtual - precoBase) / precoBase) * 100
                        rentabilidadeAcumulada += variation * valorAtivo
                        pesoTotalValido += valorAtivo
                    }
                }
            } catch (e) {
                console.warn(`   - Falha histórico ${ativo.ticker}`)
            }
            await sleep(200)
        }

        const rentabilidadeFinal = pesoTotalValido > 0 ? (rentabilidadeAcumulada / pesoTotalValido) : 0
        const result = { rentabilidade: rentabilidadeFinal, periodo }

        // 4. Salvar Cache
        supabaseAdmin.from('evolucao_cache').upsert({
            usuario_id: userId,
            periodo: cacheKey,
            payload_json: result,
            updated_at: new Date().toISOString()
        }, { onConflict: 'usuario_id,periodo' }).then(({ error }) => {
            if (!error) console.log('💾 [RENTABILIDADE-V2] Cache salvo.')
        })

        res.json({ success: true, data: result })
    } catch (error) {
        console.error('❌ [RENTABILIDADE-V2] Erro:', error)
        res.status(500).json({ success: false, message: 'Erro interno' })
    }
})

export { router as carteiraRoutes }
