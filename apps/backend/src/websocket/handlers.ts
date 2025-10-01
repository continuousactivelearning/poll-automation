// // handlers.ts
// import WebSocket, { RawData } from 'ws';
// import { forwardToWhisper, closeWhisperConnection } from '../transcription/services/whisper';

// // Define a type for our session metadata and the Whisper WebSocket itself
// interface SessionData {
//   meetingId: string;
//   speaker: string;
//   whisperWs: WebSocket | null; // The WebSocket connection to the Whisper service for this session
// }

// // This store will hold metadata AND the associated Whisper WS for each active client connection
// const connectionStore = new Map<WebSocket, SessionData>();

// export const handleSocketMessage = async (
//   ws: WebSocket, // The client's WebSocket
//   data: RawData,
//   isBinary: boolean
// ) => {
//   try {
//     if (!isBinary) {
//       const msg = JSON.parse(data.toString());
//       if (msg.type === 'start') {
//         const sessionMeta = {
//           meetingId: msg.meetingId,
//           speaker: msg.speaker,
//           whisperWs: null // Initialize, will be set once connected
//         };
//         connectionStore.set(ws, sessionMeta);
//         console.log(`[Backend WS] Session started:`, sessionMeta);

//         // --- NEW: Establish persistent connection to Whisper for this session ---
//         const whisperWsPromise = forwardToWhisper(ws, sessionMeta); // Pass client WS to associate

//         // Await the whisper connection to be established. 
//         // This is a crucial change: we connect to whisper ONCE per client session.
//         const whisperWs = await whisperWsPromise;
//         if (whisperWs) {
//           const currentSession = connectionStore.get(ws);
//           if (currentSession) {
//             currentSession.whisperWs = whisperWs; // Store the whisper WS for this session
//             connectionStore.set(ws, currentSession);
//             console.log(`[Backend WS] Persistent Whisper WS established for meeting: ${sessionMeta.meetingId}`);
//           }
//         }

//       } else if (msg.type === 'end') { // Optional: if frontend sends an 'end' message
//           const sessionData = connectionStore.get(ws);
//           if (sessionData && sessionData.whisperWs) {
//               closeWhisperConnection(sessionData.whisperWs);
//               console.log(`[Backend WS] End signal received for meeting: ${sessionData.meetingId}. Closing Whisper connection.`);
//           }
//           // The client's WS will close itself, triggering the cleanup in connection.ts
//       }
//     } else {
//       const sessionData = connectionStore.get(ws);

//       if (!sessionData || !sessionData.whisperWs) {
//         console.warn('[Backend WS] Audio received before session or Whisper connection established for this client.');
//         return;
//       }

//       const audioBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
//       console.log(`[Backend WS] Forwarding audio chunk (${audioBuffer.length} bytes) to Whisper for meeting: ${sessionData.meetingId}...`);

//       // --- NEW: Send audio chunk directly to the *persistent* Whisper WS ---
//       // Whisper service will handle the buffering/streaming
//       sessionData.whisperWs.send(audioBuffer);
//     }
//   } catch (err) {
//     console.error('[Backend WS] Error in message handler:', err);
//   }
// };

// // Update cleanup logic to also close the associated Whisper connection
// export const removeConnectionMeta = (ws: WebSocket) => {
//   const sessionData = connectionStore.get(ws);
//   if (sessionData) {
//     if (sessionData.whisperWs) {
//       closeWhisperConnection(sessionData.whisperWs); // Ensure Whisper WS is closed
//       console.log(`[Backend WS] Closing associated Whisper WS for meeting: ${sessionData.meetingId}`);
//     }
//     connectionStore.delete(ws);
//     console.log(`[Backend WS] Cleaned up metadata for disconnected client. Store size: ${connectionStore.size}`);
//   }
// };