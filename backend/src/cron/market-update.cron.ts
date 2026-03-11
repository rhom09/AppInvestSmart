import cron from 'node-cron'
import axios from 'axios'
import { brapiService, TICKERS_ACOES, TICKERS_FIIS } from '../services/brapi.service'
import { calcularScoreAcao } from '../services/score.service'
import { supabaseAdmin } from '../services/supabase.service'
import { fundamentusService } from '../services/fundamentus.service'

const BRAPI_BASE = 'https://brapi.dev/api'
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// ─── Mapeamentos (espelhados do brapi.service.ts) ───
const MAP_SETORES: Record<string, string> = {
    'WEGE3': 'INDUSTRIA', 'ITUB4': 'FINANCEIRO', 'BBAS3': 'FINANCEIRO', 'PETR4': 'PETROLEO',
    'VALE3': 'MINERACAO', 'ABEV3': 'AGRO', 'RENT3': 'TRANSPORTE', 'SUZB3': 'INDUSTRIA',
    'EGIE3': 'ENERGIA', 'ITSA4': 'FINANCEIRO', 'MGLU3': 'VAREJO', 'BBDC4': 'FINANCEIRO',
    'PRIO3': 'PETROLEO', 'VIVT3': 'TELECOMUNICACOES', 'RADL3': 'VAREJO', 'EMBR3': 'INDUSTRIA',
    'TOTS3': 'TECNOLOGIA', 'JBSS3': 'AGRO', 'CSAN3': 'ENERGIA', 'EQTL3': 'ENERGIA',
    'CCRO3': 'TRANSPORTE', 'BRFS3': 'AGRO', 'SBSP3': 'ENERGIA', 'AZZA3': 'VAREJO',
    'UGPA3': 'PETROLEO', 'RAIL3': 'TRANSPORTE', 'MULT3': 'CONSTRUCAO', 'TAEE11': 'ENERGIA',
    'CPFE3': 'ENERGIA', 'CPLE6': 'ENERGIA', 'ENGI11': 'ENERGIA', 'SAPR4': 'ENERGIA',
    'BEEF3': 'AGRO', 'MRVE3': 'CONSTRUCAO', 'DIRR3': 'CONSTRUCAO', 'TIMS3': 'TELECOMUNICACOES',
    'CMIN3': 'MINERACAO', 'BPAC11': 'FINANCEIRO', 'PETZ3': 'VAREJO', 'RDOR3': 'SAUDE'
}

const MAP_SEGMENTOS: Record<string, string> = {
    'MXRF11': 'RECEBIVEL', 'HGLG11': 'LOGISTICA', 'XPML11': 'SHOPPING', 'KNRI11': 'HIBRIDO',
    'VISC11': 'SHOPPING', 'BCFF11': 'HIBRIDO', 'BTLG11': 'LOGISTICA', 'HFOF11': 'HIBRIDO',
    'RBRF11': 'HIBRIDO', 'GGRC11': 'LOGISTICA', 'VILG11': 'LOGISTICA', 'BRCO11': 'LOGISTICA',
    'XPLG11': 'LOGISTICA', 'PATL11': 'LOGISTICA', 'LVBI11': 'LOGISTICA', 'VGIP11': 'RECEBIVEL',
    'KNCR11': 'RECEBIVEL', 'CPTS11': 'RECEBIVEL', 'RBRP11': 'CORPORATIVO', 'PVBI11': 'CORPORATIVO',
    'BPFF11': 'HIBRIDO', 'HABT11': 'RECEBIVEL', 'RZTR11': 'HIBRIDO', 'SARE11': 'CORPORATIVO'
}

/**
 * Busca um ticker individual da Brapi e retorna o objeto mapeado para cotacoes_cache
 */
