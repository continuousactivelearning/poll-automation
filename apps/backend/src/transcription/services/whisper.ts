import axios from 'axios';
import type { AudioChunk, TranscriptionResult } from '@poll-automation/types';

const WHISPER_API_URL = process.env.WHISPER_API_URL || 'http://localhost:8000/transcribe';

export async function transcribeAudio(chunk: AudioChunk): Promise<TranscriptionResult> {
  const response = await axios.post(WHISPER_API_URL, chunk);
  return response.data;
}