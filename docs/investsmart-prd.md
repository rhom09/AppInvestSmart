# PRD — InvestSmart
**Product Requirements Document**
**Versão:** 1.0 | **Data:** Março 2026

---

## 1. Visão Geral do Produto

### 1.1 Descrição
InvestSmart é um webapp brasileiro de rastreamento e análise de portfólio de investimentos, comparável ao Kinvo e Gorila. Ajuda investidores iniciantes a tomar decisões melhores na bolsa de valores através de indicadores fundamentalistas calculados automaticamente, pontuação de ativos (Score 0–100) e acompanhamento de carteira pessoal.

### 1.2 URLs de Produção
- **Frontend:** https://app-invest-smart.vercel.app
- **Backend:** https://appinvestsmart-backend.onrender.com

### 1.3 Stack Tecnológica
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Google OAuth via Supabase
- **Deploy:** Vercel (frontend) + Render (backend)
- **APIs Externas:** Brapi.dev, BCB (Banco Central), AwesomeAPI

---

## 2. Usuários e Contexto

### 2.1 Perfil do Usuário
- Investidor brasileiro iniciante ou intermediário
- Quer acompanhar ações (B3) e FIIs sem precisar entender fórmulas complexas
- Acessa via desktop e mobile
- Não é um broker — o usuário compra ativos em corretoras externas (XP, Rico, Clear) e registra manualmente no InvestSmart

### 2.2 Proposta de Valor
O app calcula automaticamente indicadores fundamentalistas (P/L, P/VP, DY, ROE) e entrega um Score de 0 a 100 por ativo, indicando se está barato, justo ou caro e se paga bons dividendos.

---

## 3. Funcionalidades por Tela

### 3.1 Visão Geral / Dashboard

**Usuário não logado ("Visão Geral"):**
- MarketBar em cards: IBOVESPA, IFIX, SELIC, IPCA, USD/BRL, CDI com valores e variações em tempo real
- Tabela "Ações Indicadas Hoje" com top ações por Score
- Seção "Top FIIs por Score" com cards dos melhores fundos
- Seção de Notícias (dados mockados — melhoria futura com RSS)
- Cards de Patrimônio, Evolução Patrimonial e Composição da Carteira bloqueados com overlay 🔒 e CTA de login
- Botão "Entrar com Google" na Navbar

**Usuário logado ("Dashboard"):**
- Todos os itens acima desbloqueados
- 4 cards de resumo: Patrimônio Total, Resultado Total, Rentabilidade Mês, Dividendos Mês
- Gráfico de Evolução Patrimonial (histórico real baseado em preços de fechamento da Brapi)
- Gráfico de Composição da Carteira (pizza/donut por tipo de ativo)
- Avatar com dropdown: nome, email, foto do Google, botão "Sair"

### 3.2 Ações
- Listagem paginada de ~150 ações da B3 (20 por página)
- Colunas: Ativo (avatar + ticker + nome), Preço, Var. Dia, P/L, P/VP, DY, ROE, Score IA
- Filtros por setor: Financeiro, Indústria, Energia, Varejo, Tecnologia, Agro, Saúde
- Score exibido como barra de progresso + número
- Paginação: ← Anterior | 1 2 3 | Próxima →
- Busca global no topo (debounce 300ms, resultados agrupados por tipo)
- Valores nulos da Brapi exibidos como "—"

### 3.3 FIIs
- Listagem paginada de ~50 FIIs (9 por página, grid 3 colunas)
- Cards com: ticker, nome truncado com `title` nativo (tooltip no hover desktop, long press mobile), tipo/segmento, métricas (Cota, DY Mensal, P/VP, Vacância)
- Filtros por tipo: Tijolo, Papel, Híbrido, Fundo de Fundos
- Filtros por segmento: Logística, Lajes, Shoppings, Residencial, Agro, CRI/CRA
- Valores nulos exibidos como "—"

### 3.4 ETFs
- Listagem de ETFs com histórico de rentabilidade
- Dados via Brapi

### 3.5 Renda Fixa
- Calculadora comparando Tesouro Selic, IPCA+ e CDB com inflação atual
- Dados de SELIC e IPCA via API do Banco Central

