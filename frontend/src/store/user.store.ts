import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '@/types'

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
        }),
        { name: 'investsmart-user' }
    )
)
