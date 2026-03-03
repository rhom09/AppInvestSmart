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
        // Initialize from existing session
        supabase.auth.getSession().then(({ data }) => {
            const sessionUser = data.session?.user ?? null
            setUser(sessionUser)
            if (sessionUser) setFromSupabase(sessionUser)
            setLoading(false)
        })

        // Listen for auth state changes (login / logout / token refresh)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            const sessionUser = session?.user ?? null
            setUser(sessionUser)
            if (sessionUser) setFromSupabase(sessionUser)
            setLoading(false)
        })

        return () => listener.subscription.unsubscribe()
    }, [setFromSupabase])

    return { user, loading, isLoggedIn: !!user }
}
