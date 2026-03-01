import type { Ativo, FII, ItemCarteira, ResumoCarteira, ETF, RendaFixa, DividendoEvento } from '@/types'

// ─── Ações Mock ──────────────────────────────────────────────────────
export const ACOES_MOCK: Ativo[] = [
    { ticker: 'PETR4', nome: 'Petrobras PN', setor: 'PETROLEO', preco: 34.50, variacao: 0.45, variacaoPercent: 1.32, score: 72, pl: 4.1, pvp: 1.2, dy: 12.5, roe: 28.3, receita: 450000, divLiquida: 120000, margemLiquida: 22.1, ebitda: 180000, volume: 85000000, marketCap: 450000000000, analise: 'Valuation atrativo com P/L de 4.1. DY de 12.5% acima da média histórica. Sólida geração de caixa.' },
    { ticker: 'VALE3', nome: 'Vale ON', setor: 'MINERACAO', preco: 68.20, variacao: -1.35, variacaoPercent: -1.94, score: 65, pl: 5.8, pvp: 1.8, dy: 9.2, roe: 22.1, receita: 320000, divLiquida: -50000, margemLiquida: 28.4, ebitda: 145000, volume: 72000000, marketCap: 320000000000, analise: 'Exposição ao preço do minério de ferro. Queda recente cria oportunidade. Balanço robusto.' },
    { ticker: 'BBAS3', nome: 'Banco do Brasil ON', setor: 'FINANCEIRO', preco: 24.80, variacao: 0.30, variacaoPercent: 1.22, score: 84, pl: 4.1, pvp: 0.88, dy: 11.4, roe: 21.3, receita: 85000, divLiquida: 0, margemLiquida: 35.2, ebitda: 0, volume: 45000000, marketCap: 140000000000, analise: '14% abaixo da média histórica de P/L. ROE consistente acima de 20%. Payout de dividendos sólido.' },
    { ticker: 'ITUB4', nome: 'Itaú Unibanco PN', setor: 'FINANCEIRO', preco: 36.40, variacao: 0.85, variacaoPercent: 2.39, score: 78, pl: 8.2, pvp: 1.9, dy: 5.8, roe: 19.5, receita: 95000, divLiquida: 0, margemLiquida: 38.1, ebitda: 0, volume: 55000000, marketCap: 380000000000, analise: 'Maior banco privado do Brasil. Qualidade de ativos elevada e capitalizaçäo sólida.' },
    { ticker: 'WEGE3', nome: 'WEG ON', setor: 'INDUSTRIA', preco: 42.10, variacao: 1.20, variacaoPercent: 2.93, score: 88, pl: 28.5, pvp: 8.2, dy: 1.8, roe: 26.8, receita: 28000, divLiquida: -8000, margemLiquida: 18.9, ebitda: 7200, volume: 18000000, marketCap: 170000000000, analise: 'Referência em qualidade no setor industrial. Crescimento consistente. Premium justificado.' },
    { ticker: 'MGLU3', nome: 'Magazine Luiza ON', setor: 'VAREJO', preco: 2.30, variacao: -0.15, variacaoPercent: -6.12, score: 28, pl: -8.2, pvp: 1.1, dy: 0.0, roe: -15.2, receita: 18000, divLiquida: 12000, margemLiquida: -4.2, ebitda: 800, volume: 35000000, marketCap: 15000000000, analise: 'Endividamento elevado. Transição digital ainda consome caixa. Alto risco.' },
    { ticker: 'RENT3', nome: 'Localiza ON', setor: 'TRANSPORTE', preco: 48.90, variacao: 0.60, variacaoPercent: 1.24, score: 71, pl: 14.2, pvp: 3.1, dy: 2.1, roe: 18.4, receita: 14500, divLiquida: 22000, margemLiquida: 9.8, ebitda: 5200, volume: 22000000, marketCap: 95000000000, analise: 'Líder em locação de veículos. Integração UNIDAS cria sinergias relevantes.' },
    { ticker: 'ABEV3', nome: 'Ambev ON', setor: 'INDUSTRIA', preco: 12.40, variacao: -0.20, variacaoPercent: -1.59, score: 61, pl: 16.8, pvp: 2.9, dy: 5.2, roe: 15.3, receita: 22000, divLiquida: -15000, margemLiquida: 22.4, ebitda: 8500, volume: 38000000, marketCap: 195000000000, analise: 'Marca forte e geração de caixa elevada. Pressão de volume no mercado brasileiro.' },
    { ticker: 'RDOR3', nome: 'Rede D\'Or ON', setor: 'SAUDE', preco: 35.80, variacao: 0.95, variacaoPercent: 2.73, score: 69, pl: 22.1, pvp: 2.8, dy: 0.8, roe: 12.5, receita: 16000, divLiquida: 18000, margemLiquida: 7.2, ebitda: 4800, volume: 12000000, marketCap: 65000000000, analise: 'Maior rede hospitalar privada. Crescimento acima de 20% a.a. Margem em expansão.' },
    { ticker: 'SUZB3', nome: 'Suzano ON', setor: 'INDUSTRIA', preco: 52.30, variacao: 1.15, variacaoPercent: 2.25, score: 74, pl: 6.8, pvp: 1.6, dy: 4.2, roe: 22.8, receita: 19500, divLiquida: 45000, margemLiquida: 38.5, ebitda: 9800, volume: 14000000, marketCap: 90000000000, analise: 'Maior produtora de celulose do mundo. Custos competitivos globais. DY consistente.' },
    { ticker: 'KLBN11', nome: 'Klabin UNT', setor: 'INDUSTRIA', preco: 22.80, variacao: -0.30, variacaoPercent: -1.30, score: 63, pl: 9.4, pvp: 2.1, dy: 6.8, roe: 14.2, receita: 8200, divLiquida: 18000, margemLiquida: 15.3, ebitda: 3100, volume: 9000000, marketCap: 27000000000, analise: 'Diversificação no setor de papel e embalagens. Dividendos consistentes.' },
    { ticker: 'BBDC4', nome: 'Bradesco PN', setor: 'FINANCEIRO', preco: 13.20, variacao: 0.15, variacaoPercent: 1.15, score: 55, pl: 7.8, pvp: 0.95, dy: 7.2, roe: 11.2, receita: 72000, divLiquida: 0, margemLiquida: 24.5, ebitda: 0, volume: 62000000, marketCap: 145000000000, analise: 'Processo de turnaround em curso. Inadimplência controlada mas ROE ainda abaixo do histórico.' },
    { ticker: 'CPLE6', nome: 'Copel PNB', setor: 'ENERGIA', preco: 9.80, variacao: 0.10, variacaoPercent: 1.03, score: 76, pl: 7.2, pvp: 1.1, dy: 9.4, roe: 14.8, receita: 12500, divLiquida: 8000, margemLiquida: 18.2, ebitda: 4200, volume: 8000000, marketCap: 22500000000, analise: 'Privatização concluída. Gestão privada com foco em eficiência. DY atrativo.' },
    { ticker: 'HAPV3', nome: 'Hapvida ON', setor: 'SAUDE', preco: 4.50, variacao: -0.25, variacaoPercent: -5.26, score: 42, pl: -2.1, pvp: 0.8, dy: 0.0, roe: -18.5, receita: 22000, divLiquida: 15000, margemLiquida: -3.8, ebitda: 1800, volume: 28000000, marketCap: 24000000000, analise: 'Integração com NotreDame ainda impactando resultados. Sinistralidade elevada.' },
    { ticker: 'IVVB11', nome: 'iShares S&P 500 ETF', setor: 'ETF', preco: 289.10, variacao: 3.60, variacaoPercent: 1.26, score: 80, pl: 22.5, pvp: 4.1, dy: 1.4, roe: 0, receita: 0, divLiquida: 0, margemLiquida: 0, ebitda: 0, volume: 25000000, marketCap: 0 },
]

