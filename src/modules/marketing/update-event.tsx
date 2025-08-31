"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { ChevronLeft, Save, Upload, Trash2, Search } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { Switch } from "@/shared/ui/switch"
import { Checkbox } from "@/shared/ui/checkbox"
import { apiService } from "@/lib/api"
import Cropper from "react-easy-crop"
import { getCroppedImg } from "@/lib/utils"
import type { Event, User } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"
import { useTheme } from "next-themes"

interface EventForm {
  titre: string
  description: string
  date: string
  heure: string
  lieu: string
  capacite: number
  status: "PENDING" | "PUBLISHED" | "CANCELLED" | "DONE"
  formUrl?: string
  sheetId?: string | null
}

export default function UpdateEventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const router = useRouter()
  const { t } = useLanguage()
  const { theme } = useTheme()

  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeletingImage, setIsDeletingImage] = useState(false)
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

  // --- privacy & invitations ---
  const [isPrivate, setIsPrivate] = useState<boolean>(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [invitedIds, setInvitedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [skipSheetId, setSkipSheetId] = useState<boolean>(false)

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
        
                 // Set privacy and invitation states
         setIsPrivate(fetched.isPrivate || false)
         setInvitedIds(fetched.invitedIds || [])
         
         // Auto-check skipSheetId if no sheetId exists
         setSkipSheetId(!fetched.sheetId || fetched.sheetId.trim() === "")
        
        // Load users immediately if event is private
        if (fetched.isPrivate) {
          try {
            const users = await apiService.getUsers()
            setAllUsers(users)
          } catch (err) {
            console.error("Erreur lors du chargement des utilisateurs:", err)
          }
        }
        
        reset({
          titre: fetched.titre,
          description: fetched.description,
          date: fetched.date,
          heure: fetched.heure,
          lieu: fetched.lieu,
          capacite: fetched.capacite,
          status: (fetched.status as any) || "PENDING",
          formUrl: fetched.formUrl || "",
          sheetId: fetched.sheetId || "",
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

  // Load users when event becomes private
  useEffect(() => {
    if (!isPrivate) return
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
  }, [isPrivate])

  // Filter users based on search term
  const filteredUsers = allUsers.filter(user => 
    !invitedIds.includes(user.id) && 
    (user.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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

  // Supprimer l'image de l'événement
  const onDeleteImage = async () => {
    if (!event?.id) return
    
    try {
      setIsDeletingImage(true)
      setErrorMessage(null)
      
      // Appel API pour supprimer l'image
      await apiService.deleteEventImage(event.id)
      
      // Mettre à jour l'état local
      setImagePreview(null)
      setImageUrl(null)
      setSuccessMessage("Image de l'événement supprimée avec succès.")
    } catch (error) {
      console.error("Delete image error:", error)
      setErrorMessage("Erreur lors de la suppression de l'image.")
    } finally {
      setIsDeletingImage(false)
    }
  }

  const onSubmit = async (data: EventForm) => {
    if (!event) return
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    
    try {
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
      
      // Build updates object conditionally
      const updates: any = {
        titre: data.titre,
        description: data.description,
        date: data.date,
        heure: data.heure,
        lieu: data.lieu,
        capacite: Number(data.capacite),
        imageUrl: imageUrl || "",
        status: data.status,
        formUrl: data.formUrl || "",
        isPrivate,
        invitedIds: isPrivate ? invitedIds : [],
      }

      // Handle sheetId logic
      if (skipSheetId) {
        // If skip is checked, explicitly set sheetId to null to remove it
        updates.sheetId = null
      } else if (sheetId.trim()) {
        // If not skipped and has a valid value, set the sheetId
        updates.sheetId = sheetId.trim()
      } else {
        // If not skipped but empty, explicitly set to null to remove it
        updates.sheetId = null
      }
      
      console.log("Updating event with data:", updates)
      await apiService.updateEvent(event.id, updates)
      
      // Recharger les données de l'événement pour confirmer la mise à jour
      const updatedEvent = await apiService.getEvent(event.id)
      setEvent(updatedEvent)
      
             // Check if sheetId was removed
       const wasSheetIdRemoved = event.sheetId && !updates.sheetId
       if (wasSheetIdRemoved) {
         setSuccessMessage("Événement mis à jour avec succès. L'ID du Google Sheet a été supprimé.")
       } else {
         setSuccessMessage("Événement mis à jour avec succès.")
       }
      
      // Ne pas rediriger automatiquement, laisser l'utilisateur voir le message de succès
      // router.push("/marketing/events")
    } catch (error) {
      console.error("Update failed:", error)
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
          setErrorMessage(`Erreur lors de la mise à jour de l'événement: ${error.message}`)
        }
      } else {
        setErrorMessage("Erreur lors de la mise à jour de l'événement.")
      }
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
        className="text-primary hover:text-primary/80 transition cursor-pointer mb-4 p-0"
        style={{ background: "none", border: "none" }}
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
        <h1 className="text-3xl font-bold">{t("events.updateEvent")}</h1>
        <p className="text-muted-foreground">{t("events.ajustez")}</p>
      </div>
      

      {successMessage && <p className="text-primary">{successMessage}</p>}
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

            {/* Visibility */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{t("events.visibility")}</Label>
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border">
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
              <div className="space-y-4 p-4 bg-muted/10 rounded-lg border">
                <h4 className="font-medium text-sm">{t("events.invitedUsers")}</h4>

                                 {/* Current invited users */}
                 {invitedIds.length > 0 && (
                   <div className="space-y-2">
                     <Label className="text-sm font-medium text-primary">{t("events.invitedUsers")} ({invitedIds.length})</Label>  
                     <ul className="space-y-2 max-h-40 overflow-y-auto border border-green-200 rounded-lg p-2 bg-green-50">
                       {invitedIds.map((id) => {
                         const u = allUsers.find((u) => u.id === id)
                         if (!u) return (
                           <li key={id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-md">
                             <span className="text-sm text-yellow-700">
                               Utilisateur ID: {id} (chargement...)
                             </span>
                             <Button
                               type="button"
                               variant="destructive"
                               size="sm"
                               className="h-7 px-3 text-xs"
                                                               onClick={async () => {
                                  try {
                                    // Retirer de la liste des invités
                                    const newInvitedIds = invitedIds.filter((inv) => inv !== id)
                                    
                                    // Mettre à jour l'événement avec la nouvelle liste d'invités
                                    await apiService.updateEvent(event!.id, {
                                      invitedIds: newInvitedIds
                                    })
                                    
                                    // Mettre à jour l'état local
                                    setInvitedIds(newInvitedIds)
                                    
                                    setSuccessMessage("Utilisateur retiré de la liste des invités.")
                                  } catch (error) {
                                    console.error("Erreur lors de la suppression de l'invité:", error)
                                    setErrorMessage("Erreur lors de la suppression de l'utilisateur de la liste des invités.")
                                  }
                                }}
                             >
                               {t("events.remove")}
                             </Button>
                           </li>
                         )
                         return (
                           <li key={id} className="flex items-center justify-between p-2 hover:bg-green-100 rounded-md transition-colors">
                             <span className="text-sm text-primary">
                               {u.nom} ({u.email})
                             </span>
                             <Button
                               type="button"
                               variant="destructive"
                               size="sm"
                               className="h-7 px-3 text-xs"
                                                               onClick={async () => {
                                  try {
                                    // Retirer de la liste des invités
                                    const newInvitedIds = invitedIds.filter((inv) => inv !== id)
                                    
                                    // Mettre à jour l'événement avec la nouvelle liste d'invités
                                    await apiService.updateEvent(event!.id, {
                                      invitedIds: newInvitedIds
                                    })
                                    
                                    // Mettre à jour l'état local
                                    setInvitedIds(newInvitedIds)
                                    
                                    setSuccessMessage(`${u.nom} a été retiré de la liste des invités.`)
                                  } catch (error) {
                                    console.error("Erreur lors de la suppression de l'invité:", error)
                                    setErrorMessage(`Erreur lors de la suppression de ${u.nom} de la liste des invités.`)
                                  }
                                }}
                             >
                               {t("events.remove")}
                             </Button>
                           </li>
                         )
                       })}
                     </ul>
                   </div>
                 )}

                {/* Add new users section */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <Label className="text-sm font-medium text-green-600">{t("events.addNewUsers")}</Label>
                  
                  {/* Search bar */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      placeholder={t("events.searchUsers") || "Rechercher des utilisateurs..."}
                      className="pl-10 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Available users */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Utilisateurs disponibles</Label>
                    <ul className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2 bg-background">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => (
                          <li key={u.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors">
                            <span className="text-sm">
                              {u.nom} ({u.email})
                            </span>
                                                         <Button
                               type="button"
                               size="sm"
                               className="h-7 px-3 text-xs"
                                                               onClick={async () => {
                                  try {
                                    // Ajouter à la liste des invités
                                    const newInvitedIds = [...invitedIds, u.id]
                                    
                                    // Mettre à jour l'événement avec la nouvelle liste d'invités
                                    await apiService.updateEvent(event!.id, {
                                      invitedIds: newInvitedIds
                                    })
                                    
                                    // Mettre à jour l'état local
                                    setInvitedIds(newInvitedIds)
                                    
                                    setSuccessMessage(`${u.nom} a été ajouté à la liste des invités.`)
                                  } catch (error) {
                                    console.error("Erreur lors de l'ajout de l'invité:", error)
                                    setErrorMessage(`Erreur lors de l'ajout de ${u.nom} à la liste des invités.`)
                                  }
                                }}
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
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="formUrl">{t("events.formUrl")}</Label>
              <Input id="formUrl" type="url" {...register("formUrl", { required: false })} />
              {errors.formUrl && <p className="text-sm text-destructive">{t("events.formUrlRequired")}</p>}
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
                  <Label htmlFor="sheetId">ID Google Sheet (optionnel)</Label>
                  <Input 
                    id="sheetId" 
                    type="text" 
                    placeholder="1VUZphArq8WrrPDKaqimHpzpOS4dDq1xy0BEZIkipEVs"
                    {...register("sheetId", { 
                      required: false,
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
                  {errors.sheetId && <p className="text-sm text-destructive">{errors.sheetId.message}</p>}
                </>
              )}
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
                <div className="mt-4 space-y-2">
                  <img src={imagePreview} alt="Aperçu" className="w-32 h-32 object-cover rounded-lg border" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={onDeleteImage}
                    disabled={isDeletingImage}
                    className="flex items-center gap-2"
                  >
                    {isDeletingImage ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {t("events.deleteEventImage") || "Supprimer l'image"}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isUploading || isLoading}>
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> 
                    {t("events.save")}
                  </>
                )}
              </Button>
              
                          {successMessage && (
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push("/marketing/events")}
              >
                Retourner à la liste
              </Button>
            )}
          </div>
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