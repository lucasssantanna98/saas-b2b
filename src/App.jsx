import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardGestor } from './pages/Gestor/DashboardGestor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardGestor />} />
      </Routes>
    </Router>
  )
}

export default App
