"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter, useParams } from "next/navigation"
import { Eye, EyeOff, Check } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { apiService } from "@/lib/api"
import { useToast } from "@/shared/hooks/use-toast"
import { useLanguage } from "@/lib/i18n"

interface ResetForm {
  newPassword: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const { t } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetForm>()

  const onSubmit = async (data: ResetForm) => {
    if (data.newPassword !== data.confirmPassword) {
      setError(t("profile.passwordMismatch") || "Les mots de passe ne correspondent pas")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await apiService.resetPassword(token, data.newPassword)
      toast({
        title: t("common.success"),
        description: t("auth.passwordResetSuccess") || "Votre mot de passe a été mis à jour",
      })
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (err) {
      setError((err as Error).message)
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
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <h1 className="text-2xl font-bold gradient-text">TeamwillEvents</h1>
          <p className="text-muted-foreground mt-2">{t("auth.resetPassword") || "Réinitialiser le mot de passe"}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.resetPassword") || "Réinitialiser le mot de passe"}</CardTitle>
            <CardDescription>
              {t("auth.resetPassword") || "Entrez votre nouveau mot de passe"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("profile.newPassword") || "Nouveau mot de passe"}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("newPassword", {
                      required: t("profile.newPasswordRequired") || "Nouveau mot de passe requis",
                      minLength: {
                        value: 6,
                        message:
                          t("profile.passwordMinLength") || "Le mot de passe doit contenir au moins 6 caractères",
                      },
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("profile.confirmPassword") || "Confirmer le mot de passe"}</Label>
                <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword", {
                    required:
                      t("profile.confirmPasswordRequired") || "Merci de confirmer le mot de passe",
                    validate: (value) =>
                      value === watch("newPassword") ||
                      t("profile.passwordMismatch") ||
                      "Les mots de passe ne correspondent pas",
                  })}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
              

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {t("profile.changePassword") || "Modifier le mot de passe"}
                  </>
                )}
              </Button>

              <div className="text-center">
                <a href="/auth/login" className="text-sm text-green-600 hover:underline">
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