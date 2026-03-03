import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '@/types'
import type { User } from '@supabase/supabase-js'

const USUARIO_MOCK: Usuario = {
    id: '1',
    nome: 'Gabriel Silva',
    email: 'gabriel@investsmart.com.br',
    plano: 'FREE',
    perfil: 'MODERADO',
    nivel: 'Investidor Iniciante',
}

interface UserState {
    usuario: Usuario | null
    isAuthenticated: boolean
    login: (email: string, senha: string) => Promise<void>
    logout: () => void
    updatePerfil: (perfil: Partial<Usuario>) => void
    /** Sync store with a real Supabase session user */
    setFromSupabase: (supabaseUser: User) => void
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            usuario: USUARIO_MOCK,
            isAuthenticated: true,

            login: async (_email: string, _senha: string) => {
                await new Promise(r => setTimeout(r, 800))
                set({ usuario: USUARIO_MOCK, isAuthenticated: true })
            },

            logout: () => set({ usuario: null, isAuthenticated: false }),

            updatePerfil: (perfil) =>
                set(state => ({
                    usuario: state.usuario ? { ...state.usuario, ...perfil } : null,
                })),

            setFromSupabase: (supabaseUser: User) => {
                const meta = supabaseUser.user_metadata ?? {}
                set({
                    isAuthenticated: true,
                    usuario: {
                        id: supabaseUser.id,
                        nome: meta.full_name ?? meta.name ?? supabaseUser.email ?? 'Usuário',
                        email: supabaseUser.email ?? '',
                        avatar: meta.avatar_url ?? meta.picture,
                        plano: 'FREE',
                        perfil: 'MODERADO',
                        nivel: 'Investidor Iniciante',
                    },
                })
            },
        }),
        { name: 'investsmart-user' }
    )
)
