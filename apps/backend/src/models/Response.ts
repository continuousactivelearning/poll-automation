import mongoose, { Document, Schema } from 'mongoose';

export interface IResponse extends Document {
  pollId: mongoose.Types.ObjectId;
  userId: string;
  answer: number;
  responseTime: number;
  createdAt: Date;
}

const ResponseSchema: Schema = new Schema({
  pollId: { type: Schema.Types.ObjectId, ref: 'Poll', required: true },
  userId: { type: String, required: true },
  answer: { type: Number, required: true },
  responseTime: { type: Number, required: true }, // in seconds
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IResponse>('Response', ResponseSchema);