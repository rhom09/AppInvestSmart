import YahooFinance from 'yahoo-finance2'
const yahooFinance = new YahooFinance()

const toYahoo = (ticker: string) => `${ticker}.SA`

export async function buscarCotacoesBatch(tickers: string[]) {
  const symbols = tickers.map(toYahoo)
  try {
    const results = await yahooFinance.quote(symbols)
    const arr = Array.isArray(results) ? results : [results]
    
    return arr.map((item: any) => ({
      ticker: item.symbol?.replace('.SA', ''),
      nome: item.longName || item.shortName || item.symbol?.replace('.SA', ''),
      preco: item.regularMarketPrice ?? 0,
      variacao: item.regularMarketChange ?? 0,
      variacaoPercent: item.regularMarketChangePercent ?? 0,
      marketCap: item.marketCap ?? null,
      pl: item.trailingPE ?? null,
      pvp: item.priceToBook ?? null,
      dy: item.trailingAnnualDividendYield ? item.trailingAnnualDividendYield * 100 : null,
      roe: null,
      margemLiquida: null,
    })).filter(a => a.preco > 0)
  } catch (error: any) {
    console.error(`❌ [YAHOO] Erro ao buscar cotações em batch:`, error.message)
    return []
  }
}

export async function buscarHistorico(ticker: string, periodo: string) {
  try {
    const symbol = ticker.startsWith('^') ? ticker : toYahoo(ticker)

    const hoje = new Date()
    const ontem = new Date(hoje)
    ontem.setDate(ontem.getDate() - 1)

    const inicio = getPeriodStart(periodo)

    const dados = await (yahooFinance.chart as any)(symbol, {
      period1: inicio,
      period2: ontem,
      interval: '1d'
    }, { validateResult: false })

    if (!dados?.quotes || dados.quotes.length === 0) return []

    return dados.quotes
      .filter((q: any) => q.date && q.close !== null)
      .map((q: any) => ({
        date: new Date(q.date).toISOString(),
        close: q.close
      }))
  } catch (error: any) {
    console.error(`❌ [YAHOO] Erro ao buscar histórico de ${ticker}:`, error.message)
    return []
  }
}

export async function buscarIndices() {
  try {
    // IBOVESPA (^BVSP) e IFIX (IFIX11.SA ou similar)
    const symbols = ['^BVSP', 'IFIX.SA']
    const results = await yahooFinance.quote(symbols)
    const arr = Array.isArray(results) ? results : [results]
    
    return arr.map((item: any) => ({
      ticker: item.symbol === '^BVSP' ? 'IBOV' : 'IFIX',
      name: item.shortName || item.longName || item.symbol,
      close: item.regularMarketPrice ?? 0,
      variation: item.regularMarketChangePercent ?? 0
    })).filter(a => a.close > 0)
  } catch (error: any) {
    console.error(`❌ [YAHOO] Erro ao buscar índices:`, error.message)
    return []
  }
}

function getPeriodStart(periodo: string): Date {
  const now = new Date()
  if (periodo === '1mo') now.setMonth(now.getMonth() - 1)
  else if (periodo === '3mo') now.setMonth(now.getMonth() - 3)
  else if (periodo === '1y') now.setFullYear(now.getFullYear() - 1)
  else if (periodo === '5y') now.setFullYear(now.getFullYear() - 5)
  else now.setDate(now.getDate() - 5) // default to approx 5 days for short periods
  return now
}
