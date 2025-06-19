import mongoose, { Document, Schema } from 'mongoose';

export interface IMeeting extends Document {
  meetingId: string;
  hostId: string;
  participants: string[];
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
}

const MeetingSchema: Schema = new Schema({
  meetingId: { type: String, required: true, unique: true },
  hostId: { type: String, required: true },
  participants: { type: [String], default: [] },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  isActive: { type: Boolean, default: true }
});

export default mongoose.model<IMeeting>('Meeting', MeetingSchema);

