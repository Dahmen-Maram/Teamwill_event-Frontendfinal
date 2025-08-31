"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Plus, Trash2, Pencil, Users, ChevronDown, Search, Target, TrendingUp, Sparkles, Eye, MapPin, Clock, X } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { EventCard } from "@/shared/ui/event-card"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { apiService } from "@/lib/api"
import type { Event, Participant, User } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"
import { toast } from "sonner"
import io from "socket.io-client"
import ChatCounter from '@modules/marketing/chat-counter'
import { useAuth } from "../auth/auth-context"

export default function ManageEventPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [openEventId, setOpenEventId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<
    "ALL" | "PUBLISHED" | "PENDING" | "CANCELLED" | "DONE"
  >("ALL")
  const { user, loading, refresh } = useAuth()
  const [count, setCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchEvents = async () => {
        try {
          let events: Event[] = []
          events = await apiService.getEvents()

          const enriched = await Promise.all(
            events.map(async (event) => {
              try {
                const participants = await apiService.getEventParticipants(event.id)
                const isRegistered = participants.some((p: Participant) => {
                  const participantUserId = (p as any).userId ?? p.user?.id
                  return participantUserId === user?.id && (p.status === "APPROVED" || p.status === "PENDING")
                })
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
          console.error("Error fetching events or user:", error)
        } finally {
          setIsLoading(false)
        }
      }

    fetchEvents()
  }, [])

  const handleDelete = async (eventId: string) => {
    const confirmed = window.confirm(t("events.confirmDelete"))
    if (!confirmed) return

    try {
      await apiService.deleteEvent(eventId)
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
      toast.success(t("events.deleted"))
    } catch (error) {
      console.error("Delete failed:", error)
      toast.error(t("events.errorDelete"))
    }
  }

  const handleRemoveParticipant = async (eventId: string, participant: Participant) => {
    const confirmed = window.confirm(t("events.confirmDelete"))
    if (!confirmed) return

    try {
      const participantUserId = (participant as any).userId ?? participant.user?.id
      await apiService.cancelParticipation(eventId, participantUserId)
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, participants: (e.participants ?? []).filter((pp: Participant) => pp.id !== participant.id) } : e
        )
      )
      toast.success(t("events.deleted"))
    } catch (error) {
      console.error("Delete participant failed:", error)
      toast.error(t("events.errorDelete"))
    }
  }

  // Filtrage avec recherche textuelle et filtre par status
  const filteredEvents = events.filter((event) => {
    // filtre par statut
    if (filter !== "ALL" && event.status !== filter) return false

    // filtre par recherche texte
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        event.titre.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term) ||
        event.lieu.toLowerCase().includes(term)
      )
    }

    return true
  })

  // Statistiques
  const stats = {
    total: events.length,
    published: events.filter(e => e.status === "PUBLISHED").length,
    pending: events.filter(e => e.status === "PENDING").length,
    done: events.filter(e => e.status === "DONE").length,
    cancelled: events.filter(e => e.status === "CANCELLED").length,

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
            <p className="text-lg font-medium text-gray-700">{t("events.loadingEvents")}</p>
            <p className="text-sm text-gray-500">{t("events.pleaseWait")}</p>
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
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <h1 className="text-xl lg:text-2xl font-bold text-primary-900 dark:text-white">
                        {t("events.manageEvents")}
                      </h1>
                      <p className="text-xs text-primary-600 dark:text-gray-400 font-medium">
                        {t("events.manageEvents")}
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
                          <span className="text-xs font-semibold text-primary-700 dark:text-gray-300 uppercase tracking-wide">{t("events.portfolioEvent")}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-primary-900 dark:text-gray-100">{stats.published}</span>
                            <span className="text-xs font-medium text-primary-600 dark:text-gray-400">{t("events.publishedEvents")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative bg-gray-300/80 dark:bg-gray-700/80 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary-600 to-primary-700 rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${stats.total > 0 ? (stats.published / stats.total) * 100 : 0}%` }}
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {[
            {
              icon: Target,
              label: "Total",
              value: stats.total,
              gradient: "from-gray-600 to-gray-800",
              bgGradient: "from-white to-white"
            },
            {
              icon: Eye,
              label: t("events.published"),
              value: stats.published,
              gradient: "from-green-500 to-green-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: Clock,
              label: t("events.pending"),
              value: stats.pending,
              gradient: "from-yellow-500 to-yellow-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: Calendar,
              label: t("events.done"),
              value: stats.done,
                             gradient: "from-green-500 to-green-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: Trash2,
              label: t("events.cancelled"),
              value: stats.cancelled,
              gradient: "from-red-500 to-red-600",
              bgGradient: "from-white to-white"
            },

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

        {/* Recherche et filtres ultra raffinés */}
        <Card className="border-0 shadow-sm dark:shadow-black/50 shadow-gray-200/50 dark:bg-gray-900/90 bg-white/90 backdrop-blur-sm border border-gray-300/30 dark:border-gray-700/30">
          <CardContent className="p-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {/* Recherche ultra compacte */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder={t("events.searchEvents")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full text-sm bg-white/80 dark:bg-gray-800/80 border border-gray-300/60 dark:border-gray-600/60 rounded-md focus:outline-none focus:border-primary/60 focus:ring-primary/20 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Filtres ultra raffinés */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "ALL", label: t("events.all") },
                  { key: "PUBLISHED", label: t("events.published") },
                  { key: "PENDING", label: t("events.pending") },
                  { key: "CANCELLED", label: t("events.cancelled") },

                  { key: "DONE", label: t("events.done") },
                ].map((filterOption) => (
                  <Button
                    key={filterOption.key}
                    variant={filter === filterOption.key ? "default" : "outline"}
                    onClick={() => setFilter(filterOption.key as any)}
                    size="sm"
                    className={`text-xs font-medium transition-all duration-200 ${
                      filter === filterOption.key 
                        ? "bg-primary text-white shadow-sm" 
                        : "bg-white/80 border-slate-200/60 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {filterOption.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des événements */}
        <Card className="border-0 shadow-sm shadow-slate-100/50 bg-white/90 backdrop-blur-sm">
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
                    <h3 className="text-lg font-bold text-slate-800">{t("events.noEventsFound")}</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                      {searchTerm ? t("events.tryAnotherSearch") : t("events.createFirstEvent")}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="space-y-2">
                    <EventCard event={event} showActions={false} onClick={() => {
                      router.push(`/marketing/update/${event.id}`)
                    }} />
                    
                    {/* Participants toggle + Chat */}
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <button
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                        onClick={() => setOpenEventId(openEventId === event.id ? null : event.id)}
                      >
                        <Users className="w-3 h-3" />
                        {t("events.participants")} ({event.participants?.length})
                        <ChevronDown className={`w-3 h-3 transition-transform ${openEventId === event.id ? 'rotate-180' : ''}`} />
                      </button>

                      <Button variant="link" size="sm" asChild className="text-xs h-auto p-0">
                        <Link href={`/chat/${event.id}`}>{t("events.openChat")}</Link>
                      </Button>
                    </div>

                    {openEventId === event.id && (
                      <ul className="pl-4 py-2 space-y-1 bg-slate-50/50 rounded-md">
                        {event.participants?.length === 0 && (
                          <li className="text-xs text-slate-500">{t("events.noParticipants")}</li>
                        )}
                        {event.participants?.map((p) => (
                          <li key={p.id} className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => handleRemoveParticipant(event.id, p)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <img
                              src={p.user?.avatarUrl || "/placeholder-user.jpg"}
                              alt={p.user?.nom || "Utilisateur"}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-slate-600">{p.user?.nom || "Utilisateur"}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                   
                    <div className="flex justify-between gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full text-xs h-8"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t("events.delete")}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs h-8"
                        asChild
                      >
                        <Link href={`/marketing/update/${event.id}`}>
                          <Pencil className="w-3 h-3 mr-1" />
                          {t("events.edit")}
                        </Link>
                      </Button>
                    </div>
                    
                    {/* View Statistics Button - Only show if event has sheetId */}
                    {event.sheetId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 mt-2"
                        asChild
                      >
                        <Link href={`/marketing/stat?eventId=${event.id}`}>
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {t("events.viewStatistics")}
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
