import { supabase } from './supabase'
import type { ItemCarteira } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────
export interface CarteiraAtivo {
    id?: string
    user_id?: string
    ticker: string
    tipo: 'acao' | 'fii' | 'etf' | 'renda_fixa'
    quantidade: number
    preco_medio: number
    data_compra?: string
    created_at?: string
}

// ─── CRUD ─────────────────────────────────────────────────────────────────

/** Insere um novo ativo na carteira do usuário */
export const adicionarAtivo = async (ativo: Omit<CarteiraAtivo, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
        .from('carteira_ativos')
        .insert(ativo)
        .select()
        .single()
    if (error) throw error
    return data as CarteiraAtivo
}

/** Remove um ativo pelo ID */
export const removerAtivo = async (id: string) => {
    const { error } = await supabase
        .from('carteira_ativos')
        .delete()
        .eq('id', id)
    if (error) throw error
}

/** Busca todos os ativos de um usuário */
export const getCarteira = async (userId: string): Promise<CarteiraAtivo[]> => {
    const { data, error } = await supabase
        .from('carteira_ativos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as CarteiraAtivo[]
}

/**
 * Calcula o patrimônio somando quantidade × preço atual de cada ativo.
 * cotacoes: map de ticker → preço atual (obtido da API)
 */
export const calcularPatrimonio = (
    carteira: CarteiraAtivo[],
    cotacoes: Record<string, number>
): number =>
    carteira.reduce((total, ativo) => {
        const precoAtual = cotacoes[ativo.ticker] ?? ativo.preco_medio
        return total + ativo.quantidade * precoAtual
    }, 0)

/**
 * Converte um CarteiraAtivo do Supabase em um ItemCarteira para o store local.
 * Requer o preço atual do ticker.
 */
export const toItemCarteira = (ativo: CarteiraAtivo, precoAtual: number): ItemCarteira => {
    const totalInvestido = ativo.quantidade * ativo.preco_medio
    const totalAtual = ativo.quantidade * precoAtual
    const resultado = totalAtual - totalInvestido
    return {
        ticker: ativo.ticker,
        nome: ativo.ticker,
        tipo: ativo.tipo === 'acao'
            ? 'ACAO'
            : ativo.tipo === 'fii'
                ? 'FII'
                : ativo.tipo === 'etf'
                    ? 'ETF'
                    : 'RENDA_FIXA',
        quantidade: ativo.quantidade,
        precoMedio: ativo.preco_medio,
        precoAtual,
        totalInvestido,
        totalAtual,
        resultado,
        resultadoPercent: totalInvestido > 0 ? (resultado / totalInvestido) * 100 : 0,
        percentCarteira: 0, // caller calculates proportions
    }
}
