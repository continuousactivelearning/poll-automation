import mongoose, { Document, Schema } from 'mongoose';

export interface IMeeting extends Document {
  meetingId: string;
  hostId: string;
  hostName?: string;
  participants: Array<{
    participantId: string;
    displayName?: string;
    role: 'host' | 'participant' | 'guest';
    joinedAt: Date;
    leftAt?: Date;
  }>;
  status: 'active' | 'completed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  metadata: {
    totalTranscripts?: number;
    totalQuestions?: number;
    lastQuestionGeneratedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema: Schema = new Schema({
  meetingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hostId: {
    type: String,
    required: true,
    index: true
  },
  hostName: {
    type: String,
    required: false
  },
  participants: [{
    participantId: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      required: false
    },
    role: {
      type: String,
      enum: ['host', 'participant', 'guest'],
      required: true
    },
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    leftAt: {
      type: Date,
      required: false
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    required: true,
    default: 'active',
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  endTime: {
    type: Date,
    required: false
  },
  duration: {
    type: Number,
    required: false,
    min: 0
  },
  metadata: {
    totalTranscripts: {
      type: Number,
      default: 0,
      min: 0
    },
    totalQuestions: {
      type: Number,
      default: 0,
      min: 0
    },
    lastQuestionGeneratedAt: {
      type: Date,
      required: false
    }
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
MeetingSchema.index({ meetingId: 1, status: 1 });
MeetingSchema.index({ hostId: 1, createdAt: -1 });
MeetingSchema.index({ status: 1, startTime: -1 });

export const Meeting = mongoose.model<IMeeting>('Meeting', MeetingSchema);