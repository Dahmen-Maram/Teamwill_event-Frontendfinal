"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { Camera, Save, Eye, EyeOff } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Alert, AlertDescription } from "@/shared/ui/alert"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { useLanguage } from "@/lib/i18n"
import { apiService } from "@/lib/api"
import Cropper from "react-easy-crop"
import { getCroppedImg } from "@/lib/utils"

import type { User, UpdateProfileData, ChangePasswordData } from "@/lib/types"

interface ProfileFormProps {
  user: User
  onUserUpdate: (user: User) => void
}

export function ProfileForm({ user, onUserUpdate }: ProfileFormProps) {
  const { t } = useLanguage()
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Nouveaux états pour cropping ---
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfileForm,
  } = useForm<UpdateProfileData>({
    defaultValues: {
      nom: user.nom,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      department: user.department || "",
      location: user.location || "",
      job: user.job || "",
      position: user.position || "",
    },
  })

  useEffect(() => {
    resetProfileForm({
      nom: user.nom,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      department: user.department || "",
      location: user.location || "",
      job: user.job || "",
      position: user.position || "",
      avatarUrl: user.avatarUrl || "",
    })
  }, [user, resetProfileForm])

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
    watch,
  } = useForm<ChangePasswordData>()

  const newPassword = watch("newPassword")

  const validateTeamWillEmail = (email: string) => {
    return email.includes("@teamwill") || email.includes("@teamwillgroup")
  }

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return true
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-$$$$]/g, ""))
  }

  // Submit profile update
  const onSubmitProfile = async (data: UpdateProfileData) => {
    setIsUpdatingProfile(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const updatedUser = await apiService.updateProfile(data)
      onUserUpdate(updatedUser)
      setSuccessMessage(t("profile.profileUpdated"))
    } catch (error: any) {
      setErrorMessage(error?.message || t("common.error"))
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Submit password change
  const onSubmitPassword = async (data: ChangePasswordData) => {
    setIsChangingPassword(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      if (data.newPassword !== data.confirmPassword) {
        setErrorMessage(t("profile.passwordMismatch"))
        return
      }
      await apiService.changePassword(data.currentPassword, data.newPassword)
      setSuccessMessage(t("profile.passwordChanged"))
      resetPasswordForm()
    } catch (error) {
      setErrorMessage(t("common.error"))
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Gestion crop area complété
  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // Sélection fichier pour cropping
  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const reader = new FileReader()
      reader.readAsDataURL(event.target.files[0])
      reader.onload = () => {
        setImageSrc(reader.result as string)
        setIsCropping(true)
        setErrorMessage(null)
      }
    }
  }

  // Confirmation crop + upload image cropée
  const onCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || !user?.id) return

    try {
      setIsUploadingAvatar(true)
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const croppedFile = new File([croppedBlob], "avatar.png", { type: "image/png" })
      const result = await apiService.uploadAvatar(user.id, croppedFile)
      const updatedUser = { ...user, avatarUrl: result.avatarUrl }
      onUserUpdate(updatedUser)
      setSuccessMessage(t("profile.avatarUpdated"))
      setIsCropping(false)
      setImageSrc(null)
    } catch (error) {
      console.error("Crop & upload error:", error)
      setErrorMessage(t("common.error"))
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Annuler crop
  const onCropCancel = () => {
    setIsCropping(false)
    setImageSrc(null)
    setErrorMessage(null)
  }

  const formatJoinedDate = (dateString?: string) => {
    if (!dateString) return ""
    return new Intl.DateTimeFormat(t("common.locale") || "fr-FR", {
      year: "numeric",
      month: "long",
    }).format(new Date(dateString))
  }

  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
      {successMessage && (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.avatar")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center space-x-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.nom} />
              <AvatarFallback className="text-2xl">{user.nom.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>
          <div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar || isCropping}
              variant="outline"
              className="mb-2"
            >
              <Camera className="h-4 w-4 mr-2" />
              {t("profile.changeAvatar")}
            </Button>
            <p className="text-sm text-muted-foreground">JPG, PNG ou GIF. Max 5MB.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={onSelectFile}
              className="hidden"
              disabled={isUploadingAvatar || isCropping}
            />
          </div>
        </CardContent>
      </Card>

      {isCropping && imageSrc && (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70"
    style={{ zIndex: 9999 }}
    onClick={onCropCancel}
  >
    <div
      className="relative w-80 h-[360px] bg-white rounded p-4 flex flex-col"
      style={{ zIndex: 10000 }}
      onClick={e => e.stopPropagation()}
      tabIndex={0}
    >
      <div className="flex-grow">
        <div className="relative w-full h-64"> {/* Fixed height to avoid overlaying buttons */}
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { width: "100%", height: "100%" },
            }}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <Button
          onClick={onCropCancel}
          variant="outline"
        >
          Annuler
        </Button>
        <Button
          onClick={onCropConfirm}
          disabled={isUploadingAvatar}
        >
          {isUploadingAvatar ? <LoadingSpinner size="sm" /> : "Confirmer"}
        </Button>
      </div>
    </div>
  </div>
)}



      {/* Personal Information */}
      {/* ... (reste du formulaire personnel inchangé) ... */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.personalInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
            {/* ... tous les champs ... */}
            {/* (colle ici tout ce que tu as déjà dans ton formulaire personnel) */}
            {/* Je le laisse inchangé pour ne pas allonger trop, tu peux garder ce que tu as déjà */}
            {/* --- start of full personal information fields --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="nom">
                  {t("profile.name")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nom"
                  placeholder={t("profile.namePlaceholder")}
                  {...registerProfile("nom", {
                    required: t("profile.nameRequired"),
                  })}
                />
                {profileErrors.nom && (
                  <p className="text-sm text-destructive">{profileErrors.nom.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t("profile.email")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("profile.emailPlaceholder")}
                  {...registerProfile("email", {
                    required: t("auth.emailRequired"),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t("auth.emailInvalid"),
                    },
                    validate: (value) => validateTeamWillEmail(value) || t("auth.emailDomainInvalid"),
                  })}
                />
                {profileErrors.email && (
                  <p className="text-sm text-destructive">{profileErrors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">{t("profile.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t("profile.phonePlaceholder")}
                  {...registerProfile("phone", {
                    validate: (value) =>
                      validatePhoneNumber(value || "") || t("profile.phoneInvalid"),
                  })}
                />
                {profileErrors.phone && (
                  <p className="text-sm text-destructive">{profileErrors.phone.message}</p>
                )}
              </div>

              {/* Department (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="department">{t("profile.department")}</Label>
                <Input
                  id="department"
                  placeholder={t("profile.departmentPlaceholder")}
                  {...registerProfile("department")}
                  disabled
                />
              </div>

              {/* Position (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="position">{t("profile.position")}</Label>
                <Input
                  id="position"
                  placeholder={t("profile.positionPlaceholder")}
                  {...registerProfile("position")}
                  disabled
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">{t("profile.location")}</Label>
                <Input
                  id="location"
                  placeholder={t("profile.locationPlaceholder")}
                  {...registerProfile("location")}
                />
                {profileErrors.location && (
                  <p className="text-sm text-destructive">{profileErrors.location.message}</p>
                )}
              </div>

              {/* Joined date (display only) */}
              {user.joinedAt && (
                <div className="space-y-2">
                  <Label>{t("profile.joinedAt")}</Label>
                  <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {formatJoinedDate(user.joinedAt)}
                  </div>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">{t("profile.address")}</Label>
              <Textarea
                id="address"
                placeholder={t("profile.addressPlaceholder")}
                rows={3}
                {...registerProfile("address")}
              />
            </div>
            {/* --- end of full personal information fields --- */}

            <Button type="submit" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? <LoadingSpinner size="sm" /> : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t("profile.updateProfile")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Form */}
      {/* ... laisse tel quel ... */}
      {/* --- start of full security form section --- */}
      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.security")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
            <div className="space-y-4">
              {/* Current password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  {t("profile.currentPassword")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    {...registerPassword("currentPassword", {
                      required: t("profile.currentPasswordRequired"),
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                    }
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* New password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  {t("profile.newPassword")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    {...registerPassword("newPassword", {
                      required: t("profile.newPasswordRequired"),
                      minLength: {
                        value: 6,
                        message: t("auth.passwordMinLength"),
                      },
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                    }
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("profile.confirmPassword")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    {...registerPassword("confirmPassword", {
                      required: t("profile.confirmPasswordRequired"),
                      validate: (value) =>
                        value === newPassword || t("profile.passwordMismatch"),
                    })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                    }
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isChangingPassword} variant="outline">
              {isChangingPassword ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t("profile.changePassword")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      {/* --- end of full security form section --- */}
    </div>
  )
}
