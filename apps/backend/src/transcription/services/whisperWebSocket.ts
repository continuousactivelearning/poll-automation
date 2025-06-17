import WebSocket from 'ws';
import { AudioChunkMessage, TranscriptionMessage } from '@poll-automation/types';

let ws: WebSocket | null = null;
const WHISPER_WS_URL = process.env.WHISPER_WS_URL || 'ws://localhost:8000/transcribe';

// Initialize WebSocket connection to Whisper
export function initializeWhisperWebSocket(): Promise<void> {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(WHISPER_WS_URL);

    ws.on('open', () => {
      console.log('Connected to Whisper WebSocket');
      resolve();
    });

    ws.on('error', (error) => {
      console.error('Whisper WebSocket error:', error);
      reject(error);
    });

    ws.on('close', () => {
      console.log('Whisper WebSocket disconnected');
      ws = null;
    });
  });
}

// Send audio chunk to Whisper
export function sendAudioChunk(chunk: AudioChunkMessage): Promise<TranscriptionMessage> {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('Whisper WebSocket not connected'));
      return;
    }

    ws.send(JSON.stringify(chunk));

    ws.once('message', (data: Buffer) => {
      try {
        const result = JSON.parse(data.toString()) as TranscriptionMessage;
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Reconnect on failure
export function reconnectWhisperWebSocket() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    initializeWhisperWebSocket().catch((error) => {
      console.error('Failed to reconnect to Whisper:', error);
      setTimeout(reconnectWhisperWebSocket, 5000); // Retry after 5s
    });
  }
}