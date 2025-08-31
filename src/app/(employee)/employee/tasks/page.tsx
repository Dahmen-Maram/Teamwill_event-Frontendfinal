"use client"

import { useEffect, useState } from "react"
import { Task, TaskProgress } from "@/lib/types"
import { apiService } from "@/lib/api"
import { useLanguage } from "@/lib/i18n"
import { useAuth } from "@/modules/auth/auth-context"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Badge } from "@/shared/ui/badge"
import { CheckCircle, Clock, AlertCircle, Users, Calendar, Filter, ClipboardList, Target, TrendingUp, Sparkles } from "lucide-react"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { TaskCard } from "@/shared/ui/task-card"
import { toast } from "sonner"

export default function MyTasksPage() {
  const { t } = useLanguage()
  const { user, loading: authLoading } = useAuth()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [progress, setProgress] = useState<TaskProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (authLoading || !user) return

    const fetchTasks = async () => {
      try {
        setIsLoading(true)
        
        // Récupérer les tâches de l'utilisateur
        const tasksData = await apiService.getTasksByUser(user.id)
        console.log("Tâches récupérées:", tasksData)
        setTasks(tasksData)
        
        // Récupérer le progrès (si implémenté côté backend)
        try {
          const progressData = await apiService.getUserTaskProgress(user.id)
          setProgress(progressData)
        } catch (error) {
          console.log("Progress not implemented yet")
        }
        
      } catch (error) {
        console.error("Error fetching tasks:", error)
        toast.error(t("common.error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [authLoading, user])

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    )
  }

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

  const filteredTasks = tasks.filter(task => {
    switch (activeTab) {
      case "pending":
        return task.status === "PENDING"
      case "accepted":
        return task.status === "ACCEPTED"
      case "completed":
        return task.status === "COMPLETED"
      case "refused":
        return task.status === "REFUSED"
      default:
        return true
    }
  })

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "PENDING").length,
    accepted: tasks.filter(t => t.status === "ACCEPTED").length,
    completed: tasks.filter(t => t.status === "COMPLETED").length,
    refused: tasks.filter(t => t.status === "REFUSED").length,
  }

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
            <LoadingSpinner size="lg" className="relative z-10" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">Chargement de vos tâches</p>
            <p className="text-sm text-gray-500">Veuillez patienter un moment...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dark:bg-gradient-to-br dark:from-black dark:via-gray-900 dark:to-black bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Header Section Ultra Compact */}
        <div className="relative">
          {/* Effets de fond subtils */}
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-28 h-28 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-lg"></div>
          
          <Card className="relative overflow-hidden border-0 shadow-sm dark:shadow-black/50 shadow-white/50 backdrop-blur-sm dark:bg-gray-900/95 bg-white/95">
            <div className="absolute inset-0 dark:bg-gradient-to-r dark:from-gray-900/50 dark:via-gray-800/30 dark:to-primary/5 bg-gradient-to-r from-white/50 via-white/30 to-primary/5"></div>
            
            <CardContent className="relative z-10 px-4 py-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary-700/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                      <div className="relative bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-2 rounded-md shadow-sm">
                        <ClipboardList className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <h1 className="text-xl lg:text-2xl font-bold text-primary-900 dark:text-white">
                        {t("navigation.myTasks")}
                      </h1>
                      <p className="text-xs text-primary-600 dark:text-gray-400 font-medium">
                        {t("tasks.manageTasks")}
                      </p>
                    </div>
                  </div>
                  
                  {/* Indicateur de progrès ultra compact */}
                  {stats.total > 0 && (
                    <div className="bg-gradient-to-r from-primary-50 via-white/50 to-primary-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-primary-900/30 rounded-lg p-3 border border-primary-200/60 dark:border-gray-700/60 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-900 dark:to-primary-800 p-1 rounded-md">
                          <TrendingUp className="h-3 w-3 text-white dark:text-primary-300" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-primary-700 dark:text-gray-300 uppercase tracking-wide">{t("tasks.completionRate")}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-primary-900 dark:text-gray-100">{completionRate}</span>
                            <span className="text-xs font-medium text-primary-600 dark:text-gray-400">%</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative bg-gray-300/80 dark:bg-gray-700/80 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary-600 to-primary-700 rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${completionRate}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques ultra compactes */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            {
              icon: Target,
              label: "Total",
              value: stats.total,
              gradient: "from-gray-600 to-gray-800",
              bgGradient: "from-white to-white"
            },
            {
              icon: AlertCircle,
              label: t("tasks.pending"),
              value: stats.pending,
              gradient: "from-yellow-500 to-yellow-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: CheckCircle,
              label: t("tasks.accepted"),
              value: stats.accepted,
                             gradient: "from-green-500 to-green-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: CheckCircle,
              label: t("tasks.completed"),
              value: stats.completed,
              gradient: "from-green-500 to-green-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: AlertCircle,
              label: t("tasks.refused"),
              value: stats.refused,
              gradient: "from-red-500 to-red-600",
              bgGradient: "from-white to-white"
            }
          ].map((stat, index) => (
                         <Card key={index} className={`group border-0 bg-gradient-to-br ${stat.bgGradient} dark:from-gray-900 dark:to-gray-800 hover:shadow-md hover:shadow-white/50 dark:hover:shadow-black/50 transition-all duration-300 hover:-translate-y-0.5 border border-primary-200/30 dark:border-gray-700/30`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                                     <div className={`relative bg-gradient-to-br ${stat.gradient} p-1.5 rounded-md shadow-sm group-hover:shadow-md transition-all duration-300`}>
                     <stat.icon className="h-3 w-3 text-white" />
                     <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-md"></div>
                   </div>
                  <div>
                    <p className="text-xs font-semibold text-primary-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold text-primary-900 dark:text-gray-100 tabular-nums">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs ultra raffinées */}
        <Card className="border-0 shadow-sm shadow-white/50 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
              <TabsList className="grid w-full grid-cols-5 bg-slate-100/50 p-0.5 rounded-md">
                <TabsTrigger value="all" className="text-xs font-medium py-1.5">{t("tasks.all")} ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs font-medium py-1.5">{t("tasks.pending")} ({stats.pending})</TabsTrigger>
                <TabsTrigger value="accepted" className="text-xs font-medium py-1.5">{t("tasks.accepted")} ({stats.accepted})</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs font-medium py-1.5">{t("tasks.completed")} ({stats.completed})</TabsTrigger>
                <TabsTrigger value="refused" className="text-xs font-medium py-1.5">{t("tasks.refused")} ({stats.refused})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3">
                {tasks.length === 0 ? (
                  <Card className="border-2 border-dashed border-slate-200 bg-gradient-to-br from-white/80 to-slate-50/30 backdrop-blur-sm">
                    <CardContent className="px-4 py-8 text-center">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-slate-100 rounded-full blur-lg opacity-50"></div>
                        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
                          <ClipboardList className="w-8 h-8 text-slate-400" />
                        </div>
                      </div>
                      <div className="space-y-2 mb-6">
                        <h3 className="text-lg font-bold text-slate-800">{t("tasks.noTasksAssigned")}</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                          {t("tasks.noTasksAssignedDescription")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onTaskUpdate={handleTaskUpdate}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <Card className="border-2 border-dashed border-slate-200 bg-gradient-to-br from-white/80 to-slate-50/30 backdrop-blur-sm">
                    <CardContent className="px-4 py-8 text-center">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-slate-100 rounded-full blur-lg opacity-50"></div>
                        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
                          <AlertCircle className="w-8 h-8 text-slate-400" />
                        </div>
                      </div>
                      <div className="space-y-2 mb-6">
                        <h3 className="text-lg font-bold text-slate-800">{t("tasks.noTasksPending")}</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                          {t("tasks.noTasksPendingDescription")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onTaskUpdate={handleTaskUpdate}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="accepted" className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <Card className="border-2 border-dashed border-slate-200 bg-gradient-to-br from-white/80 to-slate-50/30 backdrop-blur-sm">
                    <CardContent className="px-4 py-8 text-center">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-slate-100 rounded-full blur-lg opacity-50"></div>
                        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
                          <CheckCircle className="w-8 h-8 text-slate-400" />
                        </div>
                      </div>
                      <div className="space-y-2 mb-6">
                        <h3 className="text-lg font-bold text-slate-800">{t("tasks.noTasksAccepted")}</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                          {t("tasks.noTasksAcceptedDescription")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onTaskUpdate={handleTaskUpdate}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <Card className="border-2 border-dashed border-slate-200 bg-gradient-to-br from-white/80 to-slate-50/30 backdrop-blur-sm">
                    <CardContent className="px-4 py-8 text-center">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-slate-100 rounded-full blur-lg opacity-50"></div>
                        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
                          <CheckCircle className="w-8 h-8 text-slate-400" />
                        </div>
                      </div>
                      <div className="space-y-2 mb-6">
                        <h3 className="text-lg font-bold text-slate-800">{t("tasks.noTasksCompleted")}</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                          {t("tasks.noTasksCompletedDescription")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onTaskUpdate={handleTaskUpdate}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="refused" className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <Card className="border-2 border-dashed border-slate-200 bg-gradient-to-br from-white/80 to-slate-50/30 backdrop-blur-sm">
                    <CardContent className="px-4 py-8 text-center">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-slate-100 rounded-full blur-lg opacity-50"></div>
                        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
                          <AlertCircle className="w-8 h-8 text-slate-400" />
                        </div>
                      </div>
                      <div className="space-y-2 mb-6">
                          <h3 className="text-lg font-bold text-slate-800">{t("tasks.noTasksRefused")}</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                          {t("tasks.noTasksRefusedDescription")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onTaskUpdate={handleTaskUpdate}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

