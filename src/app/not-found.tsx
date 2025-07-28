"use client"

import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { HeroScene } from "@/components/three/hero-scene"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { useLanguage } from "@/lib/i18n"

export default function NotFound() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Language Selector */}
        <div className="flex justify-end">
          <LanguageSelector showText />
        </div>

        <div className="relative h-64">
          <HeroScene />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-8xl font-bold text-primary/20">404</div>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            <h1 className="text-4xl font-bold mb-4">{t("errors.pageNotFound")}</h1>
            <p className="text-muted-foreground text-lg mb-8">{t("errors.pageNotFoundDesc")}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  {t("errors.backHome")}
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg">
                <Link href="javascript:history.back()">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("errors.previousPage")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p>{t("errors.contactSupport")}</p>
        </div>
      </div>
    </div>
  )
}
