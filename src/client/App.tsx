import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthInit } from './hooks/useAuthInit'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function AppRoutes() {
  const isInitialized = useAuthInit()

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div
          role="status"
          aria-label="Chargement de l'application"
          className="w-8 h-8 border-4 border-eco-200 border-t-eco-700 rounded-full animate-spin"
        />
      </div>
    )
  }

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Routes protégées — redirige vers /login si non authentifié */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<div>App (à venir)</div>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
