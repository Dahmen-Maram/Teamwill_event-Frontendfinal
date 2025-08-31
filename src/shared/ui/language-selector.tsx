"use client"

import { Globe } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { useLanguage } from "@/lib/i18n"

interface LanguageSelectorProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
  showText?: boolean
}

export function LanguageSelector({ variant = "ghost", size = "default", showText = false }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage()

  const languages = [
    { code: "fr" as const, name: "Français", flag: "🇫🇷" },
    { code: "en" as const, name: "English", flag: "🇺🇸" },
  ]

  const currentLanguage = languages.find((lang) => lang.code === language)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className="gap-0.5 sm:gap-1 md:gap-2 h-6 w-6 sm:h-8 sm:w-8 md:h-auto md:w-auto p-0.5 sm:p-1 md:p-2 min-w-0"
          aria-label="Changer de langue"
        >
          <Globe className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4" />
          {showText && currentLanguage && (
            <>
              <span className="hidden md:inline">{currentLanguage.flag}</span>
              <span className="hidden lg:inline">{currentLanguage.name}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[90px] sm:min-w-[120px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-1 sm:gap-2 ${language === lang.code ? "bg-accent" : ""}`}
          >
            <span className="text-xs sm:text-sm">{lang.flag}</span>
            <span className="text-xs sm:text-sm">{lang.name}</span>
            {language === lang.code && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
