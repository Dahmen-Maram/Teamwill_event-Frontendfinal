"use client"

import { useEffect, useState } from "react"
import { Calendar, Search, Users, MapPin, Clock, Target, TrendingUp, Sparkles } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Card, CardContent } from "@/shared/ui/card"
import { EventCard } from "@/shared/ui/event-card"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { apiService } from "@/lib/api"
import { useAuth } from "@/modules/auth/auth-context"
import type { Event, Participant } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"
import { toast } from "sonner"
import { EventDetailsModal } from "@/shared/ui/EventDetailsModal"
import { useRouter } from "next/navigation"

export default function MyRegistrationsPage() {
  const { t } = useLanguage()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { user: currentUser } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Charge les événements où l'utilisateur est inscrit
  const fetchRegisteredEvents = async () => {
    try {
      if (!currentUser) return

      const [allEvents, myParticipants] = await Promise.all([
        apiService.getEvents(),
        apiService.getParticipantsByUser(currentUser.id),
      ])

      const myEventIds = new Set(myParticipants.map((p) => p.event.id))

      const registered = allEvents
        .filter((e) => myEventIds.has(e.id))
        .map((e) => ({
          ...e,
          participants: myParticipants.filter((p) => p.event.id === e.id),
          isRegistered: true,
        }))

      setEvents(registered)
    } catch (error) {
      console.error("Erreur lors du chargement :", error)
      toast.error(t("events.errorLoading"))
    } finally {
      setIsLoading(false)
    }
  }

  const router = useRouter()

  // Navigue vers la page de détails d'événement pour l'employé
  const handleEventClick = (event: Event) => {
    router.push(`/employee/events/${event.id}`)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedEvent(null)
  }

  useEffect(() => {
    fetchRegisteredEvents()
  }, [])

  // Fonction d'annulation d'inscription
  const handleCancelRegistration = async (eventId: string) => {
    if (!currentUser) return
    try {
      await apiService.cancelParticipation(eventId, currentUser.id)
      toast.success(t("events.registrationCancelled"))
      // Recharge la liste après suppression
      fetchRegisteredEvents()
    } catch (error) {
      console.error("Erreur lors de l'annulation :", error)
      toast.error(t("events.errorCancelling"))
    }
  }

  // Filtrage local par recherche
  const filteredEvents = events.filter((event) =>
    event.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.lieu.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Statistiques
  const stats = {
    total: events.length,
    upcoming: events.filter(e => new Date(e.date) > new Date()).length,
    past: events.filter(e => new Date(e.date) <= new Date()).length,
    withLocation: events.filter(e => e.lieu).length,
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
            <LoadingSpinner size="lg" className="relative z-10" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">{t("events.loadingRegistrations")}</p>  
            <p className="text-sm text-gray-500">{t("common.pleaseWait")}</p>  
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
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <h1 className="text-xl lg:text-2xl font-bold text-primary-900 dark:text-white">
                        {t("navigation.myRegistrations")}
                      </h1>
                      <p className="text-xs text-primary-600 dark:text-gray-400 font-medium">
                        {t("events.manageRegistrations")}
                      </p>
                    </div>
                  </div>
                  
                  {/* Indicateur de participation ultra compact */}
                  {stats.total > 0 && (
                    <div className="bg-gradient-to-r from-primary-50 via-white/50 to-primary-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-primary-900/30 rounded-lg p-3 border border-primary-200/60 dark:border-gray-700/60 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-900 dark:to-primary-800 p-1 rounded-md">
                          <TrendingUp className="h-3 w-3 text-white dark:text-primary-300" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-primary-700 dark:text-gray-300 uppercase tracking-wide">{t("events.participationRate")}</span>
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
              icon: Target,
              label: "Total",
              value: stats.total,
              gradient: "from-gray-600 to-gray-800",
              bgGradient: "from-white to-white"
            },
            {
              icon: Calendar,
              label: t("events.upcomingEvents"),
              value: stats.upcoming,
              gradient: "from-green-500 to-green-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: Clock,
              label: t("events.pastEvents"),
              value: stats.past,
              gradient: "from-green-500 to-green-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: MapPin,
              label: t("events.withLocation"),
              value: stats.withLocation,
              gradient: "from-blue-500 to-blue-600",
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
                    <h3 className="text-lg font-bold text-slate-800">
                      {searchTerm ? t("events.noneFound") : "Aucune inscription"}
                    </h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                      {searchTerm ? t("events.tryAnotherSearch") : "Vous n'êtes inscrit à aucun événement pour le moment."}
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
                    onRegister={async () => {}}
                    onCancel={async () => {
                      await handleCancelRegistration(event.id)
                    }}
                    onClick={() => handleEventClick(event)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EventDetailsModal
        event={selectedEvent}
        isOpen={modalOpen}
        onClose={closeModal}
      />
    </div>
  )
}
