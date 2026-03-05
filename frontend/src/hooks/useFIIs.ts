import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import type { FII } from '@/types'

export const useFIIs = () => {
    const [fiis, setFiis] = useState<FII[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState('')
    const [segmento, setSegmento] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const limit = 12

    useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            try {
                const { data } = await api.get('/fiis', {
                    params: { page, limit }
                })
                if (data.success) {
                    setFiis(data.data)
                    setTotal(data.total)
                    setTotalPages(data.totalPages)
                }
            } catch (err) {
                console.error('Erro ao buscar FIIs:', err)
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [page])

    // Reset para primeira página ao filtrar ou buscar
    useEffect(() => {
        setPage(1)
    }, [busca, segmento])

    // Filtro local apenas para busca pontual na página atual, ou podemos expandir o backend se necessário
    // Dado que o usuário pediu Cards e Skeleton, a paginação servidor é o foco.
    const fiisFiltered = fiis.filter(f => {
        const matchBusca = !busca || f.ticker.toLowerCase().includes(busca.toLowerCase()) || f.nome.toLowerCase().includes(busca.toLowerCase())
        const matchSeg = !segmento || f.segmento === segmento
        return matchBusca && matchSeg
    })

    return {
        fiis: fiisFiltered,
        loading,
        busca,
        setBusca,
        segmento,
        setSegmento,
        page,
        setPage,
        totalPages,
        total
    }
}
