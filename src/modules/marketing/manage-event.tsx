"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Plus, Trash2, Pencil, Users, ChevronDown } from "lucide-react"
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

export default function ManageEventPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [openEventId, setOpenEventId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<
    "ALL" | "PUBLISHED" | "PENDING" | "CANCELLED" | "REJECTED" | "DONE"
  >("ALL")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [count, setCount] = useState(0)

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

  const filteredEvents = events.filter((event) => {
    if (filter === "ALL") return true
    return event.status === filter
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("events.manageEvents")}</h1>
          <p className="text-muted-foreground">{t("events.filterAndManage")}</p>
        </div>

        <Button asChild>
          <Link href="/marketing/create">
            <Plus className="h-4 w-4 mr-2" />
            {t("navigation.createEvent")}
          </Link>
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: "ALL", label: t("events.all") },
          { key: "PUBLISHED", label: t("events.publie") },
          { key: "PENDING", label: t("events.pending") },
          { key: "CANCELLED", label: t("events.cancelled") },
          { key: "REJECTED", label: t("events.rejetes") },
          { key: "DONE", label: t("events.termines") },
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            onClick={() => setFilter(key as any)}
            size="sm"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Filtered Events with Action Buttons */}
      <div>
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("events.noneFound")}</h3>
              <p className="text-muted-foreground mb-4">{t("events.createFirst")}</p>
              <Button asChild>
                <Link href="/marketing/create">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("events.createEvent")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="space-y-2">
                <EventCard event={event} showActions={false} onClick={() => {
                
                  router.push(`/marketing/update/${event.id}`)
                
              }} />
                {/* Participants toggle + Chat */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <button
                    className="inline-flex items-center gap-1 hover:text-primary"
                    onClick={() => setOpenEventId(openEventId === event.id ? null : event.id)}
                  >
                    <Users className="w-4 h-4" />
                    {t("events.participants")}
                    <ChevronDown className={`w-4 h-4 transition-transform ${openEventId === event.id ? 'rotate-180' : ''}`} />
                  </button>

                  <Button variant="link" size="sm" asChild>
                    <Link href={`/chat/${event.id}`}>{t("events.openChat")}</Link>
                  </Button>
                </div>

                {openEventId === event.id && (
                  <ul className="pl-4 py-2 space-y-1">
                    {event.participants?.length === 0 && (
                      <li className="text-xs text-muted-foreground">{t("events.noParticipants", "Aucun participant")}</li>
                    )}
                    {event.participants?.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 text-sm">
                        <img
                          src={p.user?.avatarUrl || "/placeholder-user.jpg"}
                          alt={p.user?.nom || "Utilisateur"}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span>{p.user?.nom || "Utilisateur"}</span>
                      </li>
                    ))}
                  </ul>
                )}
               
                <div className="flex justify-between gap-2">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t("events.delete")}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/marketing/update/${event.id}`}>
                      <Pencil className="w-4 h-4 mr-2" />
                      {t("events.edit")}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  )
}
