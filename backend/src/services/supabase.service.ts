import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL as string
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Backend Supabase credentials missing (SUPABASE_URL / SUPABASE_SERVICE_KEY)')
}

// Client com service role para bypass de RLS em rotinas de backend
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})
