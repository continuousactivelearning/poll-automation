import { WebSocket } from 'ws';
import { AudioChunkMessage, TranscriptionMessage } from '@poll-automation/types';
import { sendAudioChunk } from '../transcription/services/whisperWebSocket';
import { broadcastToMeeting } from '../transcription/services/connections';

export async function handleMessage(ws: WebSocket, message: AudioChunkMessage) {
  if (message.type === 'audio_chunk') {
    try {
      const result = await sendAudioChunk(message);
      const transcription: TranscriptionMessage = {
        type: 'transcription',
        meetingId: message.meetingId,
        speakerId: message.speakerId,
        speaker: message.speaker,
        text: result.text,
        timestamp: Date.now(),
      };

      // Broadcast to all clients in the meeting
      broadcastToMeeting(message.meetingId, JSON.stringify(transcription));
    } catch (error) {
      console.error('Error transcribing audio:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Transcription failed' }));
    }
  }
}