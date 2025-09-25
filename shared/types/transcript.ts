export interface TranscriptSegment {
  guestId: string;
  start: number;
  end: number;
  text: string;
}

export interface TranscriptChunk {
  meetingId: string;
  chunkStart: number;
  chunkEnd: number;
  transcripts: TranscriptSegment[];
}
