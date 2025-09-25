import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import GlassCard from "../../components/GlassCard";
import GuestMicControls from "../../transcription/components/GuestRecorder";
import { getMicrophones, selectMicrophone } from "../../transcription/utils/micManager";

const GuestPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get("meetingId") || "N/A";
  const displayName = searchParams.get("displayName") || "N/A";

  const [isMuted, setIsMuted] = useState(false);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    getMicrophones().then((devices) => {
      setMicDevices(devices);
      if (devices[0]) handleMicChange(devices[0].deviceId);
    });
  }, []);

  // Restart volume monitoring if it stops working
  useEffect(() => {
    const checkVolumeMonitoring = () => {
      if (streamRef.current && (!audioCtxRef.current || audioCtxRef.current.state === 'closed')) {
        console.log('[GuestPage] Restarting volume monitoring...');
        setupAudioAnalysis(streamRef.current);
      }
    };

    const interval = setInterval(checkVolumeMonitoring, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [streamRef.current]);

  const handleMicChange = async (deviceId: string) => {
    setSelectedMic(deviceId);
    await selectMicrophone(deviceId);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId } });
    streamRef.current = stream;

    setupAudioAnalysis(stream);
    setIsMuted(false);
  };

  const setupAudioAnalysis = (stream: MediaStream) => {
    console.log('[GuestPage] Setting up audio analysis...');

    // Clean up existing audio context
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close();
    }
    if (scriptNodeRef.current) {
      scriptNodeRef.current.disconnect();
    }

    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    console.log('[GuestPage] Audio context and processor created');

    processor.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const avg = input.reduce((a, b) => a + Math.abs(b), 0) / input.length;

      // Show volume level even when muted (for visual feedback)
      if (!isMuted) {
        // Amplify for better sensitivity, then ease to 0–100 range
        const amplified = avg * 300; // increase multiplier as needed
        const eased = Math.min(100, Math.floor(amplified ** 1.2)); // nonlinear scaling
        setVolumeLevel(eased);
        if (eased > 5) console.log('[GuestPage] Volume level:', eased);
      } else {
        // Show reduced volume when muted but still show some activity
        const amplified = avg * 100;
        const eased = Math.min(30, Math.floor(amplified ** 1.2));
        setVolumeLevel(eased);
      }
    };

    source.connect(processor);

    // Connect to a dummy gain node to enable processing without audio output
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // Silent output
    processor.connect(gainNode);
    gainNode.connect(audioContext.destination);

    console.log('[GuestPage] Audio nodes connected');

    audioCtxRef.current = audioContext;
    scriptNodeRef.current = processor;
  };

  const toggleMute = () => {
    if (!streamRef.current) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    // Disable/enable audio tracks
    streamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !newMutedState;
    });

    // Reset volume level when muted
    if (newMutedState) {
      setVolumeLevel(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <GlassCard className="p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md">
          <div className="text-white flex flex-col items-center text-center gap-6">
            <h1 className="text-3xl font-bold">🎙️ Guest Voice Input</h1>

            <div className="space-y-2 text-sm sm:text-base">
              <p><span className="text-gray-400 font-medium">Meeting ID:</span> {meetingId}</p>
              <p><span className="text-gray-400 font-medium">Your Display ID:</span> {displayName}</p>
              <p><span className="text-gray-400 font-medium">Mic:</span> {isMuted ? <span className="text-red-400">Muted</span> : <span className="text-blue-400">Unmuted</span>}</p>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleMute}
              disabled={!streamRef.current}
              className={`flex items-center gap-2 ${
                !streamRef.current
                  ? "bg-gray-600 cursor-not-allowed"
                  : isMuted
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
              } text-white px-5 py-2 rounded-lg shadow disabled:opacity-50`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isMuted ? "Unmute" : "Mute"}
            </motion.button>

            {/* Mic Selector */}
            <div className="w-full text-left mt-6">
              <label className="block text-sm text-gray-300 mb-1">Select Microphone</label>
              <select
                value={selectedMic}
                onChange={(e) => handleMicChange(e.target.value)}
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600"
              >
                {micDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Mic ${device.deviceId}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Volume Bar */}
            <div className="w-full mt-4 text-sm text-gray-400">
              Volume Level: {volumeLevel}% {isMuted && "(Muted)"}
              <div className="w-full h-2 bg-gray-600 rounded mt-1 overflow-hidden">
                <div
                  className={`h-2 rounded transition-all duration-100 ease-linear ${
                    isMuted ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{ width: `${volumeLevel}%` }}
                />
              </div>
            </div>

            {/* Guest Transcription Controls */}
            <div className="mt-6 w-full">
              <GuestMicControls
                guestId={displayName}
                meetingId={meetingId}
                isMuted={isMuted}
                onTranscriptionReceived={(text) => {
                  setTranscriptions(prev => [...prev.slice(-4), text]);
                }}
              />
            </div>

            {/* Real-time Transcriptions Display */}
            {transcriptions.length > 0 && (
              <div className="mt-6 w-full">
                <h3 className="text-lg font-semibold text-white mb-3">Live Transcription</h3>
                <div className="bg-gray-800/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {transcriptions.map((text, index) => (
                    <div key={index} className="text-gray-300 text-sm mb-2 last:mb-0">
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default GuestPage;
