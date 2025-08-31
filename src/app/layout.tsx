import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { LanguageProvider } from "@/lib/i18n"
import { AuthProvider } from "@modules/auth/auth-context"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cookies } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TeamwillEvents - Gestion d'événements d'entreprise",
  description:
    "Plateforme moderne de gestion d'événements pour les entreprises avec chat en temps réel et création par commande vocale",
  keywords: ["événements", "entreprise", "gestion", "chat", "commande vocale"],
  generator: "v0.dev",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        {/* ThemeProvider agit sur <html> via attribute="class", côté client uniquement */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
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
