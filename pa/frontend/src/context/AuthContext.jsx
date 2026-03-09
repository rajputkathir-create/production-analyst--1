import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
        authApi.me().then(res => {
          setUser(res.data)
          localStorage.setItem('user', JSON.stringify(res.data))
        }).catch(() => logout())
      } catch { logout() }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const res = await authApi.login({ username, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const hasRole = (...roles) => user && roles.includes(user.role)
  const isAdminOrAbove = () => hasRole('super_admin', 'admin')
  const isTLOrAbove = () => hasRole('super_admin', 'admin', 'tl')

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, theme, toggleTheme, hasRole, isAdminOrAbove, isTLOrAbove }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
