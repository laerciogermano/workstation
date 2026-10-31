import { useState } from 'react'
import { errorMessage, type User } from '../api/client'
import { useAuth } from './AuthContext'

// Chama a API, guarda o usuário devolvido e expõe busy/erro para a tela.
export function useSave() {
  const { setUser } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save(fn: () => Promise<User>) {
    setBusy(true)
    setError('')
    try {
      const user = await fn()
      setUser(user)
      return user
    } catch (e) {
      setError(errorMessage(e))
      return null
    } finally {
      setBusy(false)
    }
  }

  return { save, busy, error, setError }
}
