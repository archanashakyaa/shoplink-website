import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../api/api'

interface User {
  id: number
  email: string
  full_name?: string
  phone?: string
  profile_photo?: string
  bio?: string
  is_verified: boolean
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, fullName?: string, phone?: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [])

  const loadUser = async () => {
    try {
      const response = await api.getCurrentUser()
      if (response.status === 'success' && response.data) {
        setUser(response.data)
      } else {
        localStorage.removeItem('access_token')
      }
    } catch (error) {
      localStorage.removeItem('access_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login(email, password)
      if (response.status === 'success' && response.data) {
        localStorage.setItem('access_token', response.data.access_token)
        setUser(response.data.user)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const signup = async (
    email: string,
    password: string,
    fullName?: string,
    phone?: string
  ): Promise<boolean> => {
    try {
      const response = await api.signup(email, password, fullName, phone)
      if (response.status === 'success' && response.data) {
        localStorage.setItem('access_token', response.data.access_token)
        setUser(response.data.user)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

