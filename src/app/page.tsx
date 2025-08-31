"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  ArrowRight,
  Calendar,
  MessageSquare,
  Users,
  Star,
  ChevronDown,
  Mail,
  Phone,
  CheckCircle,
  Tag,
  CheckSquare,
  ImageIcon,
  Mic,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Sparkles,
} from "lucide-react"
import { Button } from "@/shared/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent } from "@/shared/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"
import { ThemeSelector } from "@/shared/ui/theme-selector"

import { apiService } from "@/lib/api"
import type { User } from "@/lib/types"
import { useLanguage } from "@/lib/i18n"

// Functional Language Selector
const LanguageSelector = ({ showText }: { showText?: boolean }) => {
  const { language, setLanguage } = useLanguage()

  const languages = [
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "en", name: "English", flag: "🇺🇸" },
  ] as const

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-background/80 backdrop-blur-xl border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <Globe className="h-4 w-4" />
          {currentLanguage.flag}
          {showText && <span>{currentLanguage.name}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-xl border-border/50">
        {languages.map((lang) => (
          <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code as "fr" | "en")} className="gap-2">
            {lang.flag} {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLanguage()
  const { theme } = useTheme()

  const [upcomingEvents, setUpcomingEvents] = useState([
    {
      id: 1,
      title: "Séminaire Équipe Marketing",
      date: "15 Mars 2024",
      participants: 24,
      status: t("events.inscrit"),
      image: "https://ev.zoom.us/wp-content/uploads/2024/12/FR.png",
    },
    {
      id: 2,
      title: "Formation Leadership",
      date: "22 Mars 2024",
      participants: 18,
      status: "Disponible",
      image: "https://ev.zoom.us/wp-content/uploads/2025/03/Mastering-Virtual-Hybrid-events-1024x585.png",
    },
    {
      id: 3,
      title: "Team Building Annuel",
      date: "5 Avril 2024",
      participants: 45,
      status: "Complet",
      image: "https://ev.zoom.us/wp-content/uploads/2025/03/Virtual-Hybrid-Events-Europe-1024x585.png",
    },
  ])
  const router = useRouter()

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
      title: t("events.eventsinternal"),
      description: t("events.description"),
    },
    {
      icon: MessageSquare,
      title: t("events.chatsalons"),
      description: t("events.description1"),
    },
    {
      icon: Tag,
      title: t("events.tagsmentions"),
      description: t("events.description2"),
    },
    {
      icon: CheckSquare,
      title: t("home.taskManagement"),
      description: t("home.taskManagementDesc"),
    },
  ]

  const stats = [
    { number: "150+", label: t("home.statActiveCollaborators") },
    { number: "25+", label: t("home.statEventsThisMonth") },
    { number: "500+", label: t("home.statPhotosShared") },
    { number: "95%", label: t("home.statParticipationRate") },
  ]

  const testimonials = [
    {
      content: t("home.testimonial1"),
      author: "Sophie Martin",
      role: "Développeuse Frontend",
      department: "Finance",
      avatar: "https://img.favpng.com/6/19/20/businessperson-management-woman-png-favpng-Q12v98dtSivGHapnwvsss8Jdd.jpg",
      rating: 5,
    },
    {
      content: t("home.testimonial2"),
      author: "Thomas Leroy",
      role: "Responsable RH",
      department: "Ressources Humaines",
      avatar:
        "https://img.lovepik.com/free-png/20211107/lovepik-business-men-who-work-in-folders-png-image_400427430_wh1200.png",
      rating: 5,
    },
    {
      content: t("home.testimonial3"),
      author: "John Rousseau",
      role: "Designer UX",
      department: "IT",
      avatar:
        "https://img.lovepik.com/free-png/20211115/lovepik-creative-business-male-image-photo-png-image_400930461_wh1200.png",
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
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-primary shadow-lg"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-primary/20"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Subtle animated background pattern */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_theme(colors.primary/0.1)_1px,_transparent_0)] bg-[size:20px_20px] animate-pulse"></div>
      </div>
      
      {/* Floating elements for visual interest */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${20 + Math.random() * 10}s`,
            }}
          >
            <div className="w-1 h-1 bg-primary/20 rounded-full blur-sm"></div>
          </div>
        ))}
      </div>

      {/* Language Selector and Theme Selector - Top Right */}
      <div className="fixed top-6 right-6 z-50 flex gap-3">
        <ThemeSelector size="sm" />
        <LanguageSelector showText />
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="container mx-auto py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 animate-fadeInUp">
              <div className="space-y-6">
                <div className="group inline-flex items-center px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full text-sm font-medium text-primary border border-primary/20 hover:bg-primary/15 transition-all duration-300 hover:scale-105 shadow-lg">
                  <Sparkles className="h-4 w-4 mr-2 group-hover:animate-spin" />
                  {t("home.title")}
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="text-primary animate-slideInLeft">{t("home.discover")}</span>
                  <br />
                  <span className="text-foreground animate-slideInRight">{t("home.ourEvents")}</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl animate-fadeIn">
                  {t("home.heroDescription")}
                </p>
              </div>

              {/* Conditional Authentication Section */}
              {!user ? (
                <div className="flex flex-col sm:flex-row gap-4 animate-fadeInUp">
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    className="group text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    {t("home.register")}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-6 rounded-2xl border-2 bg-muted/50 hover:bg-muted backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <Link href="/auth/login">{t("home.signIn")}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 animate-fadeInUp">
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    className="group text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    {t("home.accessDashboard")}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  {/* User Status Display */}
                  <div className="p-6 bg-muted/20 backdrop-blur-sm rounded-3xl border border-border/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-14 w-14 ring-4 ring-primary/20 ring-offset-2 ring-offset-background">
                        <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.nom} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                          {user.nom
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">{t("home.loggedInAs")}</p>
                        <p className="font-bold text-xl text-foreground">{user.nom}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge
                            variant={
                              user.role === "Responsable"
                                ? "default"
                                : user.role === "Admin"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="rounded-full px-3 py-1 font-medium shadow-sm"
                          >
                            {user.role === "Responsable"
                              ? t("auth.marketing")
                              : user.role === "Admin"
                                ? t("auth.admin")
                                : t("auth.employee")}
                          </Badge>
                          {user.department && (
                            <span className="text-sm text-muted-foreground font-medium">• {user.department}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Logo Teamwill avec effet visuel amélioré */}
            <div className="space-y-6 animate-fadeInRight">
              <div className="relative lg:h-[400px] mb-6 flex items-center justify-center">
                <div className="relative group">
                  {/* Subtle glow effect using theme colors */}
                  <div className="absolute -inset-6 bg-primary/10 rounded-full opacity-50 group-hover:opacity-70 animate-pulse blur-2xl transition-opacity duration-500"></div>
                  <div className="relative">
                    <img
                      src={theme === "eco" ? "/logo-teamwill2.png" : "/logo-teamwill.png"}
                      alt="Logo TeamwillEvents"
                      className="h-56 w-56 rounded-3xl object-cover shadow-2xl group-hover:scale-105 transition-all duration-500 border-4 border-border/30"
                    />
                  </div>
                </div>
                
                {/* Floating Elements with theme colors */}
                <div className="absolute top-8 right-8 animate-float">
                  <div className="bg-background/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-border/50 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                      <span className="text-sm font-semibold text-foreground">{t("home.liveChatActive")}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-8 left-8 animate-float" style={{ animationDelay: "1s" }}>
                  <div className="bg-background/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-border/50 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <Mic className="h-4 w-4 text-primary animate-pulse" />
                      <span className="text-sm font-semibold text-foreground">{t("home.voiceCommand")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 backdrop-blur-sm rounded-3xl p-8 border border-border/30 shadow-xl hover:shadow-2xl transition-all duration-300">
                <h3 className="text-2xl font-bold mb-6 flex items-center text-foreground">
                  <div className="p-3 bg-primary/20 rounded-2xl mr-3 shadow-lg">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  {t("home.upcomingEvents")}
                </h3>

                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="group flex items-center space-x-4 p-4 bg-background/50 backdrop-blur-sm rounded-2xl hover:bg-background/70 transition-all duration-300 cursor-pointer border border-border/30 hover:border-border/60 hover:shadow-lg transform hover:scale-102"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="relative">
                        <img
                          src={event.image || "/placeholder.svg"}
                          alt={event.title}
                          className="w-20 h-20 rounded-2xl object-cover group-hover:scale-105 transition-transform duration-300 shadow-lg"
                        />
                        <div className="absolute inset-0 bg-primary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium">{event.date}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="p-1 bg-primary/20 rounded-lg">
                            <Users className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm text-muted-foreground font-medium">
                            {event.participants} {t("events.participants")}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          event.status === "Inscrit"
                            ? "default"
                            : event.status === "Complet"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs rounded-full px-3 py-1 font-semibold shadow-sm"
                      >
                        {user ? event.status : t("home.seeDetails")}
                      </Badge>
                    </div>
                  ))}
                </div>
                {!user && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                    <p className="text-sm text-center text-muted-foreground">
                      <Link href="/auth/login" className="text-primary hover:text-primary/80 font-bold hover:underline transition-colors">
                        {t("home.signIn")}
                      </Link>{" "}
                      {t("home.loginPrompt")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Enhanced Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="p-3 bg-background/80 backdrop-blur-xl rounded-full border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <ChevronDown className="h-6 w-6 text-primary" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-muted/10 backdrop-blur-sm relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <p className="text-xl text-muted-foreground font-medium">{t("home.teamwillEngagement")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="bg-background/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-border/30 group-hover:scale-105 group-hover:bg-primary/5">
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-3 group-hover:scale-110 transition-transform duration-300">
                    {stat.number}
                  </div>
                  <p className="text-sm text-muted-foreground font-semibold">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20 animate-fadeInUp">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-foreground">{t("home.features")}</h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              {t("home.featuresDescription")}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-muted/10 backdrop-blur-sm shadow-xl hover:scale-105 rounded-3xl overflow-hidden animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-8 text-center relative">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-3xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10">
                    <feature.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-6 text-foreground group-hover:text-primary transition-colors relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed relative z-10">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-24 bg-muted/10 backdrop-blur-sm relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20 animate-fadeInUp">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-foreground">
              {t("home.shareCollaborateTitle")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              {t("home.shareCollaborateDesc")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group bg-background/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden hover:scale-105 animate-fadeInUp">
              <CardContent className="p-10 text-center relative">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                                 <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-3xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10">
                   <ImageIcon className="h-10 w-10 text-green-600" />
                 </div>
                 <h3 className="font-bold text-2xl mb-6 text-foreground group-hover:text-green-600 transition-colors relative z-10">
                  {t("home.photosVideos")}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg relative z-10">{t("home.photosVideosDesc")}</p>
              </CardContent>
            </Card>
            <Card className="group bg-background/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden hover:scale-105 animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-10 text-center relative">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-3xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10">
                  <Tag className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="font-bold text-2xl mb-6 text-foreground group-hover:text-green-600 transition-colors relative z-10">
                  {t("home.tagsMentions")}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg relative z-10">{t("home.tagsMentionsDesc")}</p>
              </CardContent>
            </Card>
            <Card className="group bg-background/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden hover:scale-105 animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
              <CardContent className="p-10 text-center relative">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                                 <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-3xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10">
                   <CheckSquare className="h-10 w-10 text-green-600" />
                 </div>
                 <h3 className="font-bold text-2xl mb-6 text-foreground group-hover:text-green-600 transition-colors relative z-10">
                  {t("home.taskManagement")}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg relative z-10">{t("home.taskManagementDesc")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20 animate-fadeInUp">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-foreground">
              {t("home.testimonialsTitle")}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="group bg-background/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden hover:scale-105 animate-fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-8 relative">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex mb-6 justify-center">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-6 w-6 text-yellow-400 fill-current group-hover:scale-110 transition-transform" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-8 leading-relaxed italic text-lg">"{testimonial.content}"</p>
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16 ring-4 ring-primary/20 ring-offset-2 ring-offset-background group-hover:ring-primary/40 transition-all duration-300">
                        <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.author} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                          {testimonial.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-lg text-foreground">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground font-medium">{testimonial.role}</p>
                        <Badge variant="outline" className="text-xs mt-2 rounded-full px-3 py-1 border-primary/30 text-primary">
                          {testimonial.department}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/10 backdrop-blur-sm relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20 animate-fadeInUp">
              <h2 className="text-4xl md:text-6xl font-bold mb-8 text-foreground">{t("home.faqTitle")}</h2>
            </div>
            <Accordion type="single" collapsible className="space-y-6">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-0 rounded-3xl px-8 bg-background/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-102 animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <AccordionTrigger className="text-left font-bold text-lg hover:text-primary transition-colors py-8 hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-lg pb-8">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-foreground/10 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-5xl mx-auto space-y-10 animate-fadeInUp">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 text-primary-foreground">
              {user ? t("home.continueAdventure") : t("home.joinCommunity")}
            </h2>
            <p className="text-2xl text-primary-foreground/90 leading-relaxed font-medium">
              {user ? t("home.continueAdventure") : t("home.joinCommunity")}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                variant="secondary"
                className="group text-lg px-10 py-6 bg-background text-primary hover:bg-background/90 rounded-2xl shadow-2xl hover:shadow-background/20 transition-all duration-300 transform hover:scale-105 font-bold"
              >
                <Sparkles className="mr-2 h-5 w-5 group-hover:animate-spin" />
                {user ? t("home.accessEvents") : t("home.discoverEvents")}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 pt-12">
              <div className="flex items-center space-x-3 text-primary-foreground/90 bg-primary-foreground/10 backdrop-blur-xl rounded-full px-6 py-3 border border-primary-foreground/20 hover:scale-105 transition-all duration-300">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span className="font-semibold">{user ? t("home.immediateAccess") : t("home.simpleRegistration")}</span>
              </div>
              <div className="flex items-center space-x-3 text-primary-foreground/90 bg-primary-foreground/10 backdrop-blur-xl rounded-full px-6 py-3 border border-primary-foreground/20 hover:scale-105 transition-all duration-300">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span className="font-semibold">{t("home.realTimeNotifications")}</span>
              </div>
              <div className="flex items-center space-x-3 text-primary-foreground/90 bg-primary-foreground/10 backdrop-blur-xl rounded-full px-6 py-3 border border-primary-foreground/20 hover:scale-105 transition-all duration-300">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <span className="font-semibold">{t("home.teamSupport")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border/50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="space-y-6 animate-fadeInUp">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={theme === "eco" ? "/logo-teamwill2.png" : "/logo-teamwill.png"}
                    alt="Logo TeamwillEvents"
                    className="h-12 w-12 rounded-2xl object-cover shadow-xl"
                  />
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="font-bold text-2xl text-foreground">TeamwillEvents</span>
              </div>
              <p className="text-muted-foreground leading-relaxed font-medium">{t("home.footerDescription")}</p>
            </div>
            <div className="animate-fadeInUp" style={{ animationDelay: "0.1s" }}>
              <h4 className="font-bold text-lg mb-6 text-foreground">{t("home.events")}</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link
                    href={user ? (user.role === "Responsable" ? "/responsable" : "/employee") : "/auth/login"}
                    className="hover:text-primary transition-colors font-medium hover:underline"
                  >
                    {t("home.upcomingEvents")}
                  </Link>
                </li>
                <li>
                  <Link
                    href={user ? (user.role === "Responsable" ? "/responsable" : "/employee") : "/auth/login"}
                    className="hover:text-primary transition-colors font-medium hover:underline"
                  >
                    {t("home.myRegistrations")}
                  </Link>
                </li>
              </ul>
            </div>
            <div className="animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
              <h4 className="font-bold text-lg mb-6 text-foreground">{t("home.community")}</h4>
              <ul className="space-y-3 text-muted-foreground mb-6">
                <li>
                  <Link
                    href={user ? (user.role === "Responsable" ? "/responsable" : "/employee") : "/auth/login"}
                    className="hover:text-primary transition-colors font-medium hover:underline"
                  >
                    {t("home.chatRooms")}
                  </Link>
                </li>
                <li>
                  <Link
                    href={user ? (user.role === "Responsable" ? "/responsable" : "/employee") : "/auth/login"}
                    className="hover:text-primary transition-colors font-medium hover:underline"
                  >
                    {t("home.notifications")}
                  </Link>
                </li>
              </ul>
              <div className="flex items-center space-x-4">
                <a
                  href="https://www.facebook.com/TeamwillTunisie/?locale=fr_FR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-muted/50 backdrop-blur-sm rounded-2xl hover:bg-primary/20 transition-all duration-300 hover:scale-110 border border-border/30 shadow-lg"
                >
                  <Facebook className="h-5 w-5 hover:text-primary transition-colors" />
                </a>
                <a href="https://www.instagram.com/teamwillgroup/" target="_blank" rel="noopener noreferrer"
                   className="p-3 bg-muted/50 backdrop-blur-sm rounded-2xl hover:bg-primary/20 transition-all duration-300 hover:scale-110 border border-border/30 shadow-lg">
                  <Instagram className="h-5 w-5 hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://www.linkedin.com/company/teamwill/jobs/?originalSubdomain=fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-muted/50 backdrop-blur-sm rounded-2xl hover:bg-primary/20 transition-all duration-300 hover:scale-110 border border-border/30 shadow-lg"
                >
                  <Linkedin className="h-5 w-5 hover:text-primary transition-colors" />
                </a>
                <a
                  href="https://www.youtube.com/channel/UCaLs6ZwJce-qcoKKztUklFQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-muted/50 backdrop-blur-sm rounded-2xl hover:bg-primary/20 transition-all duration-300 hover:scale-110 border border-border/30 shadow-lg"
                >
                  <Youtube className="h-5 w-5 hover:text-primary transition-colors" />
                </a>
              </div>
            </div>
            <div className="animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
              <h4 className="font-bold text-lg mb-6 text-foreground">Support</h4>
              <div className="space-y-4 text-muted-foreground">
                <div className="flex items-center space-x-3 group">
                  <div className="p-2 bg-muted/50 backdrop-blur-sm rounded-xl group-hover:bg-primary/20 transition-all duration-300 border border-border/30 shadow-lg">
                    <Mail className="h-5 w-5 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="font-medium">support@teamwill.com</span>
                </div>
                <div className="flex items-center space-x-3 group">
                  <div className="p-2 bg-muted/50 backdrop-blur-sm rounded-xl group-hover:bg-primary/20 transition-all duration-300 border border-border/30 shadow-lg">
                    <Phone className="h-5 w-5 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="font-medium">+33 1 84 20 71 49 1234</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 mt-16 pt-10 text-center">
            <p className="text-muted-foreground font-medium text-lg">{t("home.footerCopyright")}</p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(2deg);
          }
          66% {
            transform: translateY(-10px) rotate(-2deg);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animate-fadeInLeft {
          animation: fadeInLeft 0.8s ease-out forwards;
        }

        .animate-fadeInRight {
          animation: fadeInRight 0.8s ease-out forwards;
        }

        .animate-slideInLeft {
          animation: slideInLeft 1s ease-out forwards;
        }

        .animate-slideInRight {
          animation: slideInRight 1s ease-out forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 1.2s ease-out forwards;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        /* Backdrop blur fallback */
        .backdrop-blur-xl {
          backdrop-filter: blur(24px);
        }
        
        .backdrop-blur-sm {
          backdrop-filter: blur(4px);
        }
      `}</style>
    </div>
  )
}