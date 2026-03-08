import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/services/api'

interface SearchResult {
    ticker: string
    nome: string
    tipo: 'ACAO' | 'FII'
    preco: number
    variacao: number
}

export const GlobalSearch = () => {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [searched, setSearched] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const navigate = useNavigate()

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // Debounced search
    const doSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults([])
            setOpen(false)
            setSearched(false)
            return
        }
        setLoading(true)
        setSearched(false)
        try {
            const { data: res } = await api.get(`/busca?q=${encodeURIComponent(q)}`)
            setResults(res.data ?? [])
            setSearched(true)
            setOpen(true)
        } catch {
            setResults([])
            setSearched(true)
        } finally {
            setLoading(false)
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setQuery(val)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => doSearch(val), 300)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setOpen(false)
            setQuery('')
        }
    }

    const handleSelect = (result: SearchResult) => {
        setOpen(false)
        setQuery('')
        const path = result.tipo === 'FII' ? '/fiis' : '/acoes'
        navigate(path)
    }

    const grouped = {
        ACAO: results.filter(r => r.tipo === 'ACAO'),
        FII: results.filter(r => r.tipo === 'FII'),
    }

    const formatPreco = (v: number) =>
        v > 0
            ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
            : '—'

    return (
        <div ref={containerRef} className="relative flex-1 max-w-md">
            {/* Input */}
            <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10"
            />
            {loading && (
                <Loader2
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted animate-spin z-10"
                />
            )}
            <input
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (results.length > 0) setOpen(true) }}
                placeholder="Buscar ativo, ticker, FII..."
                className="input pl-9 pr-8 h-9 text-sm w-full"
                autoComplete="off"
            />

            {/* Dropdown */}
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        background: '#0e1120',
                        border: '1px solid #1e2438',
                        borderRadius: '12px',
                        zIndex: 9999,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
                        overflow: 'hidden',
                    }}
                >
                    {results.length === 0 && searched ? (
                        <div className="px-4 py-5 text-center text-text-muted text-sm">
                            Nenhum resultado para <span className="font-semibold text-text-primary">"{query}"</span>
                        </div>
                    ) : (
                        <div className="py-2">
                            {(['ACAO', 'FII'] as const).map(tipo => {
                                const items = grouped[tipo]
                                if (items.length === 0) return null
                                return (
                                    <div key={tipo}>
                                        <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                                            {tipo === 'ACAO' ? 'Ações' : 'FIIs'}
                                        </p>
                                        {items.map(result => (
                                            <button
                                                key={result.ticker}
                                                onMouseDown={() => handleSelect(result)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                                            >
                                                {/* Ticker badge */}
                                                <div className="w-10 h-10 rounded-xl bg-surface-border flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] font-black text-primary leading-none text-center px-0.5">
                                                        {result.ticker}
                                                    </span>
                                                </div>
                                                {/* Name */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-text-primary leading-tight">
                                                        {result.ticker}
                                                    </p>
                                                    <p className="text-xs text-text-muted truncate leading-tight">
                                                        {result.nome}
                                                    </p>
                                                </div>
                                                {/* Price & Variation */}
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-semibold text-text-primary">
                                                        {formatPreco(result.preco)}
                                                    </p>
                                                    <p
                                                        className={`text-xs font-semibold flex items-center gap-0.5 justify-end ${result.variacao >= 0 ? 'text-primary' : 'text-danger'
                                                            }`}
                                                    >
                                                        {result.variacao >= 0
                                                            ? <TrendingUp size={10} />
                                                            : <TrendingDown size={10} />
                                                        }
                                                        {result.variacao !== 0
                                                            ? `${result.variacao >= 0 ? '+' : ''}${result.variacao.toFixed(2)}%`
                                                            : '—'
                                                        }
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
