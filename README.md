# 📊 InvestSmart

InvestSmart é uma plataforma completa de análise de investimentos da B3, focada em fornecer cotações em tempo real, cálculo de scores baseados em fundamentos e automação de acompanhamento de carteira.

## 🚀 Funcionalidades

- **Dashboard**: Visão geral do mercado com índices (IBOV, SELIC, IPCA, Dólar).
- **Análise de Ativos**: Scores automáticos baseados em P/L, P/VP, DY, ROE e Margem Líquida.
- **Carteira Inteligente**: Cálculo de rentabilidade e score médio da carteira.
- **Notícias**: Feed de notícias financeiras integradas.
- **Automação (Job)**: Atualização diária automática de dados após o fechamento do mercado.

## 🛠️ Tecnologias

- **Frontend**: Vite + React + TypeScript + Vanilla CSS.
- **Backend**: Node.js + Express + TypeScript + Node-Cron.
- **Banco de Dados**: Supabase (PostgreSQL).
- **APIs**: Brapi (Mercado), BCB (IPCA), AwesomeAPI (Dólar).

## 📥 Pré-requisitos

- Node.js 20+
- Conta no [Supabase](https://supabase.com)
- Token da [Brapi](https://brapi.dev)

## 💻 Instalação Local

1.  **Clonar o repositório**:
    ```bash
    git clone https://github.com/usuario/AppInvestSmart.git
    cd AppInvestSmart
    ```

2.  **Instalar dependências**:
    ```bash
    npm run install:all
    ```

3.  **Configurar variáveis de ambiente**:
    Crie um arquivo `.env` na pasta `backend` seguindo o modelo abaixo:
    ```env
    PORT=3001
    BRAPI_TOKEN=seu_token_aqui
    SUPABASE_URL=sua_url_supabase
    SUPABASE_SERVICE_KEY=sua_service_key
    ADMIN_API_KEY=chave_secreta_admin
    ```

4.  **Rodar o projeto**:
    ```bash
    npm run dev
    ```

## 🌍 Deploy

### Backend (Railway)
1. Conecte seu repositório ao Railway.
2. O Railway detectará o `Procfile` e `railway.json`.
3. Configure as variáveis de ambiente no dashboard do Railway (as mesmas do `.env`).

### Frontend (Vercel)
1. Conecte seu repositório à Vercel.
2. Defina o diretório raiz como `frontend`.
3. Adicione as variáveis de ambiente no dashboard da Vercel:
   - `VITE_API_URL`: Sua URL do Railway.
   - `VITE_SUPABASE_URL`: URL do Supabase.
   - `VITE_SUPABASE_KEY`: Chave Anon do Supabase.

## 📝 Variáveis de Ambiente Necessárias

| Variável | Descrição |
| :--- | :--- |
| `BRAPI_TOKEN` | Token da API Brapi para cotações e fundamentos. |
| `SUPABASE_URL` | URL do seu projeto no Supabase. |
| `SUPABASE_SERVICE_KEY` | Chave de serviço (backend) para operações administrativas. |
| `SUPABASE_KEY` | Chave pública (frontend) para autenticação. |
| `ADMIN_API_KEY` | Chave para disparar o Job de atualização manualmente. |

---
Desenvolvido por **InvestSmart Team**
