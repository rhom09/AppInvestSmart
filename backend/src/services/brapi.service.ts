import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const BRAPI_BASE = 'https://brapi.dev/api'
const TOKEN = process.env.BRAPI_TOKEN

// Mock data quando BRAPI não está disponível
const MOCK_ATIVOS = [
    { ticker: 'PETR4', nome: 'Petrobras PN', preco: 34.50, variacao: 0.45, variacaoPercent: 1.32 },
    { ticker: 'VALE3', nome: 'Vale ON', preco: 68.20, variacao: -1.35, variacaoPercent: -1.94 },
    { ticker: 'BBAS3', nome: 'Banco do Brasil ON', preco: 24.80, variacao: 0.30, variacaoPercent: 1.22 },
]

export const brapiService = {
    async listarAtivos() {
        if (!TOKEN) {
            console.warn('⚠️  BRAPI_TOKEN não configurado, usando mock')
            return MOCK_ATIVOS
        }
        try {
            const { data } = await axios.get(`${BRAPI_BASE}/available`, { params: { token: TOKEN } })
            return data.stocks?.slice(0, 50) ?? MOCK_ATIVOS
        } catch {
            return MOCK_ATIVOS
        }
    },

    async buscarAtivo(ticker: string) {
        if (!TOKEN) return MOCK_ATIVOS.find(a => a.ticker === ticker)
        try {
            const { data } = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, { params: { token: TOKEN } })
            return data.results?.[0]
        } catch {
            return MOCK_ATIVOS.find(a => a.ticker === ticker)
        }
    },

    async buscarHistorico(ticker: string, periodo = '1mo') {
        if (!TOKEN) return []
        try {
            const { data } = await axios.get(`${BRAPI_BASE}/quote/${ticker}`, {
                params: { token: TOKEN, range: periodo, interval: '1d', history: true }
            })
            return data.results?.[0]?.historicalDataPrice ?? []
        } catch {
            return []
        }
    },
}
