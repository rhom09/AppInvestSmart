import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { AcoesPage } from './pages/AcoesPage'
import { FIIsPage } from './pages/FIIsPage'
import { ETFsPage } from './pages/ETFsPage'
import { RendaFixaPage } from './pages/RendaFixaPage'
import { CarteiraPage } from './pages/CarteiraPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/acoes" element={<AcoesPage />} />
          <Route path="/fiis" element={<FIIsPage />} />
          <Route path="/etfs" element={<ETFsPage />} />
          <Route path="/renda-fixa" element={<RendaFixaPage />} />
          <Route path="/carteira" element={<CarteiraPage />} />
          <Route path="/aprender" element={<div className="card p-8 text-center text-text-secondary">Em breve: Conteúdo educacional 📚</div>} />
          <Route path="/configuracoes" element={<div className="card p-8 text-center text-text-secondary">Em breve: Configurações ⚙️</div>} />
          <Route path="/planos" element={<div className="card p-8 text-center text-text-secondary">Em breve: Planos Premium 🚀</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
