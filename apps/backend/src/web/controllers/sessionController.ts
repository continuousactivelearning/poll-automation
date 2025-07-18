// apps/backend/src/web/controllers/sessionController.ts
import { Request, Response } from 'express';
import Session, { ISession } from '../models/Session'; // Import the Session model
import { IUser } from '../models/User'; // Import IUser interface for type checking (for reference, not direct role check)
import sendEmail from '../../utils/sendEmail'; // Import the email utility
import { Types } from 'mongoose'; // For ObjectId

// Extend Request to include user property from authentication middleware
// This interface ensures that req.user is typed correctly after auth middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    fullName: string; // Assuming auth middleware adds user's full name
    email: string;    // Assuming auth middleware adds user's email
  };
}

/**
 * Helper function to generate a random 6-character alphanumeric room code.
 */
const generateRoomCode = (): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Helper function to send session invitation emails.
 * This is a simplified version. In a real app, you might use a queue for bulk emails.
 */
const sendSessionInvites = async (
  hostName: string,
  sessionTitle: string,
  roomCode: string,
  participants: { email: string; name?: string }[],
  clientUrl: string // Frontend URL to generate links
) => {
  const loginLink = `${clientUrl}/login`;
  const registerLink = `${clientUrl}/register`; // Assuming a registration page

  for (const participant of participants) {
    const subject = `Invitation to Poll Session: ${sessionTitle} by ${hostName}`;
    const text = `Dear ${participant.name || participant.email},\n\nYou are invited to join a poll session hosted by ${hostName} (${sessionTitle}).\n\nRoom Code: ${roomCode}\n\nTo join, please visit our application:\n${loginLink}\n\nIf you don't have an account, you can register here:\n${registerLink}\n\nWe look forward to your participation!\n\nBest regards,\nThe Automatic Poll Generation Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">Invitation to Poll Session</h2>
        <p>Dear <strong>${participant.name || participant.email}</strong>,</p>
        <p>You are invited to join a poll session titled "<strong>${sessionTitle}</strong>" hosted by <strong>${hostName}</strong>.</p>
        <p>Your unique Room Code to join the session is: <strong style="font-size: 1.2em; color: #007bff;">${roomCode}</strong></p>
        <p>To join the session, please visit our application:</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="${loginLink}" style="
            background-color: #4CAF50;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            font-family: Arial, sans-serif;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          ">
            Go to Application
          </a>
        </div>
        <p style="margin-top: 20px;">If you don't have an account yet, you can register here:</p>
        <div style="text-align: center; margin-top: 10px;">
          <a href="${registerLink}" style="
            background-color: #007bff;
            color: white;
            padding: 8px 15px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            font-family: Arial, sans-serif;
            font-size: 14px;
          ">
            Register Now
          </a>
        </div>
        <p style="margin-top: 20px;">We look forward to your participation!</p>
        <p style="font-size: 0.9em; color: #777;">Best regards,<br>The Automatic Poll Generation Team</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8em; color: #999;">This is an automated email, please do not reply.</p>
      </div>
    `;

    try {
      await sendEmail(participant.email, subject, text, html);
      console.log(`Invite email sent to ${participant.email} for session ${roomCode}`);
    } catch (error) {
      console.error(`Failed to send invite email to ${participant.email}:`, error);
    }
  }
};

/**
 * @desc    Create a new poll session
 * @route   POST /api/sessions/create
 * @access  Private (Host only - implicitly by authentication)
 *
 * Request Body:
 * {
 * "sessionTitle": "My First Class Session",
 * "roomCode": "ABC123", // Frontend generated
 * "initialDurationHours": 3, // Default 3 hours from frontend
 * "participants": [ // Optional array of { email: string, name?: string }
 * { "email": "student1@example.com", "name": "Student One" },
 * { "email": "student2@example.com" }
 * ]
 * }
 */
