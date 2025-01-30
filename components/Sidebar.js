"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, User, Phone, PhoneOff } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function Sidebar() {
  const pathname = usePathname()
  const [callStatus, setCallStatus] = useState("idle")
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

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
              // Handle audio URL as needed
            }
          })
          .catch((error) => console.error("Error accessing microphone. Please check permissions.", error))
      }
    }
  }, [])

  const startCall = () => {
    audioChunksRef.current = []
    mediaRecorderRef.current.start()
    setCallStatus("calling")
  }

  const endCall = () => {
    mediaRecorderRef.current.stop()
    setCallStatus("idle")
  }

  return (
    <div className="w-64 bg-black text-white p-4 flex flex-col">
      <div className="text-2xl font-bold mb-8">azmth</div>
      <nav className="space-y-4 py-5">
        <Link href="/" className={`flex items-center space-x-2 p-2 rounded-md ${pathname === "/" ? "bg-blue-500 text-white" : "text-blue-400 hover:text-blue-300"}`}>
          <Home />
          <span>Home</span>
        </Link>
        <Link href="/personal-assistance" className={`flex items-center space-x-2 p-2 rounded-md ${pathname === "/personal-assistance" ? "bg-blue-500 text-white" : "text-blue-400 hover:text-blue-300"}`}>
          <User />
          <span>Personal Assistance</span>
        </Link>
      </nav>
      <div className="mt-auto border-t pt-4">
        <h2 className="text-lg font-bold mb-2">Call Interface</h2>
        {callStatus === "calling" ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center justify-center bg-gray-800 p-6 rounded-lg shadow-lg"
          >
            <Phone className="text-green-400 animate-ping" size={48} />
            <p className="mt-2">Calling...</p>
            <Button onClick={endCall} variant="destructive" className="mt-4">
              <PhoneOff /> End Call
            </Button>
          </motion.div>
        ) : (
          <Button onClick={startCall}>
            <Phone /> Start Call
          </Button>
        )}
      </div>
    </div>
  )
}
