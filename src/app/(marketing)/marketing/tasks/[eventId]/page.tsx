"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Event, Task, EventTaskProgress, CreateTaskDto, User } from "@/lib/types"
import { apiService } from "@/lib/api"
import { useLanguage } from "@/lib/i18n"
import { useAuth } from "@/modules/auth/auth-context"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { ArrowLeft, Plus, Users, Calendar, MapPin, Clock, X } from "lucide-react"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { TaskCard } from "@/shared/ui/task-card"
import { TaskProgress } from "@/shared/ui/task-progress"
import { toast } from "sonner"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

export default function EventTasksPage() {
  const { t } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [event, setEvent] = useState<Event | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [progress, setProgress] = useState<EventTaskProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)
  const [isLoadingTasks, setIsLoadingTasks] = useState(true) // Nouvelle variable pour le chargement des tâches
  
  // Modal pour ajouter une tâche
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [taskDeadline, setTaskDeadline] = useState("")

  const eventId = params.eventId as string

  useEffect(() => {
    if (authLoading || !eventId) return

    const fetchEventAndTasks = async () => {
      try {
        setIsLoading(true)
        
        // Récupérer l'événement
        const eventData = await apiService.getEvent(eventId)
        setEvent(eventData)
        
        // Récupérer les tâches
        const tasksData = await apiService.getTasksByEvent(eventId)
        setTasks(tasksData)
        setIsLoadingTasks(false) // Marquer le chargement des tâches comme terminé
        
        // Récupérer tous les utilisateurs pour l'assignation
        const usersData = await apiService.getAllUsers()
        setAllUsers(usersData)
        
        // Récupérer le progrès
        await fetchProgress()
        
      } catch (error) {
        console.error("Error fetching event and tasks:", error)
        toast.error(t("common.error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventAndTasks()
  }, [authLoading, eventId])

  // Recalculer le progrès quand les tâches changent
  useEffect(() => {
    if (tasks.length > 0 && !isLoadingTasks) {
      console.log("Tâches chargées, recalcul automatique du progrès...")
      recalculateProgress()
    }
  }, [tasks, isLoadingTasks]) // Se déclenche quand les tâches changent ET quand le chargement se termine

  // Calculer le progrès initial après le chargement des tâches
  useEffect(() => {
    if (tasks.length > 0 && !isLoadingTasks && !progress) {
      console.log("Calcul initial du progrès...")
      recalculateProgress()
    }
  }, [tasks, isLoadingTasks, progress])

  const fetchProgress = async () => {
    try {
      setIsLoadingProgress(true)
      
      // Essayer de récupérer le progrès depuis le backend
      try {
        const progressData = await apiService.getEventTaskProgress(eventId)
        console.log("Progrès récupéré depuis le backend:", progressData)
        setProgress(progressData)
      } catch (backendError) {
        console.log("Endpoint progress non implémenté côté backend, calcul côté frontend")
        
        // Si les tâches ne sont pas encore chargées, ne pas calculer ici
        if (tasks.length === 0) {
          console.log("Tâches pas encore chargées, calcul différé...")
          return
        }
        
        // Utiliser les tâches actuelles pour le calcul
        const currentTasks = tasks
        console.log("Tâches actuelles pour le calcul:", currentTasks)
        
        const totalTasks = currentTasks.length
        const completedTasks = currentTasks.filter(task => task.status === "COMPLETED").length
        const acceptedTasks = currentTasks.filter(task => task.status === "ACCEPTED").length
        
        // Le progrès se base sur les tâches acceptées ET terminées
        const activeTasks = acceptedTasks + completedTasks
        const progressPercentage = totalTasks > 0 ? Math.round((activeTasks / totalTasks) * 100) : 0
        
        const frontendProgress: EventTaskProgress = {
          eventId: eventId,
          eventTitle: event?.titre || "Événement",
          totalTasks: totalTasks,
          acceptedTasks: acceptedTasks,
          completedTasks: completedTasks,
          progressPercentage: progressPercentage,
          tasks: currentTasks
        }
        
        console.log("Progrès calculé côté frontend:", {
          totalTasks,
          completedTasks,
          acceptedTasks,
          activeTasks: activeTasks,
          progressPercentage,
          tasksStatuses: currentTasks.map(t => ({ id: t.id, title: t.title, status: t.status }))
        })
        setProgress(frontendProgress)
      }
      
    } catch (error) {
      console.error("Error fetching progress:", error)
      // Ne pas afficher d'erreur car le progrès peut ne pas être implémenté côté backend
    } finally {
      setIsLoadingProgress(false)
    }
  }

  // Fonction pour recalculer le progrès manuellement
  const recalculateProgress = () => {
    const currentTasks = tasks
    console.log("Recalcul manuel du progrès avec les tâches:", currentTasks)
    
    const totalTasks = currentTasks.length
    const completedTasks = currentTasks.filter(task => task.status === "COMPLETED").length
    const acceptedTasks = currentTasks.filter(task => task.status === "ACCEPTED").length
    
    // Le progrès se base sur les tâches acceptées ET terminées
    const activeTasks = acceptedTasks + completedTasks
    const progressPercentage = totalTasks > 0 ? Math.round((activeTasks / totalTasks) * 100) : 0
    
    const newProgress: EventTaskProgress = {
      eventId: eventId,
      eventTitle: event?.titre || "Événement",
      totalTasks: totalTasks,
      acceptedTasks: acceptedTasks,
      completedTasks: completedTasks,
      progressPercentage: progressPercentage,
      tasks: currentTasks
    }
    
    console.log("Nouveau progrès calculé:", {
      totalTasks,
      completedTasks,
      acceptedTasks,
      activeTasks: activeTasks,
      progressPercentage
    })
    
    setProgress(newProgress)
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    console.log("Tâche mise à jour:", updatedTask)
    
    // Mettre à jour la liste des tâches
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
      
      console.log("Nouvelles tâches après mise à jour:", newTasks)
      
      // Recalculer le progrès immédiatement
      setTimeout(() => {
        recalculateProgress()
      }, 200)
      
      return newTasks
    })
  }

  const handleAddTask = async () => {
    if (!selectedUserId || !taskTitle.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    setIsAddingTask(true)
    try {
      const taskData: CreateTaskDto = {
        title: taskTitle,
        description: taskDescription,
        deadline: taskDeadline ? new Date(taskDeadline) : undefined
      }

      const newTask = await apiService.createTask(eventId, selectedUserId, taskData)
      setTasks(prevTasks => [...prevTasks, newTask])
      
      // Réinitialiser le formulaire
      setTaskTitle("")
      setTaskDescription("")
      setTaskDeadline("")
      setSelectedUserId("")
      setShowAddTaskModal(false)
      
      toast.success("Tâche créée avec succès")
      
      // Recalculer le progrès après l'ajout
      setTimeout(() => {
        recalculateProgress()
      }, 100)
      
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error(t("common.error"))
    } finally {
      setIsAddingTask(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (time: string) => {
    return time
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">{t("events.notFound")}</h2>
        <p className="text-muted-foreground mb-6">{t("events.notFoundDescription")}</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("common.back")}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{event.titre}</h1>
          <p className="text-muted-foreground">{t("events.manageTasks")}</p>
        </div>
      </div>

      {/* Event Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("events.eventDetails")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{formatDate(event.date)}</p>
              <p className="text-xs text-muted-foreground">{formatTime(event.heure)}</p>
            </div>
          </div>
          
          {event.lieu && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{event.lieu}</p>
                <p className="text-xs text-muted-foreground">{t("events.location")}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{event.participants?.length || 0}</p>
              <p className="text-xs text-muted-foreground">{t("events.participants")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{tasks.length}</p>
              <p className="text-xs text-muted-foreground">{t("tasks.title")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progrès des tâches */}
        <div className="lg:col-span-1">
          {progress && (
            <TaskProgress progress={progress} />
          )}
        </div>

        {/* Liste des tâches */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("tasks.list")}</CardTitle>
                <Button onClick={() => setShowAddTaskModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("tasks.add")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t("tasks.noTasksAssigned")}</h3>
                  <p className="text-muted-foreground mb-4">
                    Aucune tâche n'a été assignée pour cet événement
                  </p>
                  <Button onClick={() => setShowAddTaskModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("tasks.add")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onTaskUpdate={handleTaskUpdate}
                      showActions={false} // Le responsable ne peut que consulter
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal pour ajouter une tâche */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t("tasks.add")}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddTaskModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="taskTitle" className="text-gray-900 dark:text-white">Titre *</Label>
                <Input
                  id="taskTitle"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Titre de la tâche"
                />
              </div>
              
              <div>
                <Label htmlFor="taskDescription" className="text-gray-900 dark:text-white">Description</Label>
                <Textarea
                  id="taskDescription"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Description de la tâche"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="assignedUser" className="text-gray-900 dark:text-white">Assigner à *</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nom} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="taskDeadline" className="text-gray-900 dark:text-white">Date limite</Label>
                <Input
                  id="taskDeadline"
                  type="datetime-local"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleAddTask}
                disabled={isAddingTask || !selectedUserId || !taskTitle.trim()}
                className="flex-1"
              >
                {isAddingTask ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {t("tasks.add")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddTaskModal(false)}
                disabled={isAddingTask}
                className="text-gray-900 dark:text-white"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}