import cron from 'node-cron'
import { TICKERS_ACOES, TICKERS_FIIS } from '../utils/tickers'
import { calcularScoreAcao, scoreService } from '../services/score.service'
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

import { buscarCotacoesBatch } from '../services/yahoo.service'

// Helper para dividir array em pedaços
function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

// Estado da rotação (em memória)
let grupoAtual = 0

/**
 * Atualiza cotações usando Yahoo Finance em grandes lotes sem rate limit.
 */
export async function atualizarCotacoesCache(tickersOverride?: string[]) {
    const inicio = Date.now()

    const uniqueAcoes = tickersOverride 
        ? tickersOverride.filter(t => TICKERS_ACOES.includes(t)) 
        : [...new Set(TICKERS_ACOES)]
    
    const uniqueFIIs = tickersOverride 
        ? tickersOverride.filter(t => TICKERS_FIIS.includes(t)) 
        : [...new Set(TICKERS_FIIS)]

    const allTickersToFetch = [...uniqueAcoes, ...uniqueFIIs]
    console.log(`🔄 [CRON] Iniciando atualização de ${allTickersToFetch.length} ativos (Yahoo Finance)...`)
    
    // Pre-fetch Fundamentus para DY, PVP, ROE etc. (como Yahoo não tem tudo perfeitamente para FIIs)
    const fundAcoes = await fundamentusService.scrapingAcoes()
    const fundFIIs = await fundamentusService.scrapingFIIs()

    const { scoreService } = require('../services/score.service')
    let successCount = 0
    let failCount = 0

    // Fetch batch (Yahoo Finance supports large arrays, but we can do it in one go if < 500)
    const lotes = chunkArray(allTickersToFetch, 50)
    for (const lote of lotes) {
        console.log(`📦 Processando lote de ${lote.length} ativos...`)
        const cotacoes = await buscarCotacoesBatch(lote)
        
        for (const c of cotacoes) {
            const isFii = TICKERS_FIIS.includes(c.ticker)
            const fundAcao = fundAcoes.find(a => a.ticker === c.ticker)
            const fundFII = fundFIIs.find(f => f.ticker === c.ticker)
            
            // ANTES de fazer o upsert na cotacoes_cache, verificar:
            if (!c || c.preco == null || c.preco <= 0) {
                console.log(`[CRON SKIP] ${c.ticker} sem preço válido (${c?.preco}), mantendo cache anterior`)
                continue
            }

            // Combinar Yahoo + Fundamentus
            const mappedData = {
                ticker: c.ticker,
                nome: c.nome,
                preco: c.preco,
                variacao: c.variacao,
                variacao_percent: c.variacaoPercent,
                pl: isFii ? null : (fundAcao ? fundAcao.pl : c.pl),
                pvp: fundAcao ? fundAcao.pvp : (fundFII ? fundFII.pvp : c.pvp),
                dy: fundAcao ? fundAcao.dy : (fundFII ? fundFII.dy : c.dy),
                roe: isFii ? null : (fundAcao ? fundAcao.roe : c.roe),
                margem_liquida: isFii ? null : (fundAcao ? fundAcao.margemLiquida : c.margemLiquida),
                dy_mensal: isFii ? (fundFII ? fundFII.dy / 12 : (c.dy ? c.dy / 12 : null)) : null,
                vacancia: isFii ? (fundFII ? fundFII.vacancia : null) : null,
                setor: !isFii ? (MAP_SETORES[c.ticker] || 'OUTROS') : null,
                segmento: isFii ? (MAP_SEGMENTOS[c.ticker] || fundFII?.segmento || 'OUTROS') : null,
                market_cap: c.marketCap,
                tipo: isFii ? 'fii' : 'acao'
            }

            const score = scoreService.calcularScore({
                ...mappedData,
                variacaoPercent: mappedData.variacao_percent,
                margemLiquida: mappedData.margem_liquida,
                dyMensal: mappedData.dy_mensal,
                marketCap: mappedData.market_cap
            })

            const finalData = {
                ...mappedData,
                score,
                atualizado_em: new Date().toISOString()
            }

            const { error } = await supabaseAdmin.from('cotacoes_cache').upsert(finalData, { onConflict: 'ticker' })
            if (error) {
                console.error(`❌ [CRON] Erro ao salvar ${c.ticker}:`, error.message)
                failCount++
            } else {
                successCount++
            }
        }
        await sleep(1000) // 1s entre lotes de 50
    }

    const fim = Date.now()
    const tempo = ((fim - inicio) / 1000).toFixed(1)
    const logMsg = `✅ [CRON] Concluído: ${successCount} salvos, ${failCount} falhas em ${tempo}s (Yahoo Finance)`
    console.log(logMsg)

    return { success: true, message: logMsg, saved: successCount, failed: failCount }
}

