import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') })

const supabaseUrl = process.env.SUPABASE_URL as string
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '')

async function check() {
    const { data, error } = await supabase.from('evolucao_cache').select('usuario_id, periodo').limit(5)
    console.log("Error:", error)
    console.log("Data:", data?.length ? data : "No data or table doesn't exist")
}
check()
