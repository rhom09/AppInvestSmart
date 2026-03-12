import YahooFinance from 'yahoo-finance2'
import { cacheService } from './cache.service'

const yahooFinance = new YahooFinance()

export const awesomeService = {
    async buscarDolar() {
        return cacheService.getOrSet('awesome_usd_brl', async () => {
            try {
                const result = await yahooFinance.quote('USDBRL=X')
                return {
                    ticker: 'USD',
                    name: 'Dólar Comercial',
                    close: result.regularMarketPrice ?? 0,
                    variation: result.regularMarketChangePercent ?? 0
                }
            } catch (error) {
                console.error('[DOLAR] Erro ao buscar USDBRL=X no Yahoo:', error)
                return {
                    ticker: 'USD',
                    name: 'Dólar Comercial',
                    close: 5.85,
                    variation: 0
                }
            }
        }, 3600) // 60 minutos (3600s)
    }
}
