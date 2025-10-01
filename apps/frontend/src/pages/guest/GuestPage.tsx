import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Mic, MicOff, Volume2, VolumeX, Wifi, WifiOff, Pause, Play } from "lucide-react";
import { motion } from "framer-motion";
import GlassCard from "../../components/GlassCard";
import { GuestAudioStreamer, type GuestTranscriptMessage } from "../../utils/guestAudioStreamer";

const GuestPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get("meetingId") || "N/A";
  const displayName = searchParams.get("displayName") || "N/A";

  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isGuestMuted, setIsGuestMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'recording'>('disconnected');
  const [statusMessage, setStatusMessage] = useState('Click Start Recording to begin');
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioStreamerRef = useRef<GuestAudioStreamer | null>(null);

  useEffect(() => {
    // Initialize audio streamer
    const wsUrl = 'ws://localhost:8000/ws/asr';
    audioStreamerRef.current = new GuestAudioStreamer(wsUrl, meetingId, displayName);
    
    // Set up callbacks
    audioStreamerRef.current.setCallbacks({
      onTranscript: (transcript: GuestTranscriptMessage) => {
        console.log('🎯 [GUEST UI] Received transcript:', transcript);
        // Don't store transcripts locally - they go directly to host via WebSocket
        // Just log for debugging purposes
      },
      onStatusChange: (status) => {
        console.log('🔄 [GUEST UI] Status changed to:', status);
        setConnectionStatus(status);
        
        switch (status) {
          case 'connecting':
            setStatusMessage('Connecting to transcription service...');
            break;
          case 'connected':
            setStatusMessage('Connected - ready to record');
            break;
          case 'recording':
            setStatusMessage('Recording - your voice is being sent to host in real-time');
            break;
          case 'error':
            setStatusMessage('Connection error - please try again');
            break;
          case 'disconnected':
            setStatusMessage('Disconnected');
            break;
        }
      },
      onError: (error) => {
        console.error('❌ [GUEST UI] Audio streaming error:', error);
        setStatusMessage(`Error: ${error}`);
      }
    });

    return () => {
      // Cleanup on unmount
      if (audioStreamerRef.current?.isCurrentlyRecording()) {
        audioStreamerRef.current.stopRecording();
      }
    };
  }, [meetingId, displayName]);

  const startRecording = async () => {
    try {
      if (!audioStreamerRef.current) {
        throw new Error('Audio streamer not initialized');
      }

      setStatusMessage('Starting recording...');
      const success = await audioStreamerRef.current.startRecording();
      
      if (success) {
        setIsRecording(true);
        setIsMuted(false);
        setStatusMessage('Recording started - your voice is being transcribed in real-time');
      } else {
        setStatusMessage('Failed to start recording - check microphone permissions');
      }
    } catch (error) {
      console.error('❌ [GUEST UI] Failed to start recording:', error);
      setStatusMessage(`Failed to start recording: ${error}`);
    }
  };

  const stopRecording = async () => {
    try {
      if (!audioStreamerRef.current) {
        throw new Error('Audio streamer not initialized');
      }

      setStatusMessage('Stopping recording...');
      await audioStreamerRef.current.stopRecording();
      
      setIsRecording(false);
      setIsMuted(false);
      setIsGuestMuted(false);
      setStatusMessage('Recording stopped. Transcripts saved.');
    } catch (error) {
      console.error('❌ [GUEST UI] Failed to stop recording:', error);
      setStatusMessage(`Failed to stop recording: ${error}`);
    }
  };

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  };

  const toggleGuestMute = () => {
    if (!audioStreamerRef.current || !isRecording) {
      setStatusMessage('Cannot mute - not currently recording');
      return;
    }

    if (isGuestMuted) {
      // Resume speech recognition
      const success = audioStreamerRef.current.resumeSpeechRecognition();
      if (success) {
        setIsGuestMuted(false);
        setStatusMessage('Guest unmuted - your voice is being transcribed again');
      } else {
        setStatusMessage('Failed to unmute - speech recognition error');
      }
    } else {
      // Pause speech recognition
      const success = audioStreamerRef.current.pauseSpeechRecognition();
      if (success) {
        setIsGuestMuted(true);
        setStatusMessage('Guest muted - paused for host to speak');
      } else {
        setStatusMessage('Failed to mute - speech recognition error');
      }
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'connecting':
        return <Wifi className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <GlassCard className="p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
          <div className="text-white flex flex-col items-center text-center gap-6">
            <h1 className="text-3xl font-bold">🎙️ Guest Voice Input</h1>

            <div className="space-y-2 text-sm sm:text-base">
              <p><span className="text-gray-400 font-medium">Meeting ID:</span> {meetingId}</p>
              <p><span className="text-gray-400 font-medium">Your Display ID:</span> {displayName}</p>
              <p>
                <span className="text-gray-400 font-medium">Status:</span>{" "}
                {isRecording ? (
                  <span className="text-green-400 flex items-center gap-1">
                    <span>Recording</span>
                    {getConnectionIcon()}
                  </span>
                ) : (
                  <span className="text-yellow-400 flex items-center gap-1">
                    <span>Idle</span>
                    {getConnectionIcon()}
                  </span>
                )}
              </p>
              {isRecording && (
                <p>
                  <span className="text-gray-400 font-medium">Mic:</span>{" "}
                  {isMuted ? (
                    <span className="text-red-400">Muted</span>
                  ) : (
                    <span className="text-blue-400">Unmuted</span>
                  )}
                </p>
              )}
              {isRecording && (
                <p>
                  <span className="text-gray-400 font-medium">Speech Recognition:</span>{" "}
                  {isGuestMuted ? (
                    <span className="text-orange-400">Paused (Host Turn)</span>
                  ) : (
                    <span className="text-green-400">Active</span>
                  )}
                </p>
              )}
            </div>

            {/* Status Message */}
            <div className="bg-black/20 rounded-lg p-3 border border-white/10">
              <p className="text-sm text-gray-300">{statusMessage}</p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 justify-center">
              {isRecording ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg shadow"
                >
                  <MicOff className="w-4 h-4" />
                  Stop Recording
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={startRecording}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow"
                >
                  <Mic className="w-4 h-4" />
                  Start Recording
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                disabled={!mediaStreamRef.current}
                className={`flex items-center gap-2 ${isMuted
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-blue-600 hover:bg-blue-700"
                  } text-white px-5 py-2 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isMuted ? "Unmute" : "Mute"}
              </motion.button>

              {isRecording && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleGuestMute}
                  className={`flex items-center gap-2 ${isGuestMuted
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-purple-600 hover:bg-purple-700"
                    } text-white px-5 py-2 rounded-lg shadow`}
                >
                  {isGuestMuted ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isGuestMuted ? "Resume" : "Hold for Host"}
                </motion.button>
              )}
            </div>

            <p className="text-xs text-gray-400 pt-4 border-t border-white/10">
              Ensure microphone access is granted in your browser. Your voice will be transcribed and appear in the host's Audio Capture page in real-time.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default GuestPage;
