"use client"

import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface ThemeLogoProps {
  width?: number
  height?: number
  className?: string
  alt?: string
}

export function ThemeLogo({ 
  width = 48, 
  height = 48, 
  className = "mx-auto rounded-lg mb-4 object-cover cursor-pointer",
  alt = "Logo TeamwillEvents"
}: ThemeLogoProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use a default logo during SSR and before hydration
  const logoSrc = mounted && theme === "eco" ? "/logo-teamwill2.png" : "/logo-teamwill.png"

  return (
    <Link href="/">
      <Image
        src={logoSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    </Link>
  )
}
