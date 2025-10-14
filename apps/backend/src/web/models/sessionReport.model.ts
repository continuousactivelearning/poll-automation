// apps/backend/src/web/models/sessionReport.model.ts

import mongoose, { Document, Schema } from 'mongoose';

// Interface for the detailed report of a single student in a session
export interface IStudentSessionResult {
    userId: mongoose.Types.ObjectId;
    studentEmail: string;
    studentName: string;
    totalPolls: number;
    pollsAttempted: number;
    correctAnswers: number;
    totalPoints: number;
    streak: number; // Current streak (consecutive correct answers from the end)
    longestStreak?: number; // Longest streak achieved in the session
    averageTime: number; // Average time taken for answered questions
    accuracy: number; // Percentage of correct answers
}

// Interface for the overall session report document
export interface ISessionReport extends Document {
    sessionId: mongoose.Types.ObjectId;
    sessionName: string;
    hostId: mongoose.Types.ObjectId;
    hostEmail: string;
    sessionEndedAt: Date;
    studentResults: IStudentSessionResult[];
}

const StudentSessionResultSchema = new Schema<IStudentSessionResult>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentEmail: { type: String, required: true },
    studentName: { type: String, required: true },
    totalPolls: { type: Number, required: true },
    pollsAttempted: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
    streak: { type: Number, required: true },
    longestStreak: { type: Number, default: 0 },
    averageTime: { type: Number, required: true },
    accuracy: { type: Number, required: true },
}, { _id: false });


const SessionReportSchema = new Schema<ISessionReport>({
    sessionId: { type: Schema.Types.ObjectId, ref: 'Room', required: true, unique: true },
    sessionName: { type: String, required: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hostEmail: { type: String, required: true },
    sessionEndedAt: { type: Date, default: Date.now },
    studentResults: [StudentSessionResultSchema],
}, { timestamps: true });

export const SessionReport = mongoose.model<ISessionReport>('SessionReport', SessionReportSchema);