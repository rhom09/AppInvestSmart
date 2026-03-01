import { Router } from 'express'

const router = Router()

router.get('/', async (_req, res) => {
    try {
        const noticias = [
            { id: '1', titulo: 'Ibovespa fecha em alta com resultado do Banco do Brasil', resumo: 'O índice ganhou impulso com os resultados acima do esperado do BB e do setor bancário.', fonte: 'InfoMoney', publicadoEm: new Date().toISOString(), sentimento: 'POSITIVO' },
            { id: '2', titulo: 'Petrobras anuncia dividendos acima das projeções', resumo: 'A empresa comunicou o pagamento de R$ 2,50 por ação, superando estimativas de mercado.', fonte: 'Valor Econômico', publicadoEm: new Date().toISOString(), sentimento: 'POSITIVO' },
            { id: '3', titulo: 'IPCA-15 fica em 0,59% em fevereiro, acima da estimativa', resumo: 'Dado frustra mercado e aumenta pressão sobre política monetária.', fonte: 'IBGE', publicadoEm: new Date().toISOString(), sentimento: 'NEGATIVO' },
        ]
        res.json({ success: true, data: noticias })
    } catch {
        res.status(500).json({ success: false, message: 'Erro ao buscar notícias' })
    }
})

export { router as noticiasRoutes }
