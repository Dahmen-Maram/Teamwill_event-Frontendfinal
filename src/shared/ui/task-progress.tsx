"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Progress } from "@/shared/ui/progress"
import { Badge } from "@/shared/ui/badge"
import { CheckCircle, Clock, AlertCircle, Users, Calendar } from "lucide-react"
import { EventTaskProgress, Task } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"

interface TaskProgressProps {
  progress: EventTaskProgress
  className?: string
}

export function TaskProgress({ progress, className }: TaskProgressProps) {
  const { t } = useLanguage()

  // Debug pour voir le calcul du progrès
  console.log("TaskProgress Debug:", {
    totalTasks: progress.totalTasks,
    completedTasks: progress.completedTasks,
    progressPercentage: progress.progressPercentage,
    tasks: progress.tasks.map(t => ({
      id: t.id,
      title: t.title,
      status: t.status,
      isDone: t.isDone,
      assignedTo: t.assignedTo?.nom
    }))
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-green-500" />
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "PENDING":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "REFUSED":
        return <AlertCircle className="h-4 w-4 text-red-500" />
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t("tasks.progressOverview")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistiques générales */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{progress.totalTasks}</div>
                         <div className="text-sm text-muted-foreground">{t("tasks.totalTasks")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{progress.completedTasks}</div>
                         <div className="text-sm text-muted-foreground">{t("tasks.completedTasks")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {progress.totalTasks - progress.completedTasks}
            </div>
                         <div className="text-sm text-muted-foreground">En cours</div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t("tasks.progressPercentage")}</span>
            <span className="font-medium">{progress.progressPercentage}%</span>
          </div>
          <Progress value={progress.progressPercentage} className="h-3" />
                     <div className="text-xs text-muted-foreground text-center">
             {progress.completedTasks} sur {progress.totalTasks} tâches terminées
           </div>
        </div>

        {/* Liste des tâches */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t("tasks.list")} ({progress.tasks.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {progress.tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  task.status === "COMPLETED" 
                    ? "bg-green-50 border-green-200" 
                    : task.status === "ACCEPTED"
                    ? "bg-green-50 border-green-200"
                    : "bg-muted/50 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStatusIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{task.title}</div>
                                         <div className={`text-xs truncate ${
                       task.status === "PENDING" 
                         ? "text-gray-600 dark:text-white" 
                         : "text-muted-foreground"
                     }`}>
                       Assigné à: {task.assignedTo?.nom || "Non assigné"}
                     </div>
                    {task.completedAt && (
                      <div className="text-xs text-primary">
                        Terminé le: {formatDate(task.completedAt)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(task.status)}>
                    {t(`tasks.${task.status.toLowerCase()}`)}
                  </Badge>
                  {task.status === "COMPLETED" && (
                    <CheckCircle className="h-4 w-4 text-green-500" title="Tâche terminée" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Résumé des statuts */}
        <div className="pt-4 border-t">
                     <h5 className="font-medium text-sm mb-2">Résumé des statuts:</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                             <span>Terminées: {progress.tasks.filter(t => t.status === "COMPLETED").length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                             <span>Acceptées: {progress.tasks.filter(t => t.status === "ACCEPTED").length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                             <span>En attente: {progress.tasks.filter(t => t.status === "PENDING").length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Refusées: {progress.tasks.filter(t => t.status === "REFUSED").length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
