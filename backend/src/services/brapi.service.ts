import axios from 'axios'
import dotenv from 'dotenv'
import { cacheService } from './cache.service'
import { fundamentusService } from './fundamentus.service'

dotenv.config()

const BRAPI_BASE = 'https://brapi.dev/api'

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

export const TICKERS_FIIS = [
    'MXRF11', 'HGLG11', 'XPML11', 'KNRI11', 'VISC11', 'BCFF11', 'BTLG11', 'HFOF11',
    'RBRF11', 'GGRC11', 'VILG11', 'BRCO11', 'XPLG11', 'PATL11', 'LVBI11', 'VGIP11',
    'KNCR11', 'CPTS11', 'RBRP11', 'PVBI11', 'BPFF11', 'HABT11', 'RZTR11', 'SARE11'
]

const MAP_SETORES: Record<string, string> = {
    'WEGE3': 'INDUSTRIA', 'ITUB4': 'FINANCEIRO', 'BBAS3': 'FINANCEIRO', 'PETR4': 'PETROLEO',
    'VALE3': 'MINERACAO', 'ABEV3': 'AGRO', 'RENT3': 'TRANSPORTE', 'SUZB3': 'INDUSTRIA',
    'EGIE3': 'ENERGIA', 'ITSA4': 'FINANCEIRO', 'MGLU3': 'VAREJO', 'BBDC4': 'FINANCEIRO',
    'PRIO3': 'PETROLEO', 'VIVT3': 'TELECOMUNICACOES', 'RADL3': 'VAREJO', 'EMBR3': 'INDUSTRIA',
    'TOTS3': 'TECNOLOGIA', 'JBSS3': 'AGRO', 'CSAN3': 'ENERGIA', 'EQTL3': 'ENERGIA',
    'CCRO3': 'TRANSPORTE', 'BRFS3': 'AGRO', 'SBSP3': 'ENERGIA', 'AZZA3': 'VAREJO',
    'UGPA3': 'PETROLEO', 'RAIL3': 'TRANSPORTE', 'MULT3': 'CONSTRUCAO', 'TAEE11': 'ENERGIA',
    'CPFE3': 'ENERGIA', 'CPLE6': 'ENERGIA', 'ENGI11': 'ENERGIA', 'SAPR4': 'ENERGIA',
    'BEEF3': 'AGRO', 'MRVE3': 'CONSTRUCAO', 'DIRR3': 'CONSTRUCAO', 'TIMS3': 'TELECOMUNICACOES',
    'CMIN3': 'MINERACAO', 'BPAC11': 'FINANCEIRO', 'PETZ3': 'VAREJO', 'RDOR3': 'SAUDE'
}

const MAP_SEGMENTOS: Record<string, string> = {
    'MXRF11': 'RECEBIVEL', 'HGLG11': 'LOGISTICA', 'XPML11': 'SHOPPING', 'KNRI11': 'HIBRIDO',
    'VISC11': 'SHOPPING', 'BCFF11': 'HIBRIDO', 'BTLG11': 'LOGISTICA', 'HFOF11': 'HIBRIDO',
    'RBRF11': 'HIBRIDO', 'GGRC11': 'LOGISTICA', 'VILG11': 'LOGISTICA', 'BRCO11': 'LOGISTICA',
    'XPLG11': 'LOGISTICA', 'PATL11': 'LOGISTICA', 'LVBI11': 'LOGISTICA', 'VGIP11': 'RECEBIVEL',
    'KNCR11': 'RECEBIVEL', 'CPTS11': 'RECEBIVEL', 'RBRP11': 'CORPORATIVO', 'PVBI11': 'CORPORATIVO',
    'BPFF11': 'HIBRIDO', 'HABT11': 'RECEBIVEL', 'RZTR11': 'HIBRIDO', 'SARE11': 'CORPORATIVO'
}

