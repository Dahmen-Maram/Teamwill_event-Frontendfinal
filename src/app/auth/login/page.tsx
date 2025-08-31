"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Eye, EyeOff,  LogIn } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { ThemeSelector } from "@/shared/ui/theme-selector"
import { ThemeLogo } from "@/shared/ui/theme-logo"
import { apiService } from "@/lib/api"
import { useAuth } from "@/modules/auth/auth-context"
import { useLanguage } from "@/lib/i18n"

interface LoginForm {
  email: string
  motDePasse: string
}

export default function LoginPage() {
  const [showmotDePasse, setShowmotDePasse] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { t } = useLanguage()
  const { theme } = useTheme()
  const { refresh } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const validateTeamWillEmail = (email: string) => {
    return email.includes("@teamwill") || email.includes("@teamwillgroup") || email.endsWith("@admin.com")
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    //clears the errors
    setError(null)

    try {
     
      const response = await apiService.login(data.email, data.motDePasse)
      

      // Ensure token is properly set and stored
      await apiService.setToken(response.access_token)
      
      // Verify token was set correctly
      const storedToken = apiService.getToken()
      //!! convert to boolean
      
      if (!storedToken) {
        throw new Error('Token not properly stored')
      }

      // Rafraîchir le contexte d'authentification pour mettre à jour l'utilisateur
      await refresh()

      const redirectPath = response.user.role === "Admin" ? "/admin" : response.user.role === "Responsable" ? "/marketing" : "/employee"
     
      
      router.replace(redirectPath)

      
    } catch (error) {
      console.error('Login failed:', error)
      setError(t("auth.invalidCredentials"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <ThemeLogo />
          <h1 className="text-2xl font-bold gradient-text">TeamwillEvents</h1>
          <p className="text-muted-foreground mt-2">{t("auth.loginTitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{t("auth.login")}</CardTitle>
                <CardDescription>{t("auth.loginDescription")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <LanguageSelector />
                <ThemeSelector />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.nom@teamwill.com"
                  {...register("email", {
                    required: t("auth.emailRequired"),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t("auth.emailInvalid"),
                    },
                    validate: (value) => validateTeamWillEmail(value) || t("auth.emailDomainInvalid"),
                  })}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="motDePasse">{t("auth.motDePasse")}</Label>
                <div className="relative">
                  <Input
                    id="motDePasse"
                    type={showmotDePasse ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("motDePasse", {
                      required: t("auth.motDePasseRequired"),
                      minLength: {
                        value: 6,
                        message: t("auth.motDePasseMinLength"),
                      },
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowmotDePasse(!showmotDePasse)}
                  >
                    {showmotDePasse ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.motDePasse && <p className="text-sm text-destructive">{errors.motDePasse.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {t("auth.loginButton")}
                  </>
                )}
              </Button>
              <div className="text-center">
                <div>
                  <a href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                    {t("auth.forgotPassword")}
                  </a>
                </div>
                <div>
                  <a href="/auth/register" className="text-sm text-primary hover:underline">
                    {t("auth.createAccount")}
                  </a>
                </div>
              </div>



            </form>


           
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
