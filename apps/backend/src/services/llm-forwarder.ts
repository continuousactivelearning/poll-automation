import WebSocket from 'ws';
import dotenv from 'dotenv';
import {
  ServerToClientMessage,
  TranscriptChunk,
  TranscriptSegment
} from '@poll-automation/types';

dotenv.config();

const LLM_FORWARD_URL = process.env.LLM_FORWARD_URL || 'ws://localhost:5001/ws/llm';

type MeetingBuffer = {
  transcripts: TranscriptSegment[];
  timeout: NodeJS.Timeout;
  chunkStart: number;
  chunkEnd: number;
};

const buffers = new Map<string, MeetingBuffer>();

let llmSocket: WebSocket | null = null;

/**
 * Establish persistent WebSocket connection to LLM service
 */
function connectToLLM() {
  if (llmSocket && llmSocket.readyState === WebSocket.OPEN) return;

  llmSocket = new WebSocket(LLM_FORWARD_URL);

  llmSocket.on('open', () => {
    console.log('🧠 Connected to LLM WebSocket');
  });

  llmSocket.on('error', (err) => {
    console.error('❌ LLM WebSocket error:', err);
  });

  llmSocket.on('close', () => {
    console.warn('🔁 LLM WebSocket disconnected. Reconnecting...');
    setTimeout(connectToLLM, 2000);
  });
}

// Connect immediately on module load
connectToLLM();

/**
 * Buffers a new transcription result and schedules flush
 */
export function forwardToLLMBuffer(msg: ServerToClientMessage): void {
  const { meetingId, guestId, start, end, text } = msg;
  if (!meetingId) return;

  if (!buffers.has(meetingId)) {
    const buffer: MeetingBuffer = {
      transcripts: [],
      chunkStart: start,
      chunkEnd: end,
      timeout: setTimeout(() => flushBuffer(meetingId), 30_000)
    };
    buffers.set(meetingId, buffer);
  }

  const buffer = buffers.get(meetingId)!;

  buffer.transcripts.push({ guestId, start, end, text });
  buffer.chunkEnd = Math.max(buffer.chunkEnd, end);
}

/**
 * Sends the buffered chunk for a given meeting to the LLM WebSocket
 */
function flushBuffer(meetingId: string): void {
  const buffer = buffers.get(meetingId);
  if (!buffer || buffer.transcripts.length === 0) return;

  const payload: TranscriptChunk = {
    meetingId,
    chunkStart: buffer.chunkStart,
    chunkEnd: buffer.chunkEnd,
    transcripts: buffer.transcripts
  };

  if (llmSocket && llmSocket.readyState === WebSocket.OPEN) {
    llmSocket.send(JSON.stringify(payload));
    console.log(`✅ Forwarded transcript chunk to LLM for meeting ${meetingId}`);
  } else {
    console.warn(`⚠️ LLM socket not open. Skipped transcript for ${meetingId}`);
  }

  clearTimeout(buffer.timeout);
  buffers.delete(meetingId);
}
