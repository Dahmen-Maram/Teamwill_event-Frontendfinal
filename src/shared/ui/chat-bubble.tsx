"use client"

import type { ChatMessage } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Badge } from "@/shared/ui/badge"
import { FileText, Download, MoreVertical, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/shared/ui/dropdown-menu"
import { useLanguage } from "@/lib/i18n"


interface ChatBubbleProps {
  message: ChatMessage
  isCurrentUser: boolean
  onDelete?: (scope: 'me' | 'all') => void
}
// Removed debug log of language.

export function ChatBubble({ message, isCurrentUser, onDelete }: ChatBubbleProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
const { t } = useLanguage()
  const renderFileContent = () => {
    if (message.type === "image" && message.fileUrl) {
      return (
        <div className="mt-2">
          <img
            src={message.fileUrl || "/placeholder.svg"}
            alt="Shared image"
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.fileUrl, "_blank")}
          />
        </div>
      )
    }

    if (message.type === "video" && message.fileUrl) {
      return (
        <div className="mt-2 max-w-xs">
          <video
            src={message.fileUrl}
            controls
            className="rounded-lg max-h-60 w-full object-cover"
          />
        </div>
      )
    }
//cas de fichier pdf, doc, xls, etc.
    if (message.type === "file" && message.fileUrl) {
      return (
        <div className="mt-2 p-3 bg-muted rounded-lg flex items-center gap-2 max-w-xs">
          <FileText className="h-4 w-4 text-primary" />
        
          <button
            onClick={() => window.open(message.fileUrl, "_blank")}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      )
    }

    return null
  }

  

  return (
    <div className={cn("flex gap-3 mb-4 animate-fade-in", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        {message.avatarUrl && (
          <AvatarImage src={message.avatarUrl} alt={message.userName} />
        )}
        <AvatarFallback className="text-xs">
          {message.userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col", isCurrentUser ? "items-end" : "items-start")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{message.userName}</span>
          <Badge variant={message.userRole === "Responsable" ? "default" : "secondary"} className="text-xs">
            {message.userRole === "Responsable" ? "Responsable" : "Employé"}
          </Badge>
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hover:bg-muted p-1 rounded">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => onDelete('me')}>
                  <Trash2 className="h-4 w-4 mr-2" /> {t("chat.deleteForMe")}
                </DropdownMenuItem>
                {isCurrentUser && (
                  <DropdownMenuItem onSelect={() => onDelete('all')} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" /> {t("chat.deleteForAll")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
        </div>

        <div
          className={cn("max-w-md p-3 rounded-lg", isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted")}
        >
          {message.type !== "image" && (
 <p className="text-sm whitespace-pre-wrap text-black">{message.message}</p>

)}


          {renderFileContent()}
        </div>
        {isCurrentUser && message.seenBy?.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-1">
            Vu par {message.seenBy.length-1}
          </p>
        )}
      </div>
    </div>
  )
}
