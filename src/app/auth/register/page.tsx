"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Eye, EyeOff, UserPlus } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { ThemeSelector } from "@/shared/ui/theme-selector"
import { ThemeLogo } from "@/shared/ui/theme-logo"
import { apiService } from "@/lib/api"
import { useLanguage } from "@/lib/i18n"
import Image from "next/image"
import Link from "next/link"

interface RegisterForm {
  nom: string
  email: string
  motDePasse: string
  confirmMotDePasse: string
  phone: string
  department: string
  position: string
  location: string
  address: string
  role: "Responsable" | "Employee" | "Admin"
}

export default function RegisterPage() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    defaultValues: { role: "Employee" },
  })

  const validateTeamWillEmail = (email: string) =>
    email.includes("@teamwill") || email.includes("@teamwillgroup") || email.endsWith("@admin.com")

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError(null)

    try {
      await apiService.registerUser({
        nom: data.nom,
        email: data.email,
        motDePasse: data.motDePasse,
        phone: data.phone,
        role: data.email.endsWith("@admin.com") ? "Admin" : data.role === "Responsable" ? "Responsable" : "Employee",
        department: data.department,
        position: data.position,
        location: data.location,
        address: data.address,
      })

      // Redirect to login after successful registration
      router.replace("/auth/login")
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-2">
      <div className="w-full max-w-6xl space-y-4">
        <div className="text-center">
          <ThemeLogo />
          <h1 className="text-xl font-bold gradient-text">TeamwillEvents</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("auth.createAccount")}</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{t("auth.register")}</CardTitle>
                <CardDescription className="text-sm">{t("auth.registerDescription")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <LanguageSelector />
                <ThemeSelector />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Personal Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Nom */}
                <div className="space-y-1">
                  <Label htmlFor="nom" className="text-sm">{t("profile.name")}</Label>
                  <Input
                    id="nom"
                    placeholder="John Doe"
                    className="h-9 text-sm"
                    {...register("nom", { required: t("profile.nameRequired") })}
                  />
                  {errors.nom && <p className="text-xs text-destructive">{errors.nom.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.nom@teamwill.com"
                    className="h-9 text-sm"
                    {...register("email", {
                      required: t("auth.emailRequired"),
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: t("auth.emailInvalid"),
                      },
                      validate: (value) => validateTeamWillEmail(value) || t("auth.emailDomainInvalid"),
                    })}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-sm">{t("profile.phone")}</Label>
                  <Input id="phone" placeholder="+216 12 345 678" className="h-9 text-sm" {...register("phone")} />
                </div>
              </div>

              {/* Password and Role Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Password */}
                <div className="space-y-1">
                  <Label htmlFor="motDePasse" className="text-sm">{t("auth.motDePasse")}</Label>
                  <div className="relative">
                    <Input
                      id="motDePasse"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-9 text-sm pr-10"
                      {...register("motDePasse", {
                        required: t("auth.motDePasseRequired"),
                        minLength: { value: 6, message: t("auth.motDePasseMinLength") },
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-9 px-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  {errors.motDePasse && <p className="text-xs text-destructive">{errors.motDePasse.message}</p>}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <Label htmlFor="confirmMotDePasse" className="text-sm">{t("auth.confirmPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="confirmMotDePasse"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-9 text-sm pr-10"
                      {...register("confirmMotDePasse", {
                        required: t("profile.confirmPasswordRequired"),
                        validate: (value) => value === watch("motDePasse") || t("profile.passwordMismatch"),
                      })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-9 px-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  {errors.confirmMotDePasse && (
                    <p className="text-xs text-destructive">{errors.confirmMotDePasse.message}</p>
                  )}
                </div>

                {/* Role Selection */}
                <div className="space-y-1">
                  <Label htmlFor="role" className="text-sm">{t("auth.role")}</Label>
                  <select
                    id="role"
                    className="w-full border rounded-md p-2 bg-background h-9 text-sm"
                    {...register("role")}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Responsable">Marketing/Responsable</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Department */}
                <div className="space-y-1">
                  <Label htmlFor="department" className="text-sm">{t("profile.department")}</Label>
                  <Input id="department" placeholder="Marketing" className="h-9 text-sm" {...register("department")} />
                </div>

                {/* Position */}
                <div className="space-y-1">
                  <Label htmlFor="position" className="text-sm">{t("profile.position")}</Label>
                  <Input id="position" placeholder="Manager" className="h-9 text-sm" {...register("position")} />
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <Label htmlFor="location" className="text-sm">{t("profile.location")}</Label>
                  <Input id="location" placeholder="Paris" className="h-9 text-sm" {...register("location")} />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <Label htmlFor="address" className="text-sm">{t("profile.address")}</Label>
                  <Input id="address" placeholder="10 Rue de Rivoli" className="h-9 text-sm" {...register("address")} />
                </div>
              </div>

              <Button type="submit" className="w-full h-9" disabled={isLoading}>
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("auth.register")}
                  </>
                )}
              </Button>
              <div className="text-center text-xs">
                <a href="/auth/login" className="text-primary hover:underline">
                  {t("auth.backToLogin")}
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
