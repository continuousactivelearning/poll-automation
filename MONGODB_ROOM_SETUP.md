# MongoDB Room Code Implementation

## Overview

Your room codes are now stored in MongoDB instead of in-memory storage. This provides:

- ✅ **Persistence**: Room codes survive server restarts
- ✅ **Multiple Rooms**: Multiple hosts can have active rooms simultaneously
- ✅ **Room History**: Track room creation, participants, and settings
- ✅ **Scalability**: Better performance for multiple concurrent users

## What Changed

### Backend Changes
1. **New Room Model** (`apps/backend/src/web/models/Room.ts`)
   - Stores room code, name, host info, participants, settings
   - Includes timestamps and indexing for performance

2. **New Room Controller** (`apps/backend/src/web/controllers/roomController.ts`)
   - Handles all room operations with MongoDB
   - Generates unique room codes
   - Manages participant joining/leaving

3. **Updated Routes** (`apps/backend/src/routes/index.ts`)
   - Now uses MongoDB controller instead of in-memory storage
   - Added new endpoints for joining/leaving rooms

4. **MongoDB Connection** (`apps/backend/src/index.ts`)
   - Added MongoDB connection setup
   - Uses environment variable `MONGODB_URI` or defaults to localhost

### Frontend Changes
1. **Updated API Service** (`apps/frontend/src/utils/api.ts`)
   - Added hostId parameter to room operations
   - New endpoints for joining/leaving rooms

2. **Updated CreatePollPage** (`apps/frontend/src/pages/CreatePollPage.tsx`)
   - Generates persistent hostId stored in localStorage
   - Uses hostId for all room operations

## Setup Instructions

### 1. Install Dependencies

First, install the missing `lucide-react` package:

```bash
cd apps/frontend
pnpm add lucide-react
```

### 2. MongoDB Setup

You need MongoDB running. Options:

**Option A: Local MongoDB**
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: MongoDB Atlas (Cloud)**
- Create free account at https://www.mongodb.com/atlas
- Get connection string and set environment variable

### 3. Environment Variables

Create `.env` file in `apps/backend/`:

```env
MONGODB_URI=mongodb://localhost:27017/poll-automation
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/poll-automation
```

### 4. Start the Application

```bash
# Terminal 1: Start backend
cd apps/backend
pnpm dev

# Terminal 2: Start frontend
cd apps/frontend
pnpm dev
```

## New Features

### Multiple Hosts
- Each host gets a unique `hostId` stored in localStorage
- Multiple hosts can have active rooms simultaneously
- Rooms are isolated per host

### Room Persistence
- Rooms survive server restarts
- Room history is maintained in MongoDB
- Inactive rooms are marked as inactive (not deleted)

### Participant Management
- Track participants joining/leaving rooms
- Prevent duplicate joins
- Room capacity limits

### Enhanced API Endpoints

```typescript
// Create or get room
POST /api/room
{ name: string, hostId?: string, hostName?: string }

// Get current room for host
GET /api/room?hostId=string

// Get room by code
GET /api/room/:code

// Destroy room
DELETE /api/room?hostId=string

// Join room
POST /api/room/:code/join
{ participantId: string, participantName?: string }

// Leave room
POST /api/room/:code/leave
{ participantId: string }

// Get all active rooms
GET /api/rooms
```

## Database Schema

```typescript
interface Room {
  code: string;           // Unique 6-character room code
  name: string;           // Room name
  hostId?: string;        // Host identifier
  hostName?: string;      // Host display name
  isActive: boolean;      // Room status
  participants: string[]; // Array of participant IDs
  maxParticipants?: number; // Room capacity
  settings?: {            // Room settings
    questionFrequencyMinutes: number;
    questionsPerPoll: number;
    visibilityMinutes: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
  };
  createdAt: Date;        // Auto-generated
  updatedAt: Date;        // Auto-generated
}
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network connectivity

### Frontend Errors
- Install `lucide-react`: `pnpm add lucide-react`
- Clear browser localStorage if needed
- Check browser console for errors

### Room Code Issues
- Room codes are now unique across all hosts
- Codes are generated with collision detection
- Inactive rooms are preserved for history

## Migration from In-Memory

The old in-memory room storage has been completely replaced. No migration needed - just restart your servers and the new MongoDB-based system will be active. 