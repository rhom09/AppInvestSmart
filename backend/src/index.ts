import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { acoesRoutes } from './routes/acoes.routes'
import { fiisRoutes } from './routes/fiis.routes'
import { noticiasRoutes } from './routes/noticias.routes'
import './cron/market-update.cron'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
})

// Routes
app.use('/api/acoes', acoesRoutes)
app.use('/api/fiis', fiisRoutes)
app.use('/api/noticias', noticiasRoutes)

import { adminRoutes } from './routes/admin.routes'

// 404
app.use('/api/admin', adminRoutes)

app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Rota não encontrada' })
})

app.listen(PORT, () => {
    console.log(`🚀 InvestSmart Backend rodando em http://localhost:${PORT}`)
    console.log(`📊 BRAPI Token: ${process.env.BRAPI_TOKEN ? '✅ Configurado' : '⚠️  Não configurado (usando mock)'}`)
    console.log(`🗄️  Supabase: ${process.env.SUPABASE_URL ? '✅ Configurado' : '⚠️  Não configurado'}`)
})

export default app
