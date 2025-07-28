"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  MessageSquare,
  Mic,
  Users,
  Star,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"
import { HeroScene } from "@/components/three/hero-scene"
import { LanguageSelector } from "@/shared/ui/language-selector"
import { useLanguage } from "@/lib/i18n"
import { apiService } from "@/lib/api"
import type { User } from "@/lib/types"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await apiService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        // User not authenticated
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleGetStarted = () => {
    if (user) {
      router.push(user.role === "Responsable" ? "/marketing" : "/employee")
    } else {
      router.push("/auth/register")
    }
  }

  const features = [
    {
      icon: Calendar,
      title: t("home.eventManagement"),
      description: t("home.eventManagementDesc"),
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Mic,
      title: t("home.voiceCommand"),
      description: t("home.voiceCommandDesc"),
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: MessageSquare,
      title: t("home.realTimeChat"),
      description: t("home.realTimeChatDesc"),
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Users,
      title: t("home.participantManagement"),
      description: t("home.participantManagementDesc"),
      gradient: "from-orange-500 to-red-500",
    },
  ]

  const stats = [
    { number: "500+", label: t("home.companies") },
    { number: "10K+", label: t("home.eventsCreated") },
    { number: "50K+", label: t("home.activeUsers") },
    { number: "98%", label: t("home.satisfaction") },
  ]

  const testimonials = [
    {
      content: t("home.testimonial1"),
      author: t("home.testimonial1Author"),
      role: t("home.testimonial1Role"),
      avatar: "/placeholder.svg?height=40&width=40",
      rating: 5,
    },
    {
      content: t("home.testimonial2"),
      author: t("home.testimonial2Author"),
      role: t("home.testimonial2Role"),
      avatar: "/placeholder.svg?height=40&width=40",
      rating: 5,
    },
    {
      content: t("home.testimonial3"),
      author: t("home.testimonial3Author"),
      role: t("home.testimonial3Role"),
      avatar: "/placeholder.svg?height=40&width=40",
      rating: 5,
    },
  ]

  const faqItems = [
    {
      question: t("home.faqQuestion1"),
      answer: t("home.faqAnswer1"),
    },
    {
      question: t("home.faqQuestion2"),
      answer: t("home.faqAnswer2"),
    },
    {
      question: t("home.faqQuestion3"),
      answer: t("home.faqAnswer3"),
    },
    {
      question: t("home.faqQuestion4"),
      answer: t("home.faqAnswer4"),
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSelector showText />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(22,163,74,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(132,204,22,0.1),transparent_50%)]" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary border border-primary/20">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                    {t("home.title")}
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                  {t("home.subtitle")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {user ? t("home.accessDashboard") : t("home.register")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                {!user && (
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-6 bg-background/80 backdrop-blur-sm border-2 hover:bg-background/90 transform hover:scale-105 transition-all duration-200"
                  >
                    <Link href="/auth/login">{t("home.signIn")}</Link>
                  </Button>
                )}
              </div>

              {user && (
                <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border border-primary/20 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-sm font-medium">
                      {t("home.loggedInAs")} <strong className="text-primary">{user.nom}</strong>
                      <span className="ml-2 px-2 py-1 bg-primary/20 rounded-full text-xs">
                        {user.role === "Responsable" ? t("auth.marketing") : t("auth.employee")}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative lg:h-[600px] animate-fade-in">
              <HeroScene />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />

              {/* Floating Elements */}
              <div className="absolute top-10 right-10 animate-float">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-primary/20">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">{t("home.liveChatActive")}</span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-10 animate-float" style={{ animationDelay: "1s" }}>
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-accent/20">
                  <div className="flex items-center space-x-2">
                    <Mic className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">{t("home.voiceCommand")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-accent/5 border-y border-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-lg text-muted-foreground">{t("home.trustedBy")}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 group-hover:bg-white/70 transition-all duration-300 transform group-hover:scale-105">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t("home.features")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t("home.featuresSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 border-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-sm overflow-hidden relative"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                />

                <CardContent className="p-8 text-center relative z-10">
                  <div
                    className={`mb-6 inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>

                  <h3 className="font-bold text-xl mb-4 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">{t("home.testimonials")}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  <p className="text-muted-foreground mb-6 leading-relaxed italic">"{testimonial.content}"</p>

                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.author} />
                      <AvatarFallback>{testimonial.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">{t("home.faq")}</h2>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-border/50 rounded-lg px-6 bg-white/50 backdrop-blur-sm"
                >
                  <AccordionTrigger className="text-left font-semibold hover:text-primary transition-colors">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">{t("home.readyToTransform")}</h2>

            <p className="text-xl text-white/90 leading-relaxed">{t("home.joinCompanies")}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {user ? t("home.accessPlatform") : t("home.startNow")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-8 pt-8">
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Installation gratuite</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Support 24/7</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Essai gratuit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img src="/logo-teamwill.png" alt="Logo TeamwillEvents" className="h-8 w-8 rounded-lg object-cover" />
                <span className="font-bold text-xl gradient-text">TeamwillEvents</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                La plateforme moderne pour gérer vos événements d'entreprise avec intelligence et simplicité.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Fonctionnalités
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    API
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Intégrations
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Guides
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t("home.contactUs")}</h4>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>contact@TeamwillEvents.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+33 1 23 45 67 89</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Paris, France</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>{t("home.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

