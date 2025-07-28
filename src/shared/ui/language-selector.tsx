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
        <Button variant={variant} size={size} className="gap-2">
          <Globe className="h-4 w-4" />
          {showText && currentLanguage && (
            <>
              <span className="hidden sm:inline">{currentLanguage.flag}</span>
              <span className="hidden md:inline">{currentLanguage.name}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`flex items-center gap-2 ${language === lang.code ? "bg-accent" : ""}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
            {language === lang.code && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
