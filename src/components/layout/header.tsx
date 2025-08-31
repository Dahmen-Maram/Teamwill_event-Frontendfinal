"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Menu, User, LogOut, Settings, X, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import io, { Socket } from "socket.io-client"
import { apiService } from "@/lib/api"
import type { Notification, User as UserType } from "@/lib/types"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Badge } from "@/shared/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/shared/ui/sheet"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { ThemeSelector } from "@/shared/ui/theme-selector"
import { useLanguage } from "@/lib/i18n"
import { useTheme } from "next-themes"
import Image from "next/image"

interface HeaderProps {
  user: UserType
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  const routerNext = useRouter()
  if (!user) return null

  const pathname = usePathname()
  const { t } = useLanguage()
  const { theme } = useTheme()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true
    return localStorage.getItem("notificationsEnabled") !== "false"
  })
  const unread = notifs.filter((n) => !n.read).length

  const socketRef = useRef<Socket | null>(null)

  // Charger les notifications initiales
  useEffect(() => {
    if (!notifEnabled || !user) return

    async function fetchNotifs() {
      try {
        const list = await apiService.getNotifications(user.id)
        const normalized = list.map((n: any) => ({
          ...n,
          read: n.read ?? n.isRead ?? false,
        }))
        setNotifs(normalized)
      } catch {
        // ignore error
      }
    }

    fetchNotifs()
  }, [user?.id, notifEnabled])

  // Connexion socket pour notifications en temps réel
  useEffect(() => {
    if (!notifEnabled || !user) return

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
      transports: ["websocket"],
    })
    socketRef.current = socket

    socket.emit("joinUserRoom", { userId: user.id })

    socket.on("newNotification", (notif: Notification) => {
      setNotifs((prev) => [...prev, notif])
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?.id, notifEnabled])

  const markRead = async (id: string) => {
    await apiService.markNotificationRead(id)
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
    )
  }

  const markAll = async () => {
    await apiService.markAllNotificationsRead(user.id)
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })))
  }

  const deleteNotification = async (notifId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation() // Empêcher la navigation seulement si l'événement existe
    }
    const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer cette notification ?")
    if (!confirmed) return

    try {
      await apiService.deleteNotification(notifId, user.id)
      setNotifs((prev) => prev.filter((n) => n.id !== notifId))
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification:", error)
    }
  }

  // Composant de notification avec effet de swipe
  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const [isSwiped, setIsSwiped] = useState(false)
    const [startX, setStartX] = useState(0)
    const [currentX, setCurrentX] = useState(0)
    const [isDragging, setIsDragging] = useState(false)

    const handleTouchStart = (e: React.TouchEvent) => {
      setStartX(e.touches[0].clientX)
      setIsDragging(true)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return
      const deltaX = e.touches[0].clientX - startX
      setCurrentX(deltaX)
      
      // Si on swipe vers la gauche de plus de 80px, afficher l'icône de suppression
      if (deltaX < -80) {
        setIsSwiped(true)
      } else {
        setIsSwiped(false)
      }
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
      setCurrentX(0)
      
      // Si on était en mode swiped, supprimer la notification
      if (isSwiped) {
        deleteNotification(notification.id)
      }
    }

    // Support pour la souris (drag)
    const handleMouseDown = (e: React.MouseEvent) => {
      setStartX(e.clientX)
      setIsDragging(true)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - startX
      setCurrentX(deltaX)
      
      // Si on drag vers la gauche de plus de 80px, afficher l'icône de suppression
      if (deltaX < -80) {
        setIsSwiped(true)
      } else {
        setIsSwiped(false)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setCurrentX(0)
      
      // Si on était en mode swiped, supprimer la notification
      if (isSwiped) {
        deleteNotification(notification.id)
      }
    }

    const handleClick = () => {
      if (isSwiped) {
        deleteNotification(notification.id)
      } else {
        markRead(notification.id)
        const titleLower = notification.title.toLowerCase()
        const isResp = user.role === "Responsable"

        if (titleLower.includes("message")) {
          routerNext.push(isResp ? "/marketing/events" : "/employee/chat")
        } else if (titleLower.includes("événement")) {
          routerNext.push(isResp ? "/marketing/events" : "/employee")
        } else if (titleLower.includes("tâche")) {
          routerNext.push(isResp ? "/marketing/tasks" : "/employee/tasks")
        }
      }
    }

    return (
      <div className="relative overflow-hidden">
        {/* Zone de suppression (icône poubelle) */}
        <div className={`absolute right-0 top-0 h-full w-16 bg-destructive flex items-center justify-center transition-all duration-300 ${
          isSwiped ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <Trash2 className="h-5 w-5 text-white" />
        </div>
        
        {/* Contenu de la notification */}
        <div
          className={`relative bg-background transition-transform duration-300 ${
            isSwiped ? 'translate-x-[-4rem]' : 'translate-x-0'
          }`}
          style={{
            transform: isDragging ? `translateX(${currentX}px)` : undefined
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
        >
          <DropdownMenuItem
            className={`${!notification.read ? "bg-muted/50" : ""} w-full cursor-pointer select-none`}
            onSelect={(e) => e.preventDefault()}
          >
            <div className="flex items-start justify-between w-full">
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  {notification.title}
                  <div className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>
                </div>
              </div>
              {/* Indicateur de swipe */}
              <div className="flex items-center gap-1 ml-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              </div>
            </div>
          </DropdownMenuItem>
        </div>
      </div>
    )
  }

  const navigation =
    user.role === "Admin"
      ? [] // Aucun lien de navigation pour les admins
      : user.role === "Responsable"
        ? [
            { name: t("navigation.dashboard"), href: "/marketing" },
            { name: t("navigation.createEvent"), href: "/marketing/create" },
            { name: t("navigation.myEvents"), href: "/marketing/events" },
            { name: t("navigation.eventsTasks"), href: "/marketing/tasks" },
          ]
        : [
            { name: t("navigation.events"), href: "/employee" },
            { name: t("navigation.myRegistrations"), href: "/employee/registrations" },
            { name: t("navigation.chat"), href: "/employee/chat" },
            { name: t("navigation.myTasks"), href: "/employee/tasks" },
          ]

  const profileHref = user.role === "Responsable" 
    ? "/marketing/profile" 
    : user.role === "Admin" 
      ? "/admin/profile" 
      : "/employee/profile"

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`${
            pathname === item.href
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          } ${mobile ? "block py-2" : "px-3 py-2"} text-sm font-medium transition-colors`}
        >
          {item.name}
        </Link>
      ))}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          <Link href="/" className="flex items-center space-x-1 sm:space-x-2">
            <Image
              src={theme === "eco" ? "/logo-teamwill2.png" : "/logo-teamwill.png"}
              alt="Teamwill Logo"
              width={24}
              height={24}
              className="sm:w-9 sm:h-9 md:w-9 md:h-9"
              style={{ objectFit: "contain" }}
            />
            <span className="font-bold dark:text-white light:text-black eco:not(.light):not(.dark):text-black sm:text-lg md:text-xl ">TeamwillEvents</span>
          </Link>

          {navigation.length > 0 && (
            <nav className="hidden md:flex items-center space-x-1">
              <NavLinks />
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
          <LanguageSelector size="sm" />
          <ThemeSelector size="sm" />

          {notifEnabled && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-6 w-6 sm:h-8 sm:w-8 md:h-auto md:w-auto p-0.5 sm:p-1 md:p-2 min-w-0">
                  <Bell className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
                  {unread > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unread}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="font-semibold">Notifications</span>
                  {unread > 0 && (
                    <button onClick={markAll} className="text-xs text-primary">
                      {t("navigation.markAllRead")}
                    </button>
                  )}
                </div>
                {notifs.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">Aucune notification</div>
                )}
                {notifs.map((n) => (
                  <NotificationItem key={n.id} notification={n} />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-6 w-6 sm:h-8 sm:w-8 rounded-full p-0.5 sm:p-1 min-w-0">
                <Avatar className="h-4 w-4 sm:h-6 sm:w-6 md:h-8 md:w-8">
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={user.nom}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.src = "/placeholder-user.jpg"
                    }} 
                  />
                  <AvatarFallback className="text-xs sm:text-sm">{user.nom.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <Avatar>
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={user.nom}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement
                        target.src = "/placeholder-user.jpg"
                      }} 
                    />
                  </Avatar>
                  <p className="font-medium">{user.nom}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <Badge
                    variant={
                      user.role === "Responsable"
                        ? "default"
                        : user.role === "Admin"
                        ? "destructive"
                        : "secondary"
                    }
                    className="w-fit"
                  >
                    {user.role === "Responsable"
                      ? t("auth.marketing")
                      : user.role === "Admin"
                      ? t("auth.admin")
                      : t("auth.employee")}
                  </Badge>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={profileHref}>
                  <User className="mr-2 h-4 w-4" />
                  <span>{t("navigation.profile")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("navigation.settings")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t("auth.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              {navigation.length > 0 && (
                <nav className="flex flex-col space-y-4 mt-4">
                  <NavLinks mobile />
                  <Link
                    href={profileHref}
                    className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("navigation.profile")}
                  </Link>
                  <Link
                    href="/settings"
                    className="block py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("navigation.settings")}
                  </Link>
                </nav>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}