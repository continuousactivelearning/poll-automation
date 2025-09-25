import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { IncomingMessage } from 'http';
import type {
  ClientToServerMessage,
  ServerToClientMessage,
  TranscriptionResult,
  StartMessage,
} from '@poll-automation/types';
import { forwardToLLMBuffer } from '../services/llm-forwarder';

dotenv.config();

const WHISPER_WS_URL = process.env.WHISPER_WS_URL || 'ws://localhost:8000';
console.log('🔗 Backend will connect to Whisper at:', WHISPER_WS_URL);

interface ClientSession {
  frontendSocket: WebSocket;
  whisperSocket: WebSocket;
  guestId: string;
  meetingId: string;
}

export const setupWebSocketServer = () => {
  // Create a completely separate WebSocket server on port 3001
  const wss = new WebSocketServer({
    port: 3001,
    path: '/transcription',
  });
  console.log(
    `🎙️ Transcription WebSocket server running on ws://localhost:3001/transcription`
  );

  wss.on('connection', (frontendSocket: WebSocket, req: IncomingMessage) => {
    console.log(`🔗 New transcription WebSocket connection`);
    let session: ClientSession | null = null;

    frontendSocket.on('message', async (data: WebSocket.RawData, isBinary) => {
      try {
        if (!isBinary) {
          const msg: StartMessage = JSON.parse(data.toString());

          if (msg.type === 'start' && msg.guestId && msg.meetingId) {
            const whisperSocket = new WebSocket(WHISPER_WS_URL);

            whisperSocket.on('open', () => {
              const startMsg = JSON.stringify({
                type: 'start',
                guestId: msg.guestId,
                meetingId: msg.meetingId,
              });
              whisperSocket.send(startMsg);
            });

            whisperSocket.on('message', (whisperData) => {
              const transcript: TranscriptionResult = JSON.parse(
                whisperData.toString()
              );

              const forwardMsg: ServerToClientMessage = {
                type: 'transcription',
                text: transcript.text,
                start: transcript.start,
                end: transcript.end,
                guestId: transcript.guestId,
                meetingId: transcript.meetingId,
              };

              if (frontendSocket.readyState === WebSocket.OPEN) {
                frontendSocket.send(JSON.stringify(forwardMsg));
              }

              forwardToLLMBuffer(forwardMsg);
            });

            whisperSocket.on('error', (err) => {
              console.error('Whisper socket error:', err);
            });

            session = {
              frontendSocket,
              whisperSocket,
              guestId: msg.guestId,
              meetingId: msg.meetingId,
            };
          }
        } else if (session?.whisperSocket?.readyState === WebSocket.OPEN) {
          session.whisperSocket.send(data, { binary: true });
        }
      } catch (err) {
        console.error('WebSocket error:', err);
      }
    });

    frontendSocket.on('close', () => {
      session?.whisperSocket?.close();
    });
  });
};
