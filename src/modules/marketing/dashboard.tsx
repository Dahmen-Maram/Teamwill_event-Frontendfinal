"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Calendar, Users, MessageSquare, TrendingUp, Target, Eye, MapPin, Clock, Sparkles } from "lucide-react"
import ChatCounter from "@modules/marketing/chat-counter"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { apiService } from "@/lib/api"
import type { Event, Participant } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"

export default function MarketingDashboard() {
  const { t } = useLanguage()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<
    "ALL" | "PUBLISHED" | "PENDING" | "CANCELLED" | "DONE"
  >("ALL")
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isCropping, setIsCropping] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // fallback (backend peut ne pas exposer /users/me/events)
        const events = await apiService.getEvents()

        // Enrichir chaque événement avec ses participants
        const enrichedEvents = await Promise.all(
          events.map(async (event) => {
            try {
              const participants = await apiService.getEventParticipants(event.id)
              return {
                ...event,
                participants,
              }
            } catch (error) {
              console.error(`Erreur chargement participants pour event ${event.id}`, error)
              return {
                ...event,
                participants: [],
              }
            }
          })
        )

        setEvents(enrichedEvents)
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const publishedEvents = events.filter((event) => event.status === "PUBLISHED")
  const draftEvents = events.filter((event) => event.status === "PENDING")
  const doneEvents = events.filter((event) => event.status === "DONE")

  const totalParticipants = publishedEvents.reduce((sum, event) => {
    const participantsCount = Array.isArray(event.participants) ? event.participants.length : 0
    return sum + participantsCount
  }, 0)

  const totalMaxParticipants = publishedEvents.reduce((sum, event) => {
    const capacite = typeof event.capacite === "number" ? event.capacite : 0
    return sum + capacite
  }, 0)

  const participationRate =
    totalMaxParticipants > 0
      ? ((totalParticipants / totalMaxParticipants) * 100).toFixed(1)
      : "0"

  // Statistiques
  const stats = {
    published: publishedEvents.length,
    draft: draftEvents.length,
    done: doneEvents.length,
    total: events.length,
    participants: totalParticipants,
    participationRate: parseFloat(participationRate),
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
            <p className="text-lg font-medium text-gray-700">Chargement du tableau de bord</p>
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
          <div className="absolute -bottom-4 -left-4 w-28 h-28 bg-gradient-to-tr from-gray-800/50 to-transparent rounded-full blur-lg"></div>
          
          <Card className="relative overflow-hidden border-0 shadow-sm dark:shadow-black/50 shadow-white/50 backdrop-blur-sm dark:bg-gray-900/95 bg-white/95">
            <div className="absolute inset-0 dark:bg-gradient-to-r dark:from-gray-900/50 dark:via-gray-800/30 dark:to-primary/5 bg-gradient-to-r from-gray-50/50 via-white/30 to-primary/5"></div>
            
            <CardContent className="relative z-10 px-4 py-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary-700/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                      <div className="relative bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-2 rounded-md shadow-sm">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <h1 className="text-xl lg:text-2xl font-bold">
                        <span className="bg-gradient-to-r from-gray-800 via-gray-700 to-primary-600 dark:from-gray-100 dark:via-gray-200 dark:to-primary-200 bg-clip-text text-transparent">
                          {t("navigation.dashboard")} Marketing
                        </span>
                      </h1>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {t("events.manageEvents")}
                      </p>
                    </div>
                  </div>
                  
                  {/* Indicateur de performance ultra compact */}
                  {stats.total > 0 && (
                    <div className="bg-gradient-to-r from-gray-100 via-gray-50/50 to-primary-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-primary-900/30 rounded-lg p-3 border border-gray-300/60 dark:border-gray-700/60 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-900 dark:to-primary-800 p-1 rounded-md">
                          <Target className="h-3 w-3 text-white dark:text-primary-300" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t("events.globalPerformance")}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.participationRate}%</span>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("events.participationRate")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative bg-gray-300/80 dark:bg-gray-700/80 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary-600 to-primary-700 rounded-full transition-all duration-1000 ease-out shadow-sm"
                          style={{ width: `${Math.min(stats.participationRate, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bouton créer événement */}
                <Button asChild className="bg-primary hover:bg-primary-600 shadow-sm create-event-btn">
                  <Link href="/marketing/create">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="create-event-text">{t("navigation.createEvent")}</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques ultra compactes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              icon: Eye,
              label: t("events.published"),
              value: stats.published,
              gradient: "from-green-500 to-green-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: Clock,
              label: t("events.drafts"),
              value: stats.draft,
              gradient: "from-yellow-500 to-yellow-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: Users,
              label: t("events.participants"),
              value: stats.participants,
                             gradient: "from-green-500 to-green-600",
              bgGradient: "from-white to-white"
            },
            {
              icon: Calendar,
              label: t("events.done"),
              value: stats.done,
                             gradient: "from-green-500 to-green-600",
              bgGradient: "from-white to-white"
            }
          ].map((stat, index) => (
            <Card key={index} className={`group border-0 bg-gradient-to-br ${stat.bgGradient} dark:from-gray-900 dark:to-gray-800 hover:shadow-md hover:shadow-white/50 dark:hover:shadow-black/50 transition-all duration-300 hover:-translate-y-0.5 border border-gray-200/30 dark:border-gray-700/30`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`relative bg-gradient-to-br ${stat.gradient} p-1.5 rounded-md shadow-sm group-hover:shadow-md transition-all duration-300`}>
                    <stat.icon className="h-3 w-3 text-white" />
                     <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-md"></div>
                   </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-0.5">
                      {stat.label}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions rapides ultra raffinées */}
        <Card className="border-0 shadow-sm dark:shadow-black/50 shadow-white/50 dark:bg-gray-900/90 bg-white/90 backdrop-blur-sm border border-gray-300/30 dark:border-gray-700/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t("events.quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  icon: Plus,
                  label: t("events.createEvent"),
                  href: "/marketing/create",
                  gradient: "from-green-500 to-green-600"
                },
                {
                  icon: Calendar,
                  label: t("events.manageEvents"),
                  href: "/marketing/events",
                  gradient: "from-green-500 to-green-600"
                },
                {
                  icon: TrendingUp,
                  label: t("events.viewStatistics"),
                  href: "/marketing/stat",
                  gradient: "from-green-500 to-green-600"
                }
              ].map((action, index) => (
                                                  <Button
                   key={index}
                   asChild
                   variant="outline"
                  className={`h-16 flex-col bg-gradient-to-br from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200/30 dark:border-gray-700/30 hover:shadow-md hover:shadow-white/50 dark:hover:shadow-black/50 transition-all duration-300 hover:-translate-y-0.5 group`}
                 >
                   <Link href={action.href}>
                     <div className={`relative bg-gradient-to-br ${action.gradient} p-2 rounded-md shadow-sm group-hover:shadow-md transition-all duration-300 mb-2`}>
                       <action.icon className="h-5 w-5 text-white" />
                       <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-md"></div>
                     </div>
                     <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
                   </Link>
                 </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section messages avec ChatCounter */}
        <Card className="border-0 shadow-sm dark:shadow-black/50 shadow-white/50 dark:bg-gray-900/90 bg-white/90 backdrop-blur-sm border border-gray-300/30 dark:border-gray-700/30">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-md shadow-sm">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t("events.messagesChat")}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t('events.thisWeek')}</p>
                </div>
              </div>
              <div className="text-right">
                <ChatCounter />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
