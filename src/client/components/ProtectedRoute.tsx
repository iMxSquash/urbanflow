import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'

export default function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const isGuest = useAuthStore((s) => s.isGuest)
  const isInitialized = useAuthStore((s) => s.isInitialized)

  if (!isInitialized) return null

  if (!accessToken && !isGuest) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
