import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ResumoCarteira, ItemCarteira } from '@/types'
import { CARTEIRA_MOCK } from '@/data/mockData'
import { removerAtivo } from '@/services/carteira.service'

interface CarteiraState {
    carteira: ResumoCarteira
    loading: boolean
    adicionarItem: (item: ItemCarteira) => void
    /** supabaseId: row id from Supabase (undefined for guest-only items) */
    removerItem: (supabaseId: string | undefined, itemId: string) => Promise<void>
    atualizarPrecos: (precos: Record<string, number>) => void
    fetchCarteira: () => Promise<void>
}

export const useCarteiraStore = create<CarteiraState>()(
    persist(
        (set, get) => ({
            carteira: CARTEIRA_MOCK,
            loading: false,

            adicionarItem: (item) => {
                const { carteira } = get()
                const novosItens = [...carteira.itens, item]
                const totalAtual = novosItens.reduce((s, i) => s + i.totalAtual, 0)
                const totalInvestido = novosItens.reduce((s, i) => s + i.totalInvestido, 0)
                set({
                    carteira: {
                        ...carteira,
                        itens: novosItens,
                        totalAtual,
                        totalInvestido,
                        resultado: totalAtual - totalInvestido,
                        resultadoPercent: ((totalAtual - totalInvestido) / totalInvestido) * 100,
                    },
                })
            },

            removerItem: async (supabaseId, itemId) => {
                // Delete from Supabase if the user is logged in and ID is known
                if (supabaseId) {
                    try {
                        await removerAtivo(supabaseId)
                    } catch (e) {
                        console.error('Erro ao remover ativo do Supabase:', e)
                    }
                }
                // Remove from local store by unique itemId (crypto uuid set at add time)
                const { carteira } = get()
                set({
                    carteira: {
                        ...carteira,
                        itens: carteira.itens.filter(i => i.id !== itemId),
                    },
                })
            },

            atualizarPrecos: (precos) => {
                const { carteira } = get()
                const novosItens = carteira.itens.map(item => {
                    const precoAtual = precos[item.ticker] ?? item.precoAtual
                    const totalAtual = precoAtual * item.quantidade
                    const resultado = totalAtual - item.totalInvestido
                    return {
                        ...item,
                        precoAtual,
                        totalAtual,
                        resultado,
                        resultadoPercent: (resultado / item.totalInvestido) * 100,
                    }
                })
                const totalAtual = novosItens.reduce((s, i) => s + i.totalAtual, 0)
                const totalInvestido = novosItens.reduce((s, i) => s + i.totalInvestido, 0)
                set({
                    carteira: {
                        ...carteira,
                        itens: novosItens,
                        totalAtual,
                        totalInvestido,
                        resultado: totalAtual - totalInvestido,
                        resultadoPercent: ((totalAtual - totalInvestido) / totalInvestido) * 100,
                    },
                })
            },

            fetchCarteira: async () => {
                set({ loading: true })
                await new Promise(r => setTimeout(r, 500))
                set({ carteira: CARTEIRA_MOCK, loading: false })
            },
        }),
        { name: 'investsmart-carteira' }
    )
)
