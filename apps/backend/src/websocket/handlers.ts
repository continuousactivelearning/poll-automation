// handlers.ts
import WebSocket, { RawData } from 'ws';
import { forwardToWhisper } from '../transcription/services/whisper';

let sessionMeta: { meetingId: string; speaker: string } | null = null;

export const handleSocketMessage = async (
  ws: WebSocket,
  data: RawData,
  isBinary: boolean
) => {
  try {
    if (!isBinary) {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'start') {
        sessionMeta = {
          meetingId: msg.meetingId,
          speaker: msg.speaker,
        };
        console.log(`[Backend WS] Session started:`, sessionMeta);
      }
    } else {
      if (!sessionMeta) {
        console.warn('[Backend WS] Audio received before metadata.');
        return;
      }

      const audioBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
      console.log(`[Backend WS] Forwarding audio (${audioBuffer.length} bytes) to Whisper...`);

      const transcription = await forwardToWhisper(audioBuffer, sessionMeta);
      console.log("[Backend WS] Transcription received:", transcription);

      ws.send(JSON.stringify(transcription));
    }
  } catch (err) {
    console.error('[Backend WS] Error in message handler:', err);
  }
};
