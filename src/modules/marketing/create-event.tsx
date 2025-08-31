"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import { useForm } from "react-hook-form"
import { Mic, Upload, Wand2, Save, Eye, Search } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Badge } from "@/shared/ui/badge"
import { Switch } from "@/shared/ui/switch"
import { Checkbox } from "@/shared/ui/checkbox"
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
  status?: "PENDING" | "PUBLISHED" | "CANCELLED" | "DONE"
  formUrl?: string
  sheetId?: string | null
}

export default function CreateEventPage() {
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLanguage()
  const { theme } = useTheme()
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
  const [searchTerm, setSearchTerm] = useState("")

  // --- states for cropping ---
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  // --- privacy & invitations ---
  const [isPrivate, setIsPrivate] = useState<boolean>(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [invitedIds, setInvitedIds] = useState<string[]>([])
  const [skipSheetId, setSkipSheetId] = useState<boolean>(false)

  // Charge la liste des utilisateurs uniquement lorsque l'événement devient privé
  useEffect(() => {
    if (!isPrivate || allUsers.length > 0) return
    let cancelled = false
    ;(async () => {
      try {
        const users = await apiService.getUsers()
        if (!cancelled) setAllUsers(users)
      } catch (err) {
        console.error("Erreur lors du chargement des utilisateurs:", err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isPrivate, allUsers.length])

  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventForm>()

  const watchedValues = watch()

  // Filter users based on search term
  const filteredUsers = allUsers.filter(user => 
  !invitedIds.includes(user.id) && 
  (user.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
  user.email.toLowerCase().includes(searchTerm.toLowerCase()))
)

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

      // Validate sheetId before sending to backend
      let sheetId = data.sheetId || ""
      if (!skipSheetId && sheetId.trim()) {
        // Additional validation for sheet ID format
        if (sheetId.trim().length < 20) {
          setErrorMessage("L'ID du Google Sheet doit contenir au moins 20 caractères")
          setIsLoading(false)
          return
        }
        
        if (!/^[a-zA-Z0-9-_]{20,}$/.test(sheetId.trim())) {
          setErrorMessage("L'ID du Google Sheet doit contenir uniquement des lettres, chiffres, tirets et underscores")
          setIsLoading(false)
          return
        }
      }

      // Build eventData object conditionally
      const eventData: any = {
        titre: data.titre,
        description: data.description,
        date: data.date,
        heure,
        lieu: data.lieu,
        capacite,
        organisateurId: user.id,
        imageUrl: imageUrl || "",
        status: submitStatus,
        formUrl: data.formUrl || "",
        isPrivate,
        invitedIds: isPrivate ? invitedIds : [],
      }

      // Handle sheetId logic
      if (skipSheetId) {
        // If skip is checked, explicitly set sheetId to null to remove it
        eventData.sheetId = null
      } else if (sheetId.trim()) {
        // If not skipped and has a valid value, set the sheetId
        eventData.sheetId = sheetId.trim()
      } else {
        // If not skipped but empty, explicitly set to null to remove it
        eventData.sheetId = null
      }

      await apiService.createEvent(eventData)
      

      router.push("/marketing/events")
    } catch (error) {
      console.error("Erreur lors de la création de l'événement :", error)
      if (error instanceof Error) {
        if (error.message.includes("Invalid Google Sheet ID")) {
          setErrorMessage("L'ID du Google Sheet est invalide ou inaccessible. Veuillez vérifier l'ID ou laisser le champ vide.")
        } else if (error.message.includes("Internal server error")) {
          setErrorMessage("Erreur serveur. Le problème peut être lié à l'ID du Google Sheet. Cochez la case 'Je n'ai pas de Google Sheet pour le moment' ou vérifiez l'ID.")
        } else if (error.message.includes("400")) {
          setErrorMessage("Données invalides. Veuillez vérifier tous les champs requis.")
        } else if (error.message.includes("401") || error.message.includes("403")) {
          setErrorMessage("Erreur d'authentification. Veuillez vous reconnecter.")
        } else {
          setErrorMessage(`Erreur lors de la création de l'événement: ${error.message}`)
        }
      } else {
        setErrorMessage("Erreur lors de la création de l'événement.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{t("events.createEvent")}</h1>
        <p className="text-sm text-muted-foreground">{t("events.createEventDescription")}</p>
      </div>

      <Tabs defaultValue="voice" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/50">
          <TabsTrigger value="voice" className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Mic className="h-4 w-4" />
            {t("events.voiceCommand")}
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Eye className="h-4 w-4" />
            {t("events.manualCreation")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voice" className="space-y-4">
          <Card className="border border-border/50 shadow-sm bg-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mic className="h-4 w-4 text-primary" />
                </div>
                {t("events.voiceRecording")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VoiceRecorder onTranscription={handleVoiceTranscription} disabled={isLoading} />
            </CardContent>
          </Card>

          {transcription && (
            <Card className="border border-border/50 shadow-sm bg-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">{t("events.transcription")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-sm leading-relaxed text-foreground">{transcription.text}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={transcription.confidence > 0.7 ? "default" : "secondary"} className="text-xs font-medium">
                    Confiance: {Math.round(transcription.confidence * 100)}%
                  </Badge>
                  {isGeneratingAI && (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm text-muted-foreground">{t("events.aiGenerationInProgress")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {aiContent && (
            <Card className="border border-border/50 shadow-sm bg-card/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Wand2 className="h-4 w-4 text-accent-foreground" />
                  </div>
                  {t("events.aiGeneratedContent")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiContent.titre && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">{t("events.suggestedTitle")}</Label>
                    <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                      <p className="text-sm text-foreground">{aiContent.titre}</p>
                    </div>
                  </div>
                )}
                {aiContent.description && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">{t("events.suggestedDescription")}</Label>
                    <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                      <p className="text-sm text-foreground">{aiContent.description}</p>
                    </div>
                  </div>
                )}
                {aiContent.date && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Date</Label>
                    <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                      <p className="text-sm text-foreground">{aiContent.date}</p>
                    </div>
                  </div>
                )}
                {aiContent.heure && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Heure</Label>
                    <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                      <p className="text-sm text-foreground">{aiContent.heure}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manual">
          <Card className="border border-border/50 shadow-sm bg-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">{t("events.manualCreation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t("events.fillEventInfo")}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Formulaire événement */}
      <Card className="border border-border/50 shadow-sm bg-card/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">{t("events.eventDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="titre" className="text-sm font-medium text-foreground">{t("events.eventTitle")} *</Label>
                <Input
                  id="titre"
                  placeholder={t("events.eventTitlePlaceholder")}
                  className="h-10 text-sm border-border/50 focus:border-primary"
                  {...register("titre", { required: t("events.eventTitleRequired") })}
                />
                {errors.titre && <p className="text-xs text-destructive">{errors.titre.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lieu" className="text-sm font-medium text-foreground">{t("events.eventLocation")} *</Label>
                <Input
                  id="lieu"
                  placeholder={t("events.eventLocationPlaceholder")}
                  className="h-10 text-sm border-border/50 focus:border-primary"
                  {...register("lieu", { required: t("events.eventLocationRequired") })}
                />
                {errors.lieu && <p className="text-xs text-destructive">{errors.lieu.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-foreground">{t("events.eventDate")} *</Label>
                <Input 
                  id="date" 
                  type="date" 
                  className="h-10 text-sm border-border/50 focus:border-primary" 
                  {...register("date", { required: t("events.eventDateRequired") })} 
                />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="heure" className="text-sm font-medium text-foreground">{t("events.eventTime")} *</Label>
                <Input 
                  id="heure" 
                  type="time" 
                  className="h-10 text-sm border-border/50 focus:border-primary" 
                  {...register("heure", { required: t("events.eventTimeRequired") })} 
                />
                {errors.heure && <p className="text-xs text-destructive">{errors.heure.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacite" className="text-sm font-medium text-foreground">{t("events.eventCapacity")} *</Label>
                <Input
                  id="capacite"
                  type="number"
                  min={1}
                  placeholder={t("events.eventCapacityPlaceholder")}
                  className="h-10 text-sm border-border/50 focus:border-primary"
                  {...register("capacite", {
                    required: t("events.eventCapacityRequired"),
                    min: { value: 1, message: t("events.eventCapacityMin") },
                  })}
                />
                {errors.capacite && <p className="text-xs text-destructive">{errors.capacite.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-foreground">{t("events.description")} *</Label>
              <Textarea
                id="description"
                placeholder={t("events.eventDescriptionPlaceholder")}
                rows={4}
                className="text-sm resize-none border-border/50 focus:border-primary"
                {...register("description", { required: t("events.eventDescriptionRequired") })}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            {/* Visibility */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">{t("events.visibility")}</Label>
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
                                 <span 
                   className={`text-sm font-medium ${theme === 'eco' ? 'text-white' : ''}`}
                 >
                   {t("events.public")}
                 </span>
                 <Switch
                   checked={isPrivate}
                   onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
                 />
                 <span 
                   className={`text-sm font-medium ${theme === 'eco' ? 'text-white' : ''}`}
                 >
                   {t("events.private")}
                 </span>
              </div>
            </div>

            {isPrivate && (
              <div className="space-y-4 p-4 bg-muted/10 rounded-lg border border-border/50">
                <h4 className="font-medium text-sm text-foreground">{t("events.invitedUsers")}</h4>

                {/* Barre de recherche améliorée */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    placeholder={t("events.searchUsers") || "Rechercher des utilisateurs..."}
                    className="pl-10 w-full h-10 text-sm border-border/50 focus:border-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Utilisateurs à inviter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Utilisateurs disponibles</Label>
                  <ul className="space-y-2 max-h-40 overflow-y-auto border border-border/50 rounded-lg p-2 bg-background">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <li key={u.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors">
                          <span className="text-sm text-foreground">
                            {u.nom} ({u.email})
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 px-3 text-xs"
                            onClick={() => setInvitedIds([...invitedIds, u.id])}
                          >
                            {t("events.add")}
                          </Button>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground text-center py-3">
                        {t("events.noUsersFound")}
                      </li>
                    )}
                  </ul>
                </div>

                {/* Liste des invités */}
                {invitedIds.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">{t("events.invitedList")}</Label>
                    <ul className="space-y-2 border border-border/50 rounded-lg p-2 bg-background">
                      {invitedIds.map((id) => {
                        const u = allUsers.find((u) => u.id === id)
                        if (!u) return null
                        return (
                          <li key={id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors">
                            <span className="text-sm text-foreground">
                              {u.nom} ({u.email})
                            </span>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-7 px-3 text-xs"
                              onClick={() => setInvitedIds(invitedIds.filter((inv) => inv !== id))}
                            >
                              {t("events.remove")}
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="formUrl" className="text-sm font-medium text-foreground">{t("events.formUrl")}</Label>
              <Input
                id="formUrl"
                type="url"
                placeholder="https://..."
                className="h-10 text-sm border-border/50 focus:border-primary"
                {...register("formUrl", {
                  pattern: {
                    value: /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+[/#?]?.*$/,
                    message: t("events.formUrlInvalid"),
                  },
                })}
              />
              {errors.formUrl && <p className="text-xs text-destructive">{errors.formUrl.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="skipSheetId"
                  checked={skipSheetId}
                  onCheckedChange={(checked) => setSkipSheetId(checked as boolean)}
                />
                <Label htmlFor="skipSheetId" className="text-sm">
                  Je n'ai pas de Google Sheet pour le moment
                </Label>
              </div>
              
              {!skipSheetId && (
                <>
                  <Label htmlFor="sheetId" className="text-sm font-medium text-foreground">ID Google Sheet (optionnel)</Label>
                  <Input
                    id="sheetId"
                    type="text"
                    placeholder="1VUZphArq8WrrPDKaqimHpzpOS4dDq1xy0BEZIkipEVs"
                    className="h-10 text-sm border-border/50 focus:border-primary"
                    {...register("sheetId", {
                      pattern: {
                        value: /^[a-zA-Z0-9-_]{20,}$/,
                        message: "L'ID du Google Sheet doit contenir au moins 20 caractères (lettres, chiffres, tirets et underscores)",
                      },
                      validate: (value) => {
                        if (!value || value.trim() === "") return true; // Allow empty
                        if (value.length < 20) {
                          return "L'ID du Google Sheet doit contenir au moins 20 caractères";
                        }
                        return true;
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    ID du Google Sheet pour les statistiques (ex: 1VUZphArq8WrrPDKaqimHpzpOS4dDq1xy0BEZIkipEVs). 
                    L'ID se trouve dans l'URL du Google Sheet après /d/ et avant /edit. 
                    <strong>Laissez vide si vous n'avez pas encore de Google Sheet.</strong>
                  </p>
                  {errors.sheetId && <p className="text-xs text-destructive">{errors.sheetId.message}</p>}
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm font-medium text-foreground">{t("events.image")}</Label>
              <div className="flex items-center gap-3">
                <Input 
                  id="image" 
                  type="file" 
                  accept="image/*" 
                  onChange={onSelectFile} 
                  className="flex-1 h-10 text-sm border-border/50 focus:border-primary" 
                />
                <Button type="button" variant="outline" size="sm" className="h-10 px-4 text-sm border-border/50 hover:bg-muted/50">
                  <Upload className="h-4 w-4 mr-2" />
                  {t("events.browse")}
                </Button>
              </div>
              {imagePreview && (
                <div className="mt-3">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-28 h-28 object-cover rounded-lg border border-border/50"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-border/50">
              <Button
                type="submit"
                disabled={isLoading || isUploading}
                onClick={() => setSubmitStatus("PUBLISHED")}
                className="h-10 px-6 text-sm font-medium"
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
                className="h-10 px-6 text-sm font-medium border-border/50 hover:bg-muted/50"
              >
                {t("events.saveDraft")}
              </Button>
            </div>

            {errorMessage && <p className="text-sm text-destructive mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-primary mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">{successMessage}</p>}
          </form>
        </CardContent>
      </Card>

      {watchedValues.titre && (
        <Card className="border border-border/50 shadow-sm bg-card/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">{t("events.eventPreview")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-border/50 rounded-lg p-4 space-y-4 bg-background">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base text-foreground">{watchedValues.titre}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{watchedValues.description}</p>
                </div>
                <Badge variant="secondary" className="text-xs font-medium">{t("events.preview")}</Badge>
              </div>

              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Aperçu événement"
                  className="w-full h-32 object-cover rounded-lg border border-border/50"
                />
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="font-medium text-foreground">{t("events.date")}:</span>
                  <p className="text-muted-foreground">{watchedValues.date}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-foreground">{t("events.time")}:</span>
                  <p className="text-muted-foreground">{watchedValues.heure}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-foreground">{t("events.location")}:</span>
                  <p className="text-muted-foreground">{watchedValues.lieu}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-medium text-foreground">{t("events.maxParticipants")}:</span>
                  <p className="text-muted-foreground">{watchedValues.capacite}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cropping Modal */}
      {isCropping && imageSrc && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          style={{ zIndex: 9999 }}
          onClick={onCropCancel}
        >
          <div
            className="relative w-80 h-[400px] bg-background rounded-lg border border-border/50 shadow-xl p-4 flex flex-col"
            style={{ zIndex: 10000 }}
            onClick={(e) => e.stopPropagation()}
            tabIndex={0}
          >
            <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border/50">
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
              <Button onClick={onCropCancel} variant="outline" size="sm" className="h-9 px-4 text-sm border-border/50 hover:bg-muted/50">
                {t("events.cancel")}
              </Button>
              <Button onClick={onCropConfirm} disabled={isUploading} size="sm" className="h-9 px-4 text-sm">
                {isUploading ? <LoadingSpinner size="sm" /> : t("events.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 