export const createSession = async (req: AuthRequest, res: Response) => {
  // Ensure the user is authenticated and has necessary info
  if (!req.user || !req.user.id || !req.user.fullName || !req.user.email) {
    console.log('Create session: Not authorized. User information missing.');
    return res.status(401).json({ message: 'Not authorized. User information missing.' });
  }

  const { sessionTitle, roomCode, initialDurationHours = 3, participants } = req.body;
  const hostId = new Types.ObjectId(req.user.id);
  const hostName = req.user.fullName;
  const hostEmail = req.user.email;

  // Basic validation
  if (!sessionTitle || !roomCode) {
    console.log('Create session: Missing title or room code.');
    return res.status(400).json({ message: 'Session title and room code are required.' });
  }

  if (roomCode.length !== 6 || !/^[A-Z0-9]{6}$/.test(roomCode)) {
    console.log('Create session: Invalid room code format.');
    return res.status(400).json({ message: 'Room code must be exactly 6 uppercase alphanumeric characters.' });
  }

  try {
    // Check if a session with this roomCode already exists
    const existingSession = await Session.findOne({ roomCode });
    if (existingSession) {
      console.log(`Create session: Room code ${roomCode} already in use.`);
      return res.status(400).json({ message: 'Room code already in use. Please generate a new one.' });
    }

    const now = new Date();
    const endedAt = new Date(now.getTime() + initialDurationHours * 60 * 60 * 1000); // Add hours to current time

    const newSession = await Session.create({
      host: hostId,
      hostName,
      hostEmail,
      roomCode: roomCode.toUpperCase(), // Ensure it's stored uppercase
      sessionTitle,
      createdAt: now,
      endedAt,
      isActive: true,
      allowedParticipants: participants || [], // Store allowed participants if provided
      joinedParticipants: [], // Initialize joined participants as empty
      approvedPollsCount: 0,
    });

    console.log('Session created successfully:', newSession._id); // Log success
    // If participants are provided, send them invites
    if (participants && participants.length > 0) {
      const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Fallback for safety
      sendSessionInvites(hostName, sessionTitle, roomCode, participants, clientUrl);
    }

    res.status(201).json({ message: 'Session created successfully', session: newSession });
  } catch (error: any) {
    console.error('Error creating session:', error);
    if (error.code === 11000) { // Duplicate key error (for unique roomCode)
      return res.status(400).json({ message: 'Room code already in use. Please generate a new one.' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error creating session.', error: error.message });
  }
};

/**
 * @desc    Extend an existing poll session's duration
 * @route   PUT /api/sessions/:id/extend
 * @access  Private (Host only)
 *
 * Request Body:
 * {
 * "extensionMinutes": 30 // or 60, 120, 180 as per frontend buttons
 * }
 */
export const extendSession = async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.user.id) {
    console.log('Extend session: Not authorized. User information missing.');
    return res.status(401).json({ message: 'Not authorized. User information missing.' });
  }

  const sessionId = req.params.id;
  const { extensionMinutes } = req.body;

  if (!extensionMinutes || typeof extensionMinutes !== 'number' || extensionMinutes <= 0) {
    console.log('Extend session: Invalid extension duration.');
    return res.status(400).json({ message: 'Valid extension duration in minutes is required.' });
  }

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      console.log(`Extend session: Session ${sessionId} not found.`);
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Ensure only the host who created the session can extend it
    if (session.host.toString() !== req.user.id) {
      console.log(`Extend session: User ${req.user.id} is not host of session ${sessionId}.`);
      return res.status(403).json({ message: 'Forbidden. You are not the host of this session.' });
    }

    // Extend the endedAt time
    session.endedAt = new Date(session.endedAt.getTime() + extensionMinutes * 60 * 1000);
    await session.save();
    console.log(`Session ${sessionId} extended by ${extensionMinutes} minutes.`);
    res.status(200).json({ message: 'Session extended successfully', session });
  } catch (error: any) {
    console.error('Error extending session:', error);
    res.status(500).json({ message: 'Server error extending session.', error: error.message });
  }
};

/**
 * @desc    Deactivate (Destroy) a poll session
 * @route   PUT /api/sessions/:id/deactivate
 * @access  Private (Host only)
 */
export const deactivateSession = async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.user.id) {
    console.log('Deactivate session: Not authorized. User information missing.');
    return res.status(401).json({ message: 'Not authorized. User information missing.' });
  }

  const sessionId = req.params.id;

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      console.log(`Deactivate session: Session ${sessionId} not found.`);
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Ensure only the host who created the session can deactivate it
    if (session.host.toString() !== req.user.id) {
      console.log(`Deactivate session: User ${req.user.id} is not host of session ${sessionId}.`);
      return res.status(403).json({ message: 'Forbidden. You are not the host of this session.' });
    }

    // Set isActive to false and update endedAt to current time
    session.isActive = false;
    session.endedAt = new Date(); // Session ends now
    session.joinedParticipants = []; // Clear joined participants on deactivation
    await session.save();

    console.log(`Session ${sessionId} deactivated successfully.`); // Log success
    res.status(200).json({ message: 'Session deactivated successfully', session });
  } catch (error: any) {
    console.error('Error deactivating session:', error);
    res.status(500).json({ message: 'Server error deactivating session.', error: error.message });
  }
};