export const brapiService = {
    async listarAtivos() {
        return cacheService.getOrSet('brapi_available_stocks', async () => {
            const token = process.env.BRAPI_TOKEN
            if (!token) {
                console.warn('⚠️  BRAPI_TOKEN não configurado, usando mock')
                return MOCK_ATIVOS
            }
            try {
                const { data } = await axios.get(`${BRAPI_BASE}/available`, { params: { token } })
                const stocks = data.stocks?.slice(0, 80) ?? []

                // Get Fundamentus data for enrichment
                const fundAcoes = await fundamentusService.scrapingAcoes()
                const fundFIIs = await fundamentusService.scrapingFIIs()

                // Convert list of strings into objects { ticker, nome }
                return stocks.map((s: string) => {
                    const mock = MOCK_ATIVOS.find(m => m.ticker === s)
                    const fAcao = fundAcoes.find(a => a.ticker === s)
                    const fFII = fundFIIs.find(f => f.ticker === s)

                    return {
                        ticker: s,
                        nome: mock?.nome || s,
                        preco: mock?.preco || 0,
                        variacao: mock?.variacao || 0,
                        variacaoPercent: mock?.variacaoPercent || 0,
                        setor: MAP_SETORES[s] || 'OUTROS',
                        segmento: MAP_SEGMENTOS[s] || 'OUTROS',
                        score: mock?.score || 0,
                        pl: fAcao ? fAcao.pl : (mock?.pl || 0),
                        pvp: fAcao ? fAcao.pvp : (fFII ? fFII.pvp : (mock?.pvp || 0)),
                        dy: fAcao ? fAcao.dy : (fFII ? fFII.dy : (mock?.dy || 0)),
                        roe: fAcao ? fAcao.roe : (mock?.roe || 0),
                        margemLiquida: fAcao ? fAcao.margemLiquida : (mock?.margemLiquida || 0)
                    }
                })
            } catch {
                return MOCK_ATIVOS
            }
        })
    },

    async buscarAtivo(ticker: string) {
        return cacheService.getOrSet(`brapi_quote_${ticker}`, async () => {
            const token = process.env.BRAPI_TOKEN
            if (!token) return MOCK_ATIVOS.find(a => a.ticker === ticker)
            try {
                const { data } = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, {
                    params: { token, fundamental: true, dividends: true }
                })
                const result = data.results?.[0]
                if (!result) return null

                // Mapear propriedades do BRAPI para o padrão esperado pelo nosso score.service
                const mapFundamentals = (res: any, fundAcoes: any[], fundFIIs: any[]) => {
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
                    const fundAcao = fundAcoes.find(a => a.ticker === res.symbol)
                    const fundFII = fundFIIs.find(f => f.ticker === res.symbol)

                    return {
                        ticker: res.symbol,
                        ...res,
                        setor: MAP_SETORES[res.symbol] || 'OUTROS',
                        segmento: MAP_SEGMENTOS[res.symbol] || (fundFII ? fundFII.segmento : 'OUTROS'),
                        pl: fundAcao ? fundAcao.pl : (res.priceEarnings != null ? res.priceEarnings : (mockInfo?.pl || 0)),
                        pvp: fundAcao ? fundAcao.pvp : (fundFII ? fundFII.pvp : ((price > 0 && res.regularMarketPreviousClose && res.earningsPerShare)
                            ? (price / (res.regularMarketPreviousClose / res.priceEarnings))
                            : (mockInfo?.pvp || 0))),
                        dy: fundAcao ? fundAcao.dy : (fundFII ? fundFII.dy : (dyScore > 0 ? dyScore : (mockInfo?.dy || 0))),
                        dyMensal: res.symbol.endsWith('11') ? (fundFII ? fundFII.dy / 12 : (dyMensal > 0 ? dyMensal : mockInfo?.dyMensal)) : undefined,
                        roe: fundAcao ? fundAcao.roe : (res.returnOnEquity != null && res.returnOnEquity !== 0 ? res.returnOnEquity * 100 : (mockInfo?.roe || 0)),
                        margemLiquida: fundAcao ? fundAcao.margemLiquida : (res.netMargin != null && res.netMargin !== 0 ? res.netMargin * 100 : (mockInfo?.margemLiquida || 0)),
                        vacancia: fundFII ? fundFII.vacancia : (res.vacancy != null ? res.vacancy : (mockInfo?.vacancia || undefined)),
                        liquidez: fundFII ? fundFII.liquidez : (res.regularMarketVolume || undefined),
                        score: mockInfo?.score || 0
                    }
                }

                // Need data for merging
                const fundAcoes = await fundamentusService.scrapingAcoes()
                const fundFIIs = await fundamentusService.scrapingFIIs()
                return mapFundamentals(result, fundAcoes, fundFIIs)
            } catch {
                return MOCK_ATIVOS.find(a => a.ticker === ticker)
            }
        })
    },

    async buscarHistorico(ticker: string, periodo = '1mo') {
        return cacheService.getOrSet(`brapi_history_${ticker}_${periodo}`, async () => {
            const token = process.env.BRAPI_TOKEN
            if (!token) return []
            try {
                const { data } = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, {
                    params: { token, range: periodo, interval: '1d', history: true }
                })
                return data.results?.[0]?.historicalDataPrice ?? []
            } catch {
                return []
            }
        })
    },

    async buscarVariosAtivos(tickers: string[]) {
        const token = process.env.BRAPI_TOKEN
        if (!token) return MOCK_ATIVOS.filter(a => tickers.includes(a.ticker))

        console.log(`🔍 [BRAPI] Buscando ${tickers.length} ativos individualmente (limite Brapi Free)`)

        const results: any[] = []
        const CONCURRENCY_LIMIT = 5

        for (let i = 0; i < tickers.length; i += CONCURRENCY_LIMIT) {
            const chunk = tickers.slice(i, i + CONCURRENCY_LIMIT)
            const chunkPromises = chunk.map(async (ticker) => {
                try {
                    const response = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, {
                        params: { token, fundamental: true }
                    })
                    return response.data.results?.[0]
                } catch (error: any) {
                    console.error(`❌ [BRAPI] Erro ao buscar ticker ${ticker}:`, error.message)
                    return null
                }
            })

            const chunkResults = await Promise.all(chunkPromises)
            results.push(...chunkResults.filter(r => r !== null))
        }

        // Enrich with Fundamentus data
        const fundAcoes = await fundamentusService.scrapingAcoes()
        const fundFIIs = await fundamentusService.scrapingFIIs()

        return results.map((res: any) => {
            const ticker = res.symbol
            const price = res.regularMarketPrice || 0
            const mockInfo = MOCK_ATIVOS.find(m => m.ticker === ticker)
            const fundAcao = fundAcoes.find(a => a.ticker === ticker)
            const fundFII = fundFIIs.find(f => f.ticker === ticker)

            // Approximation for DY
            let dyScore = 0
            if (res.dividendYield != null) {
                dyScore = res.dividendYield * 100
            }

            const isFii = ticker.endsWith('11')
            const setor = !isFii ? (MAP_SETORES[ticker] || 'OUTROS') : undefined
            const segmento = isFii ? (MAP_SEGMENTOS[ticker] || fundFII?.segmento || 'OUTROS') : undefined

            const baseData = {
                ticker,
                nome: res.longName || res.shortName || ticker,
                preco: price,
                variacao: res.regularMarketChange || 0,
                variacaoPercent: res.regularMarketChangePercent || 0,
                marketCap: res.marketCap,
                setor,
                segmento,
                // Metrics
                pl: isFii ? undefined : (fundAcao ? fundAcao.pl : (res.priceEarnings || mockInfo?.pl || 0)),
                pvp: fundAcao ? fundAcao.pvp : (fundFII ? fundFII.pvp : (mockInfo?.pvp || null)),
                dy: fundAcao ? fundAcao.dy : (fundFII ? fundFII.dy : (dyScore || mockInfo?.dy || 0)),
                roe: isFii ? undefined : (fundAcao ? fundAcao.roe : (res.returnOnEquity ? res.returnOnEquity * 100 : (mockInfo?.roe || 0))),
                margemLiquida: isFii ? undefined : (fundAcao ? fundAcao.margemLiquida : (res.netMargin ? res.netMargin * 100 : (mockInfo?.margemLiquida || 0))),
                dyMensal: isFii ? (fundFII ? fundFII.dy / 12 : (dyScore ? dyScore / 12 : 0)) : undefined,
                vacancia: isFii ? (fundFII ? fundFII.vacancia : undefined) : undefined,
            }

            // Import dynamically to avoid circular dependencies if any
            const { scoreService } = require('./score.service')
            const score = mockInfo?.score || scoreService.calcularScore(baseData)

            return { ...baseData, score }
        })
    },

    async buscarIndices() {
        const defaultIndices = [
            { ticker: 'IBOV', name: 'IBOVESPA', close: 128500, variation: 0.5 },
            { ticker: 'IFIX', name: 'IFIX', close: 3350, variation: 0.1 },
            { ticker: 'SELIC', name: 'SELIC', close: 10.75, variation: 0 }
        ]

        const token = process.env.BRAPI_TOKEN
        if (!token) return defaultIndices

        try {
            // Buscamos IBOV e IFIX individualmente
            const [ibovRes, ifixRes] = await Promise.all([
                axios.get(`${BRAPI_BASE}/quote/^BVSP`, { params: { token } }),
                axios.get(`${BRAPI_BASE}/quote/IFIX11`, { params: { token } })
            ])
            const ibov = ibovRes.data.results?.[0]
            const ifix = ifixRes.data.results?.[0]

            return [
                {
                    ticker: 'IBOV',
                    name: 'IBOVESPA',
                    close: ibov?.regularMarketPrice || 128500,
                    variation: ibov?.regularMarketChangePercent || 0
                },
                {
                    ticker: 'IFIX',
                    name: 'IFIX',
                    close: ifix?.regularMarketPrice || 3350,
                    variation: ifix?.regularMarketChangePercent || 0
                }
            ]
        } catch (error) {
            console.error('Erro ao buscar índices na Brapi:', error)
            return defaultIndices.filter(i => i.ticker !== 'SELIC')
        }
    },
}
