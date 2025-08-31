"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { ThemeSelector } from "@/shared/ui/theme-selector"
import { ThemeLogo } from "@/shared/ui/theme-logo"
import { apiService } from "@/lib/api"
import { useToast } from "@/shared/hooks/use-toast"
import { useLanguage } from "@/lib/i18n"

interface ForgotForm {
  email: string
}

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const { theme } = useTheme()
  

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>()

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true)
    setError(null)
    try {
      await apiService.forgotPassword(data.email)
      toast({
        title: t("common.success"),
        description:
          t("auth.resetLinkSent") ||
          "Si un compte existe, un lien de réinitialisation a été envoyé à votre adresse email.",
      })
    } catch (err) {
      setError((err as Error).message)
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
          <p className="text-muted-foreground mt-2">{t("auth.forgotPassword")}</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{t("auth.forgotPassword")}</CardTitle>
                <CardDescription>
                  {t("auth.forgotPassword") ||
                    "Entrez votre email pour recevoir un lien de réinitialisation"}
                </CardDescription>
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
                    // validate: (value) =>
                    //   validateTeamWillEmail(value) || t("auth.emailDomainInvalid"),
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    {t("auth.sendResetLink") || "Envoyer le lien"}
                  </>
                )}
              </Button>

              <div className="text-center">
                <a href="/auth/login" className="text-sm text-primary hover:underline">
                  {t("auth.backToLogin") || "Retour à la connexion"}
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
