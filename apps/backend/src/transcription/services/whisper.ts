// apps/backend/src/transcription/services/whisper.ts
import WebSocket from 'ws';
import dotenv from 'dotenv'; // Import dotenv

dotenv.config(); // Load .env file

export interface SessionMeta {
  meetingId: string;
  speaker: string;
}

// Read Whisper service URL from environment variable
const WHISPER_SERVICE_URL = process.env.WHISPER_SERVICE_URL || 'ws://127.0.0.1:8000/';

export const forwardToWhisper = (clientWs: WebSocket, meta: SessionMeta): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
        try {
            console.log(`[Backend→Whisper] Establishing persistent connection to Python Whisper service at ${WHISPER_SERVICE_URL}...`);
            const whisperWS = new WebSocket(WHISPER_SERVICE_URL);

            const connectionTimeout = setTimeout(() => {
                console.error("[Backend→Whisper] Connection timeout establishing persistent Whisper WS.");
                whisperWS.close();
                reject(new Error("Whisper service connection timeout"));
            }, 10000);

            whisperWS.on('open', () => {
                clearTimeout(connectionTimeout);
                console.log("[Backend→Whisper] Persistent Whisper WS connected. Sending 'start' signal to Whisper.");
                whisperWS.send(JSON.stringify({ type: 'start', meetingId: meta.meetingId, speaker: meta.speaker }));
                resolve(whisperWS);
            });

            // ... (rest of the whisperWS.on('message'), 'error', 'close' handlers remain the same)
             whisperWS.on('message', (data) => {
                try {
                    const response = JSON.parse(data.toString());

                    if (response.type === "status") {
                        console.log(`[Backend→Whisper] Status: ${response.message}`);
                        return;
                    }

                    if (clientWs.readyState === WebSocket.OPEN) {
                        clientWs.send(JSON.stringify(response));
                    } else {
                        console.warn("[Backend→Whisper] Client WebSocket closed, could not forward transcription.");
                    }
                } catch (err) {
                    console.error("[Backend→Whisper] Failed to parse response from Whisper or forward:", err);
                }
            });

            whisperWS.on('error', (err) => {
                clearTimeout(connectionTimeout);
                console.error("[Backend→Whisper] Persistent WebSocket error:", err.message);
                reject(err);
            });

            whisperWS.on('close', (code, reason) => {
                console.log(`[Backend→Whisper] Persistent Whisper WS closed. Code: ${code}, Reason: ${reason.toString()}`);
            });


        } catch (err) {
            console.error("[Backend→Whisper] Error initiating persistent WebSocket connection:", err);
            reject(err);
        }
    });
};

export const closeWhisperConnection = (whisperWs: WebSocket) => {
    if (whisperWs && whisperWs.readyState === WebSocket.OPEN) {
        whisperWs.send(JSON.stringify({ type: 'end' }));
        whisperWs.close();
    }
};