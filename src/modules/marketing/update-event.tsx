"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { ChevronLeft, Save, Upload } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { apiService } from "@/lib/api"
import Cropper from "react-easy-crop"
import { getCroppedImg } from "@/lib/utils"
import type { Event } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"

interface EventForm {
  titre: string
  description: string
  date: string
  heure: string
  lieu: string
  capacite: number
  status: "PENDING" | "PUBLISHED" | "CANCELLED" | "REJECTED" | "DONE"
}

export default function UpdateEventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const router = useRouter()
  const { t } = useLanguage()

  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [event, setEvent] = useState<Event | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // Cropping states
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isCropping, setIsCropping] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventForm>()

  // Fetch event details
  useEffect(() => {
    async function fetchEvent() {
      try {
        const fetched = await apiService.getEvent(eventId)
        setEvent(fetched)
        setImagePreview(fetched.imageUrl || null)
        setImageUrl(fetched.imageUrl || null)
        reset({
          titre: fetched.titre,
          description: fetched.description,
          date: fetched.date,
          heure: fetched.heure,
          lieu: fetched.lieu,
          capacite: fetched.capacite,
          status: (fetched.status as any) || "PENDING",
        })
      } catch (error) {
        console.error("Failed to load event:", error)
        setErrorMessage("Erreur lors du chargement de l'événement.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvent()
  }, [eventId, reset])
  function handleBack() {
    router.back()
  }

  const onCropComplete = useCallback((_: any, cropped: any) => {
    setCroppedAreaPixels(cropped)
  }, [])

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("L'image doit être plus petite que 5MB.")
      return
    }
    if (!/^image\/(jpeg|jpg|png|gif)$/.test(file.type)) {
      setErrorMessage("Seules les images JPEG, PNG ou GIF sont autorisées.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      setIsCropping(true)
      setErrorMessage(null)
    }
    reader.readAsDataURL(file)
  }

  const onCropCancel = () => {
    setIsCropping(false)
    setImageSrc(null)
  }

  const onCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setIsUploading(true)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const croppedFile = new File([croppedBlob], "event-image.png", { type: "image/png" })

      setImagePreview(URL.createObjectURL(croppedBlob))

      const result = await apiService.uploadEventImage(croppedFile)
      setImageUrl(result.imageUrl)
      setSuccessMessage("Image uploadée avec succès.")
      setIsCropping(false)
      setImageSrc(null)
    } catch (error) {
      console.error("Upload failed:", error)
      setErrorMessage("Erreur lors de l'upload de l'image.")
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: EventForm) => {
    if (!event) return
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const updates = {
        titre: data.titre ,
        description: data.description,
        date: data.date,
        heure: data.heure,
        lieu: data.lieu,
        capacite: Number(data.capacite),
        imageUrl: imageUrl || "",
        status: data.status,
      }
      await apiService.updateEvent(event.id, updates)
      setSuccessMessage("Événement mis à jour avec succès.")
      router.push("/marketing/events")
    } catch (error) {
      console.error("Update failed:", error)
      setErrorMessage("Erreur lors de la mise à jour de l'événement.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!event) {
    return <p className="text-destructive">Événement introuvable.</p>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
      <button
        onClick={handleBack}
        aria-label="Retour"
        className="text-green-600 hover:text-green-800 transition cursor-pointer mb-4 p-0"
        style={{ background: "none", border: "none" }}
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
        <h1 className="text-3xl font-bold">{t("events.updateEvent")}</h1>
        <p className="text-muted-foreground">{t("events.ajustez")}</p>
      </div>
      

      {successMessage && <p className="text-green-600">{successMessage}</p>}
      {errorMessage && <p className="text-destructive">{errorMessage}</p>}

      <Card>
        <CardHeader>
          <CardTitle>{t("events.eventDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="titre">{t("events.titre")} *</Label>
                <Input id="titre" {...register("titre", { required: t("events.titreRequired") })} />
                {errors.titre && <p className="text-sm text-destructive">{errors.titre.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lieu">{t("events.lieu")} *</Label>
                <Input id="lieu" {...register("lieu", { required:t("events.lieuRequired") })} />
                {errors.lieu && <p className="text-sm text-destructive">{errors.lieu.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{t("events.date")} *</Label>
                <Input id="date" type="date" {...register("date", { required: true })} />
                {errors.date && <p className="text-sm text-destructive">{t("events.dateRequired")}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="heure">{t("events.heure")} *</Label>
                <Input id="heure" type="time" {...register("heure", { required: true })} />
                {errors.heure && <p className="text-sm text-destructive">{t("events.heureRequired")}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacite">{t("events.capacite")} *</Label>
                <Input id="capacite" type="number" min={1} {...register("capacite", { required: true })} />
                {errors.capacite && <p className="text-sm text-destructive">{t("events.capaciteRequired")}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t("events.status")} *</Label>
                <select
                  id="status"
                  className="border rounded px-3 py-2 w-full"
                  {...register("status", { required: true })}
                >
                  {[
                    "PUBLISHED",
                    "PENDING",
                    "CANCELLED",
                    "REJECTED",
                    "DONE",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.status && <p className="text-sm text-destructive">{t("events.statusRequired")}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("events.description")} *</Label>
              <Textarea id="description" rows={4} {...register("description", { required: true })} />
              {errors.description && <p className="text-sm text-destructive">{t("events.descriptionRequired")}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">{t("events.image")}</Label>
              <div className="flex items-center gap-4">
                <Input id="image" type="file" accept="image/*" onChange={onSelectFile} className="flex-1" />
                <Button type="button" variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                 {t("events.browse")}
                </Button>
              </div>
              {imagePreview && (
                <div className="mt-4">
                  <img src={imagePreview} alt="Aperçu" className="w-32 h-32 object-cover rounded-lg border" />
                </div>
              )}
            </div>

            <Button type="submit" disabled={isUploading || isLoading}>
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> 
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cropping modal */}
      {isCropping && imageSrc && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70"
          style={{ zIndex: 9999 }}
          onClick={onCropCancel}
        >
          <div
            className="relative w-80 h-[360px] bg-white rounded p-4 flex flex-col"
            style={{ zIndex: 10000 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-64">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4 flex justify-between">
              <Button onClick={onCropCancel} variant="outline">
                Annuler
              </Button>
              <Button onClick={onCropConfirm} disabled={isUploading}>
                {isUploading ? <LoadingSpinner size="sm" /> : "Confirmer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 