// ─── FIIs Mock ──────────────────────────────────────────────────────
export const FIIS_MOCK: FII[] = [
    { ticker: 'MXRF11', nome: 'Maxi Renda FII', segmento: 'RECEBIVEL', preco: 10.85, variacao: 0.05, variacaoPercent: 0.46, score: 81, pvp: 0.95, dy: 13.2, dyMensal: 1.1, ffoCotaAnual: 1.42, numCotas: 2800000000, patrimonio: 3000000000, vacancia: 0, numImoveis: 0, gestora: 'XP Asset' },
    { ticker: 'HGLG11', nome: 'CSHG Logística FII', segmento: 'LOGISTICA', preco: 168.50, variacao: -1.20, variacaoPercent: -0.71, score: 77, pvp: 1.05, dy: 8.4, dyMensal: 0.70, ffoCotaAnual: 14.15, numCotas: 8500000, patrimonio: 1400000000, vacancia: 3.2, numImoveis: 24, gestora: 'Credit Suisse Hedging' },
    { ticker: 'KNRI11', nome: 'Kinea Renda Imobiliária', segmento: 'HIBRIDO', preco: 145.20, variacao: 0.80, variacaoPercent: 0.55, score: 80, pvp: 0.98, dy: 8.9, dyMensal: 0.74, ffoCotaAnual: 12.93, numCotas: 12000000, patrimonio: 1750000000, vacancia: 4.1, numImoveis: 18, gestora: 'Kinea' },
    { ticker: 'VISC11', nome: 'Vinci Shopping Centers', segmento: 'SHOPPING', preco: 105.40, variacao: 1.10, variacaoPercent: 1.05, score: 73, pvp: 0.92, dy: 9.8, dyMensal: 0.82, ffoCotaAnual: 10.33, numCotas: 6200000, patrimonio: 650000000, vacancia: 5.5, numImoveis: 12, gestora: 'Vinci' },
    { ticker: 'XPML11', nome: 'XP Malls FII', segmento: 'SHOPPING', preco: 98.30, variacao: -0.50, variacaoPercent: -0.51, score: 70, pvp: 0.96, dy: 9.5, dyMensal: 0.79, ffoCotaAnual: 9.34, numCotas: 4800000, patrimonio: 472000000, vacancia: 6.2, numImoveis: 8, gestora: 'XP Asset' },
    { ticker: 'HCTR11', nome: 'Hectare CE FII', segmento: 'RECEBIVEL', preco: 9.20, variacao: -0.35, variacaoPercent: -3.66, score: 52, pvp: 0.82, dy: 16.8, dyMensal: 1.40, ffoCotaAnual: 1.55, numCotas: 1500000000, patrimonio: 1380000000, vacancia: 0, numImoveis: 0, gestora: 'Hectare' },
    { ticker: 'LVBI11', nome: 'VBI Logístico FII', segmento: 'LOGISTICA', preco: 107.80, variacao: 0.30, variacaoPercent: 0.28, score: 75, pvp: 0.97, dy: 9.1, dyMensal: 0.76, ffoCotaAnual: 9.81, numCotas: 3200000, patrimonio: 345000000, vacancia: 2.8, numImoveis: 7, gestora: 'VBI Real Estate' },
    { ticker: 'BCFF11', nome: 'BTG Pactual FoF FII', segmento: 'HIBRIDO', preco: 7.85, variacao: 0.10, variacaoPercent: 1.29, score: 68, pvp: 0.91, dy: 11.5, dyMensal: 0.96, ffoCotaAnual: 0.90, numCotas: 8200000000, patrimonio: 6440000000, vacancia: 0, numImoveis: 0, gestora: 'BTG Pactual' },
]

