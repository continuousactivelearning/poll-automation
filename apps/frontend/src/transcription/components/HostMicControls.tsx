import React, { useRef, useState } from 'react';
import type { StartMessage } from '@poll-automation/types';
import { getSelectedMicStream } from '../utils/micManager';
import { encodeWAV } from '../utils/wavEncoder';

interface HostMicControlsProps {
  meetingId: string;
  backendWsUrl: string;
}

const HostMicControls: React.FC<HostMicControlsProps> = ({ meetingId, backendWsUrl }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startStreaming = async () => {
    const stream = getSelectedMicStream();
    if (!stream) {
      console.error('No microphone stream available.');
      return;
    }

    const ws = new WebSocket(backendWsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      const startMessage: StartMessage = {
        type: 'start',
        guestId: 'host',
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
        const samples = e.inputBuffer.getChannelData(0);
        const wavBuffer = encodeWAV(samples, 16000);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(wavBuffer);
        }
      };

      setIsStreaming(true);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      stopStreaming();
    };
  };

const stopStreaming = () => {
  if (!wsRef.current) return;

  wsRef.current.send(JSON.stringify({ type: "stop" }));
  console.log('[HostMicControls] Sent stop');

  wsRef.current.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "done") {
        console.log('[HostMicControls] Received done, closing socket.');
        wsRef.current?.close();
        setIsStreaming(false);
      }
    } catch (_) {}
  });
};



  return (
    <div>
      <button onClick={isStreaming ? stopStreaming : startStreaming}>
        {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
      </button>
    </div>
  );
};

export default HostMicControls;
