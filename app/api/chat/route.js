import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    // Check if the request is multipart form data or JSON
    const contentType = req.headers.get("content-type") || ""

    let message, audioFile

    if (contentType.includes("multipart/form-data")) {
      // Handle multipart form data (from personal assistance page)
      const formData = await req.formData()
      message = formData.get("transcript")
      audioFile = formData.get("audio")

      if (!audioFile) {
        return NextResponse.json({ error: "Audio file is missing" }, { status: 400 })
      }

      if (!message) {
        return NextResponse.json({ error: "Transcript is missing" }, { status: 400 })
      }

      // Here you would typically process the audio file
      // For now, we'll just log some information about it
      console.log("Received audio file:", audioFile.name, "Size:", audioFile.size, "bytes")
      console.log("Received transcript:", message)

      // You might want to save the audio file or process it further here
      // For example, you could use the 'fs' module to save it to disk
      // or use a cloud storage service to store it

      return NextResponse.json({
        response: `Azmth: I received your voice message. The transcript says: "${message}". The audio file ${audioFile.name} (${audioFile.size} bytes) was successfully processed.`,
      })
    } else if (contentType.includes("application/json")) {
      // Handle JSON data (from home page)
      const { message: textMessage } = await req.json()

      if (!textMessage) {
        return NextResponse.json({ error: "Message is missing" }, { status: 400 })
      }

      message = textMessage

      return NextResponse.json({
        response: `Azmth: I received your message: "${message}"`,
      })
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 })
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}

