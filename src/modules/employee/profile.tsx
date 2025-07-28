"use client"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { ProfileForm } from "@/components/profile/profile-form"
import { useLanguage } from "@/lib/i18n"
import { apiService } from "@/lib/api"
import type { User } from "@/lib/types"
import Link from "next/link"

export default function EmployeeProfilePage() {
  const { t } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await apiService.getCurrentUser()
        setUser(currentUser as User)
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">{t("common.error")}</p>
      </div>
    )
  }
 console.log(user)
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/employee">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
            <p className="text-muted-foreground">{t("profile.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <ProfileForm user={user} onUserUpdate={handleUserUpdate} />
    </div>
  )
}
