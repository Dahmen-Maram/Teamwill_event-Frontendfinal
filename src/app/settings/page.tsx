"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Switch } from "@/shared/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { useLanguage } from "@/lib/i18n"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { Header } from "@/components/layout/header"
import type { User } from "@/lib/types"
import { apiService } from "@/lib/api"
import { useAuth } from "@/modules/auth/auth-context"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"


interface SettingsPageProps {
  user: User
  onLogout: () => void
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const { user, loading, refresh, logout } = useAuth()
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
  
  function handleBack() {
    router.back()
  }
  

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as "light" | "dark" | "eco")
  }

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  // Fonction pour mettre à jour l'utilisateur dans le contexte
  const handleUserUpdate = async (updatedUser: User) => {
    // Rafraîchir le contexte d'authentification pour mettre à jour l'avatar
    await refresh()
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header user={user} onLogout={handleLogout} />
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
        {/* Titre principal */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              aria-label={t("navigation.back") ?? "Back"}
              className="text-primary hover:text-primary/80 transition cursor-pointer mb-4 p-0"
              style={{ background: "none", border: "none" }}
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <h1 className="text-3xl font-bold">{t("navigation.settings")}</h1>
          </div>
          <LanguageSelector />
        </div>

        {/* Apparence */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.appearance")}</CardTitle>
            <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">{t("settings.theme") || "Thème"}</p>
              <p className="text-sm text-muted-foreground mb-4">
                {t("settings.themeDesc") || "Choisissez l'apparence de l'application"}
              </p>
            </div>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un thème" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                    {t("settings.lightMode") || "Mode clair"}
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-900 border border-gray-600 rounded"></div>
                    {t("settings.darkMode") || "Mode sombre"}
                  </div>
                </SelectItem>
                                 <SelectItem value="eco">
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-800 rounded"></div>
                     {t("settings.ecoMode") || "Mode éco (Crayon)"}
                   </div>
                 </SelectItem>
              </SelectContent>
            </Select>
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
