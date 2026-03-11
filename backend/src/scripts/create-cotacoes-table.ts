import { supabaseAdmin } from '../services/supabase.service'

/**
 * Script para criar a tabela cotacoes_cache no Supabase.
 * Rode com: npx ts-node src/scripts/create-cotacoes-table.ts
 */
async function main() {
    console.log('🗄️  Criando tabela cotacoes_cache...')

    const { error } = await supabaseAdmin.rpc('exec_sql', {
        query: `
            CREATE TABLE IF NOT EXISTS cotacoes_cache (
                ticker TEXT PRIMARY KEY,
                nome TEXT,
                preco DECIMAL,
                variacao DECIMAL,
                variacao_percent DECIMAL,
                pl DECIMAL,
                pvp DECIMAL,
                dy DECIMAL,
                roe DECIMAL,
                margem_liquida DECIMAL,
                score INTEGER,
                tipo TEXT,
                setor TEXT,
                segmento TEXT,
                vacancia DECIMAL,
                dy_mensal DECIMAL,
                market_cap BIGINT,
                atualizado_em TIMESTAMP DEFAULT NOW()
            );
        `
    })

    if (error) {
        // Se o RPC não existir, a tabela precisa ser criada manualmente
        console.log('⚠️  Não foi possível criar a tabela via RPC.')
        console.log('📋 Cole o SQL abaixo no Supabase SQL Editor:')
        console.log('')
        console.log(`CREATE TABLE IF NOT EXISTS cotacoes_cache (
  ticker TEXT PRIMARY KEY,
  nome TEXT,
  preco DECIMAL,
  variacao DECIMAL,
  variacao_percent DECIMAL,
  pl DECIMAL,
  pvp DECIMAL,
  dy DECIMAL,
  roe DECIMAL,
  margem_liquida DECIMAL,
  score INTEGER,
  tipo TEXT,
  setor TEXT,
  segmento TEXT,
  vacancia DECIMAL,
  dy_mensal DECIMAL,
  market_cap BIGINT,
  atualizado_em TIMESTAMP DEFAULT NOW()
);`)
        console.log('')
        console.log('Depois rode o refresh: POST /api/admin/refresh-cotacoes')
    } else {
        console.log('✅ Tabela cotacoes_cache criada com sucesso!')
    }

    // Tentar um teste rápido: upsert um registro dummy e deletar
    const { error: testError } = await supabaseAdmin
        .from('cotacoes_cache')
        .upsert({ ticker: '__TEST__', nome: 'Test', preco: 0, tipo: 'acao' }, { onConflict: 'ticker' })

    if (testError) {
        console.log('❌ Tabela cotacoes_cache NÃO existe ainda. Erro:', testError.message)
        console.log('👉 Crie a tabela manualmente no Supabase SQL Editor com o SQL acima.')
    } else {
        await supabaseAdmin.from('cotacoes_cache').delete().eq('ticker', '__TEST__')
        console.log('✅ Tabela cotacoes_cache existe e está funcional!')
    }
}

main().catch(console.error)
