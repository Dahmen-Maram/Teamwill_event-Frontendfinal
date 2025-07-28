"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Send, Paperclip, ChevronLeft } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { ChatBubble } from "@/shared/ui/chat-bubble"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { apiService } from "@/lib/api"
import type { ChatMessage, Event, User } from "@/lib/types"
import io, { type Socket } from "socket.io-client"
import { useLanguage } from "@/lib/i18n"
import { Header } from "@/components/layout/header"

export default function ChatPage() {
  const { t } = useLanguage()


  const params = useParams()
  const eventId = params.eventId as string
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  

  const convertBackendMessage = (backendMsg: any): ChatMessage => {
    const isImage = (url: string) => /\.(png|jpe?g|gif|webp)$/i.test(url)
    const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url)

    const base: ChatMessage = {
      id: backendMsg.id,
      eventId: backendMsg.event?.id || backendMsg.eventId,
      userId: backendMsg.sender?.id || backendMsg.userId,
      userName: backendMsg.sender?.nom || backendMsg.userName || "Utilisateur",
      userRole: backendMsg.sender?.role || backendMsg.userRole || "Employee",
      avatarUrl: backendMsg.sender?.avatarUrl || backendMsg.avatarUrl,
      message: backendMsg.content || backendMsg.message || "",
      timestamp: backendMsg.timestamp || backendMsg.createdAt || new Date().toISOString(),
      type: "text",
      seenBy: Array.isArray(backendMsg.seenBy)
        ? backendMsg.seenBy
        : (typeof backendMsg.seenBy === 'string' && backendMsg.seenBy.length)
          ? backendMsg.seenBy.split(',').filter((id: string) => id)
          : [],
    }

    if (backendMsg.mediaUrl) {
      base.fileUrl = backendMsg.mediaUrl
      base.type = isImage(backendMsg.mediaUrl)
        ? "image"
        : isVideo(backendMsg.mediaUrl)
          ? "video"
          : "file"
      base.fileName = backendMsg.fileName || backendMsg.mediaUrl.split("/").pop()
    }

    return base
  }

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const [eventData, userData] = await Promise.all([
          apiService.getEvent(eventId),
          apiService.getCurrentUser(),
        ])
        setEvent(eventData)
        setUser(userData)

        const socketConnection = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
          transports: ["websocket"],
        })

        setSocket(socketConnection)

        socketConnection.emit("joinEvent", { userId: userData.id, eventId })

        socketConnection.emit("getMessages", { eventId, userId: userData.id }, (res: any) => {
          setMessages(res.messages.map(convertBackendMessage))
        })

        socketConnection.on("newMessage", (msg: any) => {
          setMessages((prev) => [...prev, convertBackendMessage(msg)])
        })

        socketConnection.on("messageSent", (msg: any) => {
          const real = convertBackendMessage(msg)
          setMessages((prev) => {
            const filtered = prev.filter(
              (m) => !(m.id.startsWith("tmp-") && m.userId === real.userId && m.message === real.message)
            )
            return filtered.some((m) => m.id === real.id)
              ? filtered
              : [...filtered, real]
          })
        })

        socketConnection.on("messageSeen", ({ messageId, userId }) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId && !m.seenBy.includes(userId)
                ? { ...m, seenBy: [...m.seenBy, userId] }
                : m
            )
          )
        })

        socketConnection.on("messageRemovedForAll", ({ messageId }) => {
          setMessages((prev) => prev.filter((m) => m.id !== messageId))
        })

        socketConnection.on("messageRemovedForMe", ({ messageId }) => {
          setMessages((prev) => prev.filter((m) => m.id !== messageId))
        })

        return () => {
          socketConnection.disconnect()
        }
      } catch (e) {
        console.error("Error initializing chat:", e)
      } finally {
        setIsLoading(false)
      }
    }

    initializeChat()
  }, [eventId])

  useEffect(() => {
    if (!user) return
    messages.forEach((m) => {
      if (!m.seenBy.includes(user.id) && socket?.connected) {
        socket.emit("markAsSeen", { messageId: m.id, userId: user.id })
      }
    })
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file))
    } else {
      setFilePreview(null)
    }
    setPendingFile(file)
  }

  const sendMessage = async () => {
    if (!socket?.connected || (!newMessage.trim() && !pendingFile)) return
    let mediaUrl

    if (pendingFile) {
      try {
        setIsUploading(true)
        const { url } = await apiService.uploadFile(pendingFile)
        mediaUrl = url
      } finally {
        setIsUploading(false)
        setPendingFile(null)
        setFilePreview(null)
      }
    }

    socket.emit("sendMessage", {
      userId: user?.id,
      eventId,
      content: mediaUrl ? pendingFile?.name : newMessage.trim(),
      mediaUrl,
    })

    if (!mediaUrl) setNewMessage("")
  }

  const handleDelete = (id: string, scope: "me" | "all") => {
    if (!socket || !user) return
    socket.emit(scope === "me" ? "deleteForMe" : "deleteForAll", { messageId: id, userId: user.id })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleLogout = () => {
    if (socket) socket.disconnect()
    apiService.logout()
    router.replace("/auth/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">{t("event.notFound")}</h2>
            <p className="text-muted-foreground">{t("event.notFoundDescription")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Header user={user} onLogout={handleLogout} /> {/* ✅ Ajout du header */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Chat Header */}
          <button
            onClick={() => router.back()}
            aria-label="Retour"
            className="text-green-600 hover:text-green-800 transition cursor-pointer mb-4"
            style={{ background: "none", border: "none" }}
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{event.titre}</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("chat.chatEvent")} • {messages.length} {t("chat.messages")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-muted-foreground">{t("chat.online")}</span>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Messages */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p>{t("chat.noMessages")}</p>
                    <p className="text-sm">{t("chat.firstMessage")}</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <ChatBubble
                      key={m.id}
                      message={m}
                      
                      isCurrentUser={m.userId === user.id}
                      onDelete={(scope) => handleDelete(m.id, scope)}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Input */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t("chat.typeMessage")}
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleSelectFile}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                  />

                  {filePreview && <img src={filePreview} className="w-20 h-20 object-cover rounded" />}

                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>

                <Button onClick={sendMessage} disabled={!newMessage.trim() && !pendingFile}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                {t("chat.enterToSend")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
