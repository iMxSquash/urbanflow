import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from './Spinner'
import { logout } from '../services/auth.service'
import { useAuthStore } from '../stores/auth.store'
import { useProfileStore } from '../stores/profile.store'

export default function LogoutButton() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const clearProfile = useProfileStore((s) => s.clearProfile)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    try {
      await logout()
    } finally {
      clearProfile()
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
          <Spinner />
          <span>Déconnexion…</span>
        </>
      ) : (
        'Se déconnecter'
      )}
    </button>
  )
}
