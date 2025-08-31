'use client'

import { useEffect, useState } from 'react'
import { Bar, Pie, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js'
import Papa from 'papaparse'
import { ChevronLeft, BarChart3, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { LoadingSpinner } from '@/shared/ui/loading-spinner'
import { apiService } from '@/lib/api'
import type { Event } from '@/lib/types'
import { useLanguage } from '@/lib/i18n'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

interface EventStats {
  eventId: string
  eventName: string
  charts: Array<{
    title: string
    data: any
    type: 'bar' | 'pie' | 'line'
  }>
}

export default function Page() {
  const { t } = useLanguage()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventStats, setEventStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [directEventLoading, setDirectEventLoading] = useState(false)
  const router = useRouter()

  // Get eventId from URL params
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const eventIdFromUrl = searchParams.get('eventId')

  // Charger la liste des événements avec formulaires
  useEffect(() => {
    async function fetchEvents() {
      try {
        const allEvents = await apiService.getEvents()
        // Filtrer les événements qui ont un sheetId
        const eventsWithSheets = allEvents.filter(event => event.sheetId && event.sheetId.trim() !== '')
        setEvents(eventsWithSheets)
        
        // Si un eventId est spécifié dans l'URL, sélectionner cet événement automatiquement
        if (eventIdFromUrl) {
          setDirectEventLoading(true)
          const targetEvent = eventsWithSheets.find(event => event.id === eventIdFromUrl)
          if (targetEvent) {
            setSelectedEvent(targetEvent)
            await analyzeEventFormData(targetEvent)
          } else {
            // Si l'événement n'est pas trouvé, afficher un message d'erreur
            console.error('Event not found:', eventIdFromUrl)
          }
          setDirectEventLoading(false)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des événements:', error)
        setDirectEventLoading(false)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [eventIdFromUrl])

  // Analyser les données d'un événement
  const analyzeEventFormData = async (event: Event) => {
    if (!event.sheetId) return

    setLoadingStats(true)
    setSelectedEvent(event)
    setEventStats(null)

    try {
      // Utiliser l'API backend pour récupérer les données du Google Sheet
      const sheetData = await apiService.getSheetData(event.sheetId)
      
      if (!sheetData || sheetData.length === 0) {
        setEventStats({
          eventId: event.id,
          eventName: event.titre,
          charts: []
        })
        setLoadingStats(false)
        return
      }

      // Analyser automatiquement toutes les colonnes
      const charts: Array<{ title: string; data: any; type: 'bar' | 'pie' | 'line' }> = []
      
      // Si les données sont un tableau de tableaux (format Google Sheets)
      if (Array.isArray(sheetData) && sheetData.length > 0) {
        const headers = sheetData[0] // Première ligne = en-têtes
        const dataRows = sheetData.slice(1) // Reste = données

        headers.forEach((header: string, columnIndex: number) => {
          if (!header || header.trim() === '') return

          const values = dataRows
            .map(row => row[columnIndex]?.toString().trim())
            .filter(val => val && val !== '')
          
          if (values.length === 0) return

          // Détecter le type de données et choisir le bon type de graphique
          const firstValue = values[0]
          const isNumeric = !isNaN(Number(firstValue)) && firstValue !== ''
          const isDate = header.toLowerCase().includes('date') || header.toLowerCase().includes('horodateur')
          
          if (isDate) {
            // Données temporelles - graphique en ligne
            const sortedValues = values.sort()
            const valueCounts: Record<string, number> = {}
            
            sortedValues.forEach(val => {
              valueCounts[val] = (valueCounts[val] || 0) + 1
            })

            if (Object.keys(valueCounts).length > 0) {
              charts.push({
                title: header,
                type: 'line',
                data: {
                  labels: Object.keys(valueCounts),
                  datasets: [{
                    label: header,
                    data: Object.values(valueCounts),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                  }],
                }
              })
            }
          } else if (isNumeric) {
            // Données numériques (notes, scores, etc.) - graphique en barres
            const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v))
            const valueCounts: Record<number, number> = {}
            
            numericValues.forEach(val => {
              valueCounts[val] = (valueCounts[val] || 0) + 1
            })

            if (Object.keys(valueCounts).length > 0) {
              charts.push({
                title: header,
                type: 'bar',
                data: {
                  labels: Object.keys(valueCounts).sort((a, b) => Number(a) - Number(b)),
                  datasets: [{
                    label: header,
                    data: Object.keys(valueCounts).sort((a, b) => Number(a) - Number(b)).map(k => valueCounts[Number(k)]),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                  }],
                }
              })
            }
          } else {
            // Données textuelles (choix multiples, etc.) - graphique en secteurs
            const valueCounts: Record<string, number> = {}
            
            values.forEach(val => {
              valueCounts[val] = (valueCounts[val] || 0) + 1
            })

            if (Object.keys(valueCounts).length > 0) {
              charts.push({
                title: header,
                type: 'pie',
                data: {
                  labels: Object.keys(valueCounts),
                  datasets: [{
                    label: header,
                    data: Object.values(valueCounts),
                    backgroundColor: [
                      'rgba(255, 99, 132, 0.6)',
                      'rgba(54, 162, 235, 0.6)',
                      'rgba(255, 206, 86, 0.6)',
                      'rgba(75, 192, 192, 0.6)',
                      'rgba(153, 102, 255, 0.6)',
                      'rgba(255, 159, 64, 0.6)',
                    ],
                    borderColor: [
                      'rgba(255, 99, 132, 1)',
                      'rgba(54, 162, 235, 1)',
                      'rgba(255, 206, 86, 1)',
                      'rgba(75, 192, 192, 1)',
                      'rgba(153, 102, 255, 1)',
                      'rgba(255, 159, 64, 1)',
                    ],
                    borderWidth: 1,
                  }],
                }
              })
            }
          }
        })
      }

      setEventStats({
        eventId: event.id,
        eventName: event.titre,
        charts
      })
      setLoadingStats(false)
    } catch (error) {
      console.error('Erreur fetch sheet data:', error)
      setLoadingStats(false)
    }
  }

  function handleBack() {
    if (selectedEvent) {
      setSelectedEvent(null)
      setEventStats(null)
      // Si on était arrivé directement sur un événement, retourner à la liste
      if (eventIdFromUrl) {
        router.push('/marketing/stat')
      }
    } else {
      router.back()
    }
  }

  // Afficher le loading si on charge directement un événement
  if (directEventLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Vue des statistiques d'un événement spécifique
  if (selectedEvent && eventStats) {
    return (
      <div className="p-10 max-w-6xl mx-auto space-y-8">
        <button
          onClick={handleBack}
          aria-label="Retour"
          className="text-primary hover:text-primary/80 transition cursor-pointer mb-4 p-0"
          style={{ background: 'none', border: 'none' }}
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">{t("statistics.eventFeedbacks").replace("{eventName}", eventStats.eventName)}</h1>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{eventStats.charts.length}</div>
              <div className="text-sm text-gray-600">{t("statistics.questionsAnalyzed")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
                             <div className="text-2xl font-bold text-green-600">
                {eventStats.charts.reduce((total, chart) => {
                  const dataPoints = chart.data.datasets[0].data;
                  return total + dataPoints.reduce((sum: number, val: number) => sum + val, 0);
                }, 0)}
              </div>
              <div className="text-sm text-gray-600">{t("statistics.totalResponses")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
                             <div className="text-2xl font-bold text-green-600">
                {eventStats.charts.filter(chart => chart.type === 'bar').length}
              </div>
              <div className="text-sm text-gray-600">{t("statistics.barCharts")}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
                              <div className="text-2xl font-bold text-green-600">
                {eventStats.charts.filter(chart => chart.type === 'pie').length}
              </div>
              <div className="text-sm text-gray-600">{t("statistics.pieCharts")}</div>
            </CardContent>
          </Card>
        </div>

        {loadingStats ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <LoadingSpinner size="lg" />
          </div>
        ) : eventStats.charts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t("statistics.noDataAvailable")}</h3>
              <p className="text-gray-600">{t("statistics.noDataDescription")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {eventStats.charts.map((chart, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{chart.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {chart.type === 'bar' && (
                    <Bar 
                      data={chart.data} 
                      options={{ 
                        responsive: true, 
                        scales: { y: { beginAtZero: true } },
                        plugins: {
                          legend: {
                            display: false
                          }
                        }
                      }} 
                    />
                  )}
                  {chart.type === 'pie' && (
                    <Pie 
                      data={chart.data} 
                      options={{ 
                        responsive: true,
                        plugins: {
                          legend: {
                            position: 'bottom'
                          }
                        }
                      }} 
                    />
                  )}
                  {chart.type === 'line' && (
                    <Line 
                      data={chart.data} 
                      options={{ 
                        responsive: true, 
                        scales: { y: { beginAtZero: true } },
                        plugins: {
                          legend: {
                            display: false
                          }
                        }
                      }} 
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Vue de la liste des événements
  return (
    <div className="p-10 max-w-6xl mx-auto space-y-8">
      <button
        onClick={handleBack}
        aria-label="Retour"
        className="text-primary hover:text-primary/80 transition cursor-pointer mb-4 p-0"
        style={{ background: 'none', border: 'none' }}
      >
        <ChevronLeft className="w-7 h-7" />
      </button>

      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">{t("statistics.title")}</h1>    
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("statistics.noEventsWithFeedbacks")}</h3>
            <p className="text-gray-600">{t("statistics.noEventsWithFeedbacksDescription")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{event.titre}</CardTitle>
                <p className="text-sm text-gray-600">
                  {new Date(event.date).toLocaleDateString('fr-FR')} à {event.heure}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{event.lieu}</p>
                <Button 
                  onClick={() => analyzeEventFormData(event)}
                  className="w-full"
                  disabled={loadingStats}
                >
                  {loadingStats ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {t("statistics.viewFeedbacks")}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
