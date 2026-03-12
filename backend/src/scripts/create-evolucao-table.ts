import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function createTable() {
    const query = `
    CREATE TABLE IF NOT EXISTS evolucao_cache (
      id uuid primary key default gen_random_uuid(),
      user_id uuid,
      periodo text,
      data jsonb,
      atualizado_em timestamp default now(),
      unique(user_id, periodo)
    );
    `

    // Supabase JS doesn't have a direct raw SQL method over REST easily without rpc or similar,
    // but the user might have pg installed, or we can just make an rpc if we have one, or run it via psql if accessible.
    // Wait, since we are using supabase, let's see if there is an rpc. If not, I can create it via psql if they have local supersbase or I'll just write a script that sends a raw request.
    // Actually, I can just write a script that attempts to use Supabase API or pg.
    // Let me check if `pg` is installed in package.json.
}
createTable()
