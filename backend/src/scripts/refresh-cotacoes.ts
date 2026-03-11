import { atualizarCotacoesCache } from '../cron/market-update.cron'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Script para disparar o refresh manual das cotações no Supabase.
 * Rode com: npx ts-node src/scripts/refresh-cotacoes.ts
 */
async function main() {
    console.log('🚀 Iniciando refresh manual de cotações...')
    const resultado = await atualizarCotacoesCache()
    console.log('🏁 Resultado:', resultado)

    if (resultado.success) {
        console.log('✅ Banco de dados populado com sucesso!')
    } else {
        console.log('❌ Falha ao popular banco de dados.')
    }
}

main().catch(console.error)