// ─── Dividendos Mock ────────────────────────────────────────────────
export const DIVIDENDOS_MOCK: DividendoEvento[] = [
    { ticker: 'MXRF11', valor: 0.12, dataCom: '2026-03-14', dataPagamento: '2026-03-24' },
    { ticker: 'HGLG11', valor: 1.18, dataCom: '2026-03-14', dataPagamento: '2026-03-25' },
    { ticker: 'KNRI11', valor: 1.07, dataCom: '2026-03-13', dataPagamento: '2026-03-21' },
    { ticker: 'VISC11', valor: 0.86, dataCom: '2026-03-12', dataPagamento: '2026-03-20' },
    { ticker: 'LVBI11', valor: 0.82, dataCom: '2026-03-11', dataPagamento: '2026-03-19' },
    { ticker: 'XPML11', valor: 0.78, dataCom: '2026-03-07', dataPagamento: '2026-03-17' },
]

// ─── ETFs Mock ──────────────────────────────────────────────────────
export const ETFS_MOCK: ETF[] = [
    { ticker: 'IVVB11', nome: 'iShares S&P 500 ETF', indiceReferencia: 'S&P 500', preco: 289.10, variacao: 3.60, variacaoPercent: 1.26, dy: 1.4, pl: 22.5, patrimonio: 8200000000, volume: 25000000 },
    { ticker: 'BOVA11', nome: 'iShares Ibovespa ETF', indiceReferencia: 'Ibovespa', preco: 118.40, variacao: 1.20, variacaoPercent: 1.02, dy: 3.2, pl: 14.1, patrimonio: 4500000000, volume: 18000000 },
    { ticker: 'SMAL11', nome: 'iShares Small Cap ETF', indiceReferencia: 'SMLL', preco: 94.20, variacao: -0.80, variacaoPercent: -0.84, dy: 2.8, pl: 12.4, patrimonio: 1200000000, volume: 8000000 },
    { ticker: 'ACWI11', nome: 'iShares MSCI ACWI ETF', indiceReferencia: 'MSCI ACWI', preco: 68.50, variacao: 0.45, variacaoPercent: 0.66, dy: 1.8, pl: 18.2, patrimonio: 650000000, volume: 3500000 },
    { ticker: 'GOLD11', nome: 'Trend ETF Ouro', indiceReferencia: 'Ouro', preco: 62.80, variacao: 2.10, variacaoPercent: 3.46, dy: 0.0, pl: 0, patrimonio: 420000000, volume: 2800000 },
]