async function fetchAndMapTicker(
    ticker: string,
    tipo: 'acao' | 'fii',
    token: string,
    fundAcoes: any[],
    fundFIIs: any[]
): Promise<any | null> {
    try {
        const response = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, {
            params: { token, fundamental: true }
        })
        const res = response.data.results?.[0]
        
        // LOG BRUTO PARA DIAGNÓSTICO
        console.log(`[BRAPI ${ticker}] RAW:`, JSON.stringify(res, null, 2))

        if (!res) {
            console.log(`[SKIP] ${ticker}: nenhum resultado na Brapi`)
            return null
        }

        const price = res.regularMarketPrice ?? res.currentPrice ?? 0
        if (price <= 0) {
            console.log(`[SKIP] ${ticker} sem preço válido: ${price}`)
            return null
        }

        const isFii = tipo === 'fii'
        const fundAcao = fundAcoes.find(a => a.ticker === ticker)
        const fundFII = fundFIIs.find(f => f.ticker === ticker)

        let dyScore = 0
        if (res.dividendYield != null) {
            dyScore = res.dividendYield * 100
        }

        const { scoreService } = require('../services/score.service')

        const mappedData = {
            ticker,
            nome: res.longName || res.shortName || ticker,
            preco: price,
            variacao: res.regularMarketChange ?? 0,
            variacao_percent: res.regularMarketChangePercent ?? 0,
            pl: isFii ? null : (fundAcao ? fundAcao.pl : (res.priceEarnings || res.trailingPE || null)),
            pvp: fundAcao ? fundAcao.pvp : (fundFII ? fundFII.pvp : (res.priceToBook || null)),
            dy: fundAcao ? fundAcao.dy : (fundFII ? fundFII.dy : (dyScore || res.dividendYield || null)),
            roe: isFii ? null : (fundAcao ? fundAcao.roe : (res.returnOnEquity ? res.returnOnEquity * 100 : null)),
            margem_liquida: isFii ? null : (fundAcao ? fundAcao.margemLiquida : (res.netMargin || res.profitMargins ? (res.netMargin || res.profitMargins) * 100 : null)),
            dy_mensal: isFii ? (fundFII ? fundFII.dy / 12 : (dyScore ? dyScore / 12 : null)) : null,
            vacancia: isFii ? (fundFII ? fundFII.vacancia : null) : null,
            setor: !isFii ? (MAP_SETORES[ticker] || 'OUTROS') : null,
            segmento: isFii ? (MAP_SEGMENTOS[ticker] || fundFII?.segmento || 'OUTROS') : null,
            market_cap: res.marketCap || null,
            tipo
        }

        const score = scoreService.calcularScore({
            ...mappedData,
            variacaoPercent: mappedData.variacao_percent,
            margemLiquida: mappedData.margem_liquida,
            dyMensal: mappedData.dy_mensal,
            marketCap: mappedData.market_cap
        })

        return {
            ...mappedData,
            score,
            atualizado_em: new Date().toISOString()
        }
    } catch (error: any) {
        if (error.response?.status === 429) {
            console.error(`🛑 [CRON] Rate Limit atingido em ${ticker}. Pulando.`)
            return 'RATE_LIMIT'
        }
        console.error(`❌ [CRON] Falha em ${ticker}: ${error.message}`)
        return null
    }
}

/**
 * Atualiza TODAS as cotações no Supabase (cotacoes_cache)
 * Chamado pelo cron a cada 30min ou sob demanda via admin endpoint
 */
export async function atualizarCotacoesCache() {
    const inicio = Date.now()
    const token = process.env.BRAPI_TOKEN
    if (!token) {
        console.error('❌ [CRON] BRAPI_TOKEN não configurado. Abortando.')
        return { success: false, error: 'BRAPI_TOKEN não configurado' }
    }

    console.log('🔄 [CRON] Iniciando atualização de cotacoes_cache...')
    console.log(`📊 [CRON] Total: ${TICKERS_ACOES.length} ações + ${TICKERS_FIIS.length} FIIs`)

    // Deduplica tickers
    const uniqueAcoes = [...new Set(TICKERS_ACOES)]
    const uniqueFIIs = [...new Set(TICKERS_FIIS)]

    // Pre-fetch Fundamentus para enriquecimento
    const fundAcoes = await fundamentusService.scrapingAcoes()
    const fundFIIs = await fundamentusService.scrapingFIIs()

    const DELAY_MS = 2000
    let successCount = 0
    let failCount = 0
    let rateLimitHit = false

    // Processar Ações
    console.log(`📈 [CRON] Processando ${uniqueAcoes.length} ações...`)
    for (let i = 0; i < uniqueAcoes.length; i++) {
        const ticker = uniqueAcoes[i]
        const result = await fetchAndMapTicker(ticker, 'acao', token, fundAcoes, fundFIIs)

        if (result === 'RATE_LIMIT') {
            console.error(`🛑 [CRON] Rate Limit atingido em ${ticker}. Parando processamento de ações.`)
            break
        }

        if (result) {
            const { error } = await supabaseAdmin
                .from('cotacoes_cache')
                .upsert(result, { onConflict: 'ticker' })

            if (error) {
                console.error(`❌ [CRON] Erro ao salvar ${ticker} no Supabase:`, error.message)
                failCount++
            } else {
                successCount++
            }
        } else {
            failCount++
        }

        if (i < uniqueAcoes.length - 1) await sleep(DELAY_MS)
    }

    // Processar FIIs
    console.log(`🏢 [CRON] Processando ${uniqueFIIs.length} FIIs...`)
    for (let i = 0; i < uniqueFIIs.length; i++) {
        const ticker = uniqueFIIs[i]
        const result = await fetchAndMapTicker(ticker, 'fii', token, fundAcoes, fundFIIs)

        if (result === 'RATE_LIMIT') {
            console.error(`🛑 [CRON] Rate Limit atingido em ${ticker}. Parando processamento de FIIs.`)
            break
        }

        if (result) {
            const { error } = await supabaseAdmin
                .from('cotacoes_cache')
                .upsert(result, { onConflict: 'ticker' })

            if (error) {
                console.error(`❌ [CRON] Erro ao salvar ${ticker} no Supabase:`, error.message)
                failCount++
            } else {
                successCount++
            }
        } else {
            failCount++
        }

        if (i < uniqueFIIs.length - 1) await sleep(DELAY_MS)
    }

    const fim = Date.now()
    const tempo = ((fim - inicio) / 1000).toFixed(1)
    const logMsg = `✅ [CRON] Cotações atualizadas: ${successCount} salvos, ${failCount} falhas, em ${tempo}s`
    console.log(logMsg)

    return { success: true, message: logMsg, saved: successCount, failed: failCount }
}

