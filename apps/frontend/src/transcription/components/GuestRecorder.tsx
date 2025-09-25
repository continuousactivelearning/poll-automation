import React, { useRef, useState, useEffect } from 'react';
import type { StartMessage, ServerToClientMessage } from '@poll-automation/types';
import { getSelectedMicStream } from '../utils/micManager';
import { encodeWAV } from '../utils/wavEncoder';

// Helper function to merge audio buffers (same as host)
function mergeBuffers(buffers: Float32Array[]): Float32Array {
  const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const merged = new Float32Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    merged.set(buffer, offset);
    offset += buffer.length;
  }
  return merged;
}

interface GuestMicControlsProps {
  guestId: string;
  meetingId: string;
  onTranscriptionReceived?: (transcription: string) => void;
  isMuted: boolean; // Receive mute state from parent
}

const GuestMicControls: React.FC<GuestMicControlsProps> = ({
  guestId,
  meetingId,
  onTranscriptionReceived,
  isMuted
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioBufferRef = useRef<Float32Array[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMutedRef = useRef<boolean>(isMuted); // Track mute state in ref

  // Use same chunk interval as host (30 seconds default, minimum 1 second)
  const CHUNK_INTERVAL = Math.max(
    1000,
    parseInt(import.meta.env.VITE_CHUNK_INTERVAL || "30000")
  );

  // Update mute ref when prop changes
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);


  const startStreaming = async () => {
    const stream = getSelectedMicStream();
    if (!stream) {
      console.error('[GuestMicControls] No microphone stream available');
      return;
    }

    const ws = new WebSocket(import.meta.env.VITE_BACKEND_WS_URL_GUEST as string);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[GuestMicControls] WebSocket connected');

      const startMessage: StartMessage = {
        type: 'start',
        guestId,
        meetingId
      };
      ws.send(JSON.stringify(startMessage));

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);

      // Connect to a dummy gain node to enable processing without audio output
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Silent output
      processor.connect(gainNode);
      gainNode.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current) return; // Don't process audio when muted

        const samples = e.inputBuffer.getChannelData(0);
        // Buffer audio instead of sending immediately (like host)
        audioBufferRef.current.push(new Float32Array(samples));
      };

      setIsStreaming(true);

      // Start interval-based transmission (like host)
      intervalRef.current = setInterval(() => {
        if (audioBufferRef.current.length === 0) return;

        // Don't send audio when muted
        if (isMutedRef.current) {
          audioBufferRef.current = []; // Clear buffer when muted
          return;
        }

        const merged = mergeBuffers(audioBufferRef.current);
        const wav = encodeWAV(merged, 16000);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(wav);
        }
        audioBufferRef.current = []; // Clear buffer after sending
      }, CHUNK_INTERVAL);
    };

    ws.onmessage = (event) => {
      try {
        const data: ServerToClientMessage = JSON.parse(event.data);
        if (data.type === 'transcription' && data.text && onTranscriptionReceived) {
          onTranscriptionReceived(data.text);
        }
      } catch (err) {
        console.error('[GuestMicControls] Error parsing message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[GuestMicControls] WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('[GuestMicControls] WebSocket closed');
      setIsStreaming(false);
    };
  };
//function to stop streaming and send final audio chunk
  const stopStreaming = () => {
    if (!wsRef.current) return;

    // Send any remaining buffered audio before stopping
    if (audioBufferRef.current.length > 0) {
      const merged = mergeBuffers(audioBufferRef.current);
      const wav = encodeWAV(merged, 16000);
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(wav);
      }
    }

    wsRef.current.send(JSON.stringify({ type: "stop" }));
    console.log('[GuestMicControls] Sent stop signal');

    // Clean up interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Clear audio buffer
    audioBufferRef.current = [];

    wsRef.current.close();
    wsRef.current = null;
    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          onClick={startStreaming}
          disabled={isStreaming}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded"
        >
          {isStreaming ? 'Recording...' : 'Start Recording'}
        </button>

        <button
          onClick={stopStreaming}
          disabled={!isStreaming}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded"
        >
          Stop Recording
        </button>

      </div>

      {isStreaming && (
        <div className={`text-sm ${isMuted ? 'text-yellow-400' : 'text-green-400'}`}>
          🎙️ {isMuted ? 'Recording muted...' : 'Recording in progress...'}
        </div>
      )}
    </div>
  );
};

export default GuestMicControls;
