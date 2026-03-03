import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string

if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase] Missing env vars VITE_SUPABASE_URL / VITE_SUPABASE_KEY — auth features disabled.')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '')

/** Inicia o fluxo OAuth com o Google */
export const loginComGoogle = () =>
    supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
    })

/** Encerra a sessão do usuário */
export const logout = () => supabase.auth.signOut()

/** Retorna o usuário da sessão atual (null se não logado) */
export const getUsuario = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.user ?? null
}
