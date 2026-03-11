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

export const TICKERS_ACOES = [
    'WEGE3', 'ITUB4', 'BBAS3', 'PETR4', 'VALE3', 'ABEV3', 'RENT3', 'SUZB3', 'EGIE3', 'ITSA4',
    'MGLU3', 'BBDC4', 'PRIO3', 'VIVT3', 'RADL3', 'EMBR3', 'TOTS3', 'JBSS3', 'CSAN3', 'EQTL3',
    'CCRO3', 'BRFS3', 'SBSP3', 'AZZA3', 'UGPA3', 'RAIL3', 'MULT3', 'TAEE11', 'CPFE3', 'CPLE6',
    'ENGI11', 'SAPR4', 'BEEF3', 'MRVE3', 'DIRR3', 'TIMS3', 'CMIN3', 'BPAC11', 'PETZ3', 'RDOR3',
    // Novos ativos (Expansão 100)
    'BBSE3', 'CMIG4', 'TRPL4', 'SAPR11', 'ELET3', 'ELET6', 'AURE3', 'ENEV3', 'CSMG3', 'POMO4',
    'TUPY3', 'FRAS3', 'MRFG3', 'SMLS3', 'GOLL4', 'AZUL4', 'ECOR3', 'STBP3', 'PSSA3', 'SULA11',
    'BBDC3', 'SANB11', 'SMTO3', 'SLCE3', 'AGRO3', 'TTEN3', 'LJQQ3', 'SOMA3', 'VIVA3', 'ARZZ3',
    'SBFG3', 'HYPE3', 'FLRY3', 'HAPV3', 'GNDI3', 'ODPV3', 'DASA3', 'QUAL3', 'PARD3', 'CVCB3',
    'DESK3', 'LWSA3', 'CASH3', 'INTB3', 'MLAS3', 'OIBR3', 'TELB4', 'FIQE3', 'EQPA3', 'CGAS5',
    // Expansão Fase 2 (~50 ativos)
    'ALPA4', 'ANIM3', 'ATOM3', 'BLAU3', 'BMGB4', 'BRKM5', 'CBAV3', 'CMIN3', 'CSNA3', 'CXSE3',
    'DIRR3', 'DMMO3', 'DXCO3', 'ENAT3', 'ESPA3', 'EVEN3', 'EZTC3', 'FESA4', 'GFSA3', 'GRND3',
    'HBSA3', 'INEP4', 'IRBR3', 'JFEN3', 'JHSF3', 'KEPL3', 'KLBN11', 'LEVE3', 'LOGG3', 'LREN3',
    'MDIA3', 'MEGA3', 'MILS3', 'MOVI3', 'MRVE3', 'MULT3', 'MYPK3', 'NCAB3', 'NEOE3', 'NGRD3',
    'NIGO3', 'NTCO3', 'NUBD3', 'ONCO3', 'ORVR3', 'PETZ3', 'PLPL3', 'PMAM3', 'PNVL3', 'PTBL3'
]

