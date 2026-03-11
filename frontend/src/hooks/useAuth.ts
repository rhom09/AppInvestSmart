import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/services/supabase'
import { useUserStore } from '@/store/user.store'

interface AuthState {
    user: User | null
    loading: boolean
    isLoggedIn: boolean
}

export const useAuth = (): AuthState => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const { setFromSupabase } = useUserStore()

    useEffect(() => {
        console.error('🔍 [AUTH] useAuth: Inicializando listener...')
        // Initialize from existing session
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) console.error('❌ [AUTH] getSession error:', error)
            const sessionUser = data.session?.user ?? null
            console.error('🔍 [AUTH] getSession result:', sessionUser?.email || 'Nenhum usuário')

            if (sessionUser) {
                setFromSupabase(sessionUser)
                setUser(sessionUser)
            } else {
                useUserStore.getState().logout()
                setUser(null)
            }
            setLoading(false)
        })

        // Listen for auth state changes (login / logout / token refresh)
        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            console.error(`🔍 [AUTH] onAuthStateChange event: ${event}`)
            const sessionUser = session?.user ?? null
            console.error('🔍 [AUTH] onAuthStateChange user:', sessionUser?.email || 'Nenhum usuário')

            setUser(sessionUser)
            if (sessionUser) {
                setFromSupabase(sessionUser)
            } else {
                useUserStore.getState().logout()
            }
            setLoading(false)
        })

        return () => listener.subscription.unsubscribe()
    }, [setFromSupabase])

    return { user, loading, isLoggedIn: !!user }
}
