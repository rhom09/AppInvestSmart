import { useState, useEffect, useCallback } from 'react'
import type { Ativo } from '@/types'
import { api } from '@/services/api'
import { ACOES_MOCK } from '@/data/mockData'

export const useAcoes = (initialPage = 1, initialLimit = 20) => {
    const [acoes, setAcoes] = useState<Ativo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(initialPage)
    const [limit, setLimit] = useState(initialLimit)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(0)

    const [busca, setBusca] = useState('')
    const [setor, setSetor] = useState('')
    const [ordenarPor, setOrdenarPor] = useState<keyof Ativo>('score')
    const [ordem, setOrdem] = useState<'asc' | 'desc'>('desc')

    const fetchAcoes = useCallback(async () => {
        setLoading(true)
        try {
            const { data } = await api.get('/acoes', {
                params: { page, limit }
            })
            if (data.success && Array.isArray(data.data)) {
                setAcoes(data.data)
                setTotal(data.total || data.data.length)
                setTotalPages(data.totalPages || 1)
            }
            setError(null)
        } catch {
            setError('Falha ao carregar ações')
        } finally {
            setLoading(false)
        }
    }, [page, limit])

    useEffect(() => { fetchAcoes() }, [fetchAcoes])

    // Reset para primeira página ao filtrar ou buscar
    useEffect(() => {
        setPage(1)
    }, [busca, setor])

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

    return {
        acoes: acoesFiltradas,
        loading,
        error,
        busca,
        setBusca,
        setor,
        setSetor,
        ordenarPor,
        setOrdenarPor,
        ordem,
        setOrdem,
        page,
        setPage,
        limit,
        setLimit,
        total,
        totalPages,
        refetch: fetchAcoes
    }
}
