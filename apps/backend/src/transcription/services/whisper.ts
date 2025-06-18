// whisper.ts
import { WebSocket } from 'ws';

type SessionMeta = {
  meetingId: string;
  speaker: string;
};

export const forwardToWhisper = (audioBuffer: Buffer, meta: SessionMeta): Promise<any> => {
  return new Promise((resolve, reject) => {
    console.log("[Backend→Whisper] Connecting to Python Whisper service...");
    const whisperWS = new WebSocket(`ws://localhost:8000/`);

    whisperWS.on('open', () => {
      console.log("[Backend→Whisper] Connected. Sending audio buffer...");
      whisperWS.send(audioBuffer);
    });

    whisperWS.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());
        console.log("[Backend→Whisper] Received transcription:", response);
        whisperWS.close();
        resolve(response);
      } catch (err) {
        console.error("[Backend→Whisper] Failed to parse response:", err);
        reject('Invalid response from Whisper');
      }
    });

    whisperWS.on('error', (err) => {
      console.error("[Backend→Whisper] WebSocket error:", err);
      reject(err);
    });
  });
};
