import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '../types'
import { getMe } from '../api/client'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 初期化：localStorageからトークンを復元
  useEffect(() => {
    const stored = localStorage.getItem('auth_token')
    if (stored) {
      getMe(stored)
        .then((u) => { setUser(u); setToken(stored) })
        .catch(() => localStorage.removeItem('auth_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (newToken: string) => {
    const u = await getMe(newToken)
    setUser(u)
    setToken(newToken)
    localStorage.setItem('auth_token', newToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
