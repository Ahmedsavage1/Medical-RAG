import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getToken, clearToken, saveToken } from '../api'

const AuthContext = createContext(null)

/**
 * Provides authentication state (token + derived user email) to the whole app.
 * Also exposes login / logout helpers so child components don't need to
 * touch localStorage directly.
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken())
  const [userEmail, setUserEmail] = useState(null)

  // Decode the email from the JWT payload (no signature verification needed
  // on the client – the server enforces security).
  useEffect(() => {
    if (!token) {
      setUserEmail(null)
      return
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUserEmail(payload.sub ?? null)
    } catch {
      setUserEmail(null)
    }
  }, [token])

  const login = useCallback((accessToken) => {
    saveToken(accessToken)
    setToken(accessToken)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Convenience hook – throws if used outside <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
