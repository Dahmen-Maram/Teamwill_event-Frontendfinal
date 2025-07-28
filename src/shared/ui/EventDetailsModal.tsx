"use client"

import React, { useEffect, useState } from "react"
import { Event, Participant } from "@/lib/types"
import { apiService } from "@/lib/api"

import { formatDate, formatTime } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import { Modal } from "@/modules/employee/components/Modal"

interface EventDetailsModalProps {
  event: Event | null
  isOpen: boolean
  onClose: () => void
}

export function EventDetailsModal({ event, isOpen, onClose }: EventDetailsModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    if (isOpen && event) {
      setLoading(true)
      apiService.getEventParticipants(event.id)
        .then(setParticipants)
        .catch(() => setParticipants([]))
        .finally(() => setLoading(false))
    } else {
      setParticipants([])
    }
  }, [isOpen, event])

  if (!event) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">{event.titre}</h2>
      <p className="mb-2">{event.description}</p>
      <p><strong>{t("events.date")}:</strong> {formatDate(event.date)}</p>
      <p><strong>{t("events.time")}:</strong> {formatTime(event.heure)}</p>
      <p><strong>{t("events.location")}:</strong> {event.lieu}</p>

      <h3 className="mt-6 font-semibold">{t("events.participants")}</h3>

      {loading ? (
        <p>{t("loading")}</p>
      ) : participants.length === 0 ? (
        <p>{t("events.noParticipants")}</p>
      ) : (
        <ul className="max-h-48 overflow-auto">
          {participants.map((p) => {
            const user = (p as any).user // adapter selon ta structure
            return (
              <li key={p.id} className="border-b py-1">
                <p><strong>{user?.name || user?.nom || "–"}</strong></p>
                <p>{user?.email || "–"}</p>
                <p>{user?.phone || "–"}</p>
              </li>
            )
          })}
        </ul>
      )}

      <button
        className="mt-4 px-4 py-2 bg-primary text-white rounded"
        onClick={onClose}
      >
        {t("close")}
      </button>
    </Modal>
  )
}
