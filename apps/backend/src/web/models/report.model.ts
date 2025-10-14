//apps/backend/src/web/models/report.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  roomId: mongoose.Schema.Types.ObjectId;
  pollId: mongoose.Schema.Types.ObjectId;
  userId: mongoose.Schema.Types.ObjectId;
  answer: string;
  isCorrect: boolean;
  timeTaken: number; // in seconds
  points: number;
}

const ReportSchema = new Schema<IReport>({
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  pollId: { type: Schema.Types.ObjectId, ref: 'Poll', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  answer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  timeTaken: { type: Number, required: true },
  points: { type: Number, required: true },
}, { timestamps: true });

export const Report = mongoose.model<IReport>('Report', ReportSchema);