import { supabaseAdmin } from '../services/supabase.service'

async function main() {
    console.log('🧹 Limpando tabela cotacoes_cache...')
    const { error } = await supabaseAdmin.from('cotacoes_cache').delete().neq('ticker', '')
    if (error) {
        console.error('❌ Erro ao limpar tabela:', error.message)
    } else {
        console.log('✅ Tabela limpa com sucesso!')
    }
}

main().catch(console.error)
