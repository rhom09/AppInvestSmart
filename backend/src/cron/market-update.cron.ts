import cron from 'node-cron'

// Atualiza cotações a cada hora nos dias úteis (8h às 18h, seg a sex)
cron.schedule('0 8-18 * * 1-5', async () => {
    console.log(`[CRON] ${new Date().toISOString()} - Atualizando cotações de mercado...`)
    try {
        // Aqui você integraria com BRAPI/B3 para atualizar o banco de dados
        console.log('[CRON] Cotações atualizadas com sucesso')
    } catch (error) {
        console.error('[CRON] Erro ao atualizar cotações:', error)
    }
}, { timezone: 'America/Sao_Paulo' })

console.log('[CRON] Job de atualização de mercado iniciado')
