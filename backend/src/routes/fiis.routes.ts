import { Router } from 'express'

const router = Router()

router.get('/', async (_req, res) => {
    try {
        // Retorna FIIs mockados (integração BRAPI real via token pago)
        res.json({ success: true, data: [], message: 'Configure BRAPI_TOKEN para dados reais' })
    } catch {
        res.status(500).json({ success: false, message: 'Erro ao buscar FIIs' })
    }
})

export { router as fiisRoutes }
