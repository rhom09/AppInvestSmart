import { useState, useEffect } from 'react'
import type { Noticia } from '@/types'

// Mock news since there's no backend news endpoint yet
const NOTICIAS_MOCK: Noticia[] = [
    {
        id: '1',
        titulo: 'IBOVESPA fecha em alta de 0,28% em sessão de cautela global',
        resumo: 'Bolsa brasileira encerrou o dia aos 189.307 pontos, sustentada por Petrobras e setor financeiro.',
        fonte: 'Valor Econômico',
        url: '#',
        publicadoEm: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        tickers: ['PETR4', 'BBAS3'],
        sentimento: 'POSITIVO',
    },
    {
        id: '2',
        titulo: 'Banco do Brasil (BBAS3) anuncia dividendos de R$ 0,42 por ação',
        resumo: 'Pagamento previsto para 28 de março com data-com em 14 de março.',
        fonte: 'InfoMoney',
        url: '#',
        publicadoEm: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        tickers: ['BBAS3'],
        sentimento: 'POSITIVO',
    },
    {
        id: '3',
        titulo: 'Selic em 10,75%: renda fixa ainda supera dividendos médios?',
        resumo: 'Análise mostra que a Selic atual requer DY acima de 9% para ações serem mais atrativas.',
        fonte: 'Exame Invest',
        url: '#',
        publicadoEm: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        tickers: [],
        sentimento: 'NEUTRO',
    },
    {
        id: '4',
        titulo: 'WEG (WEGE3) bate recorde de receita no 4T25 com expansão internacional',
        resumo: 'Resultado 18% acima do esperado pelo mercado. Margem EBITDA se manteve em 18,9%.',
        fonte: 'Bloomberg Brasil',
        url: '#',
        publicadoEm: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        tickers: ['WEGE3'],
        sentimento: 'POSITIVO',
    },
    {
        id: '5',
        titulo: 'Dólar recua para R$ 5,17 com dados de inflação americana abaixo do esperado',
        resumo: 'CPI dos EUA veio abaixo das projeções, aliviando pressão sobre mercados emergentes.',
        fonte: 'Reuters Brasil',
        url: '#',
        publicadoEm: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        tickers: [],
        sentimento: 'POSITIVO',
    },
]

export const useNoticias = () => {
    const [noticias, setNoticias] = useState<Noticia[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulates async fetch; swap for real API call when endpoint is ready
        const timer = setTimeout(() => {
            setNoticias(NOTICIAS_MOCK)
            setLoading(false)
        }, 800)
        return () => clearTimeout(timer)
    }, [])

    return { noticias, loading }
}
