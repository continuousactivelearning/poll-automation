// apps/backend/src/web/controllers/manualPollController.ts
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Session, { ISession } from '../models/Session';
import ManualPollQuestion, { IManualPollQuestion } from '../models/ManualPollQuestions';
import { IUser } from '../models/User';
import { io } from '../../index'; 

interface AuthRequest extends Request {
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface LeaderboardStat {
    userId: string;
    name: string; 
    email: string; 
    points: number; 
    correct: number; 
    attempted: number; 
    currentStreak: number; 
    longestStreak: number;
    accuracy: number;
    avgTime: string;
    rank: number;
}

// Helper function to normalize text (remove case and whitespace)
const normalizeText = (text: string | undefined | null): string => {
    return (text || '').toLowerCase().trim();
};

// Helper function to calculate points and streak 
const calculateLeaderboardStats = (polls: IManualPollQuestion[]): LeaderboardStat[] => {
    const stats: {
        [userId: string]: { 
            name: string; 
            email: string; 
            points: number; 
            correct: number; 
            attempted: number; 
            currentStreak: number; 
            longestStreak: number;
            userId: string; 
        } 
    } = {};

    polls.forEach(poll => {
        const isGradable = (poll.questionType === 'mcq' || poll.questionType === 'truefalse') && poll.correctAnswer;
        
        let correctOptionId: string | null = null;

        if (poll.questionType === 'mcq' && poll.options && poll.correctAnswer) {
             // 1. Find the ID corresponding to the stored correct TEXT.
             const correctOption = poll.options.find(opt => 
                 normalizeText(opt.text) === normalizeText(poll.correctAnswer)
             );
             // The ID is the actual correct key we need for comparison (e.g., "b")
             correctOptionId = correctOption?.id || null;
        }


        poll.answers?.forEach((answer: any) => {
            const userId = answer.userId.toString();
            
            if (!stats[userId]) {
                stats[userId] = { 
                    userId: userId, 
                    name: answer.email, 
                    email: answer.email,
                    points: 0, 
                    correct: 0, 
                    attempted: 0, 
                    currentStreak: 0, 
                    longestStreak: 0 
                };
            }

            const userStats = stats[userId];
            userStats.attempted += 1;
            
            if (isGradable) {
                let isCorrect = false;

                if (poll.questionType === 'mcq') {
                    // FINAL FIX: Compare the submitted answer ID against the derived correct Option ID
                    if (correctOptionId) {
                        isCorrect = normalizeText(answer.answer) === normalizeText(correctOptionId);
                    }
                    
                } else if (poll.questionType === 'truefalse') {
                    // True/False: Compares submitted text/ID against the stored answer text
                    isCorrect = normalizeText(answer.answer) === normalizeText(poll.correctAnswer);
                }

                if (isCorrect) {
                    userStats.correct += 1;
                    userStats.points += 10; 
                    
                    userStats.currentStreak += 1;
                    if (userStats.currentStreak > userStats.longestStreak) {
                        userStats.longestStreak = userStats.currentStreak;
                    }
                } else {
                    userStats.currentStreak = 0;
                }
            }
        });
    });

    // Convert to array and calculate final accuracy
    const leaderboardArray = Object.values(stats).map(userStats => ({
        ...userStats,
        accuracy: userStats.attempted > 0 ? (userStats.correct / userStats.attempted) * 100 : 0,
        // Mocking avgTime for display purposes
        avgTime: (Math.random() * 5 + 1).toFixed(1), 
        rank: 0, 
    }));

    // Sort and apply rank (TIE-BREAKING FIX)
    const rankedArray = leaderboardArray.sort((a, b) => b.points - a.points);
    
    let currentRank = 1;
    let lastPoints = -1;

    return rankedArray.map((stats, index) => {
        if (stats.points !== lastPoints) {
            currentRank = index + 1;
            lastPoints = stats.points;
        }
        return {
            ...stats,
            rank: currentRank
        };
    }) as LeaderboardStat[];
};


/**
 * @desc    Create a new manual poll question and make it active for a session
 * @route   POST /api/manual-polls/create
 * @access  Private (Host only)
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
      correctAnswer: correctAnswer, // Store the correct answer value (Text or ID)
      isActive: true,
      approvedAt: new Date(),
    });

    session.currentPollId = newManualPollQuestion._id as Types.ObjectId;
    session.approvedPollsCount = (session.approvedPollsCount || 0) + 1;
    await session.save();

    console.log(`Manual Poll Question ${newManualPollQuestion._id} created and set as active for session ${sessionId}`);

    // Emit a Socket.IO event to notify clients about the new poll
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
  //console.log("Backend received request for active poll (getActiveManualPoll). User:", req.user);

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

    //console.log(`Active Manual Poll ${activePoll._id} fetched for session ${session._id} by user ${userEmail}`);
    res.status(200).json({ message: 'Active poll fetched successfully', poll: activePoll, sessionStatus: 'active' });

  } catch (error: any) {
    console.error('Error fetching active manual poll:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid ID format provided.', error: error.message });
    }
    res.status(500).json({ message: 'Server error fetching active manual poll.', error: error.message });
  }
};

/**
 * @desc    Submit a student's answer to the currently active poll
 * @route   POST /api/manual-polls/submit-answer
 * @access  Private (Authenticated student)
 */
export const submitPollAnswer = async (req: AuthRequest, res: Response) => {
  if (!req.user || !req.user.id || !req.user.email) {
    return res.status(401).json({ message: 'Not authorized. User information missing.' });
  }

  const { sessionId, pollId, answer } = req.body;
  const userId = new Types.ObjectId(req.user.id);
  const userEmail = req.user.email;

  if (!sessionId || !pollId || !answer) {
    return res.status(400).json({ message: 'Session ID, Poll ID, and Answer are required.' });
  }

  try {
    // 1. Validate Session and Poll
    const session = await Session.findById(sessionId);
    const poll = await ManualPollQuestion.findById(pollId);

    if (!session || !poll) {
      return res.status(404).json({ message: 'Session or Poll not found.' });
    }

    if (session.currentPollId?.toString() !== pollId) {
        return res.status(400).json({ message: 'This poll is no longer the active poll for the session.' });
    }

    // 2. Check if user is blocked/allowed (logic passed when joining session)
    const isBlocked = session.blockedParticipants.some(
        (blockedUserId: Types.ObjectId) => blockedUserId.toString() === userId.toString()
    );
    if (isBlocked) {
        return res.status(403).json({ message: 'Access Denied. You have been blocked from this session.' });
    }

    // Check if the participant already answered this poll
    const alreadyAnswered = poll.answers?.some((a: any) => a.userId.toString() === userId.toString());

    if (alreadyAnswered) {
        return res.status(400).json({ message: 'You have already submitted an answer for this poll.' });
    }

    // Save the answer by pushing to the answers array
    const answerData = {
        userId: userId,
        email: userEmail,
        answer: answer,
        answeredAt: new Date(),
    };
    
    await ManualPollQuestion.updateOne(
        { _id: pollId },
        { $push: { answers: answerData } }
    );
    
    // 3. Emit update event for host dashboard (Live Results)
    io.to(session.roomCode.toUpperCase()).emit('pollAnswered', { 
        pollId: pollId, 
        userId: userId, 
        answer: answer 
    });

    res.status(200).json({ message: 'Answer submitted successfully.' });

  } catch (error: any) {
    console.error('Error submitting poll answer:', error);
    res.status(500).json({ message: 'Server error submitting poll answer.', error: error.message });
  }
};

/**
 * @desc    Get the calculated leaderboard data for a specific session
 * @route   GET /api/manual-polls/leaderboard/:sessionId
 * @access  Private (Host or joined participant for meeting view)
 */
export const getLeaderboardBySessionId = async (req: AuthRequest, res: Response) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Not authorized. User information missing.' });
    }

    const { sessionId } = req.params;
    const userId = req.user.id;

    if (!sessionId || !Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ message: 'Valid session ID is required.' });
    }

    try {
        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({ message: 'Session not found.' });
        }

        // Host check
        const isHost = session.host.toString() === userId;
        if (!isHost) {
            return res.status(403).json({ message: 'Forbidden. Only the host can access the full leaderboard.' });
        }

        // 1. Fetch all polls for this session
        const allPolls = await ManualPollQuestion.find({
            sessionId: new Types.ObjectId(sessionId),
            approvedAt: { $exists: true } // Only count approved/pushed polls
        }).lean() as IManualPollQuestion[];

        // 2. Calculate the stats
        const leaderboardData = calculateLeaderboardStats(allPolls);

        // 3. Enrich data with full user names from Session's joinedParticipants
        const participantMap = new Map();
        session.joinedParticipants.forEach(p => {
            if (p.userId && p.fullName) {
                participantMap.set(p.userId.toString(), p.fullName);
            }
        });

        const finalLeaderboard = leaderboardData.map(item => {
            const nameFromSession = participantMap.get(item.userId); // Use item.userId which is a string now
            return {
                ...item,
                name: nameFromSession || item.name, // Use full name if available
            };
        });
        
        console.log(`Leaderboard generated for session ${sessionId} with ${finalLeaderboard.length} participants.`);

        res.status(200).json({
            message: 'Leaderboard data fetched successfully',
            leaderboard: finalLeaderboard,
            sessionId: session._id,
            sessionTitle: session.sessionTitle
        });

    } catch (error: any) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Server error fetching leaderboard.', error: error.message });
    }
};