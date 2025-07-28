"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Menu, User, LogOut, Settings } from "lucide-react"
import { useEffect } from "react"
import io from "socket.io-client"
import { apiService } from "@/lib/api"
import type { Notification } from "@/lib/types"
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
import { useLanguage } from "@/lib/i18n"
import type { User as UserType } from "@/lib/types"
import Image from "next/image"
interface HeaderProps {
  user: UserType
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  if (!user) {
    return null // or a placeholder header if desired
  }
  const pathname = usePathname()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('notificationsEnabled') !== 'false'
  })
  const unread = notifs.filter((n) => !n.read).length

  useEffect(() => {
    if (!notifEnabled) return
    if (!user) return
    async function fetchNotifs() {
      try {
        const list = user.role === "Responsable" ? await apiService.getAllNotifications() : await apiService.getNotifications(user.id)
        const normalized = list.map((n:any)=>({ ...n, read: n.read ?? n.isRead ?? false }))
        setNotifs(normalized)
      } catch {
        /* Ignore */
      }
    }
    fetchNotifs()
  }, [user?.id])

  const markRead = async (id: string) => {
    await apiService.markNotificationRead(id)
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n)))
  }

  const markAll = async () => {
    if (user.role === "Responsable") {
      await Promise.all(
        notifs
          .filter((n) => !n.read)
          .map((n) => apiService.markNotificationRead(n.id))
      )
    } else {
      await apiService.markAllNotificationsRead(user.id)
    }
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })))
  }

  const { t } = useLanguage()

  const navigation =
    user.role === "Responsable"
      ? [
        { name: t("navigation.dashboard"), href: "/marketing" },
        { name: t("navigation.createEvent"), href: "/marketing/create" },
        { name: t("navigation.myEvents"), href: "/marketing/events" },
        // Added profile link
      ]
      : [
        { name: t("navigation.events"), href: "/employee" },
        { name: t("navigation.myRegistrations"), href: "/employee/registrations" },

      ]

  const profileHref = user.role === "Responsable" ? "/marketing/profile" : "/employee/profile"

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`${pathname === item.href
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
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo-teamwill.png" alt="Teamwill Logo" width={36} height={36} style={{ objectFit: 'contain' }} />

            <span className="font-bold text-xl gradient-text">TeamwillEvents</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <NavLinks />
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <LanguageSelector />

          {/* Notifications */}
          {notifEnabled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {unread}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="font-semibold">Notifications</span>
                {unread > 0 && (
                  <button onClick={markAll} className="text-xs text-primary">{t("navigation.markAllRead")}</button>
                )}
              </div>
              {notifs.length === 0 && <div className="p-4 text-sm text-muted-foreground">Aucune notification</div>}
              {notifs.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={!n.read ? "bg-muted/50" : ""}
                  onSelect={() => {
                    markRead(n.id)
                    if (n.eventId) {
                      window.location.href = n.kind === "event" ? `/employee/events/${n.eventId}` : `/chat/${n.eventId}`
                    }
                  }}
                >
                  <div className="text-sm">
                    {n.title}
                    <div className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>) }

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.nom} />
                  <AvatarFallback>{user.nom.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <Avatar>                  <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.nom} />
                  </Avatar>                  <p className="font-medium">{user.nom}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <Badge variant={user.role === "Responsable" ? "default" : "secondary"} className="w-fit">
                    {user.role === "Responsable" ? t("auth.marketing") : t("auth.employee")}
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

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
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
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
