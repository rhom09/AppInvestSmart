import { useState, useCallback, useRef, useEffect } from 'react'
import { X, Search, Plus, Loader2 } from 'lucide-react'
import { api } from '@/services/api'
import { adicionarAtivo } from '@/services/carteira.service'
import { useAuth } from '@/hooks/useAuth'
import { useCarteiraStore } from '@/store/carteira.store'
import { formatMoeda } from '@/utils/formatters'
import type { Ativo } from '@/types'
import type { CarteiraAtivo } from '@/services/carteira.service'

interface Props {
    onClose: () => void
}

const TIPOS = [
    { value: 'acao', label: 'Ação' },
    { value: 'fii', label: 'FII' },
    { value: 'etf', label: 'ETF' },
    { value: 'renda_fixa', label: 'Renda Fixa' },
]

export const ModalAdicionarAtivo = ({ onClose }: Props) => {
    const { user } = useAuth()
    const { adicionarItem } = useCarteiraStore()

    const [query, setQuery] = useState('')
    const [resultados, setResultados] = useState<Ativo[]>([])
    const [buscando, setBuscando] = useState(false)
    const [selecionado, setSelecionado] = useState<Ativo | null>(null)

    const [tipo, setTipo] = useState<CarteiraAtivo['tipo']>('acao')
    const [quantidade, setQuantidade] = useState('')
    const [precoMedio, setPrecoMedio] = useState('')
    const [dataCompra, setDataCompra] = useState(new Date().toISOString().slice(0, 10))

    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Search with 400ms debounce
    const buscar = useCallback((q: string) => {
        setQuery(q)
        setSelecionado(null)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (!q.trim()) { setResultados([]); return }

        debounceRef.current = setTimeout(async () => {
            setBuscando(true)
            try {
                // Backend returns all assets on /acoes (either array of objects or strings if BRAPI)
                const { data } = await api.get<{ data: any[] }>('/acoes')
                const list = Array.isArray(data.data) ? data.data : []

                // Normalize strings to Ativo format
                const ativosNormalizados: Ativo[] = list.map(item =>
                    typeof item === 'string'
                        ? { ticker: item, nome: item, preco: 0, variacao: 0, variacaoPercent: 0 }
                        : item
                )

                // Filter locally for autocomplete
                const searchQ = q.toUpperCase()
                const filtrados = ativosNormalizados.filter(a =>
                    a.ticker.toUpperCase().includes(searchQ) ||
                    (a.nome && a.nome.toUpperCase().includes(searchQ))
                ).slice(0, 6)

                setResultados(filtrados)
            } catch {
                setResultados([])
            } finally {
                setBuscando(false)
            }
        }, 400)
    }, [])

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const selecionar = async (ativoOriginal: Ativo) => {
        // Sempre garante o ticker do item clicado — nunca deixa vir da API raw
        const tickerGarantido = ativoOriginal.ticker

        setQuery(tickerGarantido)
        setResultados([])

        // Se preco === 0, o ativo veio como string pura da lista — busca o detalhe real
        if (ativoOriginal.preco === 0) {
            setBuscando(true)
            try {
                const { data } = await api.get<{ data: any; success: boolean }>(`/acoes/${tickerGarantido}`)
                if (data.success && data.data) {
                    const precoReal = data.data.preco || data.data.regularMarketPrice || 0
                    // Força o ticker correto — BRAPI raw usa 'symbol', não 'ticker'
                    const ativoCompleto: Ativo = {
                        ...data.data,
                        ticker: tickerGarantido,
                        preco: precoReal,
                    }
                    setSelecionado(ativoCompleto)
                    setPrecoMedio(precoReal > 0 ? String(precoReal) : '')
                    return
                }
            } catch (e) {
                console.error('Erro ao buscar detalhe do ativo', e)
            } finally {
                setBuscando(false)
            }
        }

        // Ativo já tinha preço — usa direto (também garante ticker)
        const precoReal = ativoOriginal.preco || (ativoOriginal as any).regularMarketPrice || 0
        setSelecionado({ ...ativoOriginal, ticker: tickerGarantido, preco: precoReal })
        setPrecoMedio(precoReal > 0 ? String(precoReal) : '')
    }

    const handleSalvar = async () => {
        if (!selecionado) { setErro('Selecione um ativo.'); return }
        if (!quantidade || Number(quantidade) <= 0) { setErro('Informe a quantidade.'); return }
        if (!precoMedio || Number(precoMedio) <= 0) { setErro('Informe o preço médio.'); return }

        setSalvando(true)
        setErro(null)

        try {
            const ativoData: Omit<CarteiraAtivo, 'id' | 'created_at'> = {
                user_id: user?.id,
                ticker: selecionado.ticker,
                tipo,
                quantidade: Number(quantidade),
                preco_medio: Number(precoMedio),
                data_compra: dataCompra || undefined,
            }

            // Save to Supabase if user is logged in; otherwise keep it local only
            if (user) {
                await adicionarAtivo(ativoData)
            }

            // Always add to local zustand store (works for guests too)
            const precoAtual = selecionado.preco
            const totalInvestido = Number(quantidade) * Number(precoMedio)
            const totalAtual = Number(quantidade) * precoAtual
            const resultado = totalAtual - totalInvestido

            adicionarItem({
                ticker: selecionado.ticker,
                nome: selecionado.nome,
                tipo: tipo === 'acao' ? 'ACAO' : tipo === 'fii' ? 'FII' : tipo === 'etf' ? 'ETF' : 'RENDA_FIXA',
                quantidade: Number(quantidade),
                precoMedio: Number(precoMedio),
                precoAtual,
                totalInvestido,
                totalAtual,
                resultado,
                resultadoPercent: totalInvestido > 0 ? (resultado / totalInvestido) * 100 : 0,
                percentCarteira: 0,
            })

            onClose()
        } catch (err: unknown) {
            setErro(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
        } finally {
            setSalvando(false)
        }
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-bg-card border border-surface-border rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-surface-border">
                        <div className="flex items-center gap-2">
                            <Plus size={18} className="text-primary" />
                            <h2 className="font-semibold text-text-primary">Adicionar Ativo</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-elevated transition-colors"
                        >
                            <X size={16} className="text-text-muted" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-4">
                        {/* Ticker search */}
                        <div>
                            <label className="text-xs text-text-secondary mb-1.5 block font-medium">
                                Buscar ticker
                            </label>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    className="input pl-9 w-full text-sm"
                                    placeholder="Ex: WEGE3, MXRF11..."
                                    value={query}
                                    onChange={e => buscar(e.target.value)}
                                    autoFocus
                                />
                                {buscando && (
                                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
                                )}

                                {/* Autocomplete dropdown */}
                                {resultados.length > 0 && (
                                    <div
                                        className="mt-1 bg-bg-elevated border border-surface-border rounded-xl shadow-xl"
                                        style={{ width: '100%', maxHeight: '200px', overflowY: 'auto', position: 'absolute', zIndex: 50 }}
                                    >
                                        {resultados.map(a => (
                                            <button
                                                key={a.ticker}
                                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-bg-card transition-colors text-left"
                                                onClick={() => selecionar(a)}
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-text-primary">{a.ticker}</p>
                                                    <p className="text-xs text-text-muted truncate max-w-[200px]">{a.nome}</p>
                                                </div>
                                                <span className="text-sm font-semibold text-primary">
                                                    {a.preco > 0 ? formatMoeda(a.preco) : ''}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="text-xs text-text-secondary mb-1.5 block font-medium">Tipo</label>
                            <div className="grid grid-cols-4 gap-2">
                                {TIPOS.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => setTipo(t.value as CarteiraAtivo['tipo'])}
                                        className={`py-2 text-xs font-semibold rounded-lg border transition-all ${tipo === t.value
                                            ? 'bg-primary text-bg-primary border-primary'
                                            : 'border-surface-border text-text-muted hover:border-primary/40'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity & average price */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-text-secondary mb-1.5 block font-medium">Quantidade</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="input w-full text-sm"
                                    placeholder="100"
                                    value={quantidade}
                                    onChange={e => setQuantidade(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-secondary mb-1.5 block font-medium">Preço médio (R$)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="input w-full text-sm"
                                    placeholder="42.10"
                                    value={precoMedio}
                                    onChange={e => setPrecoMedio(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div>
                            <label className="text-xs text-text-secondary mb-1.5 block font-medium">Data de compra</label>
                            <input
                                type="date"
                                className="input w-full text-sm"
                                value={dataCompra}
                                onChange={e => setDataCompra(e.target.value)}
                            />
                        </div>

                        {/* Preview */}
                        {selecionado && quantidade && precoMedio && (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex justify-between text-sm">
                                <span className="text-text-secondary">Total investido</span>
                                <span className="font-bold text-primary">
                                    {formatMoeda(Number(quantidade) * Number(precoMedio))}
                                </span>
                            </div>
                        )}

                        {/* Error */}
                        {erro && (
                            <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                                {erro}
                            </p>
                        )}

                        {/* Guest notice when not logged in */}
                        {!user && (
                            <p className="text-xs text-text-muted text-center">
                                💡 Você não está logado — o ativo será adicionado apenas neste dispositivo.{' '}
                                <a href="/login" className="text-primary underline">Entrar</a> para sincronizar.
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-5 pt-0 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-surface-border text-text-secondary hover:bg-bg-elevated text-sm font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSalvar}
                            disabled={salvando || !selecionado}
                            className="flex-1 py-2.5 rounded-xl bg-primary text-bg-primary font-semibold text-sm transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {salvando ? (
                                <><Loader2 size={14} className="animate-spin" /> Salvando...</>
                            ) : (
                                <><Plus size={14} /> Adicionar à Carteira</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