export const TICKERS_FIIS = [
    'MXRF11', 'HGLG11', 'XPML11', 'KNRI11', 'VISC11', 'BCFF11', 'BTLG11', 'HFOF11',
    'RBRF11', 'GGRC11', 'VILG11', 'BRCO11', 'XPLG11', 'PATL11', 'LVBI11', 'VGIP11',
    'KNCR11', 'CPTS11', 'RBRP11', 'PVBI11', 'BPFF11', 'HABT11', 'RZTR11', 'SARE11',
    // Novos FIIs (Expansão 48)
    'HSML11', 'RBRR11', 'XPCI11', 'VRTA11', 'HCTR11', 'IRDM11', 'RZAG11', 'MALL11',
    'ABCP11', 'BRCR11', 'FVPQ11', 'JSAF11', 'RCRB11', 'VPSI11', 'MGFF11', 'OUJP11',
    'HGRU11', 'VINO11', 'URPR11', 'GTWR11', 'TGAR11', 'RBVA11', 'ALZR11', 'VGHF11',
    // Expansão Fase 2 (~10 FIIs)
    'BTCI11', 'CVBI11', 'DEVA11', 'EDGA11', 'HGBS11', 'HGPO11', 'RBCO11', 'RECR11', 'REIT11', 'VSHO11'
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
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
        const cacheKey = `brapi_history_${ticker}_${periodo}`
        return cacheService.getOrSet(cacheKey, async () => {
            const token = process.env.BRAPI_TOKEN
            if (!token) return []
            try {
                const { data } = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, {
                    params: { token, range: periodo, interval: '1d', history: true }
                })
                return data.results?.[0]?.historicalDataPrice ?? []
            } catch (error: any) {
                // FALLBACK: Se der erro (ex: 400 Bad Request por limite de plano em FIIs)
                // e o range for longo (6mo ou 1y), tentamos o máximo do plano free (3mo)
                if (error.response?.status === 400 && (periodo === '6mo' || periodo === '1y')) {
                    console.warn(`⚠️ [BRAPI] ${ticker}: Range "${periodo}" negado. Tentando fallback para "3mo"...`)
                    try {
                        const { data: fallbackData } = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, {
                            params: { token, range: '3mo', interval: '1d', history: true }
                        })
                        console.log(`✅ [BRAPI] ${ticker}: Fallback "3mo" funcionou.`)
                        return fallbackData.results?.[0]?.historicalDataPrice ?? []
                    } catch (fallbackErr: any) {
                        console.error(`❌ [BRAPI] ${ticker}: Erro no fallback "3mo":`, fallbackErr.message)
                        return []
                    }
                }
                return []
            }
        })
    },

    async buscarVariosAtivos(tickers: string[]) {
        const token = process.env.BRAPI_TOKEN
        if (!token) return MOCK_ATIVOS.filter(a => tickers.includes(a.ticker))

        console.log(`🔍 [BRAPI] Buscando ${tickers.length} ativos sequencialmente (Rate Limit Fix)`)

        const allResults: any[] = []
        const DELAY_MS = 1000

        for (let i = 0; i < tickers.length; i++) {
            const ticker = tickers[i]
            try {
                const response = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, {
                    params: { token, fundamental: true }
                })
                const result = response.data.results?.[0]
                if (result) {
                    allResults.push(result)
                } else {
                    const mock = MOCK_ATIVOS.find(m => m.ticker === ticker)
                    allResults.push({ 
                        symbol: ticker, 
                        longName: mock?.nome || ticker, 
                        regularMarketPrice: mock?.preco || 0, 
                        regularMarketChange: mock?.variacao || 0, 
                        regularMarketChangePercent: mock?.variacaoPercent || 0 
                    })
                }
            } catch (error: any) {
                if (error.response?.status === 429) {
                    console.error(`🛑 [BRAPI] Rate Limit atingido em ${ticker}. Usando dados básicos para o restante.`)
                    for (let j = i; j < tickers.length; j++) {
                        const remainingTicker = tickers[j]
                        const mock = MOCK_ATIVOS.find(m => m.ticker === remainingTicker)
                        allResults.push({ 
                            symbol: remainingTicker, 
                            longName: mock?.nome || remainingTicker, 
                            regularMarketPrice: mock?.preco || 0, 
                            regularMarketChange: mock?.variacao || 0, 
                            regularMarketChangePercent: mock?.variacaoPercent || 0 
                        })
                    }
                    break 
                }
                
                console.error(`❌ [BRAPI] Falha em ${ticker}: ${error.message}. Tentando Dados Básicos...`)
                const mock = MOCK_ATIVOS.find(m => m.ticker === ticker)
                allResults.push({ 
                    symbol: ticker, 
                    longName: mock?.nome || ticker, 
                    regularMarketPrice: mock?.preco || 0, 
                    regularMarketChange: mock?.variacao || 0, 
                    regularMarketChangePercent: mock?.variacaoPercent || 0 
                })
            }

            if (i < tickers.length - 1) {
                await sleep(DELAY_MS)
            }
        }

        const results = allResults

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
            // Brapi costuma usar ^BVSP ou IBOV, e IFIX ou IFIX.SA ou IFIX11
            const [ibovRes, ifixRes] = await Promise.all([
                axios.get(`${BRAPI_BASE}/quote/IBOV`, { params: { token } }).catch(() => axios.get(`${BRAPI_BASE}/quote/^BVSP`, { params: { token } })),
                axios.get(`${BRAPI_BASE}/quote/IFIX`, { params: { token } }).catch(() => axios.get(`${BRAPI_BASE}/quote/IFIX11`, { params: { token } }))
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
