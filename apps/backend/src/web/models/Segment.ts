import mongoose from 'mongoose';

export interface ISegment {
  meetingId: mongoose.Types.ObjectId;
  hostmail: string;
  segmentNumber: number;
  transcriptText: string;
  timestamp: Date;
  duration?: number;
}

const segmentSchema = new mongoose.Schema<ISegment>({
  meetingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Meeting', 
    required: true 
  },
  hostmail: { 
    type: String, 
    required: true 
  },
  segmentNumber: { 
    type: Number, 
    required: true 
  },
  transcriptText: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  duration: { 
    type: Number 
  }
}, {
  timestamps: true
});

// Create compound index for efficient querying
segmentSchema.index({ meetingId: 1, segmentNumber: 1 });
segmentSchema.index({ meetingId: 1, timestamp: 1 });

export const Segment = mongoose.model<ISegment>('Segment', segmentSchema);