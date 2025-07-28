"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, MapPin, Search } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { EventCard } from "@/shared/ui/event-card"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { apiService } from "@/lib/api"
import type { Event, User, Participant } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"

function isEventUpcoming(date: string, heure: string): boolean {
  const eventDateTime = new Date(`${date}T${heure}`)
  return eventDateTime > new Date()
}

export default function EmployeeDashboard() {
  const { t } = useLanguage()
  const router = useRouter()

  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<
    "ALL" | "PUBLISHED" | "PENDING" | "CANCELLED" | "REJECTED" | "DONE"
  >("PUBLISHED")
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
      const fetchEvents = async () => {
        try {
          const user = await apiService.getCurrentUser()
          setCurrentUser(user)

          const events = await apiService.getEvents()

          const enriched = await Promise.all(
            events.map(async (event) => {
              try {
                const participants = await apiService.getEventParticipants(event.id)
                const isRegistered = participants.some((p: Participant) => {
                  const participantUserId = (p as any).userId ?? p.user?.id
                  return participantUserId === user.id
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
      filtered = filtered.filter((event) => event.status === filter)
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm, filter])

  const handleRegister = async (eventId: string) => {
    if (!currentUser) return

    try {
      await apiService.participateInEvent(eventId, currentUser.id)
      const updatedParticipants = await apiService.getEventParticipants(eventId)

      const isRegistered = updatedParticipants.some((p: Participant) => {
        const participantUserId = (p as any).userId ?? p.user?.id
        return participantUserId === currentUser.id
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
    const eventDate = new Date(event.date)
    eventDate.setHours(0, 0, 0, 0)

    return (
      eventDate >= today &&
      eventDate <= endOfWeek &&
      event.status === "PUBLISHED"
    )
  })

  const registeredEvents = useMemo(() => {
    if (!currentUser) return []
    return events.filter((event) =>
      event.participants?.some((p) => {
        const participantUserId = (p as any).userId ?? p.user?.id
        return participantUserId === currentUser.id
      })
    )
  }, [events, currentUser])

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
          <h1 className="text-3xl font-bold">{t("events.title")}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>{upcomingEvents.length}</span>
            <p className="text-muted-foreground" style={{ margin: 0 }}>
              {t("events.EventsDescription")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("events.searchEvents")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("events.upcoming")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">{t("events.eventdispo")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("navigation.myRegistrations")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registeredEvents.length}</div>
            <p className="text-xs text-muted-foreground">{t("events.eventinscri")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("events.thisWeek")}</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingWeekEvents.length}</div>
            <p className="text-xs text-muted-foreground">{t("events.nextevents")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "ALL" ? "default" : "outline"}
          onClick={() => setFilter("ALL")}
          size="sm"
        >
          {t("events.all")}
        </Button>
        <Button
          variant={filter === "PUBLISHED" ? "default" : "outline"}
          onClick={() => setFilter("PUBLISHED")}
          size="sm"
        >
          {t("events.publie")}
        </Button>
        <Button
          variant={filter === "CANCELLED" ? "default" : "outline"}
          onClick={() => setFilter("CANCELLED")}
          size="sm"
        >
          {t("events.cancelled")}
        </Button>
        <Button
          variant={filter === "REJECTED" ? "default" : "outline"}
          onClick={() => setFilter("REJECTED")}
          size="sm"
        >
          {t("events.rejetes")}
        </Button>
        <Button
          variant={filter === "DONE" ? "default" : "outline"}
          onClick={() => setFilter("DONE")}
          size="sm"
        >
          {t("events.termines")}
        </Button>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("events.noneFound")}</h3>
            <p className="text-muted-foreground">
              {searchTerm ? t("events.tryAnotherSearch") : t("events.noneForStatus")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={currentUser?.id ?? null}
              onRegister={() => handleRegister(event.id)}
              onClick={() => {
                if (event.isRegistered) {
                  router.push(`/employee/events/${event.id}`)
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
