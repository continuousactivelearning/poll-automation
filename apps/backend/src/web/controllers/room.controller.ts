//// File: apps/backend/src/web/controllers/room.controller.ts
import { Request, Response } from 'express';
import { Room } from '../models/room.model';
import { User } from '../models/user.model';
import { sendEmail } from '../utils/email';
import * as xlsx from 'xlsx';
import crypto from 'crypto';

// --- HELPER FUNCTIONS ---

// Helper to generate a random room code
function generateRoomCode(): string { return crypto.randomBytes(3).toString('hex').toUpperCase(); }

// Helper to ensure the generated room code is unique
async function generateUniqueRoomCode(): Promise<string> {
  let code: string;
  let attempts = 0;
  const maxAttempts = 10;
  do {
    code = generateRoomCode();
    attempts++;
    const existingRoom = await Room.findOne({ code, isActive: true });
    if (!existingRoom) {
      return code;
    }
  } while (attempts < maxAttempts);
  throw new Error('Failed to generate a unique room code.');
}

export const createRoom = async (req: Request, res: Response) => {
    try {
        const hostId = (req as any).user.id;
        const { name } = req.body;

        if (!name || name.trim() === '') return res.status(400).json({ message: 'Room name is required.' });
        
        await Room.updateMany({ hostId, isActive: true }, { $set: { isActive: false } });

        const code = await generateUniqueRoomCode();
        const host = await User.findById(hostId).select('fullName');

        const newRoom = new Room({
            code, name, hostId, hostName: host?.fullName || 'Unknown Host', isActive: true
        });
        await newRoom.save();
        res.status(201).json(newRoom);
    } catch (error: any) { res.status(500).json({ message: 'Failed to create room.' }); }
};


export const inviteStudents = async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findById(roomId);
        if (!room || !room.isActive) return res.status(404).json({ message: 'Active room not found.' });

        if (!req.file) return res.status(400).json({ message: 'No Excel or CSV file uploaded.' });
        
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const students = xlsx.utils.sheet_to_json(sheet) as Array<{ email?: string }>;

        const emailList = students.map(s => s.email).filter((e): e is string => !!e && e.includes('@'));
        if (emailList.length === 0) return res.status(400).json({ message: 'No valid student emails found.' });
        
        const host = await User.findById(room.hostId);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

        // --- NEW LOGIC: Loop and check each user ---
        for (const email of emailList) {
            const userExists = await User.findOne({ email: email.toLowerCase() });

            let joinLink: string;
            let callToAction: string;
            
            if (userExists) {
                // If user exists, create a direct join link
                joinLink = `${frontendUrl}/student/join-poll?code=${room.code}`;
                callToAction = "Join the Session";
            } else {
                // If user does not exist, create a link to register that also carries the room code
                joinLink = `${frontendUrl}/register?redirect=join-poll&roomCode=${room.code}`;
                callToAction = "Register to Join";
            }

            const subject = `You're Invited to the Poll Session: "${room.name}"`;
            const html = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Poll Session Invitation</h2>
                    <p>Hello,</p>
                    <p>You have been invited by <strong>${host?.fullName || 'the host'}</strong> to join the poll session: "<strong>${room.name}</strong>".</p>
                    <p>Your Room Code is: <strong style="font-size: 20px; letter-spacing: 2px; color: #3B82F6;">${room.code}</strong></p>
                    <p>Click the button below to get started:</p>
                    <a href="${joinLink}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #4f46e5; text-decoration: none; border-radius: 5px;">
                        ${callToAction}
                    </a>
                    <p style="font-size: 12px; color: #666;">If the button doesn't work, you can copy this link into your browser: ${joinLink}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                    <p style="font-size: 12px; color: #999;">If you were not expecting this invitation, please ignore this email.</p>
                </div>
            `;

            await sendEmail(email, subject, html);
        }

        res.status(200).json({ message: `Invites sent successfully to ${emailList.length} students.` });
    } catch (error: any) {
        console.error("INVITE STUDENTS ERROR:", error);
        res.status(500).json({ message: 'Failed to send invites.' });
    }
};





// --- NEW: Function to get the current active room for a host ---
export const getActiveRoomForHost = async (req: Request, res: Response) => {
    try {
        const hostId = (req as any).user.id; // Get user ID from authentication middleware

        if (!hostId) {
            return res.status(401).json({ message: 'Unauthorized. Host ID missing.' });
        }
        
        // Find the one room that is active and belongs to this host
        const activeRoom = await Room.findOne({ hostId: hostId, isActive: true });

        if (!activeRoom) {
            // This is not an error, it just means the host doesn't have a live session.
            return res.status(404).json({ message: 'No active session found for this host.' });
        }

        // If a room is found, send it back
        res.status(200).json(activeRoom);

    } catch (error: any) {
        console.error("ERROR FETCHING ACTIVE ROOM:", error);
        res.status(500).json({ message: 'Server error while fetching active room.' });
    }
};

// --- NEW: Get live participants for a given room ID ---
export const getLiveParticipants = async (req: Request, res: Response) => {
    try {
        const { roomId } = req.params;
        const room = await Room.findById(roomId).select('participants');

        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }
        
        // The user must be a participant or the host to view this
        // (You can add more robust security checks here if needed)

        res.status(200).json(room.participants);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error while fetching participants.' });
    }
};

export const getActiveRoomByCode = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const room = await Room.findOne({ code, isActive: true }).populate('hostId', 'fullName email');
        
        if (!room) return res.status(404).json({ message: 'Room not found.' });
        
        res.json({
            id: room._id,
            name: room.name,
            code: room.code,
            host: room.hostId,
            createdAt: (room as any).createdAt
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error retrieving room.', error: error.message });
    }
};

// Add missing exports for backward compatibility
export const createOrGetRoom = createRoom;
export const getCurrentRoom = getActiveRoomForHost;
export const destroyRoom = async (req: Request, res: Response) => {
    try {
        const hostId = (req as any).user.id;
        const result = await Room.updateMany({ hostId, isActive: true }, { $set: { isActive: false } });
        res.json({ message: 'Room destroyed', modifiedCount: result.modifiedCount });
    } catch (error: any) {
        res.status(500).json({ message: 'Error destroying room.', error: error.message });
    }
};
export const getRoomByCode = getActiveRoomByCode;

