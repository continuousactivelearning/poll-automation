// apps/backend/src/web/models/Session.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for allowed participants from CSV
interface IAllowedParticipant {
  email: string;
  name?: string; // Optional name from CSV
}

// Interface for joined participants (students who have entered the room)
interface IJoinedParticipant {
  userId: Types.ObjectId; // Reference to the User (Student) who joined
  email: string; // Store student email for easier lookup
  fullName: string; // Store student full name
  joinedAt: Date;
}

// Define the interface for a Session document
export interface ISession extends Document {
  host: Types.ObjectId; // Reference to the User (Host) who created the session
  hostName: string; // Store host's name for easier access
  hostEmail: string; // Store host's email for easier access
  roomCode: string; // Unique code for the session
  sessionTitle: string;
  createdAt: Date;
  endedAt: Date; // Calculated based on initial duration + extensions
  isActive: boolean; // True if the session is currently active/running
  allowedParticipants: IAllowedParticipant[]; // Emails from uploaded CSV
  joinedParticipants: IJoinedParticipant[]; // NEW: List of students currently in the session
  approvedPollsCount: number; // Count of polls approved within this session
}

// Define the Session Schema
const SessionSchema: Schema = new Schema({
  host: {
    type: Schema.Types.ObjectId,
    ref: 'User', // References the User model
    required: true,
  },
  hostName: {
    type: String,
    required: true,
  },
  hostEmail: {
    type: String,
    required: true,
  },
  roomCode: {
    type: String,
    required: [true, 'Room code is required'],
    trim: true,
    uppercase: true,
    minlength: [6, 'Room code must be 6 characters'],
    maxlength: [6, 'Room code must be 6 characters'],
  },
  sessionTitle: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    maxlength: [100, 'Session title cannot be more than 100 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
    required: true, // Will be calculated based on initial duration
  },
  isActive: {
    type: Boolean,
    default: true, // A newly created session is active
  },
  allowedParticipants: [
    {
      email: {
        type: String,
        required: true,
        match: [
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          'Please enter a valid email address',
        ],
      },
      name: {
        type: String,
        trim: true,
      },
    },
  ],
  joinedParticipants: [ // NEW: Array to store joined participants
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      fullName: {
        type: String,
        required: true,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  approvedPollsCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields automatically (for the document itself)
});

// Explicitly define the unique index for roomCode here
SessionSchema.index({ roomCode: 1 }, { unique: true }); // This is the preferred way

// Export the Session Model
const Session = mongoose.model<ISession>('Session', SessionSchema);

export default Session;
