import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import type { FII } from '@/types'

export const useFIIs = () => {
    const [fiis, setFiis] = useState<FII[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState('')
    const [segmento, setSegmento] = useState('')

    useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            try {
                const { data } = await api.get('/acoes')
                if (data.success) {
                    // Simples filtro por sufixo 11 (característica de FIIs)
                    const filtered = data.data.filter((a: any) =>
                        a.ticker?.endsWith('11') || a.type === 'fii'
                    )
                    setFiis(filtered)
                }
            } catch (err) {
                console.error('Erro ao buscar FIIs:', err)
            } finally {
                setLoading(false)
            }
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
