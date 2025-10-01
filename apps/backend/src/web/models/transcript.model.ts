import { Schema, model, Document } from 'mongoose';

export interface ITranscript extends Document {
  meetingId: string;
  role: 'host' | 'participant';
  participantId: string;
  text: string;
  type: 'partial' | 'final';
  startTime: Date;
  endTime: Date;
  timestamp: Date;
  audioFilePath?: string;
  duration?: number; // in seconds
}

const TranscriptSchema = new Schema<ITranscript>({
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['host', 'participant'],
    required: true
  },
  participantId: {
    type: String,
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['partial', 'final'],
    required: true,
    default: 'final'
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  audioFilePath: {
    type: String,
    required: false
  },
  duration: {
    type: Number,
    required: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
TranscriptSchema.index({ meetingId: 1, timestamp: 1 });
TranscriptSchema.index({ meetingId: 1, role: 1, participantId: 1 });
TranscriptSchema.index({ type: 1, timestamp: -1 });

export const Transcript = model<ITranscript>('Transcript', TranscriptSchema);