import { Schema, model, Document } from 'mongoose';

export interface IWholeTimerTranscript extends Document {
  sessionId: string;
  hostId: string;
  roomId?: string;
  startTime: Date;
  endTime?: Date;
  durationSelected: number; // in milliseconds
  combinedTranscript: string;
  status: 'running' | 'completed' | 'stopped';
  segmentCount: number; // number of segments included
  questionsGenerated?: boolean;
  questionIds?: string[]; // references to generated questions
  createdAt: Date;
  updatedAt: Date;
}

const WholeTimerTranscriptSchema = new Schema<IWholeTimerTranscript>({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  hostId: {
    type: String,
    required: true,
    index: true
  },
  roomId: {
    type: String,
    required: false,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: false
  },
  durationSelected: {
    type: Number,
    required: true,
    min: 60000, // minimum 1 minute
    max: 3600000 // maximum 60 minutes
  },
  combinedTranscript: {
    type: String,
    required: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'stopped'],
    required: true,
    default: 'running',
    index: true
  },
  segmentCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  questionsGenerated: {
    type: Boolean,
    default: false
  },
  questionIds: [{
    type: String,
    required: false
  }]
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
WholeTimerTranscriptSchema.index({ sessionId: 1, hostId: 1 });
WholeTimerTranscriptSchema.index({ status: 1, startTime: -1 });
WholeTimerTranscriptSchema.index({ hostId: 1, createdAt: -1 });
WholeTimerTranscriptSchema.index({ sessionId: 1, status: 1 });

// Virtual for calculated duration
WholeTimerTranscriptSchema.virtual('actualDuration').get(function() {
  if (this.endTime && this.startTime) {
    return this.endTime.getTime() - this.startTime.getTime();
  }
  return 0;
});

// Virtual for formatted duration
WholeTimerTranscriptSchema.virtual('formattedDuration').get(function() {
  const durationMs = this.durationSelected;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

export const WholeTimerTranscript = model<IWholeTimerTranscript>('WholeTimerTranscript', WholeTimerTranscriptSchema);