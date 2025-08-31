"use client"

import { useState } from "react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { apiService } from "@/lib/api"
import { useLanguage } from "@/lib/i18n"
import { toast } from "sonner"

interface SheetIdManagerProps {
  eventId: string
  currentSheetId?: string | null
  onSheetIdChange?: (sheetId: string | null) => void
}

export default function SheetIdManager({ 
  eventId, 
  currentSheetId, 
  onSheetIdChange 
}: SheetIdManagerProps) {
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [newSheetId, setNewSheetId] = useState("")

  const handleGetSheetId = async () => {
    setIsLoading(true)
    try {
      const result = await apiService.getEventSheetId(eventId)
      toast.success(`Sheet ID: ${result.sheetId || "Aucun"}`)
      console.log("Current sheet ID:", result.sheetId)
    } catch (error) {
      console.error("Error getting sheet ID:", error)
      toast.error("Erreur lors de la récupération du Sheet ID")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSheetId = async () => {
    if (!newSheetId.trim()) {
      toast.error("Veuillez entrer un Sheet ID")
      return
    }

    // Validate sheet ID format
    if (newSheetId.trim().length < 20) {
      toast.error("L'ID du Google Sheet doit contenir au moins 20 caractères")
      return
    }

    if (!/^[a-zA-Z0-9-_]{20,}$/.test(newSheetId.trim())) {
      toast.error("L'ID du Google Sheet doit contenir uniquement des lettres, chiffres, tirets et underscores")
      return
    }

    setIsLoading(true)
    try {
      const updatedEvent = await apiService.updateEventSheetId(eventId, newSheetId.trim())
      toast.success("Sheet ID mis à jour avec succès")
      setNewSheetId("")
      onSheetIdChange?.(newSheetId.trim())
      console.log("Updated event:", updatedEvent)
    } catch (error) {
      console.error("Error updating sheet ID:", error)
      if (error instanceof Error) {
        if (error.message.includes("Invalid Google Sheet ID")) {
          toast.error("L'ID du Google Sheet est invalide ou inaccessible. Veuillez vérifier l'ID.")
        } else if (error.message.includes("Internal server error")) {
          toast.error("Erreur serveur. Veuillez vérifier que l'ID est correct.")
        } else {
          toast.error(`Erreur lors de la mise à jour du Sheet ID: ${error.message}`)
        }
      } else {
        toast.error("Erreur lors de la mise à jour du Sheet ID")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSheetId = async () => {
    setIsLoading(true)
    try {
      const updatedEvent = await apiService.deleteEventSheetId(eventId)
      toast.success("Sheet ID supprimé avec succès")
      onSheetIdChange?.(null)
      console.log("Updated event:", updatedEvent)
    } catch (error) {
      console.error("Error deleting sheet ID:", error)
      toast.error("Erreur lors de la suppression du Sheet ID")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Gestion du Sheet ID</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sheet ID actuel</Label>
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <code className="text-sm">
              {currentSheetId || "Aucun Sheet ID défini"}
            </code>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGetSheetId}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : "Récupérer"}
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newSheetId" className="text-sm font-medium">
            Nouveau Sheet ID
          </Label>
          <Input
            id="newSheetId"
            type="text"
            placeholder="1VUZphArq8WrrPDKaqimHpzpOS4dDq1xy0BEZIkipEVs"
            value={newSheetId}
            onChange={(e) => setNewSheetId(e.target.value)}
            className="h-10 text-sm"
          />
                     <p className="text-xs text-muted-foreground">
             ID du Google Sheet pour les statistiques. 
             L'ID se trouve dans l'URL du Google Sheet après /d/ et avant /edit.
             Exemple: https://docs.google.com/spreadsheets/d/<strong>1VUZphArq8WrrPDKaqimHpzpOS4dDq1xy0BEZIkipEVs</strong>/edit
           </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleUpdateSheetId}
            disabled={isLoading || !newSheetId.trim()}
            size="sm"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : "Mettre à jour"}
          </Button>
          
          {currentSheetId && (
            <Button
              onClick={handleDeleteSheetId}
              disabled={isLoading}
              variant="destructive"
              size="sm"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : "Supprimer"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
