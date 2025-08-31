"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Event, EventTaskProgress } from "@/lib/types"
import { apiService } from "@/lib/api"
import { useLanguage } from "@/lib/i18n"
import { useAuth } from "@/modules/auth/auth-context"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { ClipboardList, Search, Calendar, MapPin, Plus, CheckCircle2, ListTodo, Users, Sparkles, TrendingUp, Target } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"

interface EventWithProgress extends Event {
  progress?: EventTaskProgress
}

export default function EventsTasksPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [events, setEvents] = useState<EventWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { user, loading: authLoading } = useAuth()

  // Fonction pour calculer le progrès côté frontend
  const calculateEventProgress = async (eventId: string): Promise<EventTaskProgress | null> => {
    try {
      console.log(`🔄 Calcul du progrès pour l'événement ${eventId}...`)
      
      // Essayer de récupérer le progrès depuis le backend
      try {
        const progressData = await apiService.getEventTaskProgress(eventId)
        console.log(`✅ Progrès récupéré depuis le backend pour ${eventId}:`, progressData)
        return progressData
      } catch (backendError) {
        console.log(`⚠️ Endpoint progress non implémenté pour ${eventId}, calcul côté frontend`)
        
        // Si le backend n'est pas implémenté, calculer côté frontend
        try {
          const tasks = await apiService.getTasksByEvent(eventId)
          console.log(`📋 Tâches récupérées pour ${eventId}:`, tasks.length)
          
          const totalTasks = tasks.length
          const completedTasks = tasks.filter(task => task.status === "COMPLETED").length
          const acceptedTasks = tasks.filter(task => task.status === "ACCEPTED").length
          
          // Le progrès se base sur les tâches acceptées ET terminées
          const activeTasks = acceptedTasks + completedTasks
          const progressPercentage = totalTasks > 0 ? Math.round((activeTasks / totalTasks) * 100) : 0
          
          const frontendProgress = {
            eventId: eventId,
            eventTitle: "Événement",
            totalTasks: totalTasks,
            acceptedTasks: acceptedTasks,
            completedTasks: completedTasks,
            progressPercentage: progressPercentage,
            tasks: tasks
          }
          
          console.log(`✅ Progrès calculé côté frontend pour ${eventId}:`, {
            totalTasks,
            acceptedTasks,
            completedTasks,
            activeTasks,
            progressPercentage
          })
          
          return frontendProgress
        } catch (error) {
          console.error(`❌ Error calculating progress for event ${eventId}:`, error)
          return null
        }
      }
    } catch (error) {
      console.error(`❌ Error in calculateEventProgress for ${eventId}:`, error)
      return null
    }
  }

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsLoading(false);
      setEvents([]);
      return;
    }

    const fetchEventsWithProgress = async () => {  
      try {
        const allEvents = await apiService.getEvents();
  
        const filtered = allEvents.filter((event: Event & { organisateurId?: string }) => {
          let organisateurId: string | undefined;
  
          if ("organisateurId" in event && event.organisateurId) {
            organisateurId = event.organisateurId as unknown as string;
          } else if (event.organisateur && typeof event.organisateur === "object") {
            organisateurId = (event.organisateur as any).id;
          } else if (typeof event.organisateur === "string" || typeof event.organisateur === "number") {
            organisateurId = event.organisateur as unknown as string;
          }

          const isAllowed = !event.isPrivate || organisateurId?.toString() === user.id.toString();
          return isAllowed;
        });

        // Récupérer le progrès pour chaque événement
        console.log(`🔄 Récupération du progrès pour ${filtered.length} événements...`)
        
        const eventsWithProgress = await Promise.all(
          filtered.map(async (event) => {
            console.log(`🔄 Calcul du progrès pour l'événement: ${event.titre}`)
            const progress = await calculateEventProgress(event.id)
            console.log(`📊 Événement ${event.titre} (${event.id}):`, {
              progress: progress ? {
                totalTasks: progress.totalTasks,
                acceptedTasks: progress.acceptedTasks,
                completedTasks: progress.completedTasks,
                progressPercentage: progress.progressPercentage
              } : 'null'
            })
            return {
              ...event,
              progress
            } as EventWithProgress
          })
        );
  
        console.log(`✅ ${eventsWithProgress.length} événements avec progrès chargés:`, 
          eventsWithProgress.map(e => ({
            titre: e.titre,
            progress: e.progress ? `${e.progress.progressPercentage}%` : 'null'
          }))
        )
        
        setEvents(eventsWithProgress);
      } catch (err) {
        console.error("❌ Error fetching events:", err);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchEventsWithProgress();
  }, [authLoading, user?.id]);
  

  const filteredEvents = events.filter((event) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      event.titre.toLowerCase().includes(term) ||
      event.description.toLowerCase().includes(term) ||
      (event.lieu?.toLowerCase?.().includes(term) ?? false)
    )
  })

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
            <LoadingSpinner size="lg" className="relative z-10" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">Chargement de vos événements</p>
            <p className="text-sm text-gray-500">Veuillez patienter un moment...</p>
          </div>
        </div>
      </div>
    )
  }

  const totalActiveTasks = events.reduce((total, event) => {
    if (event.progress) {
      return total + event.progress.acceptedTasks + event.progress.completedTasks
    }
    return total
  }, 0)

  const totalTasks = events.reduce((total, event) => {
    if (event.progress) {
      return total + event.progress.totalTasks
    }
    return total
  }, 0)

  const overallProgress = totalTasks > 0 ? Math.round((totalActiveTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen dark:bg-gradient-to-br dark:from-black dark:via-gray-900 dark:to-black bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
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
                        <ListTodo className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <h1 className="text-xl lg:text-2xl font-bold text-primary-900 dark:text-white">
                        {t("navigation.eventsTasks")}
                      </h1>
                      <p className="text-xs text-primary-600 dark:text-gray-400 font-medium">
                        {t("events.manageTasksForEvents")}
                      </p>
                    </div>
                  </div>
                  
                  {/* Indicateur de progrès global ultra compact */}
                  {totalTasks > 0 && (
                    <div className="bg-gradient-to-r from-primary-50 via-white/50 to-primary-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-primary-900/30 rounded-lg p-3 border border-primary-200/60 dark:border-gray-700/60 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-900 dark:to-primary-800 p-1 rounded-md">
                          <TrendingUp className="h-3 w-3 text-white dark:text-primary-300" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-primary-700 dark:text-gray-300 uppercase tracking-wide">{t("events.globalProgress")}</span>  
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-primary-900 dark:text-gray-100">{overallProgress}</span>
                            <span className="text-xs font-medium text-primary-600 dark:text-gray-400">%</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative bg-gray-300/80 dark:bg-gray-700/80 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary-600 to-primary-700 rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${overallProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Bouton créer événement */}
                <Button asChild className="bg-primary hover:bg-primary-600 shadow-sm">
                  <Link href="/marketing/create">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("navigation.createEvent")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
                 </div>

         {/* Statistiques ultra compactes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              icon: Calendar,
              label: t("events.totalEvents"),
              value: filteredEvents.length,
              gradient: "from-gray-600 to-gray-800",
              bgGradient: "from-white to-white"
            },
            {
              icon: CheckCircle2,
              label: t("events.activeTasks"),
              value: totalActiveTasks,
              gradient: "from-primary to-primary-700",
              bgGradient: "from-white to-white"
            },
            {
              icon: Target,
              label: t("events.totalTasks"),
              value: totalTasks,
              gradient: "from-gray-700 to-gray-900",
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

         {/* Recherche ultra compacte */}
         <Card className="border-0 shadow-sm shadow-white/50 dark:shadow-black/50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-primary-200/30 dark:border-gray-700/30">
           <CardContent className="p-3">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                  type="text"
                  placeholder={`${t("events.searchEvents")} • ${filteredEvents.length} événements`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full text-sm bg-white/80 dark:bg-gray-800/80 border border-gray-300/60 dark:border-gray-600/60 rounded-md focus:outline-none focus:border-primary/60 focus:ring-primary/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
             </div>
           </CardContent>
         </Card>

         {/* Grille d'événements ou état vide */}
        {filteredEvents.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-white/80 to-gray-50/30 dark:from-gray-900/80 dark:to-gray-800/30 backdrop-blur-sm">
            <CardContent className="px-4 py-8 text-center">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-full blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
                  <ListTodo className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("events.noEvents")}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                  Créez votre premier événement pour commencer à gérer les tâches efficacement
                </p>
              </div>
              <Button asChild className="bg-primary hover:bg-primary-600">
                <Link href="/marketing/create">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("navigation.createEvent")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-3">
            {filteredEvents.map((event, index) => (
                             <Card 
                 key={event.id} 
                 className="group relative overflow-hidden border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/50 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] border border-gray-200/30 dark:border-gray-700/30"
                style={{
                  animationDelay: `${index * 60}ms`,
                  animation: 'slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards opacity-0'
                }}
              >
                                 {/* Effets de fond subtils */}
                 <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 via-transparent to-primary-50/30 dark:from-gray-800/50 dark:via-transparent dark:to-primary-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                                         <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors duration-300 leading-tight line-clamp-2">
                      {event.titre}
                    </CardTitle>
                    {event.isPrivate && (
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-900/50 rounded-full blur-sm"></div>
                        <span className="relative bg-gradient-to-r from-red-900 via-red-800 to-red-900 text-red-200 text-xs px-2 py-1 rounded-full font-semibold border border-red-700/60 shadow-sm">
                          Privé
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 relative z-10">
                                     <p className="text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2 text-sm">
                    {event.description}
                  </p>
                  
                                     {event.lieu && (
                     <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 bg-gradient-to-r from-gray-100/80 to-gray-200/40 dark:from-gray-800/80 dark:to-gray-700/40 p-2 rounded-lg border border-gray-300/50 dark:border-gray-600/50">
                       <div className="bg-gray-200/60 dark:bg-gray-700/60 p-1 rounded-md">
                         <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                       </div>
                       <span className="truncate text-xs font-medium">{event.lieu}</span>
                     </div>
                   )}

                                     {/* Indicateur de progrès compact */}
                   <div className="bg-gradient-to-r from-gray-100/90 via-gray-200/50 to-primary-50/30 dark:from-gray-800/90 dark:via-gray-700/50 dark:to-primary-900/30 p-3 rounded-lg border border-gray-300/50 dark:border-gray-600/50 shadow-sm group-hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                                                 <div className="bg-primary-100/80 dark:bg-primary-900/80 p-1 rounded-md">
                           <Target className="h-3 w-3 text-primary-600 dark:text-primary-300" />
                         </div>
                         <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Progression</span>
                      </div>
                      <span className="text-lg font-bold text-primary tabular-nums">
                        {event.progress ? `${event.progress.progressPercentage}%` : "0%"}
                      </span>
                    </div>
                    
                                         <div className="relative bg-gray-300/60 dark:bg-gray-700/60 rounded-full h-2 overflow-hidden mb-2">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary-600 to-primary-700 rounded-full transition-all duration-700 ease-out"
                        style={{ 
                          width: event.progress ? `${event.progress.progressPercentage}%` : '0%' 
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                      </div>
                    </div>
                    
                    {event.progress && event.progress.totalTasks > 0 && (
                                             <div className="flex justify-between items-center text-xs">
                         <span className="text-gray-600 dark:text-gray-400 font-medium">
                           {event.progress.acceptedTasks + event.progress.completedTasks} / {event.progress.totalTasks} tâches
                         </span>
                         <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-100/80 dark:bg-emerald-900/80 px-1.5 py-0.5 rounded-full">
                           {event.progress.completedTasks} {t("events.completed")}
                         </span>
                       </div>
                    )}
                  </div>

                  <Button
                    className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-primary via-primary-600 to-primary-700 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800 text-white shadow-md hover:shadow-lg transition-all duration-300 py-2"
                    onClick={() => router.push(`/marketing/tasks/${event.id}`)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500"></div>
                    <ClipboardList className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300 relative z-10" />
                    <span className="font-medium relative z-10 text-sm">{t("events.manageTasks")}</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  )
}