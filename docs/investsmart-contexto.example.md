# InvestSmart — Contexto Completo do Projeto
> Documento de referência para Claude e Antigravity. Atualizado em 12/03/2026.

---

## 1. VISÃO GERAL

**InvestSmart** é um webapp brasileiro de rastreamento e análise de portfólio de investimentos, comparável ao Kinvo e Gorila. Voltado para investidores iniciantes brasileiros que querem acompanhar ações (B3) e FIIs sem entender fórmulas complexas.

**URLs de produção:**
- Frontend: https://app-invest-smart.vercel.app
- Backend: https://appinvestsmart-backend.onrender.com

---

## 2. STACK TECNOLÓGICA

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Banco de Dados | Supabase (PostgreSQL) |
| Autenticação | Google OAuth via Supabase |
| Deploy Frontend | Vercel |
| Deploy Backend | Render |
| Dados de mercado (principal) | yahoo-finance2 |
| Dados fundamentalistas | Fundamentus (scraping) |
| Taxas (SELIC/IPCA/CDI) | BCB API |
| Câmbio (USD) | Yahoo Finance (USDBRL=X) |
| Gráficos | Recharts |

> **Brapi:** foi a API original, mas o limite gratuito (15k req/mês) foi esgotado. Migrado para yahoo-finance2.

---

## 3. CREDENCIAIS E REFERÊNCIAS DE DEBUG

```
userId de teste:     61a93d9f-d20b-4cea-ade7-eb093560d8b4
Admin endpoint:      POST /api/admin/refresh-cotacoes
Admin header:        x-api-key: Definida via variável de ambiente `ADMIN_API_KEY` no Render/Railway.
Supabase token:      URLs e Keys geridas via variáveis de ambiente `SUPABASE_URL` e `SUPABASE_KEY`.
Brapi token (ESGOTADO — não usar): Definido via variável de ambiente `BRAPI_TOKEN`.
```

---

## 4. BANCO DE DADOS — TABELAS SUPABASE

### `carteira_ativos`
```sql
id uuid primary key
user_id uuid references auth.users   -- ATENÇÃO: coluna chama user_id, NÃO usuario_id
ticker text not null
tipo text  -- 'acao', 'fii', 'etf', 'renda_fixa'
quantidade decimal
preco_medio decimal
data_compra date
created_at timestamp default now()
```

### `cotacoes_cache`
- Armazena cotações recentes dos ativos
- Populada pelo cron job e pelo seed
- Campo: `preco`, `variacao`, `ticker`, `updated_at`

### `evolucao_cache`
- Cache do gráfico de Evolução Patrimonial
- Colunas necessárias (confirmar se existem):
  - `user_id uuid`
  - `periodo text`
  - `payload_json jsonb`
  - `updated_at timestamptz DEFAULT now()`
- **BUG ATIVO:** coluna `updated_at` pode não existir → rodar no Supabase SQL Editor:
```sql
ALTER TABLE evolucao_cache ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE evolucao_cache ADD COLUMN IF NOT EXISTS payload_json jsonb;
```

### `alertas`
```sql
id uuid primary key
user_id uuid references auth.users
ticker text
tipo text  -- 'preco_alvo', 'score_minimo', 'dy_minimo'
valor decimal
ativo boolean default true
created_at timestamp default now()
```

### `scores_diarios`
```sql
id uuid primary key
ticker text
score integer
pl decimal, pvp decimal, dy decimal, roe decimal
preco decimal
data date default current_date
unique(ticker, data)
```

### `indicados_diarios`
```sql
id uuid primary key
ticker text
score integer
motivo text
data date default current_date
```

---

## 5. SERVIÇO YAHOO FINANCE (implementação atual)

```typescript
import YahooFinance from 'yahoo-finance2'
const yahooFinance = new YahooFinance()
const toYahoo = (ticker: string) => `${ticker}.SA`

// Funções disponíveis:
buscarCotacoesBatch(tickers)     // batches de 50, usa quote()
buscarHistorico(ticker, periodo) // '5d','1mo','3mo','6mo','1y'
buscarIndicesYahoo()             // ^BVSP, IFIX11.SA

// Para histórico usa chart() com period1/period2 explícitos e { validateResult: false }
// cast como: (yahooFinance.chart as any)
```

**Regras críticas do Yahoo Finance:**
- Durante mercado aberto, retorna candles intraday duplicados para o mesmo dia
- **Sempre deduplicar por data** (manter último por `dateKey`) antes de acumular
- `{ validateResult: false }` é obrigatório para evitar erros TypeScript no `chart()`

