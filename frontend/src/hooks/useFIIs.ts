import { useState, useEffect } from 'react'
import type { FII } from '@/types'
import { FIIS_MOCK } from '@/data/mockData'

export const useFIIs = () => {
    const [fiis, setFiis] = useState<FII[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState('')
    const [segmento, setSegmento] = useState('')

    useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            await new Promise(r => setTimeout(r, 500))
            setFiis(FIIS_MOCK)
            setLoading(false)
        }
        fetch()
    }, [])

    const fiisFiltered = fiis.filter(f => {
        const matchBusca = !busca || f.ticker.toLowerCase().includes(busca.toLowerCase()) || f.nome.toLowerCase().includes(busca.toLowerCase())
        const matchSeg = !segmento || f.segmento === segmento
        return matchBusca && matchSeg
    })

    return { fiis: fiisFiltered, loading, busca, setBusca, segmento, setSegmento }
}
