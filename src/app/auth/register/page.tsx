"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Eye, EyeOff, UserPlus } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { apiService } from "@/lib/api"
import { useLanguage } from "@/lib/i18n"

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
  role: "Responsable" | "Employee"
}

export default function RegisterPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
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

  const validateTeamWillEmail = (email: string) => email.includes("@teamwill") || email.includes("@teamwillgroup")

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError(null)

    try {
      await apiService.registerUser({
        nom: data.nom,
        email: data.email,
        motDePasse: data.motDePasse,
        phone: data.phone,
        role: data.role === "Responsable" ? "Responsable" : "Employee",
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Language Selector */}
        <div className="flex justify-end">
          <LanguageSelector showText />
        </div>

        <div className="text-center">
          <img src="/logo-teamwill.png" alt="Logo TeamwillEvents" className="mx-auto h-12 w-12 rounded-lg mb-4 object-cover" />
          <h1 className="text-2xl font-bold gradient-text">TeamwillEvents</h1>
          <p className="text-muted-foreground mt-2">{t("auth.createAccount")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth.register")}</CardTitle>
            <CardDescription>{t("auth.registerDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="nom">{t("profile.name")}</Label>
                <Input
                  id="nom"
                  placeholder="John Doe"
                  {...register("nom", { required: t("profile.nameRequired") })}
                />
                {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
              </div>

              {/* Email */}
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

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="motDePasse">{t("auth.motDePasse")}</Label>
                <div className="relative">
                  <Input
                    id="motDePasse"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("motDePasse", {
                      required: t("auth.motDePasseRequired"),
                      minLength: { value: 6, message: t("auth.motDePasseMinLength") },
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
                {errors.motDePasse && <p className="text-sm text-destructive">{errors.motDePasse.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmMotDePasse">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirmMotDePasse"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmMotDePasse", {
                    required: t("profile.confirmPasswordRequired"),
                    validate: (value) => value === watch("motDePasse") || t("profile.passwordMismatch"),
                  })}
                />
                {errors.confirmMotDePasse && (
                  <p className="text-sm text-destructive">{errors.confirmMotDePasse.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">{t("profile.phone")}</Label>
                <Input id="phone" placeholder="+216 12 345 678" {...register("phone")} />
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">{t("profile.department")}</Label>
                <Input id="department" placeholder="Marketing" {...register("department")} />
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position">{t("profile.position")}</Label>
                <Input id="position" placeholder="Manager" {...register("position")} />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">{t("profile.location")}</Label>
                <Input id="location" placeholder="Paris" {...register("location")} />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">{t("profile.address")}</Label>
                <Input id="address" placeholder="10 Rue de Rivoli, Paris" {...register("address")} />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">{t("auth.role")}</Label>
                <select
                  id="role"
                  className="w-full border rounded-md p-2 bg-background"
                  {...register("role")}
                >
                  <option value="Employee">Employee</option>
                  <option value="Responsable">Marketing/Responsable</option>
                </select>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("auth.register")}
                  </>
                )}
              </Button>
              <div className="text-center text-sm">
                <a href="/auth/login" className="text-green-600 hover:underline">
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