// ─── Renda Fixa Mock ────────────────────────────────────────────────
export const RENDA_FIXA_MOCK: RendaFixa[] = [
    { id: 'rf1', tipo: 'CDB', emissor: 'Banco Inter', nome: 'CDB Inter 115% CDI', taxa: 115, indexador: 'CDI', vencimento: '2027-03-01', investimentoMinimo: 1000, liquidez: 'No vencimento', risco: 'BAIXO' },
    { id: 'rf2', tipo: 'LCI', emissor: 'Banco BTG', nome: 'LCI BTG 105% CDI', taxa: 105, indexador: 'CDI', vencimento: '2026-09-01', investimentoMinimo: 5000, liquidez: 'No vencimento', risco: 'BAIXO' },
    { id: 'rf3', tipo: 'TESOURO', emissor: 'Tesouro Nacional', nome: 'Tesouro IPCA+ 2029', taxa: 5.8, indexador: 'IPCA', vencimento: '2029-05-15', investimentoMinimo: 100, liquidez: 'D+1', risco: 'BAIXO' },
    { id: 'rf4', tipo: 'CRI', emissor: 'RB Capital', nome: 'CRI Multiplan IPCA+7%', taxa: 7.0, indexador: 'IPCA', vencimento: '2030-06-10', investimentoMinimo: 1000, liquidez: 'No vencimento', risco: 'MEDIO' },
    { id: 'rf5', tipo: 'LCA', emissor: 'Banco Safra', nome: 'LCA Safra 98% CDI', taxa: 98, indexador: 'CDI', vencimento: '2026-12-01', investimentoMinimo: 5000, liquidez: 'No vencimento', risco: 'BAIXO' },
]

// ─── Carteira Mock ──────────────────────────────────────────────────
const itensCarteira: ItemCarteira[] = [
    { ticker: 'PETR4', nome: 'Petrobras PN', tipo: 'ACAO', quantidade: 200, precoMedio: 28.40, precoAtual: 34.50, totalInvestido: 5680, totalAtual: 6900, resultado: 1220, resultadoPercent: 21.48, percentCarteira: 22.3, dy: 12.5 },
    { ticker: 'BBAS3', nome: 'Banco do Brasil', tipo: 'ACAO', quantidade: 300, precoMedio: 21.20, precoAtual: 24.80, totalInvestido: 6360, totalAtual: 7440, resultado: 1080, resultadoPercent: 16.98, percentCarteira: 24.0, dy: 11.4 },
    { ticker: 'VALE3', nome: 'Vale ON', tipo: 'ACAO', quantidade: 80, precoMedio: 72.50, precoAtual: 68.20, totalInvestido: 5800, totalAtual: 5456, resultado: -344, resultadoPercent: -5.93, percentCarteira: 17.6, dy: 9.2 },
    { ticker: 'MXRF11', nome: 'Maxi Renda FII', tipo: 'FII', quantidade: 500, precoMedio: 9.80, precoAtual: 10.85, totalInvestido: 4900, totalAtual: 5425, resultado: 525, resultadoPercent: 10.71, percentCarteira: 17.5, dy: 13.2 },
    { ticker: 'IVVB11', nome: 'iShares S&P 500 ETF', tipo: 'ETF', quantidade: 20, precoMedio: 240.00, precoAtual: 289.10, totalInvestido: 4800, totalAtual: 5782, resultado: 982, resultadoPercent: 20.46, percentCarteira: 18.6, dy: 1.4 },
]

const totalInvestido = itensCarteira.reduce((s, i) => s + i.totalInvestido, 0)
const totalAtual = itensCarteira.reduce((s, i) => s + i.totalAtual, 0)

export const CARTEIRA_MOCK: ResumoCarteira = {
    totalInvestido,
    totalAtual,
    resultado: totalAtual - totalInvestido,
    resultadoPercent: ((totalAtual - totalInvestido) / totalInvestido) * 100,
    rendimentoMes: 1.24,
    rendimentoAno: 8.45,
    dividendosMes: 580.50,
    scoreCarteira: 73,
    itens: itensCarteira,
}

// ─── Histórico Patrimonial Mock ─────────────────────────────────────
export const HISTORICO_PATRIMONIAL = Array.from({ length: 12 }, (_, i) => {
    const mes = new Date(2026, i - 11, 1)
    const base = 25000
    const crescimento = base + (i * 650) + (Math.random() * 800 - 200)
    return {
        mes: mes.toLocaleString('pt-BR', { month: 'short' }),
        valor: Math.round(crescimento),
    }
})
