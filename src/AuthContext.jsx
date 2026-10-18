import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => api.getSession())
  const navigate = useNavigate()

  // כשהשרת מחזיר 401 על token שפג, api.js מנקה אותו וקורא לכאן
  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      setSession(null)
      navigate('/login', { state: { message: 'פג תוקף ההתחברות. יש להתחבר מחדש.' } })
    })
  }, [navigate])

  const login = useCallback(async (email, password) => {
    setSession(await api.login(email, password))
  }, [])

  const register = useCallback(async (fullName, email, password) => {
    setSession(await api.register(fullName, email, password))
  }, [])

  const logout = useCallback(() => {
    api.logout()
    setSession(null)
    navigate('/')
  }, [navigate])

  const value = useMemo(() => ({ session, login, register, logout }), [session, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
