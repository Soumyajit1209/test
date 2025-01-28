"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Mic, ChevronDown, ChevronUp, Play, Pause } from "lucide-react"

export default function PersonalAssistance() {
  const [isRecording, setIsRecording] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(true)
  const [chatHistory, setChatHistory] = useState([])
  const [audioUrls, setAudioUrls] = useState({})
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlayingId, setCurrentPlayingId] = useState(null)
  const [transcript, setTranscript] = useState("")
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recognitionRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            mediaRecorderRef.current = new MediaRecorder(stream)

            mediaRecorderRef.current.ondataavailable = (event) => {
              audioChunksRef.current.push(event.data)
            }

            mediaRecorderRef.current.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
              const audioUrl = URL.createObjectURL(audioBlob)
              const messageId = Date.now().toString()
              setAudioUrls((prev) => ({ ...prev, [messageId]: audioUrl }))
              setChatHistory((prev) => [...prev, { id: messageId, type: "user", content: `🎤 ${transcript}` }])
              handleSend(transcript, audioBlob)
            }
          })
          .catch((error) => console.error("Error accessing microphone:", error))
      }

      if ("webkitSpeechRecognition" in window) {
        recognitionRef.current = new window.webkitSpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true

        recognitionRef.current.onresult = (event) => {
          let interimTranscript = ""
          let finalTranscript = ""

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            } else {
              interimTranscript += event.results[i][0].transcript
            }
          }

          setTranscript(finalTranscript || interimTranscript)
        }
      }
    }
  }, [transcript])

  const toggleRecording = () => {
    if (!mediaRecorderRef.current || !recognitionRef.current) {
      console.error("Media recording or speech recognition is not supported in this browser.")
      return
    }

    if (isRecording) {
      mediaRecorderRef.current.stop()
      recognitionRef.current.stop()
    } else {
      audioChunksRef.current = []
      setTranscript("")
      mediaRecorderRef.current.start()
      recognitionRef.current.start()
    }
    setIsRecording(!isRecording)
  }

  const handleSend = async (transcriptText, audioBlob) => {
    const formData = new FormData()
    formData.append("audio", audioBlob, "recording.wav")
    formData.append("transcript", transcriptText)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setChatHistory((prev) => [...prev, { id: Date.now().toString(), type: "azmth", content: data.response }])
    } catch (error) {
      console.error("Error sending message:", error)
      setChatHistory((prev) => [
        ...prev,
        { id: Date.now().toString(), type: "azmth", content: "Error processing your request." },
      ])
    }
  }

  const toggleAudioPlayback = (messageId) => {
    if (currentPlayingId === messageId && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      setCurrentPlayingId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      audioRef.current = new Audio(audioUrls[messageId])
      audioRef.current.play()
      setIsPlaying(true)
      setCurrentPlayingId(messageId)
      audioRef.current.onended = () => {
        setIsPlaying(false)
        setCurrentPlayingId(null)
      }
    }
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto p-4 hide-scrollbar">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`mb-2 ${msg.type === "user" ? "text-right" : "text-left"}`}>
              <span className={`inline-block p-2 rounded-lg ${msg.type === "user" ? "bg-blue-500" : "bg-gray-700"}`}>
                {msg.content}
                {msg.type === "user" && audioUrls[msg.id] && (
                  <Button onClick={() => toggleAudioPlayback(msg.id)} variant="ghost" size="sm" className="ml-2">
                    {currentPlayingId === msg.id && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-center items-center h-72 relative">
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              isRecording ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="w-48 h-48 bg-blue-500 rounded-full animate-pulse-smooth"></div>
          </div>
          <Button
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className={`rounded-full p-8 z-10 transition-colors duration-300 ${
              isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
            }`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            <Mic className={`h-12 w-12 ${isRecording ? "animate-pulse" : ""}`} />
          </Button>
        </div>
        {isRecording && <div className="text-center mt-4 text-lg font-semibold">{transcript || "Listening..."}</div>}
      </div>
      <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} className="w-1/4 bg-gray-800 p-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full flex justify-between items-center mb-4">
            Chat History
            {isHistoryOpen ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 overflow-y-auto hide-scrollbar max-h-[calc(100vh-8rem)]">
          {chatHistory.map((msg) => (
            <div key={msg.id} className="bg-gray-700 p-2 rounded">
              {msg.type === "user" ? "You: " : "Azmth: "}
              {msg.content}
              {msg.type === "user" && audioUrls[msg.id] && (
                <Button onClick={() => toggleAudioPlayback(msg.id)} variant="ghost" size="sm" className="ml-2">
                  {currentPlayingId === msg.id && isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

