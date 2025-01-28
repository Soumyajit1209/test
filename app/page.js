"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Mic, Send } from "lucide-react"

export default function Home() {
  const [isVoicePriority, setIsVoicePriority] = useState(false)
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const recognitionRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("")
        setMessage(transcript)
      }
    }
  }, [])

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      console.error("Speech recognition is not supported in this browser.")
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
    setIsRecording(!isRecording)
  }

  const handleSend = async () => {
    if (message.trim()) {
      const displayMessage = isVoicePriority ? `🎤 ${message}` : message

      // Add message to chat history
      setChatHistory((prev) => [...prev, { type: "user", content: displayMessage }])

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: message }),
        })
        const data = await response.json()
        setChatHistory((prev) => [...prev, { type: "azmth", content: data.response }])
      } catch (error) {
        console.error("Error sending message:", error)
        setChatHistory((prev) => [...prev, { type: "azmth", content: "Error processing your request." }])
      }

      setMessage("")
      if (isRecording) {
        toggleRecording()
      }
    }
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-end mb-4">
        <span className="mr-2">Text</span>
        <Switch checked={isVoicePriority} onCheckedChange={setIsVoicePriority} />
        <span className="ml-2">Voice</span>
      </div>
      <div className="flex-1 overflow-auto mb-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.type === "user" ? "text-right" : "text-left"}`}>
            <span className={`inline-block p-2 rounded-lg ${msg.type === "user" ? "bg-blue-500" : "bg-gray-700"}`}>
              {msg.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            placeholder={isVoicePriority ? "Speak your message..." : "Type your message..."}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              e.target.style.height = "auto"
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
            className="w-full pr-10 resize-none overflow-hidden"
            style={{ minHeight: "40px", maxHeight: "200px" }}
          />
        </div>
        {isVoicePriority && (
          <Button onClick={toggleRecording} variant={isRecording ? "destructive" : "default"}>
            <Mic className={isRecording ? "animate-pulse" : ""} />
          </Button>
        )}
        <Button onClick={handleSend}>
          <Send />
        </Button>
      </div>
    </div>
  )
}

