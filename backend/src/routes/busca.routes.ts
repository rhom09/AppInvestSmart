import { Router, Request, Response } from 'express'
import { cacheService } from '../services/cache.service'
import { brapiService, TICKERS_FIIS, TICKERS_ACOES } from '../services/brapi.service'

const router = Router()


// Static name map to avoid calling BRAPI for every search keystroke
const NAMES_ACOES: Record<string, string> = {
    'WEGE3': 'WEG ON', 'ITUB4': 'Itaú Unibanco PN', 'BBAS3': 'Banco do Brasil ON',
    'PETR4': 'Petrobras PN', 'VALE3': 'Vale ON', 'ABEV3': 'Ambev ON',
    'RENT3': 'Localiza ON', 'SUZB3': 'Suzano ON', 'EGIE3': 'Engie Brasil ON',
    'ITSA4': 'Itaúsa PN', 'MGLU3': 'Magazine Luiza ON', 'BBDC4': 'Bradesco PN',
    'PRIO3': 'PetroRio ON', 'VIVT3': 'Telefônica Vivo ON', 'RADL3': 'Raia Drogasil ON',
    'EMBR3': 'Embraer ON', 'TOTS3': 'Totvs ON', 'JBSS3': 'JBS ON',
    'CSAN3': 'Cosan ON', 'EQTL3': 'Equatorial ON', 'CCRO3': 'CCR ON',
    'BRFS3': 'BRF ON', 'SBSP3': 'Sabesp ON', 'AZZA3': 'Azzas ON',
    'UGPA3': 'Ultrapar ON', 'RAIL3': 'Rumo ON', 'MULT3': 'Multiplan ON',
    'TAEE11': 'Taesa UNT', 'CPFE3': 'CPFL Energia ON', 'CPLE6': 'Copel PNB',
    'ENGI11': 'Energisa UNT', 'SAPR4': 'Sanepar PN', 'BEEF3': 'Minerva ON',
    'MRVE3': 'MRV ON', 'DIRR3': 'Direcional ON', 'TIMS3': 'TIM ON',
    'CMIN3': 'CSN Mineração ON', 'BPAC11': 'BTG Pactual UNT', 'PETZ3': 'Petz ON',
    'RDOR3': 'Rede D\'Or ON'
}

const NAMES_FIIS: Record<string, string> = {
    'MXRF11': 'Maxi Renda FII', 'HGLG11': 'CSHG Logística FII', 'XPML11': 'XP Malls FII',
    'KNRI11': 'Kinea Renda Imobiliária FII', 'VISC11': 'Vinci Shopping Centers FII',
    'BCFF11': 'BC Fundo de FIIs', 'BTLG11': 'BTG Pactual Logística FII',
    'HFOF11': 'Hedge Top FOFII 3', 'RBRF11': 'RBR Alpha Fundo de FIIs',
    'GGRC11': 'GGR Covepi Renda FII', 'VILG11': 'Vinci Logística FII',
    'BRCO11': 'Bresco Logística FII', 'XPLG11': 'XP Log FII', 'PATL11': 'Pátria Logística FII',
    'LVBI11': 'VBI Logística FII', 'VGIP11': 'Valora CRI Índice de Preços FII',
    'KNCR11': 'Kinea CRI FII', 'CPTS11': 'Capitânia Securities II FII',
    'RBRP11': 'RBR Properties FII', 'PVBI11': 'VBI Prime Properties FII',
    'BPFF11': 'Brasil Plural Fundo de FIIs', 'HABT11': 'Habitat II FII',
    'RZTR11': 'Riza Terrax FII', 'SARE11': 'Santander Renda de Aluguéis FII'
}

interface SearchResult {
    ticker: string
    nome: string
    tipo: 'ACAO' | 'FII'
    preco: number
    variacao: number
}

// Builds a cached catalog with live prices from Brapi
async function buildCatalog(): Promise<SearchResult[]> {
    return cacheService.getOrSet<SearchResult[]>('busca_catalog', async () => {
        console.log('[BUSCA] Building search catalog...')

        const catalog: SearchResult[] = []

        // Add ações with static names — price/variação enriched below if Brapi responds
        for (const ticker of TICKERS_ACOES) {
            catalog.push({
                ticker,
                nome: NAMES_ACOES[ticker] || ticker,
                tipo: 'ACAO',
                preco: 0,
                variacao: 0
            })
        }

        // Add FIIs
        for (const ticker of TICKERS_FIIS) {
            catalog.push({
                ticker,
                nome: NAMES_FIIS[ticker] || ticker,
                tipo: 'FII',
                preco: 0,
                variacao: 0
            })
        }

        // Enrich with live prices in a best-effort, non-blocking way
        try {
            const allTickers = [...TICKERS_ACOES, ...TICKERS_FIIS]
            const live = await brapiService.buscarVariosAtivos(allTickers)
            for (const item of live) {
                const entry = catalog.find(c => c.ticker === item.ticker)
                if (entry) {
                    entry.preco = item.preco ?? 0
                    entry.variacao = item.variacaoPercent ?? item.variacao ?? 0
                    if (item.nome && item.nome !== item.ticker) entry.nome = item.nome
                }
            }
        } catch (err) {
            console.warn('[BUSCA] Could not enrich prices, using static catalog:', (err as any).message)
        }

        return catalog
    }, 300) // 5 minutes TTL
}

// GET /api/busca?q={termo}
router.get('/', async (req: Request, res: Response) => {
    try {
        const q = (req.query.q as string || '').trim().toUpperCase()

        if (q.length < 2) {
            return res.json({ success: true, data: [] })
        }

        const catalog = await buildCatalog()

        const results = catalog
            .filter(item =>
                item.ticker.includes(q) ||
                item.nome.toUpperCase().includes(q)
            )
            .slice(0, 8)

        return res.json({ success: true, data: results })
    } catch (error) {
        console.error('[BUSCA] Erro:', error)
        return res.status(500).json({ success: false, message: 'Erro na busca' })
    }
})

export { router as buscaRoutes }
