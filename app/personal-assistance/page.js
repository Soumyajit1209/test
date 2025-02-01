"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Plus, Play, Pause, Search, Send } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechSynthesis } from "react-speech-kit";
import AudioBall from "@/components/AudioBall"; // Import the AudioBall component

export default function PersonalAssistance() {
  const [isRecording, setIsRecording] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [audioUrls, setAudioUrls] = useState({});
  const [transcript, setTranscript] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [sessions, setSessions] = useState([{ id: 1, messages: [] }]);
  const [currentSessionId, setCurrentSessionId] = useState(1);
  const [selectedSession, setSelectedSession] = useState(1);
  const [isVoicePriority, setIsVoicePriority] = useState(false); // Simple Mode: false, Advance Mode: true
  const [message, setMessage] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const textareaRef = useRef(null);
  const { speak, cancel, speaking } = useSpeechSynthesis();
  const [conversationId, setConversationId] = useState("20250201221415");
  const [questionText, setQuestionText] = useState("What specific data storage and synchronization protocols will you implement to ensure seamless integration of AZMTH's extracted todos and notes with your existing task management and note-taking applications?");

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Speech recognition setup
      if ("webkitSpeechRecognition" in window) {
        const SpeechRecognition = window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join("");
          setMessage(transcript);
        };
      }

      // Media recorder setup
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
            setAudioBlob(audioBlob);
            audioChunksRef.current = [];
          };
        })
        .catch((err) => console.error("Error accessing microphone:", err));

      // Cleanup
      return () => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === "recording"
        ) {
          mediaRecorderRef.current.stop();
        }
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }
  }, []);

  const toggleRecording = () => {
    if (!mediaRecorderRef.current || !recognitionRef.current) return;
    if (isRecording) {
      mediaRecorderRef.current.stop();
      recognitionRef.current.stop();
    } else {
      audioChunksRef.current = [];
      setMessage("");
      mediaRecorderRef.current.start();
      recognitionRef.current.start();
    }
    setIsRecording(!isRecording);
  };

  const createNewChat = () => {
    const newSessionId = sessions.length + 1;
    setSessions([...sessions, { id: newSessionId, messages: [] }]);
    setCurrentSessionId(newSessionId);
    setSelectedSession(newSessionId);
  };

  const handleSessionClick = (sessionId) => {
    setSelectedSession(sessionId);
    setCurrentSessionId(sessionId);
  };

  const togglePreview = async () => {
    if (!showPreview) {
      try {
        await fetch("https://api.globaltfn.tech/conversation/20250201221618", {
          headers: { accept: "application/json" },
        });
      } catch (error) {
        console.error("Error fetching preview data:", error);
      }
    }
    setShowPreview(!showPreview);
  };

  const handleSend = async () => {
    if (
      (message.trim() && !isVoicePriority) ||
      (isVoicePriority && audioBlob)
    ) {
      const audioUrl = isVoicePriority ? URL.createObjectURL(audioBlob) : null;

      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
              ...session,
              messages: [
                ...session.messages,
                {
                  type: "user",
                  content: isVoicePriority ? "🎤 Voice message" : message,
                  audioUrl: audioUrl,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
            : session
        )
      );

      try {
        const endpoint = conversationId
          ? `https://api.globaltfn.tech/continue_conversation/${conversationId}`
          : "https://api.globaltfn.tech/start_conversation";
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: message }),
        });

        const data = await response.json();

        setSessions((prev) =>
          prev.map((session) =>
            session.id === currentSessionId
              ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    type: "azmth",
                    content: data.response,
                    timestamp: new Date().toISOString(),
                  },
                ],
              }
              : session
          )
        );

        if (isVoicePriority) {
          speak({ text: data.response });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setSessions((prev) =>
          prev.map((session) =>
            session.id === currentSessionId
              ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    type: "azmth",
                    content: "Error processing your request.",
                    timestamp: new Date().toISOString(),
                  },
                ],
              }
              : session
          )
        );
      }

      setMessage("");
      setAudioBlob(null);
      if (isRecording) {
        toggleRecording();
      }
    }
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

  const handlePlayResponse = (text) => {
    if (speaking) {
      cancel();
    } else {
      speak({ text });
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  return (
    <div className="flex h-full">
      {/* Chat Section */}
      {!showPreview ? (
        <div className="flex-1 flex flex-col p-4 bg-gray-950 relative">
          {/* Toggle Button for Text/Voice Mode */}
          <AudioBall className="absolute inset-0 z-0" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-sm text-white">Simple</span>
            <Switch
              checked={isVoicePriority}
              onCheckedChange={setIsVoicePriority}
            />
            <span className="text-sm text-white">Advance</span>
            {/* Microphone Button */}
            <Button
              onClick={handleVoiceInput}
              variant={isRecording ? "destructive" : "default"}
              className={`${isRecording
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              <Mic className={isRecording ? "animate-pulse" : ""} />
            </Button>
          </div>

          {/* Render Simple Mode */}
          {!isVoicePriority && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Simple Mode
              </h2>
              <div className="flex gap-4">
                <Button onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause /> : <Play />}
                </Button>
                <Button onClick={() => alert("Interrupt!")}>Interrupt</Button>
              </div>
            </div>
          )}

          {/* Render Advance Mode */}
          {isVoicePriority && (
            <div className="flex-1 rounded-lg p-4 mb-4 flex flex-col justify-end">
              <div className="flex-1 overflow-auto mb-4">
                {selectedSession ? (
                  sessions
                    .find((session) => session.id === selectedSession)
                    ?.messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`mb-4 ${msg.type === "user" ? "text-right" : "text-left"
                          }`}
                      >
                        <div
                          className={`inline-block p-3 rounded-lg ${msg.type === "user" ? "bg-blue-600" : "bg-gray-700"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            {msg.content}
                            {msg.audioUrl && (
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
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        {msg.type === "azmth" && isVoicePriority && (
                          <Button
                            onClick={() => handlePlayResponse(msg.content)}
                            variant="ghost"
                            size="sm"
                            className="mt-1"
                          >
                            {speaking ? (
                              <Pause size={16} />
                            ) : (
                              <Play size={16} />
                            )}
                          </Button>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="text-center text-gray-400">
                    Select a session to view the conversation
                  </div>
                )}
              </div>
              <div className="flex items-end space-x-2">
                {!isVoicePriority && (
                  <div className="flex-1 relative">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      className="w-full pr-10 resize-none overflow-hidden bg-gray-800 border-gray-700"
                      style={{ minHeight: "40px", maxHeight: "200px" }}
                    />
                  </div>
                )}
                {isVoicePriority && (
                  <Button
                    onClick={toggleRecording}
                    variant={isRecording ? "destructive" : "default"}
                    className={`${isRecording
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                      }`}
                  >
                    <Mic className={isRecording ? "animate-pulse" : ""} />
                  </Button>
                )}
                <Button
                  onClick={handleSend}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send />
                </Button>
              </div>
              {isVoicePriority && (
                <div className="mb-4 p-3 bg-gray-800 rounded-lg text-white">
                  <h3 className="text-lg font-bold mb-2">Incoming Question</h3>
                  <p>{questionText}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 bg-gray-950">
          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-white mb-4">Preview Mode</h2>
            <div className="flex gap-4">
              <div className="w-1/2">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-2">
                    azmth knowledge
                  </h3>
                  <p className="text-white">Sample data from backend...</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg mt-4">
                  <h3 className="text-lg font-bold text-white mb-2">
                    Audio Player
                  </h3>
                  <div className="flex gap-2">
                    <Button onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause /> : <Play />}
                    </Button>
                    <Button onClick={() => alert("Clone your voice!")}>
                      Clone Your Voice
                    </Button>
                  </div>
                  <Button
                    className="mt-2 w-full"
                    onClick={() => alert("Start call!")}
                  >
                    Start Call
                  </Button>
                </div>
              </div>
              <div className="w-1/2">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-2">Search</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-2 bg-gray-700 text-white rounded-lg"
                      placeholder="Search..."
                    />
                    <Button>
                      <Search />
                    </Button>
                  </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg mt-4">
                  <h3 className="text-lg font-bold text-white mb-2">Notes</h3>
                  <div className="flex flex-col gap-2">
                    <div className="bg-gray-700 p-2 rounded-lg text-white">
                      Note 1
                    </div>
                    <div className="bg-gray-700 p-2 rounded-lg text-white">
                      Note 2
                    </div>
                    <div className="bg-gray-700 p-2 rounded-lg text-white">
                      Note 3
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat History */}
      <div className="w-1/4 border-r p-4 bg-gray-900">
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
            className={`cursor-pointer mb-2 p-3 rounded transition-colors ${session.id === selectedSession
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
          </div>
        ))}
        <Button className="mt-4 w-full" onClick={togglePreview}>
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>
      </div>
    </div>
  );
}