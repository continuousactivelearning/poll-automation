import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion extends Document {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  concept: string;
  created_at: Date;
  is_active: boolean;
  is_approved: boolean;
}

const QuestionSchema = new Schema<IQuestion>({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correct_answer: { type: String, required: true },
  explanation: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  concept: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true },
  is_approved: { type: Boolean, default: false },
});

export default mongoose.model<IQuestion>('PollQuestion', QuestionSchema);
