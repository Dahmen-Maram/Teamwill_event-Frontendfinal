"use client"

import React, { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Send, Paperclip, ChevronLeft, UserPlus, RefreshCw, Image, Video, FileText, Grid3X3, Play, ZoomIn, X, Search, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar"
import { ChatBubble } from "@/shared/ui/chat-bubble"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { apiService } from "@/lib/api"
import type { ChatMessage, Event, User, Participant, CreateParticipantDto } from "@/lib/types"
import io, { type Socket } from "socket.io-client"
import { useLanguage } from "@/lib/i18n"
import { Header } from "@/components/layout/header"
import { toast } from "sonner"

export default function ChatPage() {
  const { t } = useLanguage()
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string

  // States
  const [event, setEvent] = useState<Event | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [nonParticipants, setNonParticipants] = useState<User[]>([])
  const [isLoadingNonParticipants, setIsLoadingNonParticipants] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([])
  const [showMentionList, setShowMentionList] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("chat")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [searchMessage, setSearchMessage] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch non-participants
  const fetchNonParticipants = async () => {
    if (!eventId || !user || user.role !== "Responsable") return
    
    setIsLoadingNonParticipants(true)
    try {
      const [allUsers, participants] = await Promise.all([
        apiService.getUsers(),
        apiService.getEventParticipants(eventId)
      ])

      const nonParticipantUsers = allUsers.filter(
        (u) =>
          !participants.some((p) => p.user.id === u.id) &&
          u.id !== user.id &&
          (u.role === "Employee" || u.role === "Responsable")
      )
      
      setNonParticipants(nonParticipantUsers)
    } catch (error) {
      console.error("Failed to fetch non-participants:", error)
      toast.error(t("chat.errorFetchingNonParticipants"))
      setNonParticipants([])
    } finally {
      setIsLoadingNonParticipants(false)
    }
  }

  // Add participant
  const handleAddParticipant = async (userId: string) => {
    if (!eventId || !user || user.role !== "Responsable") return
    
    try {
      const data: CreateParticipantDto = {
        userId,
        eventId
      }
      
      const newParticipant = await apiService.addParticipant(data)
      toast.success(t("chat.participantAdded"))
      fetchNonParticipants()
      
      if (event) {
        const updatedEvent = { ...event }
        if (!updatedEvent.participants) updatedEvent.participants = []
        updatedEvent.participants.push(newParticipant)
        setEvent(updatedEvent)
      }
    } catch (error) {
      console.error("Failed to add participant:", error)
      toast.error(t("chat.errorAddingParticipant"))
    }
  }

  // Extract media from messages
  const extractMediaFromMessages = () => {
    const mediaItems = messages
      .filter(msg => msg.fileUrl && (msg.fileUrl.includes('.jpg') || msg.fileUrl.includes('.jpeg') || msg.fileUrl.includes('.png') || msg.fileUrl.includes('.gif') || msg.fileUrl.includes('.mp4') || msg.fileUrl.includes('.mov') || msg.fileUrl.includes('.avi')))
      .map(msg => ({
        id: msg.id,
        url: msg.fileUrl!,
        type: msg.fileUrl!.includes('.mp4') || msg.fileUrl!.includes('.mov') || msg.fileUrl!.includes('.avi') ? 'video' : 'image',
        fileName: msg.fileName || 'Fichier',
        timestamp: msg.timestamp,
        userName: msg.userName
      }))
      .reverse() // Most recent first
    return mediaItems
  }

  const mediaItems = extractMediaFromMessages()
  const images = mediaItems.filter(item => item.type === 'image')
  const videos = mediaItems.filter(item => item.type === 'video')

  // Search functions
  const handleSearchMessages = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setCurrentSearchIndex(-1)
      return
    }

    const results = messages.filter(msg => 
      msg.message.toLowerCase().includes(query.toLowerCase()) ||
      msg.userName.toLowerCase().includes(query.toLowerCase())
    )
    
    setSearchResults(results)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        // Previous result
        setCurrentSearchIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
      } else {
        // Next result
        setCurrentSearchIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
      }
    } else if (e.key === 'Escape') {
      setShowSearch(false)
      setSearchMessage("")
      setSearchResults([])
      setCurrentSearchIndex(-1)
    }
  }

  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`)
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
      // Highlight the message temporarily
      messageElement.classList.add('bg-yellow-100', 'dark:bg-yellow-900/20')
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/20')
      }, 2000)
    }
  }

  // Message conversion
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

  // Initialize chat
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

        // Join rooms
        socketConnection.emit("joinEvent", { userId: userData.id, eventId })
        socketConnection.emit("joinUserRoom", { userId: userData.id })

        // Get messages
        socketConnection.emit("getMessages", { eventId, userId: userData.id }, (res: any) => {
          setMessages(res.messages.map(convertBackendMessage))
        })

        // New message listener
        socketConnection.on("newMessage", (msg: any) => {
          setMessages((prev) => [...prev, convertBackendMessage(msg)])
        })

        // Message sent confirmation
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

        // Notification listener
        socketConnection.on("newNotification", (notif: any) => {
          setNotifications((prev) => [...prev, notif])
          toast.info(notif.message)
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

  // Load non-participants when user is loaded
  useEffect(() => {
    if (user && user.role === "Responsable") {
      fetchNonParticipants()
    }
  }, [user, eventId])

  // Mark messages as read
  useEffect(() => {
    if (!user) return
    messages.forEach((m) => {
      if (!m.seenBy.includes(user.id) && socket?.connected) {
        socket.emit("markAsSeen", { messageId: m.id, userId: user.id })
      }
    })
  }, [messages])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Search effect
  useEffect(() => {
    handleSearchMessages(searchMessage)
  }, [searchMessage, messages])

  // Scroll to search result
  useEffect(() => {
    if (currentSearchIndex >= 0 && searchResults[currentSearchIndex]) {
      scrollToMessage(searchResults[currentSearchIndex].id)
    }
  }, [currentSearchIndex, searchResults])

  // Handle mentions
  useEffect(() => {
    if (!mentionQuery || !event?.participants) {
      setMentionSuggestions([])
      setShowMentionList(false)
      return
    }

    const filtered = event.participants
      .filter(p => typeof p.user?.nom === "string" &&
        p.user.nom.toLowerCase().startsWith(mentionQuery.toLowerCase()))
      .map(p => p.user)

    setMentionSuggestions(filtered)
    setShowMentionList(filtered.length > 0)
  }, [mentionQuery, event?.participants])

  // Handle file selection
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

  // Send message
  const sendMessage = async () => {
    if (!socket?.connected || (!newMessage.trim() && !pendingFile)) return

    // Create temp message for UI
    const tempId = `tmp-${Date.now()}`
    const tempMessage: ChatMessage = {
      id: tempId,
      eventId,
      userId: user!.id,
      userName: user!.nom,
      userRole: (user!.role === "Admin" ? "Responsable" : user!.role) as "Employee" | "Responsable",
      avatarUrl: user!.avatarUrl,
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: pendingFile ? "file" : "text",
      seenBy: [user!.id],
      ...(pendingFile && { fileName: pendingFile.name })
    }

    // Add temp message
    setMessages((prev) => [...prev, tempMessage])
    setNewMessage("")

    try {
      let mediaUrl
      if (pendingFile) {
        setIsUploading(true)
        const { url } = await apiService.uploadFile(pendingFile)
        mediaUrl = url
        setPendingFile(null)
        setFilePreview(null)
      }

      // Send via socket
      socket.emit("sendMessage", {
        eventId,
        userId: user!.id,
        content: newMessage,
        mediaUrl,
        fileName: pendingFile?.name
      })

    } catch (error) {
      console.error("Error sending message:", error)
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      toast.error("Failed to send message")
    } finally {
      setIsUploading(false)
    }
  }


// Dans convertBackendMessage

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Logout
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
      <Header user={user} onLogout={handleLogout} />
      <div className="container mx-auto px-4 py-8">
        {/* Employee View (no sidebar) */}
        {user.role === "Employee" && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => router.back()}
              aria-label="Retour"
              className="text-primary hover:text-primary/80 transition cursor-pointer mb-4"
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
                    
                    {/* Search button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSearch(!showSearch)}
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Rechercher dans les messages"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Search Panel */}
            {showSearch && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm">Rechercher dans les messages</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowSearch(false)
                        setSearchMessage("")
                        setSearchResults([])
                        setCurrentSearchIndex(-1)
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tapez votre recherche..."
                      value={searchMessage}
                      onChange={(e) => setSearchMessage(e.target.value)}
                      onKeyDown={handleSearchKeyPress}
                      className="pl-10 pr-20"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
                        <span>{currentSearchIndex + 1}/{searchResults.length}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentSearchIndex(prev => 
                              prev > 0 ? prev - 1 : searchResults.length - 1
                            )}
                            className="h-6 w-6 p-0"
                            title="Précédent (Shift+Enter)"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentSearchIndex(prev => 
                              prev < searchResults.length - 1 ? prev + 1 : 0
                            )}
                            className="h-6 w-6 p-0"
                            title="Suivant (Enter)"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {searchMessage && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {searchResults.length > 0 ? (
                        <span>{searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}</span>
                      ) : (
                        <span>Aucun résultat trouvé</span>
                      )}
                      <span className="ml-4">Utilisez Entrée pour naviguer, Échap pour fermer</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="mb-6">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="chat" className="flex items-center gap-2">
                      <span>Chat</span>
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        {messages.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="media" className="flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4" />
                      <span>Médias</span>
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        {mediaItems.length}
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chat" className="mt-0">
                    <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">
                          <p>{t("chat.noMessages")}</p>
                          <p className="text-sm">{t("chat.firstMessage")}</p>
                        </div>
                      ) : (
                        messages.map((m) => {
                          const isSearchResult = searchResults.some(result => result.id === m.id)
                          const isCurrentSearchResult = searchResults[currentSearchIndex]?.id === m.id
                          
                          return (
                            <div
                              key={m.id}
                              id={`message-${m.id}`}
                              className={`transition-colors duration-200 ${
                                isCurrentSearchResult 
                                  ? 'bg-yellow-100 dark:bg-yellow-900/20 ring-2 ring-yellow-400' 
                                  : isSearchResult 
                                    ? 'bg-yellow-50 dark:bg-yellow-900/10' 
                                    : ''
                              }`}
                            >
                              <ChatBubble
                                message={m}
                                isCurrentUser={m.userId === user.id}
                                onDelete={() => {}}
                              />
                            </div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="mt-0">
                    <div className="h-[500px] overflow-y-auto p-6">
                      {mediaItems.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">
                          <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p>Aucun média partagé</p>
                          <p className="text-sm">Les photos et vidéos partagées apparaîtront ici</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Images */}
                          {images.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Image className="h-5 w-5" />
                                Photos ({images.length})
                              </h3>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {images.map((item) => (
                                  <div key={item.id} className="group relative">
                                    <div 
                                      className="aspect-square rounded-lg overflow-hidden bg-gray-100 border cursor-pointer"
                                      onClick={() => setSelectedImage(item.url)}
                                    >
                                      <img
                                        src={item.url}
                                        alt={item.fileName}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                        <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                      </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                                      <p className="text-white text-xs truncate">{item.fileName}</p>
                                      <p className="text-white/80 text-xs">{item.userName}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Videos */}
                          {videos.length > 0 && (
                            <div>
                              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Video className="h-5 w-5" />
                                Vidéos ({videos.length})
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {videos.map((item) => (
                                  <div key={item.id} className="group relative">
                                    <div 
                                      className="aspect-video rounded-lg overflow-hidden bg-gray-100 border cursor-pointer"
                                      onClick={() => setSelectedVideo(item.url)}
                                    >
                                      <video
                                        src={item.url}
                                        className="w-full h-full object-cover"
                                        controls
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                        <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                      </div>
                                    </div>
                                    <div className="mt-2">
                                      <p className="text-sm font-medium truncate">{item.fileName}</p>
                                      <p className="text-xs text-muted-foreground">{item.userName}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 flex items-center gap-2 relative">
                    <div className="relative w-full">
                      <Input
                        value={newMessage}
                        onChange={(e) => {
                          const value = e.target.value
                          setNewMessage(value)

                          const match = value.match(/@(\w*)$/)
                          if (match) {
                            setMentionQuery(match[1])
                          } else {
                            setMentionQuery("")
                            setShowMentionList(false)
                          }
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder={t("chat.typeMessage")}
                      />

                      {showMentionList && mentionSuggestions.length > 0 && (
                        <div className="absolute z-50 bg-white shadow-md rounded mt-1 w-full border max-h-48 overflow-auto">
                          {mentionSuggestions.map((user) => (
                            <div
                              key={user.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                              onClick={() => {
                                const withoutQuery = newMessage.replace(/@(\w*)$/, "")
                                setNewMessage(`${withoutQuery}@${user.nom} `)
                                setMentionQuery("")
                                setShowMentionList(false)
                              }}
                            >
                              {user.nom}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleSelectFile}
                      className="hidden"
                      accept="image/*,video/*,.pdf,.doc,.docx"
                    />

                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button 
                    onClick={sendMessage} 
                    disabled={(!newMessage.trim() && !pendingFile) || isUploading}
                  >
                    {isUploading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  {t("chat.enterToSend")}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Responsable View (with sidebar) */}
        {user.role === "Responsable" && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Chat Area - Centered */}
            <div className="flex-1 lg:max-w-2xl xl:max-w-3xl mx-auto">
              <button
                onClick={() => router.back()}
                aria-label="Retour"
                className="text-primary hover:text-primary/80 transition cursor-pointer mb-4"
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

              <Card className="mb-6">
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="chat" className="flex items-center gap-2">
                        <span>Chat</span>
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          {messages.length}
                        </span>
                      </TabsTrigger>
                      <TabsTrigger value="media" className="flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4" />
                        <span>Médias</span>
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          {mediaItems.length}
                        </span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="mt-0">
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
                              onDelete={() => {}}
                            />
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </TabsContent>

                    <TabsContent value="media" className="mt-0">
                      <div className="h-[500px] overflow-y-auto p-6">
                        {mediaItems.length === 0 ? (
                          <div className="text-center text-muted-foreground py-12">
                            <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p>Aucun média partagé</p>
                            <p className="text-sm">Les photos et vidéos partagées apparaîtront ici</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Images */}
                            {images.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                  <Image className="h-5 w-5" />
                                  Photos ({images.length})
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                  {images.map((item) => (
                                    <div key={item.id} className="group relative">
                                      <div 
                                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 border cursor-pointer"
                                        onClick={() => setSelectedImage(item.url)}
                                      >
                                        <img
                                          src={item.url}
                                          alt={item.fileName}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                        </div>
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                                        <p className="text-white text-xs truncate">{item.fileName}</p>
                                        <p className="text-white/80 text-xs">{item.userName}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Videos */}
                            {videos.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                  <Video className="h-5 w-5" />
                                  Vidéos ({videos.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {videos.map((item) => (
                                    <div key={item.id} className="group relative">
                                      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border">
                                        <video
                                          src={item.url}
                                          className="w-full h-full object-cover"
                                          controls
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Play className="h-8 w-8 text-white" />
                                        </div>
                                      </div>
                                      <div className="mt-2">
                                        <p className="text-sm font-medium truncate">{item.fileName}</p>
                                        <p className="text-xs text-muted-foreground">{item.userName}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 flex items-center gap-2 relative">
                      <div className="relative w-full">
                        <Input
                          value={newMessage}
                          onChange={(e) => {
                            const value = e.target.value
                            setNewMessage(value)

                            const match = value.match(/@(\w*)$/)
                            if (match) {
                              setMentionQuery(match[1])
                            } else {
                              setMentionQuery("")
                              setShowMentionList(false)
                            }
                          }}
                          onKeyPress={handleKeyPress}
                          placeholder={t("chat.typeMessage")}
                        />

                        {showMentionList && mentionSuggestions.length > 0 && (
                          <div className="absolute z-50 bg-white dark:bg-gray-800 shadow-md rounded mt-1 w-full border dark:border-gray-700 max-h-48 overflow-auto">
                            {mentionSuggestions.map((user) => (
                              <div
                                key={user.id}
                                className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-black"
                                style={{ color: '#000000 !important' }}
                                onClick={() => {
                                  const withoutQuery = newMessage.replace(/@(\w*)$/, "")
                                  setNewMessage(`${withoutQuery}@${user.nom} `)
                                  setMentionQuery("")
                                  setShowMentionList(false)
                                }}
                              >
                                {user.nom}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleSelectFile}
                        className="hidden"
                        accept="image/*,video/*,.pdf,.doc,.docx"
                      />

                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button 
                      onClick={sendMessage} 
                      disabled={(!newMessage.trim() && !pendingFile) || isUploading}
                    >
                      {isUploading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    {t("chat.enterToSend")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Compact Sidebar */}
       {/* Dans la partie Responsable View - Sidebar */}
<div className="w-full lg:w-64 mt-6 lg:mt-0 lg:ml-4">
  <Card className="sticky top-4">
    <CardHeader className="p-4">
      <CardTitle className="text-lg flex justify-between items-center">
        <span>Inviter</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchNonParticipants}
          disabled={isLoadingNonParticipants}
          className="h-8 w-8 p-0"
        >
          {isLoadingNonParticipants ? (
            <LoadingSpinner size="sm" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardTitle>
    </CardHeader>
    <CardContent className="p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
      {isLoadingNonParticipants ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      ) : nonParticipants.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-4">
          {t("chat.allEmployeesParticipate")}
        </p>
      ) : (
        <div className="space-y-2">
          {nonParticipants.map((user) => (
            <div 
              key={user.id} 
              className="flex items-center justify-between gap-2 p-2 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={`Avatar de ${user.nom || 'Utilisateur'}`}
                  className="h-8 w-8 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = "/placeholder-user.jpg";
                  }}
                />
              ) : (
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 text-sm">
                  {user?.nom?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
                <span className="text-sm font-medium truncate">
                  {user.nom || user.nom || 'Utilisateur'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddParticipant(user.id)}
                className="h-8 w-8 p-0"
                title="Ajouter"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
</div>
          </div>
        )}
      </div>

      {/* Media Modal */}
      <Dialog open={!!selectedImage || !!selectedVideo} onOpenChange={() => {
        setSelectedImage(null)
        setSelectedVideo(null)
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-transparent border-0">
          <DialogTitle className="sr-only">Média en plein écran</DialogTitle>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 z-10 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => {
                setSelectedImage(null)
                setSelectedVideo(null)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedImage && (
              <img
                src={selectedImage as string}
                alt="Image en plein écran"
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              />
            )}
            {selectedVideo && (
              <video
                src={selectedVideo as string}
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                controls
                autoPlay
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}