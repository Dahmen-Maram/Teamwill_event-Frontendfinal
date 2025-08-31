"use client"


import { ArrowLeft } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { ProfileForm } from "@/components/profile/profile-form"
import { useLanguage } from "@/lib/i18n"
import { useAuth } from "@/modules/auth/auth-context"
import type { User } from "@/lib/types"
import Link from "next/link"

export default function EmployeeProfilePage() {
  const { t } = useLanguage()
  const { user, loading, refresh } = useAuth()

  const handleUserUpdate = async (updated: User) => {
    await refresh()
  }

  if (loading) {
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