/**
 * Modo Seed: Atualiza todos em lotes de 50
 */
export async function modoSeedRefresh() {
    const TODOS = [...new Set([...TICKERS_ACOES, ...TICKERS_FIIS])]
    console.log(`🚀 [SEED] Iniciando carga total de ${TODOS.length} ativos (Yahoo Finance)...`)
    await atualizarCotacoesCache(TODOS)
    console.log('🏁 [SEED] Carga inicial concluída com sucesso!')
}

/**
 * Rotina Principal de Atualização (scores + indicados)
 */
export async function executarAtualizacaoMercado() {
    const inicio = Date.now()
    console.log('🕒 Iniciando atualização diária de mercado...')

    try {
        // 1. Buscar tickers monitorados
        const tickers = TODOS_TICKERS

        console.log(`📊 Processando ${tickers.length} ativos para daily scores...`)

        const scoresDiarios = []

        // 2. Para cada ticker, buscar dados e calcular score
        const chunks = chunkArray(tickers, 20)
        for (const chunk of chunks) {
            const cotacoes = await buscarCotacoesBatch(chunk)
            for (const dados of cotacoes) {
                const { score } = calcularScoreAcao(dados as any)

                scoresDiarios.push({
                    ticker: dados.ticker,
                    score,
                    pl: dados.pl,
                    pvp: dados.pvp,
                    dy: dados.dy,
                    roe: dados.roe,
                    preco: dados.preco,
                    data: new Date().toISOString().split('T')[0]
                })
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

// Todos os tickers unificados para rotação
export const TODOS_TICKERS = [...new Set([...TICKERS_ACOES, ...TICKERS_FIIS])]
export const GRUPOS = chunkArray(TODOS_TICKERS, 20)

// Cotações: a cada hora, processa UM grupo rotativo (9h–18h, seg–sex)
cron.schedule('0 9-18 * * 1-5', () => {
    const index = grupoAtual % GRUPOS.length
    const grupo = GRUPOS[index]
    console.log(`⏰ [CRON] Atualizando Grupo ${index + 1}/${GRUPOS.length}: ${grupo.length} ativos...`)
    atualizarCotacoesCache(grupo)
    grupoAtual++
}, { timezone: "America/Sao_Paulo" })

// Pre-aquecimento: 8h da manhã (atualiza apenas grupo 0 para não estourar limite cedo)
cron.schedule('0 8 * * 1-5', () => {
    console.log('☀️ [CRON] Pre-aquecimento de cotações (8h - Grupo 1)...')
    atualizarCotacoesCache(GRUPOS[0])
}, { timezone: "America/Sao_Paulo" })

// Scores + Indicados: Segunda a Sexta às 18:30
cron.schedule('30 18 * * 1-5', () => {
    executarAtualizacaoMercado()
}, { timezone: "America/Sao_Paulo" })

console.log('⏲️  Cron Jobs agendados:')
console.log('   📊 Cotações: */30 10-17 * * 1-5 (a cada 30min, horário de mercado)')
console.log('   ☀️  Pre-warm: 0 8 * * 1-5 (8h)')
console.log('   🏆 Scores: 30 18 * * 1-5 (18:30)')
