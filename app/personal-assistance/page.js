"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Plus, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PersonalAssistance() {
  const [isRecording, setIsRecording] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [audioUrls, setAudioUrls] = useState({});
  const [transcript, setTranscript] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [sessions, setSessions] = useState([{ id: 1, messages: [] }]);
  const [currentSessionId, setCurrentSessionId] = useState(1);
  const [selectedSession, setSelectedSession] = useState(1);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);

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

  const createNewChat = () => {
    const newSessionId = sessions.length + 1;
    setSessions((prev) => [...prev, { id: newSessionId, messages: [] }]);
    setCurrentSessionId(newSessionId);
    setSelectedSession(newSessionId);
  };

  const handleSessionClick = (sessionId) => {
    setSelectedSession(sessionId);
    setCurrentSessionId(sessionId);
  };

  const handlePlayPause = (audioUrl) => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    audioRef.current.onended = () => setIsPlaying(false);
  }, []);

  const currentSession = sessions.find(
    (session) => session.id === selectedSession
  );

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
        <div className="relative">
          <Button onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "Close" : "Preview"}
          </Button>
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full mb-2 w-full bg-gray-800 p-4 rounded-lg shadow-lg"
              >
                <div>
                  <h3 className="font-bold mb-2">Chat Summary</h3>
                  <p>
                    {currentSession?.messages
                      .map((msg) => msg.content)
                      .join(", ")}
                  </p>
                </div>
                {currentSession?.messages.some((msg) => msg.audioUrl) && (
                  <div className="mt-4">
                    <h3 className="font-bold mb-2">User Audio</h3>
                    {currentSession.messages
                      .filter((msg) => msg.audioUrl)
                      .map((msg, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Button
                            onClick={() => handlePlayPause(msg.audioUrl)}
                            variant="ghost"
                            size="sm"
                            className="hover:bg-blue-700"
                          >
                            {isPlaying ? (
                              <Pause size={16} />
                            ) : (
                              <Play size={16} />
                            )}
                          </Button>
                          <span>{msg.content}</span>
                        </div>
                      ))}
                  </div>
                )}
                {currentSession?.messages.some((msg) => msg.audioUrl) && (
                  <div className="mt-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Clone Your Voice
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="w-1/4 border-r p-4 bg-gray-900">
        {/* Chat History */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-white">Chat History</h2>
          <Button
            onClick={createNewChat}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={16} /> New Chat
          </Button>
        </div>
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`cursor-pointer mb-2 p-3 rounded transition-colors ${
              session.id === selectedSession
                ? "bg-blue-700 hover:bg-blue-800"
                : "bg-gray-800 hover:bg-gray-700"
            }`}
            onClick={() => handleSessionClick(session.id)}
          >
            <div className="font-medium">
              {session.messages.length > 0
                ? session.messages[0].content
                : `New Chat ${session.id}`}
            </div>
            {session.messages.length > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                {new Date(session.messages[0].timestamp).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
