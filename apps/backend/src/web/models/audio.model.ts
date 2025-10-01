import mongoose, { Document, Schema } from 'mongoose';

export interface IAudio extends Document {
  meetingId: string;
  participantId: string;
  hostName?: string;
  role: 'host' | 'participant';
  text: string;
  confidence: number;
  timestamp: Date;
  sessionId?: string;
  isFinal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AudioSchema: Schema = new Schema({
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
  hostName: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['host', 'participant'],
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: false,
    index: true
  },
  isFinal: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true,
  collection: 'audios'
});

// Index for efficient queries
AudioSchema.index({ meetingId: 1, timestamp: 1 });
AudioSchema.index({ participantId: 1, timestamp: 1 });
AudioSchema.index({ role: 1, timestamp: 1 });

export default mongoose.model<IAudio>('Audio', AudioSchema);