### 3.6 Carteira (requer login)
- Se não logado: modal centralizado com CTA de login (não redireciona)
- 4 cards de resumo com ícones: Patrimônio Total, Resultado Total, Rentabilidade Mês, Dividendos Mês (estimativa)
- Card de Score da carteira com: Score médio ponderado, Rentabilidade Mês, Rentabilidade Ano (com tooltips InfoTooltip explicativos)
- Tabela de ativos: ticker, quantidade, preço médio, preço atual, resultado (R$ e %), % da carteira, DY
- Gráfico de Evolução Patrimonial com filtros 1M, 3M, 6M, 1A
- Gráfico de Composição da Carteira (pizza por tipo)
- Calculadora de Projeção
- Botão "+ Adicionar Ativo" → modal com busca de ticker, quantidade, preço médio, data de compra

---

## 4. Fluxos de Autenticação

### 4.1 Login
- Provider: Google OAuth via Supabase
- Disparado por: botão "Entrar com Google" na Navbar, botão na tela de Carteira
- Após login: permanece na página atual (não redireciona)

### 4.2 Logout
- Menu dropdown no avatar (Navbar e Sidebar)
- Chama `supabase.auth.signOut()`
- Após logout: recarrega a página

### 4.3 Rotas Protegidas
- `/carteira` → exibe modal de login se não logado
- Demais rotas são públicas

---

## 5. Integrações e APIs

### 5.1 Brapi.dev
- Cotações de ações e FIIs em tempo real
- Plano gratuito: máximo 1 ativo por request
- Batching: chunks de 1 request por ticker com Promise.all (máx 5 simultâneos)
- Cache em memória: 5 minutos para cotações, 6h para rentabilidade mês, 12h para rentabilidade ano, 24h para histórico
- Tickers de FIIs limitados a `range=3mo` no plano gratuito (fallback automático de 6mo/1y para 3mo)

### 5.2 Banco Central do Brasil (BCB)
- SELIC: série 432
- CDI: série 4389
- IPCA: série bcdata.sgs.433

### 5.3 AwesomeAPI
- USD/BRL em tempo real
- Cache: 15 minutos

---

## 6. Algoritmo de Score

### 6.1 Score de Ações (0–100)
Média ponderada de indicadores normalizados (0–10):
- **P/L** (peso 25%): ≤8→10, 8–15→8, 15–25→5, 25–40→2, >40→0
- **P/VP** (peso 15%): ≤1→10, 1–1.5→7, 1.5–2.5→4, >2.5→1
- **DY** (peso 30%): 0–3%→3, 3–6%→6, 6–10%→9, >10%→10
- **ROE** (peso 20%): 0–8%→3, 8–15%→6, 15–25%→9, >25%→10
- **Margem Líquida** (peso 10%): 0–5%→3, 5–15%→6, 15–30%→9, >30%→10

