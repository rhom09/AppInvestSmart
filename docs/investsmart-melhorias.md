# InvestSmart — Lista de Melhorias Pendentes

## 🐛 Bugs / Ajustes Visuais

- [ ] MarketBar: mostrar só IBOVESPA e SELIC no mobile (evitar texto cortado)
- [ ] Renda Fixa: cards desalinhados no mobile (layout quebrando)
- [ ] Listagem de Ações: aumentar de 15 para 50+ ativos reais da B3
- [ ] FIIs Explorer: aumentar quantidade de fundos listados (fazer com paginação, não tudo de uma vez)
- [ ] Busca: pesquisa em tempo real para qualquer ticker da B3, não só os carregados

---

## 🚀 Funcionalidades a Implementar

- [ ] **Notícias reais**: substituir mock por RSS feed do InfoMoney
  - URL: https://www.infomoney.com.br/feed
  - Parse XML → título, fonte, hora
  - Alternativa: NewsAPI.org (100 req/dia grátis, precisa de API key)

- [ ] **CDI na MarketBar**: já aparece mas verificar se o valor está correto (puxar do Banco Central)

- [ ] **IFIX em tempo real**: verificar se está vindo da Brapi ou mockado

---

## 📱 Responsividade Mobile

- [ ] Sidebar vira bottom navigation bar no mobile com 5 ícones
- [ ] Tablet: sidebar colapsada com só ícones (sem labels)
- [ ] Página de Ações: tabela com scroll horizontal no mobile
- [ ] Página de FIIs: cards em coluna única no mobile
- [ ] Dashboard: SpotlightAcao adaptado para tela pequena

---

## 💰 Monetização (Fase 4)

- [ ] Links de afiliado nas páginas de Ações, FIIs e Renda Fixa
  - Botão "Abrir conta e comprar" → link corretora (XP, Rico, Clear, Avenue)
  - Cadastrar como afiliado antes de ativar os links
- [ ] Google AdSense para usuários do plano gratuito
- [ ] Plano Premium com Stripe (R$19,90/mês)
  - Alertas ilimitados
  - Newsletter diária
  - Exportar PDF
  - Sem anúncios

---

## 🔔 Alertas (Fase 3)

- [ ] Alertas de preço por email/push notification
- [ ] Alertas de score mínimo
- [ ] Alertas de DY mínimo para FIIs
- [ ] Interface para gerenciar alertas (já tem tabela no Supabase)

---

## 📊 Análises Avançadas (Fase 3)

- [ ] Comparador de ativos (side-by-side de 2-3 ativos)
- [ ] Glossário educacional com todos os termos e indicadores
- [ ] Newsletter diária automatizada (resumo do mercado + top 3 ativos)
- [ ] Histórico de score de cada ativo (gráfico de evolução do score)

---

## 🛠️ Técnico / Performance

- [ ] Cache mais agressivo para não estourar limite da Brapi (15k req/mês)
- [ ] Paginação na listagem de ações (não buscar tudo de uma vez)
- [ ] SEO: páginas individuais de cada ativo com meta tags
- [ ] PWA: permitir instalar o app no celular como aplicativo

---

## 📋 Ordem de Execução Atual

### EM ANDAMENTO
- [x] A1 — Setup do projeto
- [x] A2 — APIs de mercado
- [x] A3 — Algoritmo de score
- [x] A4 — Dashboard completo
- [ ] **A5** — Login Google + Carteira Supabase ← PRÓXIMO
- [ ] A6 — Cron job de atualização
- [ ] A7 — Deploy Vercel

### DEPOIS DO DEPLOY
- [ ] Refinamento mobile geral
- [ ] Notícias reais (RSS)
- [ ] Mais ativos com paginação
- [ ] Alertas
- [ ] Afiliados
- [ ] Premium / Stripe
- [ ] AdSense
