"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiService } from "@/lib/api"
import type { Event, Participant, User } from "@/lib/types"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { Calendar, Clock, MapPin, Users, MessageCircle, ChevronLeft } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

export default function EventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchedEvent = await apiService.getEvent(eventId)
        setEvent(fetchedEvent)

        const fetchedParticipants = await apiService.getEventParticipants(eventId)
        setParticipants(fetchedParticipants)

        const user = await apiService.getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
        console.error("Erreur lors du chargement des détails :", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [eventId])

  if (isLoading || !event) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  function handleGoToChat() {
    router.push(`/chat/${eventId}`)
  }

  function handleBack() {
    router.back()
  }

  async function handleCancelRegistration(event?: React.MouseEvent) {
    event?.preventDefault()
    if (!currentUser) {
      toast.error("Utilisateur non connecté")
      return
    }
    try {
      await apiService.cancelParticipation(eventId, currentUser.id)
      toast.success("Inscription annulée avec succès")
      router.push("/employee/registrations")  // Redirige vers la page Mes Inscriptions
    } catch (error) {
      console.error("Erreur lors de l'annulation :", error)
      toast.error("Erreur lors de l'annulation de l'inscription")
    }
  }

  const isUserRegistered = participants.some(
    (p) => (p.user?.id ?? (p as any).userId) === currentUser?.id
  )

  return (
    <div className="bg-gradient-to-tr from-gray-50 via-white to-gray-100 min-h-screen p-4 max-w-3xl mx-auto">
      <button
        onClick={handleBack}
        aria-label="Retour"
        className="text-green-600 hover:text-green-800 transition cursor-pointer mb-4 p-0"
        style={{ background: "none", border: "none" }}
      >
        <ChevronLeft className="w-7 h-7" />
      </button>

      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6 text-center">
        {event.titre}
      </h1>

      {event.imageUrl && (
        <div className="rounded-2xl overflow-hidden shadow-md mb-6">
          <img
            src={event.imageUrl}
            alt={event.titre}
            className="w-full h-44 object-cover"
          />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6 bg-white rounded-xl shadow-lg p-6">
        <main className="flex-1 space-y-6">
          <section className="text-gray-700 text-sm leading-relaxed max-w-lg">
            {event.description}
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-800 text-sm max-w-lg">
            {[
              {
                icon: <Calendar className="w-5 h-5 text-blue-500" />,
                label: "Date",
                value: formatDate(event.date),
              },
              {
                icon: <Clock className="w-5 h-5 text-blue-500" />,
                label: "Heure",
                value: event.heure ? event.heure.replace(":", "h") : "Non spécifiée",
              },
              {
                icon: <MapPin className="w-5 h-5 text-red-500" />,
                label: "Lieu",
                value: event.lieu || "Non spécifié",
              },
              {
                icon: <Users className="w-5 h-5 text-green-500" />,
                label: "Capacité",
                value: `${event.capacite} participant${event.capacite > 1 ? "s" : ""}`,
              },
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-purple-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6" />
                  </svg>
                ),
                label: "Statut",
                value: event.status ?? "Non spécifié",
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                {icon}
                <div>
                  <h4 className="font-semibold text-gray-900">{label}</h4>
                  <p className="text-gray-700">{value}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col md:flex-row gap-4 mt-6 max-w-lg">
            {isUserRegistered && (
              <button
                onClick={handleGoToChat}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-md transition"
              >
                <MessageCircle className="w-5 h-5" />
                Accéder au salon de chat
              </button>
            )}

            {isUserRegistered && (
              <button
                type="button"
                onClick={handleCancelRegistration}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-semibold rounded-md shadow-md transition"
              >
                Annuler l'inscription
              </button>
            )}
          </section>
        </main>

        <aside className="w-full md:w-60 bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-md h-fit max-h-96 overflow-y-auto">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            Participants ({participants.length})
          </h2>

          {participants.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun participant inscrit.</p>
          ) : (
            <ul className="space-y-3">
              {participants.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-white hover:shadow transition cursor-pointer"
                >
                  {p.user?.avatarUrl ? (
                    <img
                      src={p.user.avatarUrl}
                      alt={p.user.nom}
                      className="w-8 h-8 rounded-full object-cover border border-gray-300 shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                      {p.user?.nom?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}
                  <span className="text-gray-700 text-sm font-medium">
                    {p.user?.nom ?? "Utilisateur inconnu"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
