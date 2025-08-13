// apps/backend/src/web/controllers/manualPollController.ts
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Session, { ISession } from '../models/Session';
import ManualPollQuestion, { IManualPollQuestion } from '../models/ManualPollQuestions';
import { IUser } from '../models/User';
import { io } from '../../index'; // NEW: Import the io instance

interface AuthRequest extends Request {
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

/**
 * @desc    Create a new manual poll question and make it active for a session
 * @route   POST /api/manual-polls/create
 * @access  Private (Host only)
 *
 * Request Body:
 * {
 * "sessionId": "65b8c...",
 * "questionTitle": "What is your favorite color?",
 * "questionType": "mcq",
 * "options": [
 * { "id": "option1", "text": "Red" },
 * { "id": "option2", "text": "Blue" }
 * ],
 * "timerEnabled": true,
 * "timerDuration": 60,
 * "timerUnit": "seconds",
 * "correctAnswer": "option1"
 * }
 */
export const createManualPoll = async (req: AuthRequest, res: Response) => {
  console.log("Backend received request body (createManualPoll):", req.body);

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Not authorized. User information missing.' });
  }

  const {
    sessionId,
    questionTitle,
    questionType,
    options,
    timerEnabled,
    timerDuration,
    timerUnit,
    shortAnswerPlaceholder,
    correctAnswer,
  } = req.body;

  const hostId = new Types.ObjectId(req.user.id);

  if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ message: 'Valid session ID is required.' });
  }
  console.log(`Backend validation check (createManualPoll): questionTitle='${questionTitle}', questionType='${questionType}'`);

  if (!questionTitle || !questionType) {
    return res.status(400).json({ message: 'Question title and type are required.' });
  }
  if (questionType === 'mcq' || questionType === 'truefalse') {
    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: 'MCQ/True/False questions require at least two options.' });
    }
    if (questionType === 'mcq' && !correctAnswer) {
      return res.status(400).json({ message: 'MCQ questions require a correct answer.' });
    }
  }

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    if (session.host.toString() !== hostId.toString()) {
      return res.status(403).json({ message: 'Forbidden. You are not the host of this session.' });
    }

    if (!session.isActive) {
      return res.status(400).json({ message: 'Cannot create poll: The session is not active.' });
    }

    // Deactivate previous poll if any
    if (session.currentPollId) {
      await ManualPollQuestion.findByIdAndUpdate(session.currentPollId, { isActive: false });
    }

    const newManualPollQuestion = await ManualPollQuestion.create({
      sessionId: new Types.ObjectId(sessionId),
      host: hostId,
      questionTitle,
      questionType,
      options: options || [],
      timerEnabled: timerEnabled || false,
      timerDuration: timerDuration || 30,
      timerUnit: timerUnit || 'seconds',
      shortAnswerPlaceholder,
      correctAnswer,
      isActive: true,
      approvedAt: new Date(),
    });

    session.currentPollId = newManualPollQuestion._id as Types.ObjectId;
    session.approvedPollsCount = (session.approvedPollsCount || 0) + 1;
    await session.save();

    console.log(`Manual Poll Question ${newManualPollQuestion._id} created and set as active for session ${sessionId}`);

    // NEW: Emit a Socket.IO event to notify clients about the new poll
    io.emit('newPollAvailable', { roomCode: session.roomCode, pollId: newManualPollQuestion._id });
    console.log(`Emitted 'newPollAvailable' event for roomCode: ${session.roomCode}`);

    res.status(201).json({
      message: 'Manual poll created and activated successfully',
      poll: newManualPollQuestion,
      session: session
    });

  } catch (error: any) {
    console.error('Error creating manual poll:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error creating manual poll.', error: error.message });
  }
};

/**
 * @desc    Get the currently active manual poll for a given session by room code
 * @route   GET /api/manual-polls/active/:roomCode
 * @access  Private (Host or joined participant)
 */
export const getActiveManualPoll = async (req: AuthRequest, res: Response) => {
  console.log("Backend received request for active poll (getActiveManualPoll). User:", req.user);

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Not authorized. User information missing.' });
  }

  const { roomCode } = req.params;
  const userId = req.user.id;
  const userEmail = req.user.email;

  if (!roomCode || roomCode.length !== 6) {
    return res.status(400).json({ message: 'Valid 6-character room code is required.', sessionStatus: 'invalid_room_code' });
  }

  try {
    const session = await Session.findOne({ roomCode: roomCode.toUpperCase() });

    if (!session) {
      console.log(`Session not found for room code: ${roomCode}`);
      return res.status(404).json({ message: 'Session not found.', sessionStatus: 'not_found' });
    }

    if (!session.isActive) {
      console.log(`Session ${session._id} is inactive.`);
      return res.status(400).json({ message: 'This session is currently inactive.', sessionStatus: 'inactive' });
    }

    const isBlocked = session.blockedParticipants.some(
      (blockedUserId: Types.ObjectId) => blockedUserId.toString() === userId
    );
    if (isBlocked) {
      console.log(`User ${userId} is blocked from session ${session._id}.`);
      return res.status(403).json({ message: 'Access Denied. You have been blocked from this session.', sessionStatus: 'blocked' });
    }

    const isHost = session.host.toString() === userId;
    const isJoinedParticipant = session.joinedParticipants.some(p => p.userId.toString() === userId);
    const isInvitedToPrivateSession = session.invitedParticipants.length > 0 && session.invitedParticipants.some(p => p.email.toLowerCase() === userEmail.toLowerCase());

    if (!isHost && !isJoinedParticipant) {
      if (session.invitedParticipants.length > 0) {
        if (!isInvitedToPrivateSession) {
          console.log(`User ${userEmail} not invited to private session ${session._id}.`);
          return res.status(403).json({ message: 'Forbidden. You are not invited to this private session.', sessionStatus: 'unauthorized' });
        } else {
          console.log(`User ${userEmail} is invited but not joined session ${session._id}.`);
          return res.status(403).json({ message: 'Please join the session to view active polls.', sessionStatus: 'unjoined', sessionId: session._id });
        }
      }
    }

    if (!session.currentPollId) {
      console.log(`No currentPollId for session ${session._id}.`);
      return res.status(200).json({ message: 'No active poll for this session yet.', poll: null, sessionStatus: 'active' });
    }

    const activePoll = await ManualPollQuestion.findById(session.currentPollId);

    if (!activePoll || !activePoll.isActive) {
      console.log(`Current poll ${session.currentPollId} for session ${session._id} is not active or not found.`);
      return res.status(200).json({ message: 'No active poll for this session found.', poll: null, sessionStatus: 'active' });
    }

    console.log(`Active Manual Poll ${activePoll._id} fetched for session ${session._id} by user ${userEmail}`);
    res.status(200).json({ message: 'Active poll fetched successfully', poll: activePoll, sessionStatus: 'active' });

  } catch (error: any) {
    console.error('Error fetching active manual poll:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID format provided.', error: error.message });
    }
    res.status(500).json({ message: 'Server error fetching active manual poll.', error: error.message });
  }
};