/**
 * @desc    Get all sessions created by the authenticated host
 * @route   GET /api/sessions/my-sessions
 * @access  Private (Host only - implicitly by authentication)
 */
export const getMySessions = async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.user.id) {
    console.log('Get my sessions: Not authorized, no user ID found.');
    return res.status(401).json({ message: 'Not authorized, no user ID found.' });
  }

  try {
    const sessions = await Session.find({ host: req.user.id }).sort({ createdAt: -1 }); // Sort by newest first
    console.log(`Fetched ${sessions.length} sessions for host ${req.user.id}.`);
    res.status(200).json({ message: 'Host sessions fetched successfully', sessions });
  } catch (error: any) {
    console.error('Error fetching host sessions:', error);
    res.status(500).json({ message: 'Server error fetching host sessions.', error: error.message });
  }
};

/**
 * @desc    Get a single session by its ID
 * @route   GET /api/sessions/:id
 * @access  Private (Host or allowed participant)
 */
export const getSessionById = async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.user.id) {
    console.log('Get session by ID: Not authorized, user ID missing.');
    return res.status(401).json({ message: 'Not authorized, user ID missing.' });
  }

  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      console.log(`Get session by ID: Session ${req.params.id} not found.`);
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Check if the user is the host or an allowed participant
    const isHost = session.host.toString() === req.user.id;
    const isAllowedParticipant = session.allowedParticipants.some(
      (p) => p.email.toLowerCase() === req.user?.email?.toLowerCase()
    );

    if (!isHost && !isAllowedParticipant) {
      console.log(`Get session by ID: User ${req.user.id} is not host or allowed participant for session ${req.params.id}.`);
      return res.status(403).json({ message: 'Forbidden. You do not have access to this session.' });
    }
    console.log(`Session ${session._id} fetched by ID for user ${req.user.id}.`);
    res.status(200).json({ message: 'Session fetched successfully', session });
  } catch (error: any) {
    console.error('Error fetching session by ID:', error);
    res.status(500).json({ message: 'Server error fetching session.', error: error.message });
  }
};

/**
 * @desc    Get a single session by its Room Code
 * @route   GET /api/sessions/by-code/:roomCode
 * @access  Public (for students to join, but will validate access)
 */
export const getSessionByRoomCode = async (req: AuthRequest, res: Response) => {
  const roomCode = req.params.roomCode.toUpperCase(); // Ensure uppercase for lookup

  try {
    const session = await Session.findOne({ roomCode });

    if (!session) {
      console.log(`Get session by room code: Session ${roomCode} not found.`);
      return res.status(404).json({ message: 'Session not found with this room code.' });
    }

    // --- NEW DEBUG LOGS START ---
    console.log(`Debug: Session found for room code ${roomCode}.`);
    console.log(`Debug: Session isActive: ${session.isActive}`);
    console.log(`Debug: Session allowedParticipants:`, session.allowedParticipants.map(p => p.email));
    console.log(`Debug: Authenticated user email: ${req.user?.email}`);
    // --- NEW DEBUG LOGS END ---

    // If user is authenticated, check if they are the host or an allowed participant
    if (req.user && req.user.id) {
      const isHost = session.host.toString() === req.user.id;
      const isAllowedParticipant = session.allowedParticipants.some(
        (p) => {
          // --- NEW DEBUG LOG: Compare emails ---
          console.log(`Debug: Comparing allowed email "${p.email.toLowerCase()}" with user email "${req.user?.email?.toLowerCase()}"`);
          return p.email.toLowerCase() === req.user?.email?.toLowerCase();
        }
      );

      if (!isHost && session.allowedParticipants.length > 0 && !isAllowedParticipant) {
        console.log(`Get session by room code: User ${req.user.id} not allowed for restricted session ${roomCode}.`);
        return res.status(403).json({ message: 'Access Denied. You are not authorized to join this session.' });
      }
    } else {
      // If user is not authenticated, and there's an allowed list, deny access
      if (session.allowedParticipants.length > 0) {
        console.log(`Get session by room code: Unauthenticated user tried to access restricted session ${roomCode}.`);
        return res.status(403).json({ message: 'Access Denied. Please log in with an authorized account to join this session.' });
      }
    }
    
    console.log(`Session ${roomCode} found and access granted.`);
    // For now, return basic session info.
    // Later, you might return different data based on user role (host vs student)
    res.status(200).json({ message: 'Session found', session: {
      _id: session._id,
      roomCode: session.roomCode,
      sessionTitle: session.sessionTitle,
      hostName: session.hostName,
      isActive: session.isActive,
      endedAt: session.endedAt,
      // Do NOT send allowedParticipants list to general public/unauthorized users
      // Send joinedParticipants for host, but not for general student
      joinedParticipants: session.joinedParticipants.map(p => ({
        userId: p.userId,
        fullName: p.fullName,
        email: p.email,
        joinedAt: p.joinedAt
      })) // Only include essential info for joined participants
    }});

  } catch (error: any) {
    console.error('Error fetching session by room code:', error);
    res.status(500).json({ message: 'Server error fetching session by room code.', error: error.message });
  }
};

