import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardGestor } from './pages/Gestor/DashboardGestor';
import { Login } from './pages/Auth/Login';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DreComparativo } from './pages/Gestor/DreComparativo';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rotas Protegidas com Layout Corporativo */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardGestor />
            </AppLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/dre" element={
          <ProtectedRoute>
            <AppLayout>
              <DreComparativo />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/relatorios" element={<Navigate to="/" replace />} />
        <Route path="/configuracoes" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
