import { AudioChunkMessage } from '../../../../shared/types/src';
import { WebSocket } from 'ws';
import axios from 'axios';

export async function handleMessage(ws: WebSocket, message: AudioChunkMessage) {
  if (message.type === 'audio_chunk') {
    try {
      const response = await axios.post('http://localhost:8000/transcribe', {
        audio: message.audio,
        meetingId: message.meetingId,
        speaker: message.speaker,
      });

      const result = response.data;

      ws.send(
        JSON.stringify({
          type: 'transcription',
          meetingId: message.meetingId,
          speaker: message.speaker,
          text: result.text,
        })
      );
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  }
}