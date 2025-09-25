import mongoose from 'mongoose';

export const resultSchema = new mongoose.Schema({
  user_name: { type: String, required: true },
  user_id: { type: String, required: true },
  score: { type: Number, required: true },
  room_code: { type: String }, // Optional room code to group results
  created_at: { type: Date, default: Date.now },
});

const Result = mongoose.model('Result', resultSchema);
export { Result };