**Labels:**
- 80–100: Excelente (#00e88f)
- 65–79: Bom (#00b8ff)
- 50–64: Neutro (#f5c842)
- 0–49: Evitar (#ff4d6d)

### 6.2 Score de FIIs (0–100)
- **DY Mensal** (peso 35%): <0.6%→0, 0.6–0.8%→5, 0.8–1%→8, >1%→10
- **P/VP** (peso 25%): >1.2→0, 1–1.2→5, 0.9–1→8, <0.9→10
- **Vacância** (peso 25%): >15%→0, 10–15%→3, 5–10%→6, 2–5%→8, <2%→10
- **Liquidez** (peso 15%): <100k→0, 100k–500k→4, 500k–1M→7, >1M→10

---

## 7. Banco de Dados (Supabase)

### 7.1 Tabelas Principais

**carteira_ativos**
```sql
id uuid primary key
user_id uuid references auth.users
ticker text not null
tipo text -- 'acao', 'fii', 'etf', 'renda_fixa'
quantidade decimal
preco_medio decimal
data_compra date
created_at timestamp default now()
```

**alertas**
```sql
id uuid primary key
user_id uuid references auth.users
ticker text
tipo text -- 'preco_alvo', 'score_minimo', 'dy_minimo'
valor decimal
ativo boolean default true
created_at timestamp default now()
```

**scores_diarios**
```sql
id uuid primary key
ticker text
score integer
pl decimal, pvp decimal, dy decimal, roe decimal
preco decimal
data date default current_date
unique(ticker, data)
```

**indicados_diarios**
```sql
id uuid primary key
ticker text
score integer
motivo text
data date default current_date
```

---

## 8. Endpoints da API

### 8.1 Mercado
- `GET /api/mercado/indices` → SELIC, IPCA, CDI, USD/BRL, IBOVESPA, IFIX

### 8.2 Ações
- `GET /api/acoes?page=1&limit=20` → lista paginada com score calculado
- `GET /api/acoes/:ticker` → cotação individual
- `GET /api/acoes/:ticker/historico?range=1mo` → histórico de preços
- `GET /api/busca?q={termo}` → busca global (máx 8 resultados)

### 8.3 FIIs
- `GET /api/fiis?page=1&limit=9` → lista paginada

### 8.4 Carteira
- `GET /api/cotacoes?tickers=X,Y,Z` → cotações atuais para carteira
- `GET /api/carteira/evolucao?userId={id}&periodo=1mo|3mo|6mo|1y` → evolução patrimonial histórica
- `GET /api/carteira/rentabilidade-periodo?tickers=X&quantities=N&periodo=mes|ano` → rentabilidade do período

---

## 9. Regras de Negócio

### 9.1 Cálculos da Carteira
- **Patrimônio Total:** `soma(quantidade × preçoAtual)`
- **Resultado Total R$:** `soma(quantidade × preçoAtual) - soma(quantidade × preçoMédio)`
- **Rentabilidade Total %:** `((patrimonioTotal - totalInvestido) / totalInvestido) × 100`
- **Rentabilidade Mês:** variação média ponderada dos ativos nos últimos 30 dias (preço de mercado, não pessoal)
- **Rentabilidade Ano:** variação média ponderada dos ativos nos últimos 12 meses (preço de mercado, não pessoal)
- **Dividendos Mês (estimativa):** `(dy / 100 / 12) × (quantidade × preçoAtual)` por ativo

### 9.2 Evolução Patrimonial
- Usa preços históricos de fechamento (Brapi)
- Só inclui cada ativo a partir da sua `data_compra`
- Valor atual pode diferir do gráfico (gráfico usa fechamento, card usa cotação em tempo real)
- FIIs limitados a 3 meses de histórico (plano gratuito Brapi)

### 9.3 Dados Nulos
- Indicadores fundamentalistas nulos da Brapi exibidos como "—" (nunca zero)

---

## 10. Design System

### 10.1 Cores
- Background: `#07090f`
- Surface (cards): `#0e1120`
- Positivo/alta: `#00e88f` (verde elétrico)
- Secundário: `#00b8ff` (azul)
- Negativo/queda: `#ff4d6d` (vermelho)
- Destaque: `#f5c842` (dourado)
- Texto principal: `#e8eaf2`
- Texto muted: `#5a6080`
- Bordas: `#1e2438`

### 10.2 Tipografia
- Títulos e números: Syne (800, 700, 600)
- Tickers e valores: DM Mono (500, 400)
- Texto e UI: DM Sans (500, 400, 300)

### 10.3 Componentes Reutilizáveis
- `<InfoTooltip text="..." />` — ícone ℹ com tooltip explicativo
- `<TruncatedName name="..." />` — texto truncado com title nativo (desktop) e long press (mobile)
- `<ScoreBar value={87} />` — barra de progresso colorida por faixa
- `<VariacaoBadge value={1.2} />` — badge verde/vermelho com ▲▼

---

## 11. Comportamentos Globais

### 11.1 Gráficos (Recharts)
- Todos os gráficos: `style={{ outline: 'none' }}` para remover outline de foco
- CSS global: `.recharts-wrapper svg:focus { outline: none; }`
- Tooltip padrão: `{ backgroundColor: '#1e2438', border: '1px solid #2a3050', color: '#e8eaf2' }`

### 11.2 Busca Global
- Disponível em todas as telas na Navbar
- Debounce: 300ms
- Resultados agrupados: Ações | FIIs | ETFs
- Cada resultado: ticker, nome, tipo, preço atual, variação do dia

### 11.3 Mobile
- Sidebar oculta no mobile
- Bottom Navigation Bar com 5 ícones: Dashboard | Carteira | Ações | FIIs | Mais(⋯)
- "Mais" abre drawer com: ETFs, Renda Fixa, Alertas, Calculadora, Comparador
- Tabelas: scroll horizontal
- FIIs: 1 coluna no mobile, 2 no tablet, 3 no desktop

---

## 12. Melhorias Futuras (Backlog)

- Notícias reais via RSS feed InfoMoney
- Score da carteira (depende de dados fundamentalistas da Brapi — plano pago)
- Página de FIIs: paginação de 9 por página
- Busca global: ao clicar no resultado, abrir painel de detalhe do ativo
- Dividendos reais via calendário (Status Invest)
- Alertas de preço por email/push
- Comparador de ativos (side-by-side)
- Plano Premium com Stripe (R$19,90/mês)
- Links de afiliado de corretoras (XP, Rico, Clear, Avenue)
- Google AdSense para plano gratuito
- SEO: páginas individuais por ativo
- PWA: instalar como app no celular
- Landing Page antes dos planos Premium
