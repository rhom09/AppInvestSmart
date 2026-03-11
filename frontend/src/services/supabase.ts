import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string

if (!supabaseUrl || !supabaseKey) {
    const errorMsg = '[Supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_KEY não configuradas!'
    console.error(errorMsg)
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '')

/** Inicia o fluxo OAuth com o Google */
export const loginComGoogle = async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}`
            },
        })
        if (error) {
            console.error('Erro no login via Supabase:', error.message)
            return { error }
        }
        return { error: null }
    } catch (err: any) {
        console.error('Falha crítica no login:', err)
        return { error: err }
    }
}

/** Encerra a sessão do usuário */
export const logout = () => supabase.auth.signOut()

/** Retorna o usuário da sessão atual (null se não logado) */
export const getUsuario = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.user ?? null
}