/**
 * Rotina Principal de Atualização (scores + indicados)
 */
export async function executarAtualizacaoMercado() {
    const inicio = Date.now()
    console.log('🕒 Iniciando atualização diária de mercado...')

    try {
        // 1. Buscar tickers monitorados (ativos disponíveis na Brapi)
        const ativosDisponiveis = await brapiService.listarAtivos()
        const tickers = ativosDisponiveis.map((a: any) => typeof a === 'string' ? a : a.ticker).filter(Boolean)

        console.log(`📊 Processando ${tickers.length} ativos...`)

        const scoresDiarios = []

        // 2. Para cada ticker, buscar dados e calcular score
        for (const ticker of tickers) {
            try {
                const dados = await brapiService.buscarAtivo(ticker)
                if (!dados) continue

                const { score } = calcularScoreAcao(dados)

                scoresDiarios.push({
                    ticker,
                    score,
                    pl: dados.pl,
                    pvp: dados.pvp,
                    dy: dados.dy,
                    roe: dados.roe,
                    preco: dados.regularMarketPrice || dados.preco,
                    data: new Date().toISOString().split('T')[0]
                })
            } catch (err) {
                console.error(`❌ Erro ao processar ${ticker}:`, err)
            }
        }

        // 3. Salvar no Supabase (scores_diarios)
        if (scoresDiarios.length > 0) {
            const { error: errorScores } = await supabaseAdmin
                .from('scores_diarios')
                .upsert(scoresDiarios, { onConflict: 'ticker,data' })

            if (errorScores) throw errorScores
            console.log(`✅ Salvos ${scoresDiarios.length} scores no Supabase.`)
        }

        // 4. Identificar Top 5 (score > 80)
        const indicados = scoresDiarios
            .filter(s => s.score > 80)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(s => ({
                ticker: s.ticker,
                score: s.score,
                motivo: `DY alto (${s.dy?.toFixed(1) || 0}%) + P/L e rentabilidade saudáveis.`,
                data: s.data
            }))

        // 5. Salvar indicados
        if (indicados.length > 0) {
            const hoje = new Date().toISOString().split('T')[0]
            await supabaseAdmin.from('indicados_diarios').delete().eq('data', hoje)

            const { error: errorIndicados } = await supabaseAdmin
                .from('indicados_diarios')
                .insert(indicados)

            if (errorIndicados) throw errorIndicados
            console.log(`🌟 Salvos ${indicados.length} indicados do dia.`)
        }

        const fim = Date.now()
        const tempo = ((fim - inicio) / 1000).toFixed(1)
        const logMsg = `✅ Atualização concluída: ${scoresDiarios.length} ativos processados em ${tempo}s`
        console.log(logMsg)
        return { success: true, message: logMsg, count: scoresDiarios.length }
    } catch (error: any) {
        console.error('❌ Falha na atualização de mercado:', error.message)
        return { success: false, error: error.message }
    }
}

// ─── Cron Schedules ───

// Cotações: a cada 30 minutos durante horário de mercado (10h–17h59, seg–sex)
cron.schedule('*/30 10-17 * * 1-5', () => {
    console.log('⏰ [CRON] Disparando atualização de cotações (horário de mercado)...')
    atualizarCotacoesCache()
}, { timezone: "America/Sao_Paulo" })

// Pre-aquecimento: 8h da manhã (antes do mercado abrir)
cron.schedule('0 8 * * 1-5', () => {
    console.log('☀️ [CRON] Pre-aquecimento de cotações (8h)...')
    atualizarCotacoesCache()
}, { timezone: "America/Sao_Paulo" })

// Scores + Indicados: Segunda a Sexta às 18:30
cron.schedule('30 18 * * 1-5', () => {
    executarAtualizacaoMercado()
}, { timezone: "America/Sao_Paulo" })

console.log('⏲️  Cron Jobs agendados:')
console.log('   📊 Cotações: */30 10-17 * * 1-5 (a cada 30min, horário de mercado)')
console.log('   ☀️  Pre-warm: 0 8 * * 1-5 (8h)')
console.log('   🏆 Scores: 30 18 * * 1-5 (18:30)')