**Períodos e pontos retornados:**
- `1mo` → ~19 pontos (diário)
- `3mo` → ~59 pontos (diário)
- `6mo` → ~123 pontos (diário)
- `1y` → ~251 pontos → aplica agregação mensal → 13 pontos

---

## 6. ALGORITMO DE SCORE

### Score de Ações (0–100) — Modo Dividendos (atual)
Média ponderada de indicadores normalizados (0–10):
- **DY** (peso 30%): 0–3%→3, 3–6%→6, 6–10%→9, >10%→10
- **P/L** (peso 25%): ≤8→10, 8–15→8, 15–25→5, 25–40→2, >40→0
- **ROE** (peso 20%): 0–8%→3, 8–15%→6, 15–25%→9, >25%→10
- **P/VP** (peso 15%): ≤1→10, 1–1.5→7, 1.5–2.5→4, >2.5→1
- **Margem Líquida** (peso 10%): 0–5%→3, 5–15%→6, 15–30%→9, >30%→10

### Score de Ações — Modo Crescimento (a implementar)
- **ROE** (peso 30%)
- **Margem Líquida** (peso 25%)
- **P/L** (peso 20%)
- **P/VP** (peso 15%)
- **DY** (peso 10%)

### Score de FIIs (0–100)
- **DY Mensal** (peso 35%): <0.6%→0, 0.6–0.8%→5, 0.8–1%→8, >1%→10
- **P/VP** (peso 25%): >1.2→0, 1–1.2→5, 0.9–1→8, <0.9→10
- **Vacância** (peso 25%): >15%→0, 10–15%→3, 5–10%→6, 2–5%→8, <2%→10
- **Liquidez** (peso 15%): <100k→0, 100k–500k→4, 500k–1M→7, >1M→10

### Labels de Score
| Score | Label | Cor |
|---|---|---|
| 80–100 | Excelente | #00e88f |
| 65–79 | Bom | #00b8ff |
| 50–64 | Neutro | #f5c842 |
| 0–49 | Evitar | #ff4d6d |

---

## 7. ENDPOINTS DA API (backend Render)

### Mercado
- `GET /api/mercado/indices` → SELIC, IPCA, CDI, USD/BRL, IBOVESPA, IFIX

### Ações
- `GET /api/acoes?page=1&limit=20` → lista paginada com score
- `GET /api/acoes/:ticker` → cotação individual
- `GET /api/acoes/:ticker/historico?range=1mo` → histórico de preços
- `GET /api/busca?q={termo}` → busca global (máx 8 resultados)

### FIIs
- `GET /api/fiis?page=1&limit=9` → lista paginada

### Carteira
- `GET /api/cotacoes?tickers=X,Y,Z` → cotações para carteira
- `GET /api/carteira/evolucao?userId={id}&periodo=1mo|3mo|6mo|1y` → gráfico patrimonial
- `GET /api/carteira/rentabilidade-periodo?tickers=X&quantities=N&periodo=mes|ano` → rentabilidade

### Admin
- `POST /api/admin/refresh-cotacoes` + header `x-api-key: [SUA_CHAVE_AQUI]`
  - `mode=seed` → carga completa de 193 ativos
  - `mode=cron&group=1` → atualizar grupo específico
  - **Descrição:** Dispara a atualização manual ou via Cron Job.
- **Autenticação:** Requer header `x-api-key` ou query param `key`.
- **Exemplo de uso:** 
  `curl -X POST "https://onrender.com" -H "x-api-key: [SUA_CHAVE_AQUI]"`

---

## 8. CRON JOB

- Roda a cada **1 hora** dividindo os 193 ativos em **10 grupos de ~20**
- Cada grupo roda em instâncias separadas para não sobrecarregar
- Seed completo: `POST /api/admin/refresh-cotacoes` com `mode=seed` → 161 ativos salvos em ~37s

---

## 9. DESIGN SYSTEM

### Cores
```css
--bg: #07090f          /* fundo principal */
--surface: #0e1120     /* cards */
--surface2: #141828    /* cards secundários */
--border: #1e2438      /* bordas */
--accent: #00e88f      /* verde — positivo */
--accent2: #00b8ff     /* azul — secundário */
--red: #ff4d6d         /* negativo/queda */
--gold: #f5c842        /* destaque dourado */
--text: #e8eaf2        /* texto principal */
--muted: #5a6080       /* texto secundário */
```

### Tipografia
- Títulos e números: **Syne** (800, 700, 600)
- Tickers e valores: **DM Mono** (500, 400)
- Texto e UI: **DM Sans** (500, 400, 300)

