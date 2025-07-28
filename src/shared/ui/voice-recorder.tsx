"use client"
import { useState, useRef } from "react"
import { Mic, Square } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { LoadingSpinner } from "./loading-spinner"
import type { VoiceTranscription } from "@/lib/types"
import { apiService } from "@/lib/api"
import { useLanguage } from "@/lib/i18n"

interface VoiceRecorderProps {
  onTranscription: (transcription: VoiceTranscription) => void
  disabled?: boolean
}

export function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const { t } = useLanguage()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" })
        await processAudio(audioBlob)

        // Clean up
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    try {
      const transcription = await apiService.transcribeAudio(audioBlob)
      onTranscription(transcription)
    } catch (error) {
      console.error("Error processing audio:", error)
      onTranscription({
        text: "",
        confidence: 0,
        isProcessing: false,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isProcessing) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-muted-foreground">{t("voice.processing")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled}
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              className="rounded-full h-16 w-16"
            >
              {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </div>

          {isRecording && (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">{t("voice.recordingInProgress")}</span>
              </div>
              <p className="text-2xl font-mono">{formatTime(recordingTime)}</p>
            </div>
          )}

          {!isRecording && (
            <p className="text-sm text-muted-foreground text-center">
              {t("voice.clickToStart")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
