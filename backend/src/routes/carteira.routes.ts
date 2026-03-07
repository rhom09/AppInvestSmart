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
            return res.status(400).json({ success: false, message: 'userId é obrigatório' })
        }

        console.log(`📈 [EVOLUCAO] Verificando cache para usuário ${userId} (${periodo})`)

        // 1. Verificar Cache no Supabase (24 horas)
        // Nota: Esta tabela deve ter as colunas: usuario_id (uuid), periodo (text), payload_json (jsonb), updated_at (timestamptz)
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
                console.log('✅ [EVOLUCAO] Servindo do cache (idade: ' + diffHours.toFixed(1) + 'h)')
                return res.json({ success: true, data: cacheEntry.payload_json })
            }
        }

        console.log('🔄 [EVOLUCAO] Cache expirado ou inexistente. Calculando novo histórico...')

        // 2. Buscar ativos do Supabase
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

        console.log(`🔍 [EVOLUCAO] Calculando para ${ativos.length} ativos...`)

        const evolucaoPorData: Record<string, number> = {}
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

        // 3. Buscar histórico SEQUENCIALMENTE com delay de 200ms (respeitar rate limit free)
        for (const ativo of ativos) {
            console.log(`   - Buscando ${ativo.ticker}...`)
            const history = await brapiService.buscarHistorico(ativo.ticker, periodo as string)

            if (history) {
                history.forEach((day: any) => {
                    const dateObj = new Date(day.date * 1000)
                    const dateKey = dateObj.toISOString().split('T')[0]

                    const valorNaData = (day.close || 0) * ativo.quantidade
                    evolucaoPorData[dateKey] = (evolucaoPorData[dateKey] || 0) + valorNaData
                })
            }

            // Burst protection
            await sleep(200)
        }

        // 4. Formatar, legendar e ordenar
        const chartData = Object.entries(evolucaoPorData)
            .map(([date, value]) => ({
                data: date,
                patrimonio: value,
                label: new Date(date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            }))
            .sort((a, b) => a.data.localeCompare(b.data))

        // 5. Salvar no Cache (Upsert)
        if (chartData.length > 0) {
            const { error: upsertError } = await supabaseAdmin
                .from('evolucao_cache')
                .upsert({
                    usuario_id: userId,
                    periodo: periodo,
                    payload_json: chartData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'usuario_id,periodo' })

            if (upsertError) {
                console.error('⚠️ [EVOLUCAO] Erro ao salvar cache:', upsertError)
            } else {
                console.log('💾 [EVOLUCAO] Novo cache salvo com sucesso.')
            }
        }

        res.json({ success: true, data: chartData })
    } catch (error) {
        console.error('❌ [EVOLUCAO] Erro catastrófico:', error)
        res.status(500).json({ success: false, message: 'Erro interno ao processar evolução patrimonial' })
    }
})

/**
 * GET /api/carteira/rentabilidade (Legado)
 * Nota: O frontend não deve mais usar este endpoint para cards de resumo.
 */
router.get('/rentabilidade', async (_req: Request, res: Response) => {
    res.status(410).json({ success: false, message: 'Endpoint desativado para otimização. Use cálculo local.' })
})

export { router as carteiraRoutes }
