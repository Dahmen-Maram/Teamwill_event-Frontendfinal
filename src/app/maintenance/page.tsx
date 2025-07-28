"use client"

import { Clock, Wrench, Mail } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { HeroScene } from "@/components/three/hero-scene"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { useLanguage } from "@/lib/i18n"

export default function MaintenancePage() {
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
            <Wrench className="h-16 w-16 text-primary animate-pulse" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Clock className="h-6 w-6" />
              {t("errors.maintenance")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-lg">{t("errors.maintenanceDesc")}</p>

            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold mb-2">{t("errors.estimatedTime")}</h3>
              <p className="text-2xl font-bold text-primary">2 heures</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">{t("errors.improvements")}</h3>
              <ul className="text-left space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  {t("errors.chatOptimization")}
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  {t("errors.voiceImprovement")}
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                  {t("errors.securityUpdate")}
                </li>
              </ul>
            </div>

            <Button asChild variant="outline">
              <a href="mailto:support@TeamwillEvents.com">
                <Mail className="mr-2 h-4 w-4" />
                {t("errors.contactSupportBtn")}
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p>{t("errors.thankYou")}</p>
        </div>
      </div>
    </div>
  )
}
