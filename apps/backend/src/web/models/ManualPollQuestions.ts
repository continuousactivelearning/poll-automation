// apps/backend/src/web/models/ManualPollQuestion.ts
import mongoose, { Schema, Document, Types, model } from 'mongoose';

// Interface for a single poll option
interface IPollOption {
  id: string;
  text: string;
}

// 1. Define the Answer Interface (for TypeScript)
interface IPollAnswer {
  userId: Types.ObjectId;
  email: string;
  answer: string;
  answeredAt: Date;
}

// 2. Define the Main Poll Interface (updated to include answers)
export interface IManualPollQuestion extends Document {
  sessionId: Types.ObjectId; // Reference to the Session this poll belongs to
  host: Types.ObjectId; // Reference to the User (Host) who created this poll
  questionTitle: string;
  questionType: "mcq" | "truefalse" | "shortanswer" | "opinion";
  options: IPollOption[];
  timerEnabled: boolean;
  timerDuration: number;
  timerUnit: "seconds" | "minutes";
  shortAnswerPlaceholder?: string; // For shortanswer type
  correctAnswer?: string; // For mcq and truefalse types
  createdAt: Date;
  approvedAt?: Date; // Timestamp when the poll was "pushed" or made active
  isActive: boolean; // Indicates if this specific poll question is currently active for students
  // CRITICAL ADDITION:
  answers?: IPollAnswer[]; // Array of poll submissions
}

// 3. Define the Answer Schema (Sub-document)
const AnswerSchema = new Schema<IPollAnswer>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  answer: { type: String, required: true }, // The selected option ID or short text
  answeredAt: { type: Date, default: Date.now },
}, { _id: false }); // Using false for _id since they are sub-documents

// 4. Define the ManualPollQuestion Schema
const ManualPollQuestionSchema = new Schema<IManualPollQuestion>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session', // References the Session model
    required: true,
  },
  host: {
    type: Schema.Types.ObjectId,
    ref: 'User', // References the User model
    required: true,
  },
  questionTitle: {
    type: String,
    required: [true, 'Poll question title is required'],
    trim: true,
  },
  questionType: {
    type: String,
    enum: ['mcq', 'truefalse', 'shortanswer', 'opinion'],
    required: true,
  },
  options: [
    {
      id: { type: String, required: true },
      text: { type: String, required: true },
    },
  ],
  timerEnabled: {
    type: Boolean,
    default: false,
  },
  timerDuration: {
    type: Number,
    default: 30, // Default to 30 seconds
  },
  timerUnit: {
    type: String,
    enum: ['seconds', 'minutes'],
    default: 'seconds',
  },
  shortAnswerPlaceholder: {
    type: String,
  },
  correctAnswer: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: { // When the host pushes this poll to be active
    type: Date,
  },
  isActive: { // If this specific poll question is currently the one being displayed
    type: Boolean,
    default: false,
  },
  // CRITICAL FIX: Add the answers array to the main schema
  answers: {
    type: [AnswerSchema],
    default: [],
  },
});

// Create and export the ManualPollQuestion model
const ManualPollQuestion = model<IManualPollQuestion>('ManualPollQuestion', ManualPollQuestionSchema);

export default ManualPollQuestion;