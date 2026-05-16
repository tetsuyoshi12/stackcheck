import { createContext, useContext, useEffect, useState } from 'react'
import type { User, UserTitle } from '../types'
import { getMe, getMyTitles } from '../api/client'

interface AuthContextValue {
  user: User | null
  token: string | null
  titles: UserTitle[]
  loading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
  refreshTitles: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  titles: [],
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshTitles: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [titles, setTitles] = useState<UserTitle[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTitles = async (t: string) => {
    try {
      const ts = await getMyTitles(t)
      setTitles(ts)
    } catch {
      setTitles([])
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem('auth_token')
    if (stored) {
      getMe(stored)
        .then(async (u) => {
          setUser(u)
          setToken(stored)
          await fetchTitles(stored)
        })
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
    await fetchTitles(newToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setTitles([])
    localStorage.removeItem('auth_token')
  }

  const refreshTitles = async () => {
    if (token) await fetchTitles(token)
  }

  return (
    <AuthContext.Provider value={{ user, token, titles, loading, login, logout, refreshTitles }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
