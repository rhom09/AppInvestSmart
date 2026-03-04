import axios from 'axios'
import dotenv from 'dotenv'
import { cacheService } from './cache.service'

dotenv.config()

const BRAPI_BASE = 'https://brapi.dev/api'
const TOKEN = process.env.BRAPI_TOKEN

// Mock data quando BRAPI não está disponível
const MOCK_ATIVOS: any[] = [
    { ticker: 'PETR4', nome: 'Petrobras PN', preco: 34.50, variacao: 0.45, variacaoPercent: 1.32, score: 72, pl: 4.1, pvp: 1.2, dy: 12.5, roe: 28.3, margemLiquida: 22.1 },
    { ticker: 'VALE3', nome: 'Vale ON', preco: 68.20, variacao: -1.35, variacaoPercent: -1.94, score: 65, pl: 5.8, pvp: 1.8, dy: 9.2, roe: 22.1, margemLiquida: 28.4 },
    { ticker: 'BBAS3', nome: 'Banco do Brasil ON', preco: 24.80, variacao: 0.30, variacaoPercent: 1.22, score: 84, pl: 4.1, pvp: 0.88, dy: 11.4, roe: 21.3, margemLiquida: 35.2 },
    { ticker: 'ITUB4', nome: 'Itaú Unibanco PN', preco: 36.40, variacao: 0.85, variacaoPercent: 2.39, score: 78, pl: 8.2, pvp: 1.9, dy: 5.8, roe: 19.5, margemLiquida: 38.1 },
    { ticker: 'WEGE3', nome: 'WEG ON', preco: 42.10, variacao: 1.20, variacaoPercent: 2.93, score: 88, pl: 28.5, pvp: 8.2, dy: 1.8, roe: 26.8, margemLiquida: 18.9 },
    { ticker: 'MGLU3', nome: 'Magazine Luiza ON', preco: 2.30, variacao: -0.15, variacaoPercent: -6.12, score: 28, pl: -8.2, pvp: 1.1, dy: 0.0, roe: -15.2, margemLiquida: -4.2 },
    { ticker: 'RENT3', nome: 'Localiza ON', preco: 48.90, variacao: 0.60, variacaoPercent: 1.24, score: 71, pl: 14.2, pvp: 3.1, dy: 2.1, roe: 18.4, margemLiquida: 9.8 },
    { ticker: 'ABEV3', nome: 'Ambev ON', preco: 12.40, variacao: -0.20, variacaoPercent: -1.59, score: 61, pl: 16.8, pvp: 2.9, dy: 5.2, roe: 15.3, margemLiquida: 22.4 },
    { ticker: 'SUZB3', nome: 'Suzano ON', preco: 52.30, variacao: 1.15, variacaoPercent: 2.25, score: 74, pl: 6.8, pvp: 1.6, dy: 4.2, roe: 22.8, margemLiquida: 38.5 },
]

