"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Calendar, Users, MessageSquare, TrendingUp } from "lucide-react"
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
    "ALL" | "PUBLISHED" | "PENDING" | "CANCELLED" | "REJECTED" | "DONE"
  >("ALL")
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isCropping, setIsCropping] = useState(false)


  useEffect(() => {
    const fetchEvents = async () => {
      try {
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
      ? Math.round((totalParticipants / totalMaxParticipants) * 100)
      : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("navigation.dashboard")} Marketing</h1>
          <p className="text-muted-foreground">{t("dashboard.manageEvents")}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link href="/marketing/create">
              <Plus className="h-4 w-4 mr-2" />
              {t("navigation.createEvent")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("events.eventsPublished")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedEvents.length}</div>
            <p className="text-xs text-muted-foreground">+{draftEvents.length} {t("events.draft")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("events.totalParticipants")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipants}</div>
            <p className="text-xs text-muted-foreground">{t("events.allInscriptions")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("events.participationRate")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participationRate}%</div>
            <p className="text-xs text-muted-foreground">{t("events.averageEvents")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("events.messagesChat")}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ChatCounter />
            <p className="text-xs text-muted-foreground">{t('events.thisWeek')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("events.quickActions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/marketing/create">
                <Plus className="h-6 w-6 mb-2" />
                {t("events.createEvent")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/marketing/events">
                <Calendar className="h-6 w-6 mb-2" />
                {t("events.manageEvents")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col bg-transparent">
              <Link href="/marketing/analytics">
                <TrendingUp className="h-6 w-6 mb-2" />
                {t("events.viewStatistics")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
