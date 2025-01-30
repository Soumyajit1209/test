import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Phone, X, Mic, AudioWaveformIcon as Waveform } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CallingPage({ onClose }) {
  const [callStatus, setCallStatus] = useState("calling") // 'calling', 'connected', 'ended'
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [audioUrl, setAudioUrl] = useState(null)
  const recognitionRef = useRef(null)
  const audioRef = useRef(new Audio())

  useEffect(() => {
    const timer = setTimeout(() => {
      setCallStatus('connected')
    }, 3000)

    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        const finalTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('')

        setTranscript(finalTranscript)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        if (transcript) {
          handleSendMessage()
        }
      }
    }

    return () => {
      clearTimeout(timer)
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [transcript]) // Added transcript to dependencies

  const handleEndCall = () => {
    setCallStatus("ended")
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    audioRef.current.pause()
    setTimeout(onClose, 1000)
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop()
    } else {
      setTranscript("")
      recognitionRef.current.start()
    }
    setIsListening(!isListening)
  }

  const handleSendMessage = async () => {
    if (transcript) {
      try {
        const response = await fetch("/api/elevenlabs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: transcript }),
        })
        const data = await response.json()
        setAudioUrl(`/api/audio/${data.audioFileName}`)
        audioRef.current.src = `/api/audio/${data.audioFileName}`
        audioRef.current.play()
      } catch (error) {
        console.error("Error sending message:", error)
      }
      setTranscript("")
    }
  }

  const callStatusVariants = {
    calling: { scale: [1, 1.2, 1], transition: { repeat: Number.POSITIVE_INFINITY, duration: 1.5 } },
    connected: { scale: 1, transition: { duration: 0.5 } },
    ended: { scale: 0, opacity: 0, transition: { duration: 0.5 } },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-gray-800 p-8 rounded-lg text-white text-center max-w-md w-full"
      >
        <AnimatePresence mode="wait">
          {callStatus === "calling" && (
            <motion.div key="calling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold mb-4">Calling Azmth...</h2>
              <motion.div variants={callStatusVariants} animate="calling" className="mb-6">
                <Phone size={64} className="mx-auto text-blue-400" />
              </motion.div>
            </motion.div>
          )}

          {callStatus === "connected" && (
            <motion.div key="connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold mb-4">Connected to Azmth</h2>
              <motion.div variants={callStatusVariants} animate="connected" className="mb-6">
                <Waveform size={64} className="mx-auto text-green-400" />
              </motion.div>
              <div className="mb-4">
                <Button
                  onClick={toggleListening}
                  variant={isListening ? "destructive" : "default"}
                  className="w-full mb-2"
                >
                  <Mic className={`mr-2 ${isListening ? "animate-pulse" : ""}`} />
                  {isListening ? "Stop" : "Start"} Listening
                </Button>
              </div>
              <AnimatePresence>
                {transcript && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-4 text-sm"
                  >
                    {transcript}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {callStatus === "ended" && (
            <motion.div key="ended" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-2xl font-bold mb-4">Call Ended</h2>
              <motion.div variants={callStatusVariants} animate="ended" className="mb-6">
                <X size={64} className="mx-auto text-red-400" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button onClick={handleEndCall} variant="destructive" className="mt-4 w-full">
          <X className="mr-2" /> End Call
        </Button>
      </motion.div>
    </motion.div>
  )
}

