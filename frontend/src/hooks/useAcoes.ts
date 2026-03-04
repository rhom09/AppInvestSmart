import { useState, useEffect, useCallback } from 'react'
import type { Ativo } from '@/types'
import { api } from '@/services/api'
import { ACOES_MOCK } from '@/data/mockData'

export const useAcoes = () => {
    const [acoes, setAcoes] = useState<Ativo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [busca, setBusca] = useState('')
    const [setor, setSetor] = useState('')
    const [ordenarPor, setOrdenarPor] = useState<keyof Ativo>('score')
    const [ordem, setOrdem] = useState<'asc' | 'desc'>('desc')

    const fetchAcoes = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/acoes')
            if (data.success) {
                setAcoes(data.data)
            }
            setError(null)
        } catch {
            setError('Falha ao carregar ações')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAcoes() }, [fetchAcoes])

    const acoesFiltradas = acoes
        .filter(a => {
            const matchBusca = !busca || a.ticker.toLowerCase().includes(busca.toLowerCase()) || a.nome.toLowerCase().includes(busca.toLowerCase())
            const matchSetor = !setor || a.setor === setor
            return matchBusca && matchSetor
        })
        .sort((a, b) => {
            const va = a[ordenarPor] as number
            const vb = b[ordenarPor] as number
            return ordem === 'desc' ? vb - va : va - vb
        })

    return { acoes: acoesFiltradas, loading, error, busca, setBusca, setor, setSetor, ordenarPor, setOrdenarPor, ordem, setOrdem, refetch: fetchAcoes }
}
