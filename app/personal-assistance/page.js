"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Plus, Play, Pause, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    audioRef.current.onended = () => setIsPlaying(false);
  }, []);

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
    setSessions([...sessions, { id: newSessionId, messages: [] }]);
    setCurrentSessionId(newSessionId);
    setSelectedSession(newSessionId);
  };

  const handleSessionClick = (sessionId) => {
    setSelectedSession(sessionId);
    setCurrentSessionId(sessionId);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="flex h-full">
      {/* Chat Section */}
      {!showPreview ? (
        <div className="flex-1 flex flex-col p-4 bg-gray-950 relative">
          {/* Toggle Button for Text/Voice Mode */}
          {/* //add audio ball here */}
          <AudioBall className="absolute inset-0 z-0" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-sm text-white">Simple</span>
            <Switch checked={isVoicePriority} onCheckedChange={setIsVoicePriority} />
            <span className="text-sm text-white">Advance</span>
          </div>

          {/* Render Simple Mode */}
          {!isVoicePriority && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold text-white mb-4">Simple Mode</h2>
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
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col p-4 bg-gray-950">
          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-white mb-4">Preview Mode</h2>
            <div className="flex gap-4">
              <div className="w-1/2">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-2">azmth knowledge</h3>
                  <p className="text-white">Sample data from backend...</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg mt-4">
                  <h3 className="text-lg font-bold text-white mb-2">Audio Player</h3>
                  <div className="flex gap-2">
                    <Button onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause /> : <Play />}
                    </Button>
                    <Button onClick={() => alert("Clone your voice!")}>Clone Your Voice</Button>
                  </div>
                  <Button className="mt-2 w-full" onClick={() => alert("Start call!")}>
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
                    <div className="bg-gray-700 p-2 rounded-lg text-white">Note 1</div>
                    <div className="bg-gray-700 p-2 rounded-lg text-white">Note 2</div>
                    <div className="bg-gray-700 p-2 rounded-lg text-white">Note 3</div>
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
          </div>
        ))}
        <Button className="mt-4 w-full" onClick={togglePreview}>
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>
      </div>
    </div>
  );
}