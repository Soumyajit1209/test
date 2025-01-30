"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

export default function PersonalAssistance() {
  const [isRecording, setIsRecording] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [audioUrls, setAudioUrls] = useState({});
  const [transcript, setTranscript] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
              audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, {
                type: "audio/wav",
              });
              const audioUrl = URL.createObjectURL(audioBlob);
              const messageId = Date.now().toString();
              setAudioUrls((prev) => ({ ...prev, [messageId]: audioUrl }));
              setChatHistory((prev) => [
                ...prev,
                { id: messageId, type: "user", content: `🎤 ${transcript}` },
              ]);
              handleSend(transcript, audioBlob);
            };
          })
          .catch((error) =>
            console.error(
              "Error accessing microphone. Please check permissions.",
              error
            )
          );
      }
      if ("webkitSpeechRecognition" in window) {
        recognitionRef.current = new window.webkitSpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (event) => {
          let interimTranscript = "";
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setTranscript(finalTranscript || interimTranscript);
        };
      }
    }
  }, [transcript]);

  const toggleRecording = () => {
    if (!mediaRecorderRef.current || !recognitionRef.current) return;
    if (isRecording) {
      mediaRecorderRef.current.stop();
      recognitionRef.current.stop();
    } else {
      audioChunksRef.current = [];
      setTranscript("");
      mediaRecorderRef.current.start();
      recognitionRef.current.start();
    }
    setIsRecording(!isRecording);
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col p-4 bg-gray-950">
        {/* Chat Section */}
        <div className="flex-1 border rounded-lg p-4 mb-4 flex flex-col justify-end">
          <div className="flex justify-between items-center">
            <input
              type="text"
              className="flex-1 p-2 bg-gray-800 text-white rounded-lg"
              placeholder="Type a message..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleRecording}
                variant={isRecording ? "destructive" : "default"}
              >
                <Mic className={isRecording ? "animate-pulse" : ""} />
              </Button>
              <Button onClick={() => alert("Message sent!")}>Send</Button>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowPreview(true)}>Preview</Button>
      </div>
      <div className="w-1/4 border-r p-4 bg-gray-900">
        {/* Chat History */}
        <h2 className="text-lg font-bold mb-2 text-white">Chat History</h2>
        {chatHistory.map((msg) => (
          <div key={msg.id} className="bg-gray-800 p-2 rounded mb-2 text-white">
            {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
}
