"use client"

import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
} from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import type { Event } from "@/lib/types"
import { formatDate, formatTime, truncateText } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"

interface EventCardChatProps {
  event: Event
  currentUserId?: string | null
  showActions?: boolean
  onChatAccess?: () => void
  onClick?: () => void
}

export function EventCardChat({
  event,
  currentUserId,
  showActions = true,
  onChatAccess,
  onClick,
}: EventCardChatProps) {
  const { t } = useLanguage()
  const router = useRouter()

  const currentParticipants = Array.isArray(event.participants)
    ? event.participants.length
    : 0
  const tags = event.tags ?? []

  const handleCardClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.push(`/events/${event.id}`)
    }
  }

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onChatAccess) {
      onChatAccess()
    }
  }

  const getStatusBadge = () => {
    const eventStatus = event.status?.toUpperCase() ?? "DRAFT"
    switch (eventStatus) {
      case "PUBLISHED":
        return <Badge variant="secondary">{t("events.published")}</Badge>
      case "DONE":
        return <Badge variant="outline">{t("events.done")}</Badge>
      case "DRAFT":
        return <Badge variant="default">{t("events.draft")}</Badge>
      case "PENDING":
        return <Badge variant="secondary">{t("events.pending")}</Badge>

      case "CANCELLED":
        return <Badge variant="destructive">{t("events.cancelled")}</Badge>
      default:
        return null
    }
  }

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-l-4 border-l-primary cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {event.titre}
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              {truncateText(event.description, 100)}
            </p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {event.imageUrl && (
          <div className="relative h-32 rounded-md overflow-hidden">
            <img
              src={event.imageUrl}
              alt={event.titre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>{formatTime(event.heure)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="truncate">{event.lieu}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>
              {currentParticipants}/{event.capacite ?? 0}
            </span>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="pt-3 flex justify-center">
          <Button
            onClick={handleChatClick}
            variant="default"
            className="w-full"
          >
            {t("events.accessChat")}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
