export type SpeakerRole = 'host' | 'participant';

export interface AudioChunkMessage {
  type: 'audio_chunk';
  meetingId: string;
  speakerId: string; // Added speakerId for unique identification
  speaker: SpeakerRole;
  audio: string; // base64 encoded
  timestamp: number; // Added for ordering
}

export interface TranscriptionMessage {
  type: 'transcription';
  meetingId: string;
  speakerId: string;
  speaker: SpeakerRole;
  text: string;
  timestamp: number;
}

// Add connection message for initial client metadata
export interface ConnectionMessage {
  type: 'connection';
  meetingId: string;
  speakerId: string;
  role: SpeakerRole;
}