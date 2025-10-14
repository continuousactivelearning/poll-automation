// import mongoose, { Document, Schema } from 'mongoose';

// export interface PollQuestion {
//   question: string;
//   options: string[];
//   correct_answer: string;
//   explanation: string;
//   difficulty: 'Easy' | 'Medium' | 'Hard';
//   concept: string;
//   meeting_id: string;
//   created_at: Date;
//   is_active: boolean;
//   is_approved: boolean;
// }

// export interface PollConfig extends Document {
//   questionFrequencyMinutes: number;
//   questionsPerPoll: number;
//   visibilityMinutes: number;
//   difficulty: 'Easy' | 'Medium' | 'Hard';
//   questions: PollQuestion[];
// }

// const pollQuestionSchema = new Schema<PollQuestion>({
//   question: { type: String, required: true },
//   options: [{ type: String, required: true }],
//   correct_answer: { type: String, required: true },
//   explanation: { type: String, required: true },
//   difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
//   concept: { type: String, required: true },
//   meeting_id: { type: String, required: true },
//   created_at: { type: Date, default: Date.now },
//   is_active: { type: Boolean, default: true },
//   is_approved: { type: Boolean, default: false },
// });

// const pollConfigSchema = new Schema<PollConfig>({
//   questionFrequencyMinutes: { type: Number, required: true, default: 5 },
//   questionsPerPoll: { type: Number, required: true, default: 3 },
//   visibilityMinutes: { type: Number, required: true, default: 5 },
//   difficulty: {
//     type: String,
//     enum: ['Easy', 'Medium', 'Hard'],
//     required: true,
//     default: 'Medium',
//   },
//   questions: [pollQuestionSchema],
// });

// export default mongoose.model<PollConfig>('PollConfig', pollConfigSchema);