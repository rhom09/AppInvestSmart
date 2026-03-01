import { brapiApi } from './api'
import type { Ativo } from '@/types'
import { ACOES_MOCK } from '@/data/mockData'

// ─── Buscar cotações da BRAPI (fallback para mock) ─────────────────
export const fetchCotacoes = async (tickers: string[]): Promise<Ativo[]> => {
    try {
        const tickersStr = tickers.join(',')
        const { data } = await brapiApi.get(`/quote/${tickersStr}`)
        return data.results?.map((r: Record<string, unknown>) => ({
            ticker: r.symbol,
            nome: r.longName,
            preco: r.regularMarketPrice,
            variacao: r.regularMarketChange,
            variacaoPercent: r.regularMarketChangePercent,
            volume: r.regularMarketVolume,
            marketCap: r.marketCap,
        })) ?? ACOES_MOCK
    } catch {
        console.warn('BRAPI indisponível, usando mock')
        return ACOES_MOCK.filter(a => tickers.includes(a.ticker))
    }
}

// ─── Buscar lista de ativos (com fallback para mock) ───────────────
export const fetchAtivos = async (): Promise<Ativo[]> => {
    try {
        const { data } = await brapiApi.get('/available')
        console.log(`BRAPI: ${data.stocks?.length} ativos disponíveis`)
        return ACOES_MOCK // retorna mock com fundamentais
    } catch {
        return ACOES_MOCK
    }
}

export const fetchAtivoPorTicker = async (ticker: string): Promise<Ativo | undefined> => {
    return ACOES_MOCK.find(a => a.ticker === ticker)
}
