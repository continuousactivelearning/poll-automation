// File: apps/backend/src/web/models/poll.model.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IPoll extends Document {
  hostId: mongoose.Schema.Types.ObjectId;
  sessionId: mongoose.Schema.Types.ObjectId; // --- NEW ---
  title: string;
  type: 'mcq' | 'truefalse';
  options: string[];
  correctAnswer: string;
  timerDuration: number;
}

const PollSchema = new Schema<IPoll>({
  hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Room', required: true }, // --- NEW ---
  title: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'truefalse'], required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  timerDuration: { type: Number, required: true },
}, { timestamps: true });

export const Poll = mongoose.model<IPoll>('Poll', PollSchema);