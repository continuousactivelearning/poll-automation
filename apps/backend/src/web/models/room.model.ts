// // File: apps/backend/src/web/models/Room.ts

// import mongoose, { Document, Schema } from 'mongoose';

// export interface IRoom extends Document {
//   code: string;
//   name: string;
//   hostId?: string;
//   hostName?: string;
//   isActive: boolean;
//   participants: string[];
//   maxParticipants?: number;
//   settings?: {
//     questionFrequencyMinutes: number;
//     questionsPerPoll: number;
//     visibilityMinutes: number;
//     difficulty: 'Easy' | 'Medium' | 'Hard';
//   };
//   createdAt: Date;
//   updatedAt: Date;
// }

// const roomSchema = new Schema<IRoom>({
//   code: { type: String, required: true, unique: true },
//   name: { type: String, required: true },
//   hostId: { type: String },
//   hostName: { type: String },
//   isActive: { type: Boolean, default: true },
//   participants: { type: [String], default: [] },
//   maxParticipants: { type: Number },
//   settings: {
//     questionFrequencyMinutes: { type: Number },
//     questionsPerPoll: { type: Number },
//     visibilityMinutes: { type: Number },
//     difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
//   },
// }, { timestamps: true });

// export default mongoose.model<IRoom>('Room', roomSchema); 
// File: apps/backend/src/web/models/room.model.ts
import mongoose, { Document, Schema } from 'mongoose';

// Interface for an individual participant in a room
interface Participant {
  userId: mongoose.Types.ObjectId;
  name: string;
  avatar: string;
   email: string; // <-- ADD THIS LINE
}

export interface IRoom extends Document {
  code: string;
  name: string;
  hostId: mongoose.Types.ObjectId;
  hostName: string; // <-- Added
  hostSocketId?: string; // <-- Added for real-time host communication
  isActive: boolean;
  participants: Participant[];
  currentPoll?: mongoose.Types.ObjectId;
}

const RoomSchema = new Schema<IRoom>({
  code: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hostName: { type: String, required: true }, // <-- Added
  hostSocketId: { type: String }, // <-- Added
  isActive: { type: Boolean, default: true },
  participants: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: String,
    avatar: String,
     email: String // <-- ADD THIS LINE

  }],
  currentPoll: { type: Schema.Types.ObjectId, ref: 'Poll', default: null },
}, { timestamps: true });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);