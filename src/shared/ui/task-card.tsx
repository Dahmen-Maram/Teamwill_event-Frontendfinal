"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { CheckCircle, Clock, AlertCircle, User, Calendar, Check, X, Play, MapPin } from "lucide-react"
import { Task, TaskStatus } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"
import { apiService } from "@/lib/api"
import { useState } from "react"
import { toast } from "sonner"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { useAuth } from "@/modules/auth/auth-context"

interface TaskCardProps {
  task: Task
  onTaskUpdate?: (updatedTask: Task) => void
  showActions?: boolean
  className?: string
}

export function TaskCard({ task, onTaskUpdate, showActions = true, className }: TaskCardProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "IN_PROGRESS":
        return <Play className="h-4 w-4 text-green-500" />
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "PENDING":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "REFUSED":
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
        return "bg-green-100 text-green-800"
      case "ACCEPTED":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "REFUSED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    return time
  }

  // Vérifier si l'utilisateur actuel est la personne assignée à la tâche
  const isAssignedUser = user?.id === task.assignedTo?.id

  // Debug pour voir les valeurs
  console.log("TaskCard Debug:", {
    userId: user?.id,
    taskAssignedToId: task.assignedTo?.id,
    isAssignedUser,
    showActions,
    taskStatus: task.status,
    eventDetails: task.event
  })

  // Ancienne logique qui fonctionne - utiliser updateTaskStatus
  const handleAcceptTask = async () => {
    if (!showActions) return
    
    setIsLoading(true)
    try {
      const updatedTask = await apiService.updateTaskStatus(task.id, "ACCEPTED" as TaskStatus)
      onTaskUpdate?.(updatedTask)
      toast.success(t("tasks.taskAccepted"))
    } catch (error) {
      console.error("Error accepting task:", error)
      toast.error(t("common.error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefuseTask = async () => {
    if (!showActions) return
    
    setIsLoading(true)
    try {
      const updatedTask = await apiService.updateTaskStatus(task.id, "REFUSED" as TaskStatus)
      onTaskUpdate?.(updatedTask)
      toast.success(t("tasks.taskRefused"))
    } catch (error) {
      console.error("Error refusing task:", error)
      toast.error(t("common.error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsCompleted = async () => {
    if (!showActions) return
    
    setIsLoading(true)
    try {
      const updatedTask = await apiService.updateTaskStatus(task.id, "COMPLETED" as TaskStatus)
      onTaskUpdate?.(updatedTask)
      toast.success("Tâche marquée comme terminée")
    } catch (error) {
      console.error("Error marking task as completed:", error)
      toast.error(t("common.error"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(task.status)}
            <CardTitle className="text-lg">{task.title}</CardTitle>
          </div>
          <Badge className={getStatusColor(task.status)}>
            {t(`tasks.${task.status.toLowerCase()}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        {task.description && (
          <p className="text-sm text-muted-foreground">{task.description}</p>
        )}

                 {/* Détails de l'événement */}
         {task.event && (
           <div className="bg-green-50 p-3 rounded-lg border border-green-200">
             <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
               <Calendar className="h-4 w-4" />
               Événement lié
             </h4>
             <div className="space-y-1 text-sm">
               <div className="font-medium text-green-800">{task.event.titre}</div>
               {task.event.lieu && (
                 <div className="flex items-center gap-1 text-green-700">
                   <MapPin className="h-3 w-3" />
                   <span>{task.event.lieu}</span>
                 </div>
               )}
               <div className="text-green-700">
                 {formatDate(task.event.date)} à {formatTime(task.event.heure)}
               </div>
             </div>
           </div>
         )}

        {/* Informations de la tâche */}
        <div className="space-y-2">
          
          {task.deadline && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("tasks.taskDeadline")}:</span>
              <span className="font-medium">{formatDate(task.deadline)}</span>
            </div>
          )}

          {task.acceptedAt && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">{t("tasks.taskAcceptedOn")}:</span>
              <span className="font-medium">{formatDate(task.acceptedAt)}</span>
            </div>
          )}

          {task.completedAt && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">{t("tasks.taskCompletedOn")}:</span>
              <span className="font-medium">{formatDate(task.completedAt)}</span>
            </div>
          )}
        </div>

        {/* Actions - Afficher les boutons si showActions est true */}
        {showActions && (
          <div className="flex flex-wrap gap-2 pt-2">
            {task.status === "PENDING" && (
              <>
                <Button
                  onClick={handleAcceptTask}
                  disabled={isLoading}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  {t("tasks.acceptTask")}
                </Button>
                <Button
                  onClick={handleRefuseTask}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <X className="h-4 w-4 mr-1" />
                  )}
                  {t("tasks.refuseTask")}
                </Button>
              </>
            )}

            {/* Bouton "Marquer comme terminé" pour les tâches acceptées */}
            {task.status === "ACCEPTED" && (
              <Button
                onClick={handleMarkAsCompleted}
                disabled={isLoading}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" />
                )}
                {t("tasks.completeTask")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
