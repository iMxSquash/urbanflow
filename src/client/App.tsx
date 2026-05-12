import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Link } from 'react-router-dom'
import LogoutButton from './components/LogoutButton'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthInit } from './hooks/useAuthInit'
import { useAuthStore } from './stores/auth.store'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

function HomePage() {
  const user = useAuthStore((s) => s.user)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between max-w-2xl mx-auto w-full">
        <span className="text-h3 font-bold text-slate-900">UrbanFlow</span>
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="btn-secondary text-body-sm px-3"
          >
            Mon profil
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-body text-slate-600">
          Bonjour{user?.email ? ` ${user.email}` : ''} 👋
        </p>
        <p className="text-body-sm text-slate-500">La carte arrive au Sprint 2.</p>
      </main>
    </div>
  )
}

function PageSpinner() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div
        role="status"
        aria-label="Chargement de la page"
        className="w-8 h-8 border-4 border-eco-200 border-t-eco-700 rounded-full animate-spin"
      />
    </div>
  )
}

function AppRoutes() {
  const isInitialized = useAuthInit()

  if (!isInitialized) {
    return <PageSpinner />
  }

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Routes protégées — redirige vers /login si non authentifié */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
