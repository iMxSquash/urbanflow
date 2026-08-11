import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthInit } from './hooks/use-auth-init'
import { useThemeSync } from './hooks/use-theme-sync'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const DashboardBadgesPage = lazy(() => import('./pages/DashboardBadgesPage'))
const RewardsPage = lazy(() => import('./pages/RewardsPage'))
const MapPage = lazy(() => import('./pages/MapPage'))
const ParametresPage = lazy(() => import('./pages/ParametresPage'))
const MentionsLegalesPage = lazy(() => import('./pages/MentionsLegalesPage'))
const CguPage = lazy(() => import('./pages/CguPage'))
const PolitiqueConfidentialitePage = lazy(() => import('./pages/PolitiqueConfidentialitePage'))

function PageSpinner() {
  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center">
      <div
        role="status"
        aria-label="Chargement de la page"
        className="w-8 h-8 border-4 border-primary-surface border-t-primary rounded-full animate-spin"
      />
    </div>
  )
}

function AppRoutes() {
  const isInitialized = useAuthInit()
  useThemeSync()

  if (!isInitialized) {
    return <PageSpinner />
  }

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="/cgu" element={<CguPage />} />
        <Route path="/confidentialite" element={<PolitiqueConfidentialitePage />} />

        {/* Routes protégées — redirige vers /login si non authentifié */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MapPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/badges" element={<DashboardBadgesPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/parametres" element={<ParametresPage />} />
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
