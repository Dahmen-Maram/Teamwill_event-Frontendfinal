import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { LanguageProvider } from "@/lib/i18n"
import { AuthProvider } from "@modules/auth/auth-context"
import "./globals.css"
import { ThemeProvider } from "next-themes"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TeamwillEvents - Gestion d'événements d'entreprise",
  description:
    "Plateforme moderne de gestion d'événements pour les entreprises avec chat en temps réel et création par commande vocale",
  keywords: ["événements", "entreprise", "gestion", "chat", "commande vocale"],
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
    {/* ⬆️ Important pour éviter le clignotement du thème au chargement */}
    <body className={inter.className}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
              {children}
            </div>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </body>
  </html>
  )
}
