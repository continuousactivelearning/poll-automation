// apps/frontend/src/components/MicSettingsManager.tsx

import React, { useEffect, useRef, useState } from "react";
import MicControls from "./MicControls";
import { MicrophoneStreamer } from "../utils/microphoneStream";
import type { TranscriptionResult } from "../../../../shared/types/src/websocket";


type MicSettingsManagerProps = {
  meetingId: string;
  speaker: string;
  onTranscription: (data: TranscriptionResult) => void;
  onStreamEnd: () => void;
  onError: (err: unknown) => void;
};

const MicSettingsManager: React.FC<MicSettingsManagerProps> = ({
  meetingId,
  speaker,
  onTranscription,
  onStreamEnd,
  onError,
}) => {
  const [deviceId, setDeviceId] = useState<string>("");
  const [volume, setVolume] = useState<number>(1);

  const streamerRef = useRef<MicrophoneStreamer | null>(null);

  // Initialize the streamer when component mounts
  useEffect(() => {
    if (!streamerRef.current) {
      streamerRef.current = new MicrophoneStreamer(
        meetingId,
        speaker,
        onTranscription,
        onStreamEnd,
        onError,
        { deviceId, volume }
      );
    }
  }, []);

  // Update config on change
  const handleMicChange = (newDeviceId: string, newVolume: number) => {
    setDeviceId(newDeviceId);
    setVolume(newVolume);
    streamerRef.current?.setMicConfig({
      deviceId: newDeviceId,
      volume: newVolume,
    });
  };

  // Optional helpers to control externally
  const startStreaming = () => streamerRef.current?.startStreaming();
  const stopStreaming = () => streamerRef.current?.stopStreaming();

  // Expose buttons for demo/testing (optional)
  return (
    <>
      <MicControls
        selectedDeviceId={deviceId}
        volume={volume}
        onChange={handleMicChange}
      />
      <div style={{ marginTop: "1rem" }}>
        <button onClick={startStreaming}>Start Streaming</button>
        <button onClick={stopStreaming} style={{ marginLeft: "1rem" }}>
          Stop Streaming
        </button>
      </div>
    </>
  );
};

export default MicSettingsManager;
