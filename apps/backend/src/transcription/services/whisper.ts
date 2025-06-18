// whisper.ts
import WebSocket from 'ws';

// Define SessionMeta interface directly here instead of importing it
export interface SessionMeta {
  meetingId: string;
  speaker: string;
}

// Function to establish and return a persistent WebSocket connection to Whisper
// It now takes the *client's* WebSocket as an argument to forward transcriptions back
export const forwardToWhisper = (clientWs: WebSocket, meta: SessionMeta): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
        try {
            console.log("[Backend→Whisper] Establishing persistent connection to Python Whisper service...");
            const whisperWS = new WebSocket(`ws://127.0.0.1:8000/`);

            const connectionTimeout = setTimeout(() => {
                console.error("[Backend→Whisper] Connection timeout establishing persistent Whisper WS.");
                whisperWS.close();
                reject(new Error("Whisper service connection timeout"));
            }, 10000); // 10 second timeout for initial connection

            whisperWS.on('open', () => {
                clearTimeout(connectionTimeout);
                console.log("[Backend→Whisper] Persistent Whisper WS connected. Sending 'start' signal to Whisper.");
                // Send the initial 'start' message to Whisper, indicating a new session and passing metadata
                whisperWS.send(JSON.stringify({ type: 'start', meetingId: meta.meetingId, speaker: meta.speaker }));
                resolve(whisperWS); // Resolve with the established WebSocket object
            });

            whisperWS.on('message', (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    
                    // Handle status messages
                    if (response.type === "status") {
                        console.log(`[Backend→Whisper] Status: ${response.message}`);
                        return; // Don't forward status messages to client
                    }
                    
                    // Forward transcription directly back to the original client
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
                reject(err); // Reject the promise if there's a connection error
            });

            whisperWS.on('close', (code, reason) => {
                console.log(`[Backend→Whisper] Persistent Whisper WS closed. Code: ${code}, Reason: ${reason.toString()}`);
                // This might happen if Whisper service restarts or crashes
            });

        } catch (err) {
            console.error("[Backend→Whisper] Error initiating persistent WebSocket connection:", err);
            reject(err);
        }
    });
};

// Function to explicitly close the Whisper WebSocket connection
export const closeWhisperConnection = (whisperWs: WebSocket) => {
    if (whisperWs && whisperWs.readyState === WebSocket.OPEN) {
        whisperWs.send(JSON.stringify({ type: 'end' })); // Send end signal
        whisperWs.close();
    }
};
