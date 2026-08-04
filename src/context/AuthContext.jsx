import { createContext, useCallback, useContext, useState } from 'react'
import { loginUser, logoutUser } from '../services/authApi.js'

const TOKEN_KEY = 'registration.token'
const USER_KEY = 'registration.user'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function readStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [token, setToken] = useState(readStoredToken)

  const login = useCallback(async (identifier, password) => {
    const response = await loginUser({ identifier, password })
    const userInfo = {
      id: response.id,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
    }
    localStorage.setItem(TOKEN_KEY, response.token)
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo))
    setToken(response.token)
    setUser(userInfo)
    return response
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const logoutFromServer = useCallback(async () => {
    if (!token) {
      logout()
      return
    }
    await logoutUser(token)
    logout()
  }, [token, logout])

  const isAuthenticated = Boolean(token && user)

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, login, logout, logoutFromServer }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
