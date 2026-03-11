import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { AcoesPage } from './pages/AcoesPage'
import { FIIsPage } from './pages/FIIsPage'
import { ETFsPage } from './pages/ETFsPage'
import { RendaFixaPage } from './pages/RendaFixaPage'
import { CarteiraPage } from './pages/CarteiraPage'
import { LoginPage } from './pages/LoginPage'
import { useAuth } from './hooks/useAuth'

function App() {
  useAuth() // Initialize auth listener globally

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/acoes" element={<AcoesPage />} />
          <Route path="/fiis" element={<FIIsPage />} />
          <Route path="/etfs" element={<ETFsPage />} />
          <Route path="/renda-fixa" element={<RendaFixaPage />} />
          <Route path="/carteira" element={<CarteiraPage />} />
          <Route path="/alertas" element={<div className="card p-8 text-center text-text-secondary">Em breve: Alertas de Preço 🔔</div>} />
          <Route path="/calculadora" element={<div className="card p-8 text-center text-text-secondary">Em breve: Calculadora de Investimentos 🧮</div>} />
          <Route path="/comparador" element={<div className="card p-8 text-center text-text-secondary">Em breve: Comparador de Ativos ⚖️</div>} />
          <Route path="/aprender" element={<div className="card p-8 text-center text-text-secondary">Em breve: Conteúdo educacional 📚</div>} />
          <Route path="/configuracoes" element={<div className="card p-8 text-center text-text-secondary">Em breve: Configurações ⚙️</div>} />
          <Route path="/planos" element={<div className="card p-8 text-center text-text-secondary">Em breve: Planos Premium 🚀</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
