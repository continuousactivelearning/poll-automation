import mongoose, { Document, Schema } from 'mongoose';

export interface IContent extends Document {
  meetingId: string;
  hostName?: string;
  hostId: string;
  participants: Array<{
    participantId: string;
    role: 'host' | 'participant';
    joinedAt: Date;
    leftAt?: Date;
  }>;
  transcript: Array<{
    speaker: string;
    role: 'host' | 'participant';
    text: string;
    timestamp: Date;
    confidence: number;
  }>;
  sessionStartTime: Date;
  sessionEndTime?: Date;
  totalDuration?: number; // in milliseconds
  wordCount: number;
  metadata: {
    audioQuality?: string;
    deviceInfo?: string;
    browserInfo?: string;
    speechRecognitionEngine?: string;
  };
  status: 'recording' | 'completed' | 'aborted';
  createdAt: Date;
  updatedAt: Date;
}

const ContentSchema: Schema = new Schema({
  meetingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  hostName: {
    type: String,
    required: false
  },
  hostId: {
    type: String,
    required: true,
    index: true
  },
  participants: [{
    participantId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['host', 'participant'],
      required: true
    },
    joinedAt: {
      type: Date,
      required: true
    },
    leftAt: {
      type: Date,
      required: false
    }
  }],
  transcript: [{
    speaker: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['host', 'participant'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    }
  }],
  sessionStartTime: {
    type: Date,
    required: true,
    index: true
  },
  sessionEndTime: {
    type: Date,
    required: false
  },
  totalDuration: {
    type: Number,
    required: false,
    min: 0
  },
  wordCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  metadata: {
    audioQuality: {
      type: String,
      required: false
    },
    deviceInfo: {
      type: String,
      required: false
    },
    browserInfo: {
      type: String,
      required: false
    },
    speechRecognitionEngine: {
      type: String,
      required: false,
      default: 'Web Speech API'
    }
  },
  status: {
    type: String,
    enum: ['recording', 'completed', 'aborted'],
    required: true,
    default: 'recording',
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

// Index for efficient querying
ContentSchema.index({ meetingId: 1, status: 1 });
ContentSchema.index({ hostId: 1, createdAt: -1 });
ContentSchema.index({ sessionStartTime: -1 });

export const Content = mongoose.model<IContent>('Content', ContentSchema);