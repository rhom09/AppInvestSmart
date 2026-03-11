-- Tabela para cache de cotações (pre-fetched pela cron, servida pelos endpoints)
CREATE TABLE IF NOT EXISTS cotacoes_cache (
  ticker TEXT PRIMARY KEY,
  nome TEXT,
  preco DECIMAL,
  variacao DECIMAL,
  variacao_percent DECIMAL,
  pl DECIMAL,
  pvp DECIMAL,
  dy DECIMAL,
  roe DECIMAL,
  margem_liquida DECIMAL,
  score INTEGER,
  tipo TEXT, -- 'acao' ou 'fii'
  setor TEXT,
  segmento TEXT,
  vacancia DECIMAL,
  dy_mensal DECIMAL,
  market_cap BIGINT,
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Índice para consultas por tipo (acao/fii)
CREATE INDEX IF NOT EXISTS idx_cotacoes_cache_tipo ON cotacoes_cache(tipo);

-- Índice para ordenação por score
CREATE INDEX IF NOT EXISTS idx_cotacoes_cache_score ON cotacoes_cache(score DESC);

-- Desabilitar RLS para acesso pelo service role
ALTER TABLE cotacoes_cache ENABLE ROW LEVEL SECURITY;

-- Policy para o service role poder ler/escrever
CREATE POLICY "Service role full access" ON cotacoes_cache
  FOR ALL USING (true) WITH CHECK (true);
