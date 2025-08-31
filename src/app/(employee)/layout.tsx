"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { useAuth } from "@/modules/auth/auth-context"

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && user.role !== "Employee") {
      const target = user.role === "Responsable" ? "/marketing" : user.role === "Admin" ? "/admin" : "/";
      router.push(target)
    }
  }, [loading, user, router])

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Si pas d'utilisateur après le chargement, ne rien afficher
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
