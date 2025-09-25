import mongoose, { Document, Schema } from 'mongoose';

export interface PollGeneration extends Document {
  room_title: string;
  room_code: string;
  user_id: string; // or mongoose.Types.ObjectId if referencing User
}

const pollGenerationSchema = new Schema<PollGeneration>({
  room_title: { type: String, required: true },
  room_code: { type: String, required: true },
  user_id: { type: String, required: true }, // or use ObjectId with ref
});

export default mongoose.model<PollGeneration>('PollGeneration', pollGenerationSchema);
