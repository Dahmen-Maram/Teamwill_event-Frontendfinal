"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, MapPin, Search, Target, TrendingUp, Sparkles, Users, Eye } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { EventCard } from "@/shared/ui/event-card"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { apiService } from "@/lib/api"
import { useAuth } from "@/modules/auth/auth-context"
import type { Event, User, Participant } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"

function isEventUpcoming(date: string, heure: string): boolean {
  const eventDateTime = new Date(`${date}T${heure}`)
  return eventDateTime > new Date()
}

export default function EmployeeDashboard() {
  const { t } = useLanguage()
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()

  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<
    "ALL" | "PUBLISHED" | "PENDING" | "CANCELLED" | "DONE"
  >("PUBLISHED")

  useEffect(() => {
    const fetchEvents = async () => {
      if (!currentUser) return
      
      try {
        const events = await apiService.getEvents()

        const enriched = await Promise.all(
          events.map(async (event) => {
            try {
              const participants = await apiService.getEventParticipants(event.id)
              const isRegistered = participants.some((p: Participant) => {
              const participantUserId = (p as any).userId ?? p.user?.id
              return participantUserId === currentUser.id && (p.status === "APPROVED" || p.status === "PENDING")
            })
              const isInvited = event.isPrivate && (event.invitedIds?.includes(currentUser.id) ?? false)
              return {
                ...event,
                participants,
                isRegistered,
              }
            } catch {
              return {
                ...event,
                participants: [],
                isRegistered: false,
              }
            }
          })
        )

        setEvents(enriched)
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!authLoading && currentUser) {
      fetchEvents()
    }
  }, [currentUser, authLoading])

  useEffect(() => {
    let filtered = events

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.lieu.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filter === "ALL") {
      filtered = filtered.filter((event) => event.status !== "PENDING")
    } else {
      filtered = filtered.filter((event) => {
      if (filter === "PUBLISHED") {
        const invited = event.isPrivate && (event.invitedIds?.includes(currentUser?.id ?? "") ?? false)
        return event.status === "PUBLISHED" || invited
      }
      return event.status === filter
    })
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm, filter, currentUser])

  const handleRegister = async (eventId: string) => {
    if (!currentUser) return

    try {
      await apiService.participateInEvent(eventId, currentUser.id)
      const updatedParticipants = await apiService.getEventParticipants(eventId)

      const isRegistered = updatedParticipants.some((p: Participant) => {
        const participantUserId = (p as any).userId ?? p.user?.id
        return participantUserId === currentUser.id && (p.status === "APPROVED" || p.status === "PENDING")
      })

      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? {
                ...event,
                participants: updatedParticipants,
                isRegistered,
              }
            : event
        )
      )
    } catch (error) {
      console.error("❌ Erreur lors de l'inscription :", error)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endOfWeek = new Date()
  endOfWeek.setDate(today.getDate() + 7)
  endOfWeek.setHours(0, 0, 0, 0)

  const upcomingEvents = events.filter((event) => {
    const eventDate = new Date(event.date)
    eventDate.setHours(0, 0, 0, 0)

    return eventDate >= today && event.status === "PUBLISHED"
  })

  const upcomingWeekEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
  
    // Condition : date >= today et (public ou privé ET utilisateur inscrit)
    return (
      eventDate >= today &&
      event.status === "PUBLISHED" &&
      (
        event.isPrivate === false || // événement public
        (event.isPrivate === true && event.isRegistered) // événement privé où l'utilisateur est inscrit
      )
    );
  });
  

  const registeredEvents = useMemo(() => {
    if (!currentUser) return []
    return events.filter((event) =>
      event.participants?.some((p) => {
        const participantUserId = (p as any).userId ?? p.user?.id
        return participantUserId === currentUser.id && (p.status === "APPROVED" || p.status === "PENDING")
      })
    )
  }, [events, currentUser])

  // Statistiques
  const stats = {
    upcoming: upcomingEvents.length,
    registered: registeredEvents.length,
    thisWeek: upcomingWeekEvents.length,
    total: events.length,
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
            <LoadingSpinner size="lg" className="relative z-10" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">{t("common.loading")}</p>  
                <p className="text-sm text-gray-500">{t("common.pleaseWait")}</p>  
              </div>
        </div>
      </div>
    )
  }
  
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t("common.error")}</p>
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
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <h1 className="text-xl lg:text-2xl font-bold text-primary-900 dark:text-white">
                        {t("events.title")}
                      </h1>
                      <p className="text-xs text-primary-600 dark:text-gray-400 font-medium">
                        {t("events.descriptiondashboard")}
                      </p>
                    </div>
                  </div>
                  
                  {/* Indicateur d'activité ultra compact */}
                  {stats.total > 0 && (
                    <div className="bg-gradient-to-r from-primary-50 via-white/50 to-primary-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-primary-900/30 rounded-lg p-3 border border-primary-200/60 dark:border-gray-700/60 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-900 dark:to-primary-800 p-1 rounded-md">
                          <TrendingUp className="h-3 w-3 text-white dark:text-primary-300" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-primary-700 dark:text-gray-300 uppercase tracking-wide">{t("events.eventActivity")}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-primary-900 dark:text-gray-100">{stats.upcoming}</span>
                            <span className="text-xs font-medium text-primary-600 dark:text-gray-400">{t("events.upcomingEvents")}</span>  
                          </div>
                        </div>
                      </div>
                      <div className="relative bg-gray-300/80 dark:bg-gray-700/80 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary-600 to-primary-700 rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${stats.total > 0 ? (stats.upcoming / stats.total) * 100 : 0}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recherche ultra compacte */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t("events.searchEvents")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 h-9 text-sm bg-white/80 dark:bg-gray-800/80 border-gray-300/60 dark:border-gray-600/60 focus:border-primary/60 focus:ring-primary/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques ultra compactes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: Calendar,
              label: t("events.upcoming"),
              value: stats.upcoming,
              gradient: "from-green-500 to-green-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: Users,
              label: t("events.inscriptions"),
              value: stats.registered,
                             gradient: "from-green-500 to-green-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: Clock,
              label: t("events.thisWeek"),
              value: stats.thisWeek,
              gradient: "from-green-500 to-green-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: Target,
              label: t("events.total"),
              value: stats.total,
              gradient: "from-gray-600 to-gray-800",
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

        {/* Filtres ultra raffinés */}
        <Card className="border-0 shadow-sm dark:shadow-black/50 shadow-white/50 dark:bg-gray-900/90 bg-white/90 backdrop-blur-sm border border-primary-200/30 dark:border-gray-700/30">
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2">
              {[
                { key: "ALL", label: t("events.all") },
                { key: "PUBLISHED", label: t("events.publie") },
                { key: "CANCELLED", label: t("events.cancelled") },

                { key: "DONE", label: t("events.termines") }
              ].map((filterOption) => (
                <Button
                  key={filterOption.key}
                  variant={filter === filterOption.key ? "default" : "outline"}
                  onClick={() => setFilter(filterOption.key as any)}
                  size="sm"
                  className={`${
                    filter === filterOption.key 
                      ? "bg-primary hover:bg-primary-600 text-white" 
                      : "bg-gray-100/50 hover:bg-gray-200/50 text-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 dark:text-gray-300 border-gray-300/50 dark:border-gray-600/50"
                  } transition-all duration-200`}
                >
                  {filterOption.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Liste des événements */}
        <Card className="border-0 shadow-sm shadow-white/50 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-3">
            {filteredEvents.length === 0 ? (
              <Card className="border-2 border-dashed border-slate-200 bg-gradient-to-br from-white/80 to-slate-50/30 backdrop-blur-sm">
                <CardContent className="px-4 py-8 text-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-slate-100 rounded-full blur-lg opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto shadow-inner">
                      <Calendar className="w-8 h-8 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <h3 className="text-lg font-bold text-slate-800">{t("events.noneFound")}</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                      {searchTerm ? t("events.tryAnotherSearch") : t("events.noneForStatus")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    currentUserId={currentUser?.id ?? null}
                    onRegister={() => handleRegister(event.id)}
                    onClick={() => {
                      if (event.status === 'DONE' && event.formUrl && event.isRegistered) {
                        // Ouvre le formulaire Google Forms dans un nouvel onglet
                        window.open(event.formUrl, '_blank');
                      } 
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
