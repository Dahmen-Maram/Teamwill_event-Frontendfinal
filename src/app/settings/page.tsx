"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Switch } from "@/shared/ui/switch"
import { useLanguage } from "@/lib/i18n"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { useAuth } from "@/modules/auth/auth-context"
import type { User } from "@/lib/types"
import { Header } from "@/components/layout/header"

import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"


interface SettingsPageProps {
  user: User
  onLogout: () => void
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const { user, loading, logout } = useAuth()
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('notificationsEnabled') !== 'false'
  })

  const toggleNotifications = (checked: boolean) => {
    setNotificationEnabled(checked)
    if (typeof window !== 'undefined') {
      localStorage.setItem('notificationsEnabled', checked ? 'true' : 'false')
    }
  }
  const router = useRouter()
  

  const toggleTheme = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
  }
  const handleLogout = () => {
    // Exemple simple – adapter selon votre auth
    localStorage.clear()
    router.push("/signin")
  }
  console.log("USER in settings page", user)

  if (loading) return null

  return (
    <>
      {user && <Header user={user} onLogout={logout} />}
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
        {/* Titre principal */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("navigation.settings")}</h1>
          <LanguageSelector />
        </div>

        {/* Apparence */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.appearance")}</CardTitle>
            <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">{t("settings.darkMode")}</p>
              <p className="text-sm text-muted-foreground">
                {t("settings.darkModeDesc")}
              </p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.notifications")}</CardTitle>
            <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium">{t("settings.enableNotif")}</p>
              <p className="text-sm text-muted-foreground">
                {t("settings.enableNotifDesc")}
              </p>
            </div>
            <Switch
              checked={notificationEnabled}
              onCheckedChange={toggleNotifications}
            />
          </CardContent>
        </Card>

        {/* Sécurité
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.security")}</CardTitle>
            <CardDescription>{t("settings.securityDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">{t("settings.changePassword")}</Button>
            <Button variant="outline" disabled>
              {t("settings.twoFactor")}
            </Button>
          </CardContent>
        </Card> */}
      </div>
    </>
  )
}
