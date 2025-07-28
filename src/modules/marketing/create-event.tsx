"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Mic, Upload, Wand2, Save, Eye } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Badge } from "@/shared/ui/badge"
import { VoiceRecorder } from "@/shared/ui/voice-recorder"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { apiService } from "@/lib/api"
import Cropper from "react-easy-crop"
import { getCroppedImg } from "@/lib/utils"
import type { Event, VoiceTranscription, GeneratedEventFields, User } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"

interface EventForm {
  titre: string
  description: string
  date: string
  heure: string // format HH:mm
  lieu: string
  capacite: number
  organisateurId?: string
  imageUrl?: string
  status?: "PENDING" | "PUBLISHED" | "CANCELLED" | "REJECTED" | "DONE"
}

export default function CreateEventPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLanguage()
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<VoiceTranscription | null>(null)
  const [aiContent, setAiContent] = useState<GeneratedEventFields | null>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<"PENDING" | "PUBLISHED">("PUBLISHED")

  // --- states for cropping ---
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventForm>()

  const watchedValues = watch()

  const handleVoiceTranscription = async (voiceData: VoiceTranscription) => {
    setTranscription(voiceData)

    if (voiceData.text && voiceData.confidence > 0.6) {
      setIsGeneratingAI(true)
      try {
        const generated = await apiService.generateEventContent(voiceData.text)
        setAiContent(generated)

        // Normaliser les clés en minuscules pour une recherche plus souple
        const lcMap: Record<string, any> = {}
        Object.entries(generated).forEach(([k, v]) => {
          lcMap[k.toLowerCase()] = v
        })

        const pick = (...keys: string[]) => {
          for (const k of keys) {
            if (lcMap[k.toLowerCase()] !== undefined) return lcMap[k.toLowerCase()]
          }
          return undefined
        }

        // Titre / nom
        const titreVal2 = pick("titre", "title", "nom", "event")
        if (titreVal2) setValue("titre", titreVal2 as string)

        // Description
        const descVal = pick("description", "desc")
        if (descVal) setValue("description", descVal as string)

        // Lieu
        const lieuVal = pick("lieu", "location", "place", "ville")
        if (lieuVal) setValue("lieu", lieuVal as string)

        // Capacité
        const capVal = pick("capacite", "capacity", "participants")
        if (capVal) setValue("capacite", Number(capVal))

        // Date
        const dateStr = pick("date") as string | undefined
        if (dateStr) {
          // Utilitaire de parsing français → ISO (AAAA-MM-JJ)
          const parseFrenchDateToISO = (dStr: string): string | undefined => {
            const monthMap: Record<string, string> = {
              janvier: "01",
              février: "02",
              fevrier: "02",
              mars: "03",
              avril: "04",
              mai: "05",
              juin: "06",
              juillet: "07",
              aout: "08",
              août: "08",
              septembre: "09",
              octobre: "10",
              novembre: "11",
              décembre: "12",
              decembre: "12",
            }

            // ex «15 juillet 2025»
            const match = dStr.toLowerCase().match(/(\d{1,2})\s+([a-zéûêôîì]+)/i)
            if (match) {
              const day = match[1].padStart(2, "0")
              const monthName = match[2]
              const yearMatch = dStr.match(/(\d{4})/)
              if (yearMatch && monthMap[monthName]) {
                return `${yearMatch[1]}-${monthMap[monthName]}-${day}`
              }
            }
            return undefined
          }

          // Date mapping revisité
          if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            setValue("date", dateStr, { shouldDirty: true })
          } else {
            const iso = parseFrenchDateToISO(dateStr) || undefined
            if (iso) setValue("date", iso, { shouldDirty: true })
          }
        }

        const heureStr = pick("heure", "time") as string | undefined

        // Ensure we mark changes dirty for other fields
        if (titreVal2) setValue("titre", titreVal2 as string, { shouldDirty: true })
        if (descVal) setValue("description", descVal as string, { shouldDirty: true })
        if (lieuVal) setValue("lieu", lieuVal as string, { shouldDirty: true })
        if (capVal) setValue("capacite", Number(capVal), { shouldDirty: true })
        if (heureStr) {
          const match = heureStr.match(/(\d{1,2})h?(?:[:h](\d{2}))?/i)
          if (match) {
            const h = match[1].padStart(2, "0")
            const m = match[2] ? match[2] : "00"
            setValue("heure", `${h}:${m}`, { shouldDirty: true })
          }
        }
      } catch (error) {
        console.error("Error generating event fields:", error)
      } finally {
        setIsGeneratingAI(false)
      }
    }
  }

  // crop complete callback
  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // select file and open cropper
  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
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

  // confirm crop and upload
  const onCropConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    setIsUploading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const croppedFile = new File([croppedBlob], "event-image.png", { type: "image/png" })

      // preview for UI
      setImagePreview(URL.createObjectURL(croppedBlob))

      const result = await apiService.uploadEventImage(croppedFile)

      setImageUrl(result.imageUrl)
      setSuccessMessage("Image uploadée avec succès.")
      setIsCropping(false)
      setImageSrc(null)
    } catch (error) {
      console.error("Erreur lors de l'upload de l'image :", error)
      setErrorMessage("Une erreur est survenue lors de l'upload de l'image.")
    } finally {
      setIsUploading(false)
    }
  }

  const onCropCancel = () => {
    setIsCropping(false)
    setImageSrc(null)
    setErrorMessage(null)
  }

  const onSubmit = async (data: EventForm) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const user = await apiService.getCurrentUser()

      let heure = data.heure
      if (!heure) {
        heure = "00:00"
      } else if (!/^\d{2}:\d{2}$/.test(heure)) {
        throw new Error("Format d'heure invalide, doit être HH:mm")
      }

      const capacite = parseInt(data.capacite.toString(), 10)
      if (isNaN(capacite)) {
        throw new Error("Capacité invalide")
      }

      const eventData = {
        titre: data.titre,
        description: data.description,
        date: data.date,
        heure,
        lieu: data.lieu,
        capacite,
        organisateurId: user.id,
        imageUrl: imageUrl || "",
        status: submitStatus,
      }

      await apiService.createEvent(eventData)
      console.log(eventData)
      console.log("Event created successfully")

      router.push("/marketing/events")
    } catch (error) {
      console.error("Erreur lors de la création de l'événement :", error)
      setErrorMessage("Erreur lors de la création de l’événement.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("events.createEvent")}</h1>
        <p className="text-muted-foreground"></p>
      </div>

      <Tabs defaultValue="voice" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            {t("events.voiceCommand")}
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {t("events.manualCreation")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                {t("events.voiceRecording")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VoiceRecorder onTranscription={handleVoiceTranscription} disabled={isLoading} />
            </CardContent>
          </Card>

          {transcription && (
            <Card>
              <CardHeader>
                <CardTitle>{t("events.transcription")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{transcription.text}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={transcription.confidence > 0.7 ? "default" : "secondary"}>
                      Confiance: {Math.round(transcription.confidence * 100)}%
                    </Badge>
                    {isGeneratingAI && (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-muted-foreground">{t("events.aiGenerationInProgress")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {aiContent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  {t("events.aiGeneratedContent")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiContent.titre && (
                  <div>
                    <Label className="text-sm font-medium">{t("events.suggestedTitle")}</Label>
                    <p className="text-sm bg-muted p-2 rounded">{aiContent.titre}</p>
                  </div>
                )}
                {aiContent.description && (
                  <div>
                    <Label className="text-sm font-medium">{t("events.suggestedDescription")}</Label>
                    <p className="text-sm bg-muted p-2 rounded">{aiContent.description}</p>
                  </div>
                )}
                {aiContent.date && (
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <p className="text-sm bg-muted p-2 rounded">{aiContent.date}</p>
                  </div>
                )}
                {aiContent.heure && (
                  <div>
                    <Label className="text-sm font-medium">Heure</Label>
                    <p className="text-sm bg-muted p-2 rounded">{aiContent.heure}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>{t("events.manualCreation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{t("events.fillEventInfo")}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Formulaire événement */}
      <Card>
        <CardHeader>
            <CardTitle>{t("events.eventDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="titre">{t("events.eventTitle")} *</Label>
                <Input
                  id="titre"
                  placeholder={t("events.eventTitlePlaceholder")}
                  {...register("titre", { required: t("events.eventTitleRequired") })}
                />
                {errors.titre && <p className="text-sm text-destructive">{errors.titre.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lieu">{t("events.eventLocation")} *</Label>
                <Input
                  id="lieu"
                  placeholder={t("events.eventLocationPlaceholder")}
                  {...register("lieu", { required: t("events.eventLocationRequired") })}
                />
                {errors.lieu && <p className="text-sm text-destructive">{errors.lieu.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{t("events.eventDate")} *</Label>
                <Input id="date" type="date" {...register("date", { required: t("events.eventDateRequired") })} />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="heure">{t("events.eventTime")} *</Label>
                <Input id="heure" type="time" {...register("heure", { required: t("events.eventTimeRequired") })} />
                {errors.heure && <p className="text-sm text-destructive">{errors.heure.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacite">{t("events.eventCapacity")} *</Label>
                <Input
                  id="capacite"
                  type="number"
                  min={1}
                  placeholder={t("events.eventCapacityPlaceholder")}
                  {...register("capacite", {
                    required: t("events.eventCapacityRequired"),
                    min: { value: 1, message: t("events.eventCapacityMin") },
                  })}
                />
                {errors.capacite && <p className="text-sm text-destructive">{errors.capacite.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("events.description")} *</Label>
              <Textarea
                id="description"
                placeholder={t("events.eventDescriptionPlaceholder")}
                rows={4}
                {...register("description", { required: t("events.eventDescriptionRequired") })}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
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
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-6">
              <Button
                type="submit"
                disabled={isLoading || isUploading}
                onClick={() => setSubmitStatus("PUBLISHED")}
              >
                {isLoading && submitStatus === "PUBLISHED" ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t("events.publishEvent")}
                  </>
                )}
              </Button>

              <Button
                type="submit"
                variant="outline"
                disabled={isLoading || isUploading}
                onClick={() => setSubmitStatus("PENDING")}
              >
                {t("events.saveDraft")}
              </Button>
            </div>

            {errorMessage && <p className="text-destructive mt-2">{errorMessage}</p>}
            {successMessage && <p className="text-green-600 mt-2">{successMessage}</p>}
          </form>
        </CardContent>
      </Card>

      {watchedValues.titre && (
        <Card>
          <CardHeader>
            <CardTitle>{t("events.eventPreview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{watchedValues.titre}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{watchedValues.description}</p>
                </div>
                <Badge variant="secondary">{t("events.preview")}</Badge>
              </div>

              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Aperçu événement"
                  className="w-full h-32 object-cover rounded-md"
                />
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">{t("events.date")}:</span> {watchedValues.date}
                </div>
                <div>
                  <span className="font-medium">{t("events.time")}:</span> {watchedValues.heure}
                </div>
                <div>
                  <span className="font-medium">{t("events.location")}:</span> {watchedValues.lieu}
                </div>
                <div>
                  <span className="font-medium">{t("events.maxParticipants")}:</span> {watchedValues.capacite}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cropping Modal */}
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
            tabIndex={0}
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
                {t("events.cancel")}
              </Button>
              <Button onClick={onCropConfirm} disabled={isUploading}>
                {isUploading ? <LoadingSpinner size="sm" /> : t("events.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
