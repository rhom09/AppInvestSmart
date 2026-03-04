import { Router } from 'express'
import { executarAtualizacaoMercado } from '../cron/market-update.cron'

const adminRoutes = Router()

// Middleware de autenticação simples pro admin
adminRoutes.use((req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.key
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ success: false, message: 'Não autorizado. Forneça uma API_KEY válida.' })
    }
    next()
})

// Endpoint POST /api/admin/atualizar
adminRoutes.post('/atualizar', async (req, res) => {
    try {
        // Dispara a rotina de forma assíncrona ou aguarda o resultado.
        // Como pode demorar, podemos responder logo e rodar em background, ou aguardar.
        // Aguardaremos para o teste ficar mais simples pro frontend.
        const resultado = await executarAtualizacaoMercado()

        if (resultado.success) {
            return res.json(resultado)
        } else {
            return res.status(500).json(resultado)
        }
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message })
    }
})

export { adminRoutes }
