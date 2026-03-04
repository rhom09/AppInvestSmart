import axios from 'axios'
import * as cheerio from 'cheerio'
import { cacheService } from './cache.service'

const URL_ACOES = 'https://www.fundamentus.com.br/resultado.php'
const URL_FIIS = 'https://www.fundamentus.com.br/fii_resultado.php'

export interface FundamentusAcao {
    ticker: string
    pl: number
    pvp: number
    dy: number
    evEbitda: number
    margemLiquida: number
    roic: number
    roe: number
}

export interface FundamentusFII {
    ticker: string
    dy: number
    pvp: number
    liquidez: number
    vacancia: number
}

const parsePtBrFloat = (val: string): number => {
    if (!val || val === '-') return 0
    // Remove dots (thousand separator), replaces comma with dot (decimal separator), removes %
    const cleaned = val.replace(/\./g, '').replace(',', '.').replace('%', '').trim()
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
}

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

export const fundamentusService = {
    async scrapingAcoes(): Promise<FundamentusAcao[]> {
        return cacheService.getOrSet('fundamentus_acoes', async () => {
            try {
                const { data } = await axios.get(URL_ACOES, { headers: HEADERS })
                const $ = cheerio.load(data)
                const result: FundamentusAcao[] = []

                $('#resultado tr').each((i, el) => {
                    if (i === 0) return // Skip header
                    const cols = $(el).find('td')
                    if (cols.length < 10) return

                    result.push({
                        ticker: $(cols[0]).text().trim(),
                        pl: parsePtBrFloat($(cols[2]).text()),
                        pvp: parsePtBrFloat($(cols[3]).text()),
                        dy: parsePtBrFloat($(cols[5]).text()),
                        evEbitda: parsePtBrFloat($(cols[11]).text()),
                        margemLiquida: parsePtBrFloat($(cols[13]).text()),
                        roic: parsePtBrFloat($(cols[15]).text()),
                        roe: parsePtBrFloat($(cols[16]).text()),
                    })
                })

                return result
            } catch (error) {
                console.error('Erro ao fazer scraping de ações Fundamentus:', error)
                return []
            }
        }, 86400) // 24 horas
    },

    async scrapingFIIs(): Promise<FundamentusFII[]> {
        return cacheService.getOrSet('fundamentus_fiis', async () => {
            try {
                const { data } = await axios.get(URL_FIIS, { headers: HEADERS })
                const $ = cheerio.load(data)
                const result: FundamentusFII[] = []

                // Try both possible IDs or just the table that looks like results
                const table = $('#tabela_resultado').length ? $('#tabela_resultado') : $('table').filter((_, t) => $(t).text().includes('Papel'))

                table.find('tr').each((i, el) => {
                    if (i === 0) return // Skip header
                    const cols = $(el).find('td')
                    if (cols.length < 10) return

                    result.push({
                        ticker: $(cols[0]).text().trim(),
                        dy: parsePtBrFloat($(cols[4]).text()),
                        pvp: parsePtBrFloat($(cols[5]).text()),
                        liquidez: parsePtBrFloat($(cols[7]).text()),
                        vacancia: parsePtBrFloat($(cols[12]).text()),
                    })
                })

                return result
            } catch (error) {
                console.error('Erro ao fazer scraping de FIIs Fundamentus:', error)
                return []
            }
        }, 86400) // 24 horas
    },

    async getInfoAcao(ticker: string): Promise<FundamentusAcao | null> {
        const all = await this.scrapingAcoes()
        return all.find(a => a.ticker === ticker) || null
    },

    async getInfoFII(ticker: string): Promise<FundamentusFII | null> {
        const all = await this.scrapingFIIs()
        return all.find(f => f.ticker === ticker) || null
    }
}