### Componentes Reutilizáveis
- `<InfoTooltip text="..." />` — ícone ℹ com tooltip
- `<TruncatedName name="..." />` — texto truncado com `title` nativo
- `<ScoreBar value={87} />` — barra de progresso colorida por faixa
- `<VariacaoBadge value={1.2} />` — badge verde/vermelho com ▲▼
- `<MarketStatusBadge />` — badge com borda/glow colorida e pulsing dot

---

## 10. FUNCIONALIDADES IMPLEMENTADAS ✅

### Dashboard
- [x] MarketBar com IBOVESPA, IFIX, SELIC, IPCA, USD/BRL, CDI (dados reais)
- [x] Badge de status do mercado (aberto/fechado por horário B3)
- [x] Spotlight do ativo com maior score
- [x] Tabela de ações indicadas com ScoreBar
- [x] Cards de Top FIIs por score
- [x] Cards de Patrimônio, Resultado, Rentabilidade Mês
- [x] Gráfico de Evolução Patrimonial (histórico real — 1M, 3M, 6M, 1A)
- [x] Gráfico de Composição da Carteira (pizza por tipo)
- [x] Seção de Notícias (mockada — aguardando RSS real)

### Autenticação
- [x] Login com Google OAuth via Supabase
- [x] Logout via dropdown no avatar
- [x] Tela de Visão Geral para usuário não logado
- [x] Proteção da página Carteira (modal de login se não autenticado)
- [x] Avatar com dropdown: nome, email, foto do Google, botão Sair

### Carteira
- [x] Adicionar ativo (modal com busca de ticker, quantidade, preço médio, data)
- [x] Remover ativo
- [x] Tabela de ativos: ticker, quantidade, preço médio, preço atual, resultado, % carteira, DY
- [x] Cards de resumo com ícones e tooltips explicativos
- [x] Gráfico Composição da Carteira (tooltip corrigido, outline removido)
- [x] Calculadora de Projeção

### Ações
- [x] Listagem paginada (~150 ações, 20 por página)
- [x] Filtros por setor
- [x] Score IA como barra de progresso
- [x] Busca global com debounce 300ms

### FIIs
- [x] Listagem paginada (9 por página, grid 3 colunas)
- [x] Cards com ticker, nome truncado (`title` nativo no hover), tipo, métricas
- [x] Filtros por tipo e segmento

