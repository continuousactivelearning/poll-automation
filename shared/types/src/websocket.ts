export type SpeakerRole = 'host' | 'participant';

export interface AudioChunkMessage {
  type: 'audio_chunk';
  meetingId: string;
  speaker: SpeakerRole;
  audio: string; // base64 encoded
}

export interface TranscriptionMessage {
  type: 'transcription';
  meetingId: string;
  speaker: SpeakerRole;
  text: string;
}