"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { apiService } from "@/lib/api"
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const validateTeamWillEmail = (email: string) => {
    return email.includes("@teamwill") || email.includes("@teamwillgroup")
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    //clears the errors
    setError(null)

    try {
      console.log('Login attempt started')
      const response = await apiService.login(data.email, data.motDePasse)
      console.log('Login successful:', response)

      // Ensure token is properly set and stored
      await apiService.setToken(response.access_token)
      
      // Verify token was set correctly
      const storedToken = apiService.getToken()
      //!! convert to boolean
      console.log('Token stored:', !!storedToken)
      console.log('Stored token:', storedToken)
      if (!storedToken) {
        throw new Error('Token not properly stored')
      }

      // Add small delay to ensure token is fully processed
      await new Promise(resolve => setTimeout(resolve, 100))

      const redirectPath = response.user.role === "Responsable" ? "/marketing" : "/employee"
      console.log('Redirecting to:', redirectPath)
      
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
        {/* Language Selector */}
        <div className="flex justify-end">
          <LanguageSelector showText />
        </div>

        <div className="text-center">
  <img
   src="/logo-teamwill.png"
    alt="Logo TeamwillEvents"
    className="mx-auto h-12 w-12 rounded-lg mb-4 object-cover"
  />
  <h1 className="text-2xl font-bold gradient-text">TeamwillEvents</h1>
  <p className="text-muted-foreground mt-2">{t("auth.loginTitle")}</p>
</div>


        <Card>
          <CardHeader>
            <CardTitle>{t("auth.login")}</CardTitle>
            <CardDescription>{t("auth.loginDescription")}</CardDescription>
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
                    type={showmotDePasse ? "text" : "motDePasse"}
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
    <a href="/auth/forgot-password" className="text-sm text-green-600 hover:underline">
      {t("auth.forgotPassword")}
    </a>
  </div>
  <div>
    <a href="/auth/register" className="text-sm text-green-600 hover:underline">
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
