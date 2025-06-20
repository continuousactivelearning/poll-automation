export type SpeakerRole = 'host' | 'participant';

// Re-export MicrophoneStreamer's TranscriptionResult for consistency
export interface TranscriptionResult {
    type: 'transcription' | 'error' | 'status'; // Added 'error' and 'status' types from backend
    meetingId: string;
    speaker: string; // The backend sends 'speaker' as a string, not SpeakerRole for now. Keep consistent.
    text: string;
    segment_start?: number; // Optional, as it might not always be present or relevant for partials
    segment_end?: number;   // Optional
    language?: string;      // Optional
    is_final: boolean;
    message?: string; // For 'status' or 'error' messages from backend
}

// Keep if you specifically need a distinct type for audio chunk messages
// (though the current frontend sends raw ArrayBuffer for audio)
export interface AudioChunkMessage {
    type: 'audio_chunk';
    meetingId: string;
    speaker: SpeakerRole;
    audio: string; // base64 encoded (though frontend currently sends raw binary)
}

// It might be clearer to define specific message types for start/end signals:
export interface StartMessage {
    type: 'start';
    meetingId: string;
    speaker: string;
}

export interface EndMessage {
    type: 'end';
    meetingId: string;
    speaker: string;
}

// Union type for all messages the backend might receive from frontend
export type FrontendToServerMessage = StartMessage | EndMessage | ArrayBuffer; // ArrayBuffer for binary audio

// Union type for all messages the frontend might receive from backend
export type ServerToFrontendMessage = TranscriptionResult; // Backend only sends transcription or status/error