"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiService } from "@/lib/api"
import { User } from "@/lib/types"


interface AuthContextType {
  user: User | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refresh = async () => {
    try {
      const me = await apiService.getCurrentUser()
      setUser(me)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  // Redirect to login when not authenticated
  useEffect(() => {
    if (!loading && !user) {
      if (pathname !== '/auth/login' && pathname !== '/auth/register' && pathname !== '/') {
        router.replace('/auth/login')
      }
    }
  }, [loading, user, pathname])

  const logout = () => {
    apiService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
} 