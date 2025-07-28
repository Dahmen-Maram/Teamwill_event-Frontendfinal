import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Event } from "@/lib/types"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export function formatTime(time: string): string {
  if (!time) return ""; 
  const isCondidate = time.includes("T") ? time : `2023-10-01T${time}`;
  const dateObj = new Date(isCondidate);

  if(isNaN(dateObj.getTime())) {
    return time; // Return original time if parsing fails
  }
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

export function formatDateTime(date: string, time: string): string {
  const dateTime = new Date(`${date}T${time}`)
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateTime)
}

export function isEventUpcoming(date: string, time: string): boolean {
  const eventDateTime = new Date(`${date}T${time}`)
  return eventDateTime > new Date()
}

export function getEventStatus(event: Event): string {
  // Retourne directement le status si défini
  if (event.status) {
    return event.status.toLowerCase() // ex: "PUBLISHED" -> "published"
  }
  // Sinon fallback sur ta logique date-based
  const now = new Date()
  const eventDateTime = new Date(`${event.date}T${event.heure}`)

  if (now < eventDateTime) return "upcoming"
  if (now >= eventDateTime) return "done"
  return "draft" // ou autre statut par défaut
}




export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

export function generateEventSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}
// utils.ts (ajoute en bas du fichier)

export async function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<Blob> {
  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.addEventListener("load", () => resolve(img))
      img.addEventListener("error", (error) => reject(error))
      img.src = url
    })

  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext("2d")

  if (!ctx) throw new Error("Could not get canvas context")

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error("Canvas is empty")
      resolve(blob)
    }, "image/png")
  })
}

