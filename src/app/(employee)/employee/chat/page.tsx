"use client"

import { useEffect, useState, useRef } from "react"
import { Calendar, Search, MessageCircle, Users, MapPin, Clock, Hash, Send, Paperclip, UserPlus, RefreshCw, ChevronLeft, Menu, X, Image, Video, Grid3X3, Play, ZoomIn, ArrowUp, ArrowDown } from "lucide-react"
import { Input } from "@/shared/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { LoadingSpinner } from "@/shared/ui/loading-spinner"
import { Button } from "@/shared/ui/button"
import { ChatBubble } from "@/shared/ui/chat-bubble"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import { apiService } from "@/lib/api"
import type { Event, User, Participant, ChatMessage, CreateParticipantDto } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"
import { toast } from "sonner"
import io, { type Socket } from "socket.io-client"

export default function IntegratedChatsPage() {
  const { t } = useLanguage()
  
  // UI States for mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showInvitePanel, setShowInvitePanel] = useState(false)
  
  // Chat list states
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  
  // Chat states
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
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
  const sidebarRef = useRef<HTMLDivElement>(null)

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

  // Message conversion function
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

  // Fetch non-participants
  const fetchNonParticipants = async () => {
    if (!selectedEventId || !currentUser || currentUser.role !== "Responsable") return
    
    setIsLoadingNonParticipants(true)
    try {
      const [allUsers, participants] = await Promise.all([
        apiService.getUsers(),
        apiService.getEventParticipants(selectedEventId)
      ])

      const nonParticipantUsers = allUsers.filter(
        (u) =>
          !participants.some((p) => p.user.id === u.id) &&
          u.id !== currentUser.id &&
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
    if (!selectedEventId || !currentUser || currentUser.role !== "Responsable") return
    
    try {
      const data: CreateParticipantDto = {
        userId,
        eventId: selectedEventId
      }
      
      const newParticipant = await apiService.addParticipant(data)
      toast.success(t("chat.participantAdded"))
      fetchNonParticipants()
      
      if (selectedEvent) {
        const updatedEvent = { ...selectedEvent }
        if (!updatedEvent.participants) updatedEvent.participants = []
        updatedEvent.participants.push(newParticipant)
        setSelectedEvent(updatedEvent)
      }
    } catch (error) {
      console.error("Failed to add participant:", error)
      toast.error(t("chat.errorAddingParticipant"))
    }
  }

  // Initialize chat for selected event
  const initializeChat = async (eventId: string) => {
    if (!currentUser) return

    try {
      const eventData = await apiService.getEvent(eventId)
      setSelectedEvent(eventData)

      // Disconnect previous socket if exists
      if (socket) {
        socket.disconnect()
      }

      const socketConnection = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
        transports: ["websocket"],
      })

      setSocket(socketConnection)

      // Join rooms
      socketConnection.emit("joinEvent", { userId: currentUser.id, eventId })
      socketConnection.emit("joinUserRoom", { userId: currentUser.id })

      // Get messages
      socketConnection.emit("getMessages", { eventId, userId: currentUser.id }, (res: any) => {
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

    } catch (e) {
      console.error("Error initializing chat:", e)
      toast.error("Error loading chat")
    }
  }

  // Load registered events
  const fetchRegisteredEvents = async () => {
    try {
      const user = await apiService.getCurrentUser()
      setCurrentUser(user)
  
      const events = await apiService.getEvents()
      const myParticipants = await apiService.getParticipantsByUser(user.id)
      const myEventIds = new Set(myParticipants.map((p) => p.event.id))
  
      // Récupérer tous les participants pour chaque événement
      const eventsWithParticipants = await Promise.all(
        events
          .filter((e) => myEventIds.has(e.id))
          .map(async (e) => {
            try {
              const allParticipants = await apiService.getEventParticipants(e.id)
              return {
                ...e,
                participants: allParticipants,
                isRegistered: true,
              }
            } catch (error) {
              console.error(`Error fetching participants for event ${e.id}:`, error)
              return {
                ...e,
                participants: myParticipants.filter((p) => p.event.id === e.id),
                isRegistered: true,
              }
            }
          })
      )
  
      setEvents(eventsWithParticipants)
    } catch (err) {
      console.error(err)
      toast.error(t("events.errorLoading"))
    } finally {
      setIsLoading(false)
    }
  }

  // Handle event selection
  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId)
    setMessages([]) // Clear previous messages
    initializeChat(eventId)
    // Close sidebar on mobile after selection
    setIsSidebarOpen(false)
  }

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
    if (!socket?.connected || (!newMessage.trim() && !pendingFile) || !currentUser || !selectedEventId) return

    const tempId = `tmp-${Date.now()}`
    const tempMessage: ChatMessage = {
      id: tempId,
      eventId: selectedEventId,
      userId: currentUser.id,
      userName: currentUser.nom,
      userRole: (currentUser.role === "Admin" ? "Responsable" : currentUser.role) as "Employee" | "Responsable",
      avatarUrl: currentUser.avatarUrl,
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: pendingFile ? "file" : "text",
      seenBy: [currentUser.id],
      ...(pendingFile && { fileName: pendingFile.name })
    }

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

      socket.emit("sendMessage", {
        eventId: selectedEventId,
        userId: currentUser.id,
        content: newMessage,
        mediaUrl,
        fileName: pendingFile?.name
      })

    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      toast.error("Failed to send message")
    } finally {
      setIsUploading(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Handle outside click for mobile sidebar
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isSidebarOpen])

  // Effects
  useEffect(() => {
    fetchRegisteredEvents()
    
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    if (currentUser && currentUser.role === "Responsable" && selectedEventId) {
      fetchNonParticipants()
    }
  }, [currentUser, selectedEventId])

  useEffect(() => {
    if (!currentUser) return
    messages.forEach((m) => {
      if (!m.seenBy.includes(currentUser.id) && socket?.connected) {
        socket.emit("markAsSeen", { messageId: m.id, userId: currentUser.id })
      }
    })
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!mentionQuery || !selectedEvent?.participants) {
      setMentionSuggestions([])
      setShowMentionList(false)
      return
    }

    const filtered = selectedEvent.participants
      .filter(p => typeof p.user?.nom === "string" &&
        p.user.nom.toLowerCase().startsWith(mentionQuery.toLowerCase()))
      .map(p => p.user)

    setMentionSuggestions(filtered)
    setShowMentionList(filtered.length > 0)
  }, [mentionQuery, selectedEvent?.participants])

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

  // Filtering
  const filteredEvents = events.filter((event) =>
    event.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.lieu.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventInitials = (title: string) => {
    return title.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()
  }

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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex bg-background relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
      )}

      {/* Sidebar - Liste des chats */}
      <div
        ref={sidebarRef}
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-80 sm:w-96 lg:w-80
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          border-r border-border flex flex-col bg-card
        `}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">{t("navigation.myChats")}</h1>
            </div>
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-8 w-8 p-0"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("events.searchEvents")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">{t("events.noneFound")}</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? t("events.tryAnotherSearch") : t("events.noneRegistered")}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted/70 ${
                    selectedEventId === event.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleEventSelect(event.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Event Avatar */}
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12 bg-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                          {getEventInitials(event.titre)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 border-2 border-background rounded-full"></div>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-sm truncate pr-2">{event.titre}</h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDate(event.date)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {event.participants?.length || 0} participants
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground truncate">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-w-0">
        {selectedEventId && selectedEvent ? (
          <div className="flex-1 flex flex-col lg:flex-row min-w-0">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Chat Header */}
              <div className="p-3 lg:p-4 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  {/* Mobile menu button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden h-8 w-8 p-0 flex-shrink-0"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>

                  <Avatar className="h-8 lg:h-10 w-8 lg:w-10 bg-primary flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getEventInitials(selectedEvent.titre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm lg:text-base truncate">{selectedEvent.titre}</h2>
                    <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 flex-shrink-0" />
                        <span className="hidden sm:inline">{selectedEvent.participants?.length || 0} participants</span>
                        <span className="sm:hidden">{selectedEvent.participants?.length || 0}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{selectedEvent.lieu}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                        <span className="hidden sm:inline">{t("chat.online")}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile invite button for Responsable */}
                  {currentUser?.role === "Responsable" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => setShowInvitePanel(!showInvitePanel)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  )}

                                     <Badge variant="secondary" className="text-xs hidden sm:flex">
                     <Hash className="h-3 w-3 mr-1" />
                     Salon
                   </Badge>

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
              </div>

                             {/* Search Panel */}
               {showSearch && (
                 <div className="border-b border-border bg-card p-3">
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
                 </div>
               )}

               {/* Mobile Invite Panel */}
               {showInvitePanel && currentUser?.role === "Responsable" && (
                <div className="lg:hidden border-b border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-sm">Inviter</h3>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={fetchNonParticipants}
                        disabled={isLoadingNonParticipants}
                        className="h-7 w-7 p-0"
                      >
                        {isLoadingNonParticipants ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowInvitePanel(false)}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="max-h-32 overflow-y-auto">
                    {isLoadingNonParticipants ? (
                      <div className="flex justify-center py-2">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : nonParticipants.length === 0 ? (
                      <p className="text-muted-foreground text-xs text-center py-2">
                        {t("chat.allEmployeesParticipate")}
                      </p>
                    ) : (
                      <div className="space-y-1">
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
                                  className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.src = "/placeholder-user.jpg";
                                  }}
                                />
                              ) : (
                                <div className="h-6 w-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 text-xs flex-shrink-0">
                                  {user?.nom?.charAt(0).toUpperCase() || '?'}
                                </div>
                              )}
                              <span className="text-xs font-medium truncate">
                                {user.nom || 'Utilisateur'}
                              </span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddParticipant(user.id)}
                              className="h-6 w-6 p-0 flex-shrink-0"
                              title="Ajouter"
                            >
                              <UserPlus className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto bg-muted/20">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
                  <TabsList className="grid w-full grid-cols-2 sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
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

                  <TabsContent value="chat" className="mt-0 h-full">
                    <div className="p-3 lg:p-6 space-y-4 h-full overflow-y-auto">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8 lg:py-12">
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
                                 isCurrentUser={m.userId === currentUser?.id}
                                 onDelete={() => {}}
                               />
                             </div>
                           )
                         })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="mt-0 h-full">
                    <div className="p-3 lg:p-6 h-full overflow-y-auto">
                      {mediaItems.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8 lg:py-12">
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
              </div>

              {/* Message Input */}
              <div className="p-3 lg:p-4 border-t border-border bg-card">
                <div className="flex items-end gap-2 lg:gap-4">
                  <div className="flex-1 flex items-end gap-2 relative min-w-0">
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
                        className="pr-2"
                      />

                      {showMentionList && mentionSuggestions.length > 0 && (
                        <div className="absolute z-50 bg-white shadow-md rounded mt-1 w-full border max-h-48 overflow-auto bottom-full mb-1">
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
                      className="h-9 w-9 p-0 flex-shrink-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button 
                    onClick={sendMessage} 
                    disabled={(!newMessage.trim() && !pendingFile) || isUploading}
                    className="h-9 w-9 p-0 flex-shrink-0"
                  >
                    {isUploading ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-2 hidden sm:block">
                  {t("chat.enterToSend")}
                </p>
              </div>
            </div>

            {/* Desktop Sidebar for Responsable */}
            {currentUser?.role === "Responsable" && (
              <div className="hidden lg:block w-64 border-l border-border bg-card">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Inviter</h3>
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
                  </div>
                </div>
                <div className="p-2 max-h-[calc(100vh-200px)] overflow-y-auto">
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
                              {user.nom || 'Utilisateur'}
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
                </div>
              </div>
            )}
          </div>
        ) : (
          // Welcome screen
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-4 max-w-sm">
              {/* Mobile menu button when no chat selected */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden absolute top-4 left-4 h-8 w-8 p-0"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <div className="h-16 lg:h-20 w-16 lg:w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="h-8 lg:h-10 w-8 lg:w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold mb-2">{t("navigation.myChats")}</h2>
                <p className="text-muted-foreground text-sm lg:text-base">
                   {t("chat.selectChat")}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden mt-4"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t("chat.viewChats")}
                </Button>
              </div>
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