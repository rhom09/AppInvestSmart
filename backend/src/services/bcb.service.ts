import axios from 'axios'
import { cacheService } from './cache.service'

const BCB_SGS_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs'

export const bcbService = {
    /**
     * Busca o IPCA acumulado de 12 meses
     * Serie 433: Índice nacional de preços ao consumidor - amplo (IPCA) - Var. mensal
     */
    async buscarIPCA12m() {
        return cacheService.getOrSet('bcb_ipca_12m', async () => {
            try {
                // Buscamos as últimas 12 ocorrências da variação mensal (corrigindo URL para .433)
                const { data } = await axios.get(`${BCB_SGS_URL}.433/dados/ultimos/12?formato=json`)

                // Calculamos o produto das variações (1 + v1) * (1 + v2) ...
                const acumulado = data.reduce((acc: number, item: { valor: string }) => {
                    return acc * (1 + parseFloat(item.valor) / 100)
                }, 1)

                return (acumulado - 1) * 100 // Retorna em porcentagem (ex: 4.50)
            } catch (error) {
                console.error('Erro ao buscar IPCA na API do BCB:', error)
                return 4.51 // Fallback IPCA aproximado
            }
        })
    },

    /**
     * Busca a Meta Selic atual (SGS 432)
     */
    async buscarSelic() {
        return cacheService.getOrSet('bcb_selic_meta', async () => {
            try {
                const { data } = await axios.get(`${BCB_SGS_URL}.432/dados/ultimos/1?formato=json`)
                return parseFloat(data[0].valor)
            } catch (error) {
                console.error('Erro ao buscar Selic na API do BCB:', error)
                return 10.75 // Fallback
            }
        })
    }
}
