import cron from 'node-cron'
import { brapiService } from '../services/brapi.service'
import { calcularScoreAcao } from '../services/score.service'
import { supabaseAdmin } from '../services/supabase.service'

/**
 * Rotina Principal de Atualização
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

                // O buscarAtivo já tenta mesclar as propriedades. 
                // Precisamos calcular e salvar o score do dia.
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

        // 5. Salvar indicados (se já não houver para hoje)
        if (indicados.length > 0) {
            const hoje = new Date().toISOString().split('T')[0]
            // Opcional: deletar os de hoje antes de inserir para evitar duplicação, ou apenas inserir.
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

// 6. Agendar: Segunda a Sexta às 18:30 (Horário Brasília)
cron.schedule('30 18 * * 1-5', () => {
    executarAtualizacaoMercado()
}, {
    timezone: "America/Sao_Paulo"
})

console.log('⏲️  Cron Job: Atualização de mercado agendada (Seg-Sex 18:30)')
