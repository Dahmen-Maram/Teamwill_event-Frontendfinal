"use client"

import { useEffect, useState } from "react"
import { Calendar, Search } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Card, CardContent } from "@/shared/ui/card"
import { EventCard } from "@/shared/ui/event-card"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { apiService } from "@/lib/api"
import type { Event, User, Participant } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"
import { toast } from "sonner" // adapte si tu utilises autre chose
import { EventDetailsModal } from "@/shared/ui/EventDetailsModal"
import { useRouter } from "next/navigation"

export default function MyRegistrationsPage() {
  const { t } = useLanguage()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Charge les événements où l'utilisateur est inscrit
  const fetchRegisteredEvents = async () => {
    try {
      const user = await apiService.getCurrentUser()
      setCurrentUser(user)

      const allEvents = await apiService.getEvents()

      const registeredEvents = await Promise.all(
        allEvents.map(async (event) => {
          const participants = await apiService.getEventParticipants(event.id)
          const isRegistered = participants.some((p: Participant) => {
            const participantUserId = (p as any).userId ?? p.user?.id
            return participantUserId === user.id
          })
          return isRegistered
            ? {
                ...event,
                participants,
                isRegistered,
              }
            : null
        })
      )

      // Filtre les résultats non nuls
      const filtered = registeredEvents.filter(Boolean) as Event[]
      setEvents(filtered)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("navigation.myRegistrations")}</h1>
          <p className="text-muted-foreground">{t("events.registeredEventsList")}</p>
        </div>

        {/* Recherche */}
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

      {/* Liste des événements */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("events.noneFound")}</h3>
            <p className="text-muted-foreground">
              {searchTerm ? t("events.tryAnotherSearch") : t("events.noneRegistered")}
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
              onRegister={async () => {}}
              onCancel={async () => {
                await handleCancelRegistration(event.id)
              }}
              onClick={() => handleEventClick(event)}  // <-- gestion clic
            />
          ))}
        </div>
      )}

      <EventDetailsModal
        event={selectedEvent}
        isOpen={modalOpen}
        onClose={closeModal}
      />
    </div>
  )
}
