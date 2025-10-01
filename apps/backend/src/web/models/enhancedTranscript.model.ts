import mongoose, { Document, Schema } from 'mongoose';

export interface ITranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
  finalized: boolean;
  confidence?: number;
}

export interface IEnhancedTranscript extends Document {
  meetingId: string;
  participantId: string;
  displayName?: string;
  role: 'host' | 'participant' | 'guest';
  segments: ITranscriptSegment[];
  fullText: string; // concatenated text from all segments
  summary?: string; // AI-generated summary if needed
  wordCount: number;
  totalDuration: number; // in milliseconds
  language?: string;
  savedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptSegmentSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  startTime: {
    type: Number,
    required: true,
    min: 0
  },
  endTime: {
    type: Number,
    required: true,
    min: 0
  },
  finalized: {
    type: Boolean,
    required: true,
    default: true
  },
  confidence: {
    type: Number,
    required: false,
    min: 0,
    max: 1
  }
}, { _id: false });

const EnhancedTranscriptSchema: Schema = new Schema({
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  participantId: {
    type: String,
    required: true,
    index: true
  },
  displayName: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['host', 'participant', 'guest'],
    required: true,
    index: true
  },
  segments: [TranscriptSegmentSchema],
  fullText: {
    type: String,
    required: true,
    text: true // Enable text search indexing
  },
  summary: {
    type: String,
    required: false
  },
  wordCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  totalDuration: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  language: {
    type: String,
    required: false,
    default: 'en-US'
  },
  savedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
EnhancedTranscriptSchema.index({ meetingId: 1, role: 1 });
EnhancedTranscriptSchema.index({ meetingId: 1, savedAt: -1 });
EnhancedTranscriptSchema.index({ wordCount: -1 });
EnhancedTranscriptSchema.index({ fullText: 'text' }); // Text search index

export const EnhancedTranscript = mongoose.model<IEnhancedTranscript>('EnhancedTranscript', EnhancedTranscriptSchema);