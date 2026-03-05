import axios from 'axios'
import { cacheService } from './cache.service'

const AWESOME_URL = 'https://economia.awesomeapi.com.br/json/last'

export const awesomeService = {
    async buscarDolar() {
        return cacheService.getOrSet('awesome_usd_brl', async () => {
            try {
                const { data } = await axios.get(`${AWESOME_URL}/USD-BRL`)
                const usd = data.USDBRL
                return {
                    ticker: 'USD',
                    name: 'Dólar Comercial',
                    close: parseFloat(usd.bid),
                    variation: parseFloat(usd.pctChange)
                }
            } catch (error) {
                console.error('Erro ao buscar Dólar na AwesomeAPI:', error)
                return {
                    ticker: 'USD',
                    name: 'Dólar Comercial',
                    close: 5.85,
                    variation: 0
                }
            }
        }, 900) // 15 minutos (900s)
    }
}
