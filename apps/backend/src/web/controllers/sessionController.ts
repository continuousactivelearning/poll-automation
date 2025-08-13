// apps/backend/src/web/controllers/sessionController.ts
import { Request, Response } from 'express';
import Session, { ISession, IInvitedParticipant, IJoinedParticipant } from '../models/Session'; 
import { IUser } from '../models/User';
import sendEmail from '../../utils/sendEmail';
import { Types } from 'mongoose';

interface AuthRequest extends Request {
  user?: {
    id: string;
    fullName: string;
    email: string;
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
 */
const sendSessionInvites = async (
  hostName: string,
  sessionTitle: string,
  roomCode: string,
  invitee: IInvitedParticipant,
  clientUrl: string
) => {
  const loginLink = `${clientUrl}/login`;
  const registerLink = `${clientUrl}/register`;

  const participantName = invitee.name || invitee.email;

  const subject = `Invitation to Poll Session: ${sessionTitle} by ${hostName}`;
  const text = `Hello ${participantName},\n\nYou are invited to join a poll session hosted by ${hostName} (${sessionTitle}).\n\nRoom Code: ${roomCode}\n\nTo join, please visit our application:\n${loginLink}\n\nIf you don't have an account, you can register here:\n${registerLink}\n\nWe look forward to your participation!\n\nBest regards,\nThe Automatic Poll Generation Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #4CAF50;">Invitation to Poll Session</h2>
      <p>Hello <strong>${participantName}</strong>,</p>
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
    await sendEmail(invitee.email, subject, text, html);
    console.log(`Invite email sent to ${invitee.email} for session ${roomCode}`);
  } catch (error) {
    console.error(`Failed to send invite email to ${invitee.email}:`, error);
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
 * "invitedParticipants": [ // Optional array of { email: string, name?: string }
 * { "email": "student1@example.com", "name": "Student One" },
 * { "email": "student2@example.com" }
 * ]
 * }
 */
export const createSession = async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.user.id || !req.user.fullName || !req.user.email) {
    return res.status(401).json({ message: 'Not authorized. User information missing.' });
  }

  const { sessionTitle, roomCode, initialDurationHours = 3, invitedParticipants } = req.body;
  const hostId = new Types.ObjectId(req.user.id);
  const hostName = req.user.fullName;
  const hostEmail = req.user.email;

  if (!sessionTitle || !roomCode) {
    return res.status(400).json({ message: 'Session title and room code are required.' });
  }

  if (roomCode.length !== 6 || !/^[A-Z0-9]{6}$/.test(roomCode)) {
    return res.status(400).json({ message: 'Room code must be exactly 6 uppercase alphanumeric characters.' });
  }

  if (typeof initialDurationHours !== 'number' || initialDurationHours <= 0) {
    return res.status(400).json({ message: 'Initial duration must be a positive number in hours.' });
  }

  try {
    const existingSession = await Session.findOne({ roomCode });
    if (existingSession) {
      return res.status(400).json({ message: 'Room code already in use. Please generate a new one.' });
    }

    const now = new Date();
    const endedAt = new Date(now.getTime() + initialDurationHours * 60 * 60 * 1000);

    const newSession = await Session.create({
      host: hostId,
      hostName,
      hostEmail,
      roomCode: roomCode.toUpperCase(),
      sessionTitle,
      createdAt: now,
      endedAt,
      isActive: true,
      invitedParticipants: invitedParticipants || [],
      joinedParticipants: [],
      blockedParticipants: [],
      approvedPollsCount: 0,
      currentPollId: undefined, // Initialize with undefined instead of null
    });

    console.log(`Session created successfully for host ${hostEmail}: ${newSession._id}`);
    if (invitedParticipants && invitedParticipants.length > 0) {
      const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      for (const participant of invitedParticipants) {
        await sendSessionInvites(hostName, sessionTitle, roomCode, participant, clientUrl);
      }
    }

    res.status(201).json({ message: 'Session created successfully', session: newSession });
  } catch (error: any) {
    console.error('Error creating session:', error);
    if (error.code === 11000) {
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
    return res.status(401).json({ message: 'Not authorized. User information missing.' });
  }

  const sessionId = req.params.id;
  const { extensionMinutes } = req.body;

  if (!extensionMinutes || typeof extensionMinutes !== 'number' || extensionMinutes <= 0) {
    return res.status(400).json({ message: 'Valid extension duration in minutes is required.' });
  }

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Ensure only the host who created the session can extend it
    if (session.host.toString() !== req.user.id) {
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
    return res.status(401).json({ message: 'Not authorized. User information missing.' });
  }

  const sessionId = req.params.id;

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Ensure only the host who created the session can deactivate it
    if (session.host.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden. You are not the host of this session.' });
    }

    // Set isActive to false and update endedAt to current time
    session.isActive = false;
    session.endedAt = new Date(); // Session ends now
    session.joinedParticipants = []; // Clear joined participants on deactivation
    session.currentPollId = undefined; // NEW: Clear current poll with undefined
    await session.save();

    console.log(`Session ${sessionId} deactivated successfully.`);
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
    return res.status(401).json({ message: 'Not authorized, no user ID found.' });
  }

  try {
    const sessions = await Session.find({ host: req.user.id }).sort({ createdAt: -1 });
    console.log(`Fetched ${sessions.length} sessions for host ${req.user.email}.`);
    res.status(200).json({ message: 'Host sessions fetched successfully', sessions });
  }
  catch (error: any) {
    console.error('Error fetching host sessions:', error);
    res.status(500).json({ message: 'Server error fetching host sessions.', error: error.message });
  }
};

/**
 * @desc    Get a single session by its ID
 * @route   GET /api/sessions/:id
 * @access  Private (Host or invited participant)
 */
export const getSessionById = async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Not authorized, user ID missing.' });
  }

  // Ensure req.params.id is a valid ObjectId string before querying
  if (!req.params.id || !Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid session ID format.' });
  }

  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Check if the user is the host
    const isHost = session.host.toString() === req.user.id;

    // Check if the user is in the blockedParticipants list
    const isBlocked = session.blockedParticipants.some(
      (blockedUserId: Types.ObjectId) => blockedUserId.toString() === req.user!.id
    );

    if (isBlocked) {
      return res.status(403).json({ message: 'Access Denied. You have been blocked from this session.' });
    }

    // Check if the user is an invited participant (if not host)
    const isInvitedParticipant = session.invitedParticipants.some(
      (p: IInvitedParticipant) => p.email.toLowerCase() === req.user?.email?.toLowerCase()
    );

    // If not host and not invited, deny access (for private sessions)
    // For public sessions (invitedParticipants.length === 0), any logged-in user can view if not blocked.
    if (!isHost && !isInvitedParticipant && session.invitedParticipants.length > 0) {
      return res.status(403).json({ message: 'Forbidden. You do not have access to this session.' });
    }
    
    console.log(`Session ${session._id} fetched by ID for user ${req.user.email}.`);
    res.status(200).json({ message: 'Session fetched successfully', session });
  } catch (error: any) {
    console.error('Error fetching session by ID:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid session ID provided.' });
    }
    res.status(500).json({ message: 'Server error fetching session.', error: error.message });
  }
};

/**
 * @desc    Get a single session by its Room Code (for students to view details before joining)
 * @route   GET /api/sessions/by-code/:roomCode
 * @access  Private (Requires authentication to check invited participants)
 */
export const getSessionByRoomCode = async (req: AuthRequest, res: Response) => {
  const roomCode = req.params.roomCode.toUpperCase();
  const userEmail = req.user?.email;
  const userId = req.user?.id;

  if (!userEmail || !userId) {
    return res.status(401).json({ message: 'Not authorized. Please log in.' });
  }

  try {
    const session = await Session.findOne({ roomCode });

    if (!session) {
      return res.status(404).json({ message: 'Session not found with this room code.' });
    }

    if (!session.isActive) {
      return res.status(400).json({ message: 'This session is currently inactive.' });
    }

    // Check if the user is in the blockedParticipants list
    const isBlocked = session.blockedParticipants.some(
      (blockedUserId: Types.ObjectId) => blockedUserId.toString() === userId
    );

    if (isBlocked) {
      return res.status(403).json({ message: 'Access Denied. You have been blocked from this session.' });
    }

    // If invitedParticipants array is empty, it's a public session (any logged-in user can view/join)
    if (session.invitedParticipants.length === 0) {
      return res.status(200).json({
        message: 'Session found',
        session: {
          _id: session._id,
          roomCode: session.roomCode,
          sessionTitle: session.sessionTitle,
          hostName: session.hostName,
          isActive: session.isActive,
          endedAt: session.endedAt,
        }
      });
    }

    // If invitedParticipants array is not empty, it's a private session
    const isAllowed = session.invitedParticipants.some(
      (p: IInvitedParticipant) => p.email.toLowerCase() === userEmail.toLowerCase()
    );

    if (!isAllowed) {
      return res.status(403).json({ message: 'Forbidden. You are not authorized to join this session.' });
    }

    res.status(200).json({
      message: 'Session found',
      session: {
        _id: session._id,
        roomCode: session.roomCode,
        sessionTitle: session.sessionTitle,
        hostName: session.hostName,
        isActive: session.isActive,
        endedAt: session.endedAt,
      }
    });

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
    return res.status(401).json({ message: 'Not authorized. User information missing.' });
  }

  const { roomCode } = req.body;
  const studentId = new Types.ObjectId(req.user.id);
  const studentEmail = req.user.email;
  const studentFullName = req.user.fullName;

  if (!roomCode) {
    return res.status(400).json({ message: 'Room code is required.' });
  }

  try {
    const session = await Session.findOne({ roomCode: roomCode.toUpperCase() });

    if (!session) {
      return res.status(404).json({ message: 'Session not found with this room code.' });
    }

    if (!session.isActive) {
      return res.status(400).json({ message: 'This session is not currently active.' });
    }

    // Check if the student is in the blockedParticipants list
    const isBlocked = session.blockedParticipants.some(
      (blockedUserId: Types.ObjectId) => blockedUserId.toString() === studentId.toString()
    );

    if (isBlocked) {
      return res.status(403).json({ message: 'Access Denied. You have been blocked from this session.' });
    }

    // Check if the student is already in the joinedParticipants list
    const alreadyJoined = session.joinedParticipants.some(
      (p: IJoinedParticipant) => p.userId.toString() === studentId.toString()
    );

    if (alreadyJoined) {
      return res.status(200).json({ message: 'Already joined this session.', session });
    }

    // Check if the session has an invitedParticipants list and if the student is on it
    if (session.invitedParticipants.length > 0) {
      const isAllowed = session.invitedParticipants.some(
        (p: IInvitedParticipant) => p.email.toLowerCase() === studentEmail.toLowerCase()
      );
      if (!isAllowed) {
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
    return res.status(401).json({ message: 'Not authorized. Host information missing.' });
  }

  const { sessionId, participantId } = req.params;
  const hostId = req.user.id;

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Ensure the user performing the action is the host of the session
    if (session.host.toString() !== hostId) {
      return res.status(403).json({ message: 'Forbidden. You are not authorized to remove participants from this session.' });
    }

    // Check if the participant is already blocked
    const isAlreadyBlocked = session.blockedParticipants.some(
      (blockedUserId: Types.ObjectId) => blockedUserId.toString() === participantId
    );
    if (isAlreadyBlocked) {
      // If already blocked, just confirm removal from joinedParticipants if they somehow rejoined
      const initialJoinedCount = session.joinedParticipants.length;
      session.joinedParticipants = session.joinedParticipants.filter(
        (p: IJoinedParticipant) => p.userId.toString() !== participantId
      );
      if (session.joinedParticipants.length === initialJoinedCount) {
        return res.status(400).json({ message: 'Participant is already blocked and not currently joined.', session });
      }
      await session.save();
      console.log(`Participant ${participantId} removed from joinedParticipants (already blocked) from session ${sessionId}.`);
      return res.status(200).json({ message: 'Participant removed from joined list (already blocked).', session });
    }

    // Filter out the participant to be removed from joinedParticipants
    const initialJoinedCount = session.joinedParticipants.length;
    session.joinedParticipants = session.joinedParticipants.filter(
      (p: IJoinedParticipant) => p.userId.toString() !== participantId
    );

    // Add the participant's userId to the blockedParticipants array
    session.blockedParticipants.push(new Types.ObjectId(participantId));

    await session.save();

    // Check if the participant was actually removed from joinedParticipants
    if (session.joinedParticipants.length === initialJoinedCount) {
      console.log(`Participant ${participantId} was not found in joinedParticipants but was blocked from session ${sessionId}.`);
      res.status(200).json({ message: 'Participant blocked successfully (was not actively joined).', session });
    } else {
      console.log(`Participant ${participantId} removed from joinedParticipants and blocked from session ${sessionId} by host ${hostId}.`);
      res.status(200).json({ message: 'Participant removed and blocked successfully.', session });
    }
  } catch (error: any) {
    console.error('Error removing participant:', error);
    // Handle CastError if participantId is not a valid ObjectId
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid participant ID format.' });
    }
    res.status(500).json({ message: 'Server error removing participant.', error: error.message });
  }
};
