/*
 * Yahoo Finance v3 Fix: Corrected the `yahoo.service.ts` to use instance-based API (`new YahooFinance()`)
 * after a v3 update error, ensuring connectivity was restored and the database was successfully populated.
 * Verified via `check-updates.ts` script that assets are actively being saved to Supabase.
 */
import { supabaseAdmin } from '../services/supabase.service'

async function checkUpdates() {
    const { data, error } = await supabaseAdmin
        .from('cotacoes_cache')
        .select('ticker, nome, preco, atualizado_em')
        .order('atualizado_em', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Erro ao buscar dados:', error)
        return
    }

    console.log('--- Últimas 10 Atualizações ---')
    data?.forEach(row => {
        console.log(`${row.ticker} | ${row.nome} | R$ ${row.preco} | ${row.atualizado_em}`)
    })
}

checkUpdates()
