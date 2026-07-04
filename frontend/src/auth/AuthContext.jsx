import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../api/client'
import {
  AUTH_EXPIRED_EVENT,
  clearAuth,
  getAuth,
  setAuth as persistAuth,
} from './tokenStore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuthState] = useState(() => getAuth())

  // Si el cliente HTTP detecta que la sesión caducó (refresh falló), limpiamos.
  useEffect(() => {
    const onExpired = () => setAuthState(null)
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired)
  }, [])

  const value = useMemo(
    () => ({
      user: auth?.user || null,
      isAuthenticated: !!auth?.accessToken,
      async login(username, password) {
        const res = await api.login(username, password)
        const next = {
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          user: res.user,
        }
        persistAuth(next)
        setAuthState(next)
        return res.user
      },
      async logout() {
        await api.logout()
        clearAuth()
        setAuthState(null)
      },
    }),
    [auth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