/**
 * @desc    Allow a student to join a poll session
 * @route   POST /api/sessions/join
 * @access  Private (Authenticated student)
 *
 * Request Body:
 * { "roomCode": "ABC123" }
 */
export const joinSession = async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.user.id || !req.user.email || !req.user.fullName) {
    console.log('Join session: Not authorized. User information missing.');
    return res.status(401).json({ message: 'Not authorized. User information missing.' });
  }

  const { roomCode } = req.body;
  const studentId = new Types.ObjectId(req.user.id);
  const studentEmail = req.user.email;
  const studentFullName = req.user.fullName;

  if (!roomCode) {
    console.log('Join session: Room code is required.');
    return res.status(400).json({ message: 'Room code is required.' });
  }

  try {
    const session = await Session.findOne({ roomCode: roomCode.toUpperCase() });

    if (!session) {
      console.log(`Join session: Session with room code ${roomCode} not found.`);
      return res.status(404).json({ message: 'Session not found with this room code.' });
    }

    if (!session.isActive) {
      console.log(`Join session: Session ${roomCode} is not active.`);
      return res.status(400).json({ message: 'This session is not currently active.' });
    }

    // Check if the student is already in the joinedParticipants list
    const alreadyJoined = session.joinedParticipants.some(
      (p) => p.userId.toString() === studentId.toString()
    );

    if (alreadyJoined) {
      console.log(`Join session: Student ${studentEmail} already joined session ${roomCode}.`);
      return res.status(200).json({ message: 'Already joined this session.', session });
    }

    // Check if the session has an allowedParticipants list and if the student is on it
    if (session.allowedParticipants.length > 0) {
      const isAllowed = session.allowedParticipants.some(
        (p) => p.email.toLowerCase() === studentEmail.toLowerCase()
      );
      if (!isAllowed) {
        console.log(`Join session: Student ${studentEmail} is not in the allowed list for session ${roomCode}.`);
        return res.status(403).json({ message: 'Access Denied. You are not authorized to join this session.' });
      }
    }

    // Add student to joinedParticipants
    session.joinedParticipants.push({
      userId: studentId,
      email: studentEmail,
      fullName: studentFullName,
      joinedAt: new Date(),
    });
    await session.save();

    console.log(`Student ${studentEmail} joined session ${roomCode} successfully.`);
    res.status(200).json({ message: 'Successfully joined session.', session });
  } catch (error: any) {
    console.error('Error joining session:', error);
    res.status(500).json({ message: 'Server error joining session.', error: error.message });
  }
};

/**
 * @desc    Remove a participant from a poll session (Host action)
 * @route   PUT /api/sessions/:sessionId/remove-participant/:participantId
 * @access  Private (Host only)
 */
export const removeParticipant = async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.user.id) {
    console.log('Remove participant: Not authorized. Host information missing.');
    return res.status(401).json({ message: 'Not authorized. Host information missing.' });
  }

  const { sessionId, participantId } = req.params;
  const hostId = req.user.id;

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      console.log(`Remove participant: Session ${sessionId} not found.`);
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Ensure the user performing the action is the host of the session
    if (session.host.toString() !== hostId) {
      console.log(`Remove participant: User ${hostId} is not the host of session ${sessionId}.`);
      return res.status(403).json({ message: 'Forbidden. You are not authorized to remove participants from this session.' });
    }

    // Filter out the participant to be removed
    const initialCount = session.joinedParticipants.length;
    session.joinedParticipants = session.joinedParticipants.filter(
      (p) => p.userId.toString() !== participantId
    );

    if (session.joinedParticipants.length === initialCount) {
      console.log(`Remove participant: Participant ${participantId} not found in session ${sessionId}.`);
      return res.status(404).json({ message: 'Participant not found in this session.' });
    }

    await session.save();
    console.log(`Participant ${participantId} removed from session ${sessionId} by host ${hostId}.`);
    res.status(200).json({ message: 'Participant removed successfully.', session });
  } catch (error: any) {
    console.error('Error removing participant:', error);
    res.status(500).json({ message: 'Server error removing participant.', error: error.message });
  }
};
