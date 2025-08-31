"use client"

import { useTheme } from "next-themes"
import { Button } from "@/shared/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { Moon, Sun, Palette } from "lucide-react"
import { useLanguage } from "@/lib/i18n"
import { useEffect, useState } from "react"

interface ThemeSelectorProps {
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
  showText?: boolean
}

export function ThemeSelector({ variant = "ghost", size = "default", showText = false }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const themes = [
    {
      value: "light",
      label: t("settings.lightMode") || "Mode clair",
      icon: Sun,
      preview: "bg-white border border-gray-300"
    },
    {
      value: "dark",
      label: t("settings.darkMode") || "Mode sombre", 
      icon: Moon,
      preview: "bg-gray-900 border border-gray-600"
    },
    {
      value: "eco",
      label: t("settings.ecoMode") || "Mode éco (Crayon)",
      icon: Palette,
      preview: "bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-800"
    }
  ]

  const currentTheme = themes.find((t) => t.value === theme) || themes[0]

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className="gap-2"
        aria-label="Changer de thème"
      >
        <Sun className="h-4 w-4" />
        {showText && <span>{t("settings.lightMode") || "Mode clair"}</span>}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className="gap-2"
          aria-label="Changer de thème"
        >
          <currentTheme.icon className="h-4 w-4" />
          {showText && <span>{currentTheme.label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value)}
            className={`flex items-center gap-2 ${theme === themeOption.value ? "bg-accent" : ""}`}
          >
            <div className={`w-4 h-4 rounded ${themeOption.preview}`}></div>
            <span>{themeOption.label}</span>
            {theme === themeOption.value && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
