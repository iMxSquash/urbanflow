import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'

export default function LogoutButton() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    try {
      await logout()
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="btn-secondary"
      aria-disabled={isLoading}
      aria-busy={isLoading}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <span
            aria-hidden="true"
            className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"
          />
          <span>Déconnexion…</span>
        </>
      ) : (
        'Se déconnecter'
      )}
    </button>
  )
}
