import { api } from './api'
import type { Ativo } from '@/types'

// ─── Buscar cotações da BRAPI (via backend proxy) ─────────────────
export const fetchCotacoes = async (tickers: string[]): Promise<Ativo[]> => {
    try {
        const tickersStr = tickers.join(',')
        const { data } = await api.get(`/acoes/${tickersStr}`)
        // Se o backend retorna um único ativo ou lista
        const results = Array.isArray(data.data) ? data.data : [data.data]
        return results.map((r: any) => ({
            ticker: r.ticker,
            nome: r.nome,
            preco: r.preco,
            variacao: r.variacao,
            variacaoPercent: r.variacaoPercent,
            volume: r.volume,
            marketCap: r.marketCap,
        }))
    } catch (err) {
        console.error('Erro ao buscar cotações:', err)
        return []
    }
}

// ─── Buscar lista de ativos (via backend proxy) ─────────────────────
export const fetchAtivos = async (): Promise<Ativo[]> => {
    try {
        const { data } = await api.get('/acoes')
        return data.data || []
    } catch (err) {
        console.error('Erro ao listar ativos:', err)
        return []
    }
}

export const fetchAtivoPorTicker = async (ticker: string): Promise<Ativo | undefined> => {
    try {
        const { data } = await api.get(`/acoes/${ticker}`)
        return data.data
    } catch {
        return undefined
    }
}