### Visual / PWA
- [x] Logo e favicon em todos os tamanhos
- [x] PWA via `vite-plugin-pwa` (dark theme #0f1629, standalone, autoUpdate)
- [x] `MarketStatusBadge` com glow e pulsing dot
- [x] Pulsing dot na Sidebar ao lado de "InvestSmart"
- [x] Tooltip melhorado no gráfico de pizza (TICKER · X% · R$valor)
- [x] CSS global `.recharts-wrapper svg:focus { outline: none; }`

---

## 11. BUGS RESOLVIDOS (histórico)

| Bug | Solução | Sessão |
|---|---|---|
| `evolucao_cache` PGRST204 (`atualizado_em`) | SQL rename: `atualizado_em → updated_at`, `user_id → usuario_id` | #9 |
| `evolucao_cache` PGRST204 (colunas faltantes) | Adicionar colunas `updated_at` e `payload_json` via ALTER TABLE | #10 |
| Yahoo Finance `close: null` mercado aberto | Migrou `buscarHistorico` para `chart()` com `period2=ontem` e `{ validateResult: false }` | #9 |
| Período 6mo retornava só 4 pontos | Adicionou caso `'6mo'` em `getPeriodStart` | #9 |
| Patrimônio dobrando no último ponto | Deduplica histórico Yahoo Finance por data antes de acumular | #9 |
| MarketBar mobile mostrando só SELIC | Removeu `hidden md:flex`, adicionou `overflow-x-auto` | #8 |
| AwesomeAPI USD 429 | Substituído por Yahoo Finance `USDBRL=X`, cache 60min | #10 |
| Rentabilidade Mês zerada | Corrigiu incompatibilidade `symbol/ticker` no backend | #7 |
| Build Railway quebrado | Corrigiu `.catch()` inválido no Supabase | #7 |
| Card "Rentabilidade Ano" duplicado | Removido do Dashboard | #7 |
| Nome do FII vazando do card | Aplicou `truncate` + `title` nativo | #7–8 |
| Gráfico Composição — tooltip ilegível + outline azul | Corrigido CSS global Recharts | #7 |
| Calculadora de Projeção — fundo branco no hover | CSS corrigido | #7 |

---

---

### Bug Menor — cotacoes_cache sobrescrito com fallback (preco=10, score=50)

**Causa:** Seed salva ativos com `preco=0` (Yahoo não retornou)  
**Fix:** Antes de salvar, validar `preco > 0`. Se `preco === 0` ou null, pular o save.  
**Status:** ⏳ Pendente

---

## 13. PENDÊNCIAS E PRÓXIMAS IMPLEMENTAÇÕES

### Próxima prioridade (crítico)
1. **Rodar SQL no Supabase** para adicionar `updated_at` e `payload_json` na `evolucao_cache`
2. **Verificar estabilidade do gráfico** após o fix (valores devem parar de oscilar)
3. **Último ponto do gráfico** usar valor da `cotacoes_cache` em vez do Yahoo histórico

### Funcionalidades planejadas
- [ ] **Toggle de Score** Dividendos / Crescimento (localStorage, recalcula no frontend)
- [ ] **Login Google OAuth** — verificar se Supabase Auth → Providers → Google está ativo
- [ ] **Audit completo da página Carteira**
- [ ] **Notícias reais** via RSS InfoMoney (https://www.infomoney.com.br/feed)
- [ ] **Busca global** ao clicar no resultado → abrir painel de detalhe do ativo
- [ ] **Paginação FIIs** — 9 por página (corrigir de 12 para 9)
- [ ] **Score da Carteira** — depende de dados fundamentalistas completos (Brapi pago ou scraping)
- [ ] **Evolução Patrimonial** — tooltip explicativo sobre limitação (simulação retroativa)
- [ ] **Alertas de preço** por email/push
- [ ] **Comparador de ativos** (side-by-side)

### Monetização (Fase 4)
- [ ] Links de afiliado (XP, Rico, Clear, Avenue)
- [ ] Google AdSense para plano gratuito
- [ ] Plano Premium com Stripe (R$19,90/mês)

---

## 14. REGRAS DE NEGÓCIO — CÁLCULOS

### Carteira
- **Patrimônio Total:** `soma(quantidade × preçoAtual)`
- **Resultado Total R$:** `soma(quantidade × preçoAtual) - soma(quantidade × preçoMédio)`
- **Rentabilidade %:** `((patrimonioTotal - totalInvestido) / totalInvestido) × 100`
- **Rentabilidade Mês:** variação média ponderada dos ativos nos últimos 30 dias
- **Dividendos Mês (estimativa):** `(dy / 100 / 12) × (quantidade × preçoAtual)`

### Evolução Patrimonial
- Usa preços históricos de fechamento (Yahoo Finance)
- Só inclui cada ativo a partir da sua `data_compra`
- FIIs limitados a 3 meses (plano gratuito Yahoo)
- `1y` → agrega por mês (último valor de cada mês) → 13 pontos

---

## 15. APRENDIZADOS TÉCNICOS CRÍTICOS

1. **Yahoo Finance retorna candles intraday duplicados** para o mesmo dia durante mercado aberto → **sempre deduplicar por data** (manter último por `dateKey`) antes de acumular patrimônio

2. **`{ validateResult: false }` é obrigatório** ao usar `yahooFinance.chart()` para evitar erros TypeScript — usar cast `(yahooFinance.chart as any)`

3. **Cache misses causam oscilação** no gráfico porque Yahoo Finance retorna preços ligeiramente diferentes em cada request real-time. Sem cache funcionando, o último ponto do gráfico muda a cada reload.

4. **Supabase PGRST204** = coluna não existe no schema cache. Solução: rodar `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` no SQL Editor.

5. **Brapi tem limite de batch** — sempre chunkar requests em grupos de ≤10 (regra herdada, não mais usada ativamente desde migração para Yahoo)

6. **Coluna `user_id`** na `carteira_ativos` — não é `usuario_id`. Confusão histórica causou bugs de cache.

---

## 16. WORKFLOW DE DESENVOLVIMENTO

O fluxo padrão das sessões:
1. **Claude** diagnostica bugs nos logs do Railway
2. **Claude** prepara prompts ordenados em português
3. **Antigravity** implementa as mudanças (um fix por vez)
4. **Rhom** testa em produção e compartilha logs
5. Repete até resolver

Arquivos de referência do projeto:
- `investsmart-melhorias.md` — lista de bugs e features
- `investsmart-prd.md` — especificações detalhadas
- `investsmart-contexto.md` — este arquivo

---

*Última atualização: 12/03/2026 — Sessão #10*
