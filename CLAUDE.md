# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📖 Project Documentation

Sempre consulte estes arquivos para entender as regras de negócio e objetivos antes de sugerir mudanças:
 
- **Contexto (Local):** `@investsmart-contexto.local.md` (Prioritário - Contém chaves privadas)— Contém a visão geral, domínio de investimentos e regras de negócio.
- **Contexto (Padrão):** `@investsmart-contexto.md` (Estrutura do projeto)
- **PRD (Requisitos):** `@docs/prd.md` — Define as funcionalidades, requisitos técnicos e escopo atual.
- **Melhorias:** `@docs/melhorias.md` — Lista de débitos técnicos, ideias de UI/UX e futuras implementações.

---


## 🚀 Development Commands

### Project Setup
- Install all dependencies (root, frontend, backend): `npm run install:all`

### Running the Application
- Start both frontend and backend concurrently (development): `npm run dev`
- Start only frontend: `npm run dev:frontend`
- Start only backend: `npm run dev:backend`

### Backend Specific
- Build backend TypeScript: `npm run build --prefix ./backend`
- Start built backend: `npm run start --prefix ./backend`
- Run backend in development mode: `npm run dev --prefix ./backend`

### Frontend Specific
- Build frontend for production: `npm run build --prefix ./frontend`
- Preview built frontend locally: `npm run preview --prefix ./frontend`
- Lint frontend code: `npm run lint --prefix ./frontend`

### Testing
- Backend test files are located in `backend/src/` with naming pattern `test-*.ts`
- Run individual backend test: `npx ts-node backend/src/test-brapi.ts` (example)
- No frontend test framework configured in package.json

## 🏗️ Architecture Overview

### Monorepo Structure
```
investsmart/
├── backend/          # Node.js/Express/TypeScript API
│   ├── src/
│   │   ├── index.ts          # Application entry point
│   │   ├── routes/           # API route controllers (acoes, fiis, noticias, etc.)
│   │   ├── services/         # Business logic & external API integrations
│   │   ├── cron/             # Scheduled jobs (market data updates)
│   │   ├── utils/            # Utility functions
│   │   └── test-*.ts         # Backend test scripts
│   ├── .env                  # Environment variables (local development)
│   ├── package.json
│   └── tsconfig.json
├── frontend/         # React/Vite/TypeScript SPA
│   ├── src/
│   │   ├── App.tsx           # Root component
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page-level components (routes)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service layer
│   │   ├── store/            # Zustand state management
│   │   ├── types/            # TypeScript definitions
│   │   └── utils/            # Utility functions
│   ├── .env.local            # Frontend environment variables
│   ├── vite.config.ts        # Vite configuration (with React & PWA plugins)
│   ├── tailwind.config.ts    # Tailwind CSS configuration
│   └── package.json
├── supabase/             # Database migrations & SQL functions
└── package.json          # Root scripts (concurrently, install:all, etc.)
```

### Key Technical Decisions
- **Backend**: Express.js with TypeScript, using Node-Cron for scheduled market data updates
- **Frontend**: React 19 with Vite, TailwindCSS, Zustand for state management, Recharts for data visualization
- **Database**: Supabase (PostgreSQL) for persistent storage
- **External APIs**: 
  - Brapi: Stock quotes and fundamental data
  - BCB: IPCA (inflation) data
  - AwesomeAPI: Currency exchange rates
- **Environment Variables**: Managed separately for backend (.env) and frontend (.env.local/.env.production)
- **Build Process**: 
  - Backend: TypeScript compilation to `dist/` directory
  - Frontend: TypeScript check followed by Vite build
- **Deployment**: 
  - Backend: Configured for Render.com (formerly Railway)
  - Frontend: Configured for Vercel

### Important Files for Modification
- **Adding new API routes**: 
  1. Create route file in `backend/src/routes/`
  2. Implement controller logic
  3. Register route in `backend/src/index.ts`
  4. Add service functions in `backend/src/services/` if needed
- **Adding new frontend pages**:
  1. Create component in `frontend/src/pages/`
  2. Add route in `frontend/src/App.tsx` (uses react-router-dom)
  3. Create service hooks in `frontend/src/services/` if API calls needed
- **Modifying scheduled jobs**: Edit files in `backend/src/cron/`
- **Updating external API integrations**: Modify relevant services in `backend/src/services/`

### Data Flow
1. External APIs (Brapi, BCB, AwesomeAPI) → Backend services → Supabase database
2. Frontend requests → Backend routes → Backend services (with caching via node-cache) → Database/external APIs
3. Scheduled cron jobs update market data in Supabase after market close
4. Frontend Zustand store synchronizes with Supabase via real-time subscriptions (where implemented)
