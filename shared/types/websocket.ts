export interface StartMessage {
  type: "start";
  meetingId: string;
  guestId: string;
}

export interface TranscriptionResult {
  type: "transcription";
  text: string;
  start: number;
  end: number;
  guestId: string;
  meetingId: string;
}

export type ClientToServerMessage = StartMessage;
export type ServerToClientMessage = TranscriptionResult;