export const brapiService = {
    async listarAtivos() {
        return cacheService.getOrSet('brapi_available_stocks', async () => {
            if (!TOKEN) {
                console.warn('⚠️  BRAPI_TOKEN não configurado, usando mock')
                return MOCK_ATIVOS
            }
            try {
                const { data } = await axios.get(`${BRAPI_BASE}/available`, { params: { token: TOKEN } })
                const stocks = data.stocks?.slice(0, 80) ?? []

                // Convert list of strings into objects { ticker, nome }
                return stocks.map((s: string) => {
                    const mock = MOCK_ATIVOS.find(m => m.ticker === s)
                    return {
                        ticker: s,
                        nome: mock?.nome || s,
                        preco: mock?.preco || 0,
                        variacao: mock?.variacao || 0,
                        variacaoPercent: mock?.variacaoPercent || 0
                    }
                })
            } catch {
                return MOCK_ATIVOS
            }
        })
    },

    async buscarAtivo(ticker: string) {
        return cacheService.getOrSet(`brapi_quote_${ticker}`, async () => {
            if (!TOKEN) return MOCK_ATIVOS.find(a => a.ticker === ticker)
            try {
                const { data } = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, {
                    params: { token: TOKEN, fundamental: true, dividends: true }
                })
                const result = data.results?.[0]
                if (!result) return null

                // Mapear propriedades do BRAPI para o padrão esperado pelo nosso score.service
                const mapFundamentals = (res: any) => {
                    const price = res.regularMarketPrice || 0

                    // Cálculo aproximado de DY (12m)
                    let dyScore = 0
                    if (res.dividendsData && res.dividendsData.cashDividends) {
                        const dozeMesesAtras = new Date()
                        dozeMesesAtras.setFullYear(dozeMesesAtras.getFullYear() - 1)
                        const divs = res.dividendsData.cashDividends.filter((d: any) => new Date(d.paymentDate) >= dozeMesesAtras)
                        const totalDivs = divs.reduce((acc: number, cur: any) => acc + (cur.rate || 0), 0)
                        dyScore = price > 0 ? (totalDivs / price) * 100 : 0
                    } else if (res.dividendYield != null) {
                        dyScore = res.dividendYield * 100 // sometimes brapi delivers it directly
                    }

                    // DY Mensal FII (aproximado, divide o dy anual por 12 se for FII)
                    const dyMensal = dyScore / 12

                    // FII e Ações fields
                    const mockInfo = MOCK_ATIVOS.find(m => m.ticker === res.symbol)
                    return {
                        ticker: res.symbol,
                        ...res,
                        pl: res.priceEarnings != null ? res.priceEarnings : (mockInfo?.pl || null),
                        pvp: (price > 0 && res.regularMarketPreviousClose && res.earningsPerShare)
                            ? (price / (res.regularMarketPreviousClose / res.priceEarnings)) // Fallback if no VPA
                            : (mockInfo?.pvp || null),
                        dy: dyScore > 0 ? dyScore : (mockInfo?.dy || 0),
                        dyMensal: res.symbol.endsWith('11') ? (dyMensal > 0 ? dyMensal : mockInfo?.dyMensal) : undefined,
                        roe: res.returnOnEquity != null ? res.returnOnEquity * 100 : (mockInfo?.roe || null),
                        margemLiquida: res.netMargin != null ? res.netMargin * 100 : (mockInfo?.margemLiquida || null),
                        vacancia: res.vacancy != null ? res.vacancy : (mockInfo?.vacancia || undefined),
                        liquidez: res.regularMarketVolume || undefined,
                        score: mockInfo?.score || undefined
                    }
                }

                return mapFundamentals(result)
            } catch {
                return MOCK_ATIVOS.find(a => a.ticker === ticker)
            }
        })
    },

    async buscarHistorico(ticker: string, periodo = '1mo') {
        return cacheService.getOrSet(`brapi_history_${ticker}_${periodo}`, async () => {
            if (!TOKEN) return []
            try {
                const { data } = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, {
                    params: { token: TOKEN, range: periodo, interval: '1d', history: true }
                })
                return data.results?.[0]?.historicalDataPrice ?? []
            } catch {
                return []
            }
        })
    },

    async buscarIndices() {
        if (!TOKEN) return [
            { ticker: 'IBOV', name: 'IBOVESPA', close: 128500, variation: 0.5 },
            { ticker: 'SELIC', name: 'SELIC', close: 10.75, variation: 0 }
        ]
        try {
            const { data } = await axios.get(`${BRAPI_BASE}/quote/^BVSP`, { params: { token: TOKEN } })
            const ibov = data.results?.[0]
            return [
                {
                    ticker: 'IBOV',
                    name: 'IBOVESPA',
                    close: ibov?.regularMarketPrice || 128500,
                    variation: ibov?.regularMarketChangePercent || 0
                },
                {
                    ticker: 'SELIC',
                    name: 'SELIC',
                    close: 10.75,
                    variation: 0
                }
            ]
        } catch {
            return [
                { ticker: 'IBOV', name: 'IBOVESPA', close: 128500, variation: 0.5 },
                { ticker: 'SELIC', name: 'SELIC', close: 10.75, variation: 0 }
            ]
        }
    },
}
