//apps/backend/src/websocket/setup.ts
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../web/models/user.model';
import { Room } from '../web/models/room.model';
import { Poll } from '../web/models/poll.model';
import { Report } from '../web/models/report.model';
import { SessionReport } from '../web/models/sessionReport.model'; // <-- NEW IMPORT

import mongoose from 'mongoose';

interface AuthSocket extends Socket {
    userId?: string;
}

export const setupWebSocket = (io: Server) => {
    // Authenticate all incoming socket connections
    io.use((socket: AuthSocket, next) => {
        console.log('🔐 Authenticating socket connection...');
        const token = socket.handshake.auth.token;
        console.log('🎫 Token provided:', !!token);
        
        if (!token) {
            console.log('❌ No token provided');
            return next(new Error('Authentication error: Token not provided'));
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
            socket.userId = decoded.id;
            console.log('✅ Token valid for user:', socket.userId);
            next();
        } catch (err) {
            console.log('❌ Invalid token:', err);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket: AuthSocket) => {
        console.log(`[Socket.IO] User connected: ${socket.id} with UserID: ${socket.userId}`);

        // Add connection error handlers
        socket.on('connect_error', (error) => {
            console.log('❌ Socket connection error:', error);
        });

        socket.on('error', (error) => {
            console.log('❌ Socket error:', error);
        });

        // --- ROOM & SESSION LOGIC ---
        socket.on('student-join-room', async (roomCode: string, callback) => {
            console.log(`🎯 Student join room request - Code: ${roomCode}, UserID: ${socket.userId}`);
            
            if (!socket.userId) {
                console.log('❌ No userId in socket');
                return callback({ error: 'Authentication failed.' });
            }

            if (!callback || typeof callback !== 'function') {
                console.log('❌ No callback provided');
                return;
            }

            try {
                console.log('🔍 Finding user and room...');
                const user = await User.findById(socket.userId).select('fullName avatar email');
                const room = await Room.findOne({ code: roomCode, isActive: true });

                console.log('👤 User found:', !!user);
                console.log('🏠 Room found:', !!room, room ? `(${room.name})` : '');

                if (!user) {
                    console.log('❌ User not found');
                    return callback({ error: 'User not found.' });
                }

                if (!room) {
                    console.log('❌ Room not found or inactive');
                    return callback({ error: 'Invalid room code or room is no longer active.' });
                }

                console.log('🚪 Joining socket to room...');
                console.log('🏠 Room ID for socket join:', room.id);
                console.log('🏠 Room _id:', room._id);
                console.log('🏠 Room _id string:', (room._id as mongoose.Types.ObjectId).toString());
                
                // Use the same identifier consistently
                const roomIdentifier = (room._id as mongoose.Types.ObjectId).toString();
                await socket.join(roomIdentifier);
                console.log('✅ Student joined room:', roomIdentifier);

                const isAlreadyParticipant = room.participants.some(
                    p => p.userId.toString() === (user._id as mongoose.Types.ObjectId).toString()
                );

                console.log('🤔 Already participant?', isAlreadyParticipant);

                if (!isAlreadyParticipant) {
                    console.log('➕ Adding user to participants...');
                    room.participants.push({
                        userId: user._id as mongoose.Types.ObjectId,
                        name: user.fullName,
                        avatar: user.avatar || '',
                        email: user.email
                    });
                    await room.save();
                    
                    console.log('📢 Notifying participants of update...');
                    console.log('📤 Emitting to room:', roomIdentifier);
                    console.log('👥 Current participants:', room.participants.length);
                    console.log('📋 Participant data:', room.participants.map(p => ({ name: p.name, email: p.email })));
                    
                    // Use the same room identifier for emitting
                    io.to(roomIdentifier).emit('participant-list-updated', room.participants);

                    if (room.hostSocketId) {
                        console.log('📢 Notifying host directly...');
                        io.to(room.hostSocketId).emit('student-joined-notification', {
                            name: user.fullName,
                            message: `${user.fullName} has joined the session!`,
                        });
                    } else {
                        console.log('⚠️ No host socket ID found');
                    }
                }
                
                console.log('✅ Calling success callback...');
                callback({ success: true, room });

            } catch (error) {
                console.error("❌ Error in student-join-room:", error);
                callback({ error: "An internal server error occurred." });
            }
        });
// socket.on('student-join-room', async (roomCode: string, callback) => {
//     if (!socket.userId) return callback({ error: 'Authentication failed.' });

//     try {
//         const room = await Room.findOne({ code: roomCode, isActive: true });
//         // --- MODIFIED: Select 'email' along with other fields ---
//         const user = await User.findById(socket.userId).select('fullName avatar email');

//         if (!user || !room) {
//             return callback({ error: 'Invalid room code or room is no longer active.' });
//         }

//         const isAlreadyParticipant = room.participants.some(
//             p => p.userId.toString() === (user as { _id: mongoose.Types.ObjectId })._id.toString()
//         );

//         if (!isAlreadyParticipant) {
//             room.participants.push({
//                 userId: user._id as mongoose.Types.ObjectId,
//                 name: user.fullName,
//                 avatar: user.avatar || '',
//                 email: user.email // <-- ADD THIS LINE
//             });
//             await room.save();

//             if (room.hostSocketId) {
//                 io.to(room.hostSocketId).emit('student-joined-notification', {
//                     name: user.fullName,
//                     message: `${user.fullName} has joined the session!`,
//                 });
//             }
//         }

//         await socket.join(room.id);
        
//         io.to(room.id).emit('participant-list-updated', room.participants);
//         callback({ success: true, room });

//     } catch (error) {
//         console.error("Error in student-join-room:", error);
//         callback({ error: "An internal server error occurred." });
//     }
// });
//  socket.on('student-join-room', async (roomCode: string, callback) => {
//     if (!socket.userId) return callback({ error: 'Authentication failed.' });

//     try {
//         // --- ADD .populate('hostId') to get host details ---
//         const room = await Room.findOne({ code: roomCode, isActive: true }).populate('hostId');
//         const user = await User.findById(socket.userId).select('fullName avatar email');

//         if (!user || !room) {
//             return callback({ error: 'Invalid room code or room is no longer active.' });
//         }

//         const isAlreadyParticipant = room.participants.some(
//             p => p.userId.toString() === (user as { _id: mongoose.Types.ObjectId })._id.toString()
//         );

//         if (!isAlreadyParticipant) {
//             room.participants.push({
//                 userId: user._id as mongoose.Types.ObjectId,
//                 name: user.fullName,
//                 avatar: user.avatar || '',
//                 email: user.email
//             });
//             await room.save();

//             // --- NEW: NOTIFY THE HOST ---
//             // If the host has a specific socket connected, send a direct message.
//             if (room.hostSocketId) {
//                 io.to(room.hostSocketId).emit('student-joined-notification', {
//                     name: user.fullName,
//                     message: `${user.fullName} has joined the session!`,
//                 });
//             }
//         }

//         await socket.join(room.id);

//         // This event updates the list for everyone already on the participants page
//         io.to(room.id).emit('participant-list-updated', room.participants);
//         callback({ success: true, room });

//     } catch (error) {
//         console.error("Error in student-join-room:", error);
//         callback({ error: "An internal server error occurred." });
//     }
// });
 // --- NEW: Allow host to join their own room to receive updates ---
    socket.on('host-join-room', async (roomId: string) => {
        console.log('🏠 Host attempting to join room:', roomId);
        if (!socket.userId) return;

        const room = await Room.findById(roomId);
        console.log('🔍 Room found for host:', !!room);
        
        // Security check: Only the actual host can join the host's room
        if (room && room.hostId.toString() === socket.userId) {
            const roomIdentifier = (room._id as mongoose.Types.ObjectId).toString();
            socket.join(roomIdentifier);
            
            // Store the host's latest socket ID for direct messaging if needed
            room.hostSocketId = socket.id;
            await room.save();
            console.log(`✅ [Socket.IO] Host ${socket.userId} joined room ${roomIdentifier}`);
        } else {
            console.log('❌ Host join denied - not the room owner or room not found');
        }
    });
    
        // --- POLLING LOGIC ---
       socket.on('host-launch-poll', async ({ roomId, pollId }) => {
    console.log('🎯 Host launching poll:', { roomId, pollId, userId: socket.userId });
    
    if (!socket.userId) {
        console.log('❌ No userId in socket');
        return;
    }

    try {
        const poll = await Poll.findById(pollId);
        const room = await Room.findById(roomId);
        
        console.log('📋 Poll found:', !!poll);
        console.log('🏠 Room found:', !!room);
        console.log('👤 Host check:', room ? room.hostId.toString() === socket.userId : false);

        if (poll && room && room.hostId.toString() === socket.userId) {
            // Update room with current poll
            room.currentPoll = poll._id as mongoose.Types.ObjectId;
            await room.save();
            
            console.log('💾 Room updated with current poll');

            const pollDataForClient = {
                _id: (poll._id as mongoose.Types.ObjectId).toString(),
                title: poll.title,
                options: poll.options,
                timerDuration: poll.timerDuration
            };
            
            console.log('📤 Emitting poll-started to room:', roomId);
            console.log('📊 Poll data:', pollDataForClient);
            
            // Get sockets in the room to see who will receive the event
            const socketsInRoom = await io.in(roomId).fetchSockets();
            console.log('👥 Sockets in room:', socketsInRoom.length);
            
            io.to(roomId).emit('poll-started', pollDataForClient);
            console.log('✅ Poll started event emitted');
        } else {
            console.log('❌ Invalid poll launch attempt');
        }
    } catch (error) {
        console.error('❌ Error in host-launch-poll:', error);
    }
});



       socket.on('student-submit-vote', async ({ roomId, pollId, answer, timeTaken }) => {
    console.log('📝 [VOTE] Received student-submit-vote:', { roomId, pollId, answer, timeTaken, userId: socket.userId });
    
    if (!socket.userId) {
        console.log('❌ [VOTE] No userId in socket');
        return;
    }

    if (!roomId) {
        console.log('❌ [VOTE] No roomId provided');
        return socket.emit('vote-error', { message: "Room ID is required" });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
        console.log('❌ [VOTE] Poll not found:', pollId);
        return;
    }

    // Check if the user has already voted on this specific poll
    const existingReport = await Report.findOne({ pollId, userId: socket.userId });
    if (existingReport) {
        return socket.emit('vote-error', { message: "You have already voted on this poll." });
    }

    const isCorrect = poll.correctAnswer === answer;
    
    // Example scoring logic
    const timeBonus = isCorrect ? Math.max(0, Math.floor((poll.timerDuration - timeTaken) * 1.5)) : 0;
    const points = isCorrect ? 100 + timeBonus : 0;
    
    // Save the report
    console.log('💾 [VOTE] Saving report with data:', { roomId, pollId, userId: socket.userId, answer, isCorrect, timeTaken, points });
    console.log('💾 [VOTE] Data types:', { 
        roomIdType: typeof roomId, 
        pollIdType: typeof pollId, 
        userIdType: typeof socket.userId 
    });
    
    try {
        const report = new Report({ 
            roomId: new mongoose.Types.ObjectId(roomId), 
            pollId: new mongoose.Types.ObjectId(pollId), 
            userId: new mongoose.Types.ObjectId(socket.userId), 
            answer, 
            isCorrect, 
            timeTaken, 
            points 
        });
        await report.save();
        console.log('✅ [VOTE] Report saved successfully');
    } catch (error) {
        console.error('❌ [VOTE] Error saving report:', error);
        return socket.emit('vote-error', { message: "Failed to save vote" });
    }

    // --- UPGRADED RESPONSE ---
    // Now, let's calculate the user's new total score and streak for this room
    const userReports = await Report.find({ roomId, userId: socket.userId }).sort({ createdAt: 'asc' });

    const totalScore = userReports.reduce((sum, r) => sum + r.points, 0);
    
    let currentStreak = 0;
    for(let i = userReports.length - 1; i >= 0; i--) {
        if (userReports[i].isCorrect) {
            currentStreak++;
        } else {
            break;
        }
    }
    
    // Send back a comprehensive result
    socket.emit('vote-result', { 
        isCorrect, 
        pointsAwarded: points,
        totalScore,
        streak: currentStreak
    });

    // Notify host for their real-time updates
    const room = await Room.findById(roomId);
    if (room && room.hostSocketId) {
        io.to(room.hostSocketId).emit('new-vote-received');
    }
});
        socket.on('host-end-poll', async (roomId: string) => {
            if (!socket.userId) return;
            const room = await Room.findById(roomId);

            if (room && room.hostId.toString() === socket.userId) {
                room.currentPoll = undefined;
                await room.save();
                io.to(roomId).emit('poll-ended');
            }
        });
socket.on('host-get-participants', async (roomId: string, callback) => {
            const room = await Room.findById(roomId);
            if (room && room.hostId.toString() === socket.userId) {
                // Use a callback to send data back directly to the requester
                callback(room.participants);
            }
        });
socket.on('host-kick-participant', async ({ roomId, participantUserId }) => {
            if(!socket.userId) return;
            const room = await Room.findById(roomId);
            if(room && room.hostId.toString() === socket.userId) {
                // Find the participant's socket to disconnect them
                const targetSocket = [...io.sockets.sockets.values()].find(
                    (s: any) => s.userId === participantUserId
                ) as AuthSocket | undefined;

                if (targetSocket) {
                    targetSocket.emit('kicked-from-room', 'The host has removed you from the session.');
                    targetSocket.disconnect();
                }

                // Also remove them from the database
                room.participants = room.participants.filter(p => p.userId.toString() !== participantUserId);
                await room.save();
                io.to(roomId).emit('participant-list-updated', room.participants);
            }
        });

            // --- NEW: Add this event listener for ending the session ---
        // socket.on('host-end-session', async (roomId: string) => {
        //     if (!socket.userId) return;

        //     const room = await Room.findById(roomId);

        //     // Security check: Only the host of the room can end it.
        //     if (room && room.hostId.toString() === socket.userId) {
        //         // Set the room to inactive in the database
        //         room.isActive = false;
        //         await room.save();

        //         // Broadcast to all clients in the room that the session is over
        //         io.to(roomId).emit('session-ended', { message: 'The host has ended the session.' });

        //         // Optional: Force all sockets in the room to disconnect
        //         const socketsInRoom = await io.in(roomId).fetchSockets();
        //         for (const clientSocket of socketsInRoom) {
        //             clientSocket.disconnect();
        //         }

        //         console.log(`[Socket.IO] Host ${socket.userId} ended session for room ${roomId}`);
        //     }
        // });
    // --- REPLACED: This is the new, powerful host-end-session listener ---
  // --- REPLACED: This is the new, powerful host-end-session listener ---
// socket.on('host-end-session', async (roomId: string) => {
//     if (!socket.userId) return;

//     try {
//         const room = await Room.findById(roomId).populate('hostId');
//         if (!room || room.hostId._id.toString() !== socket.userId) return;

//         // --- 1. Mark the room as inactive ---
//         room.isActive = false;
//         await room.save();

//         // --- 2. Calculate and generate the summary report ---
//         await generateAndSaveSessionReport(roomId);

//         // --- 3. Notify clients and disconnect ---
//         io.to(roomId).emit('session-ended', { message: 'The host has ended the session.' });
//         const socketsInRoom = await io.in(roomId).fetchSockets();
//         for (const clientSocket of socketsInRoom) {
//             clientSocket.disconnect();
//         }

//         console.log(`[Socket.IO] Host ${socket.userId} ended session and generated report for room ${roomId}`);

//     } catch (error) {
//         console.error(`[Socket.IO] Error ending session ${roomId}:`, error);
//     }
// });


socket.on('host-end-session', async (roomId: string) => {
    if (!socket.userId) return;

    try {
        const room = await Room.findById(roomId);
        if (!room || room.hostId.toString() !== socket.userId) return;

        // --- 1. Mark the room as inactive ---
        room.isActive = false;
        await room.save();

        // --- 2. Calculate and generate the summary report ---
        // This function already saves the report with the correct sessionId
        await generateAndSaveSessionReport(roomId);

        const sessionId = (room._id as mongoose.Types.ObjectId | string).toString();

        // --- 3. First, notify the HOST specifically (before disconnecting students) ---
        socket.emit('session-ended-host', { 
            message: 'Session ended successfully.',
            sessionId: sessionId
        });

        // --- 4. Then notify all STUDENTS in the room ---
        socket.to(roomId).emit('session-ended', { 
            message: 'The host has ended the session.',
            sessionId: sessionId
        });
        
        // --- 5. Disconnect all student sockets but not the host ---
        const socketsInRoom = await io.in(roomId).fetchSockets();
        for (const clientSocket of socketsInRoom) {
            // Don't disconnect the host socket
            if (clientSocket.id !== socket.id) {
                clientSocket.disconnect();
            }
        }

        console.log(`[Socket.IO] Host ${socket.userId} ended session for room ${roomId}`);

    } catch (error) {
        console.error(`[Socket.IO] Error ending session ${roomId}:`, error);
    }
});
        // --- DISCONNECT ---
        socket.on('disconnect', async () => {
            console.log(`[Socket.IO] User disconnected: ${socket.id}`);
            if (!socket.userId) return;

            const room = await Room.findOneAndUpdate(
                { "participants.userId": socket.userId, isActive: true },
                { $pull: { participants: { userId: new mongoose.Types.ObjectId(socket.userId) } } },
                { new: true }
            );

            if (room) {
                io.to(room.id).emit('participant-list-updated', room.participants);
            }
        });
        
    });
    
};

// --- NEW HELPER FUNCTION TO BE ADDED AT THE BOTTOM OF setup.ts ---
async function generateAndSaveSessionReport(roomId: string) {
    console.log('📊 [SessionReport] Starting report generation for roomId:', roomId);
    
    // Find the ended room and populate host details
    const room = await Room.findById(roomId).populate<{ hostId: typeof User.prototype }>('hostId');
    if (!room) {
        console.log('❌ [SessionReport] Room not found for roomId:', roomId);
        throw new Error("Room not found for report generation");
    }
    
    console.log('🏠 [SessionReport] Found room:', room.name);
    
    // Get all individual poll answers for this room
    const individualReports = await Report.find({ roomId }).sort({ createdAt: 'asc' });
    console.log('📋 [SessionReport] Found individual reports:', individualReports.length);
    
    if (individualReports.length === 0) {
        console.log(`⚠️ [SessionReport] No reports found for room ${roomId}, skipping summary generation.`);
        return;
    }
    
    // Get all polls that were launched in this room to find the total count
    const pollsLaunched = await Poll.find({ _id: { $in: individualReports.map(r => r.pollId) } }) as Array<{ _id: mongoose.Types.ObjectId }>;
    const totalPollsInSession = new Set(pollsLaunched.map(p => p._id.toString())).size;

    // Group reports by user to calculate individual stats
    const reportsByUser = individualReports.reduce((acc, report) => {
        const userId = report.userId.toString();
        if (!acc[userId]) {
            acc[userId] = [];
        }
        acc[userId].push(report);
        return acc;
    }, {} as Record<string, (typeof Report.prototype)[]>);

    const studentResults = [];

    for (const userId in reportsByUser) {
        const userReports = reportsByUser[userId];
        const userDetails = await User.findById(userId);
        if (!userDetails) continue;

        // Calculate stats for this user
        const totalPoints = userReports.reduce((sum, r) => sum + r.points, 0);
        const correctAnswers = userReports.filter(r => r.isCorrect).length;
        const pollsAttempted = userReports.length;
        const totalTimeTaken = userReports.reduce((sum, r) => sum + r.timeTaken, 0);
        const averageTime = pollsAttempted > 0 ? totalTimeTaken / pollsAttempted : 0;
        const accuracy = pollsAttempted > 0 ? (correctAnswers / pollsAttempted) * 100 : 0;
        
        // Calculate longest streak
        let longestStreak = 0;
        let currentStreak = 0;
        for (const report of userReports) {
            if (report.isCorrect) {
                currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 0;
            }
        }
        longestStreak = Math.max(longestStreak, currentStreak);

        studentResults.push({
            userId: userDetails._id,
            studentEmail: userDetails.email,
            studentName: userDetails.fullName,
            totalPolls: totalPollsInSession,
            pollsAttempted,
            correctAnswers,
            totalPoints,
            streak: longestStreak,
            averageTime: parseFloat(averageTime.toFixed(2)),
            accuracy: parseFloat(accuracy.toFixed(2)),
        });
    }

    // Create and save the final summary report
    console.log('💾 [SessionReport] Creating final report with:', {
        sessionId: room._id,
        sessionName: room.name,
        hostId: room.hostId._id,
        studentCount: studentResults.length
    });
    
    const finalReport = new SessionReport({
        sessionId: room._id as mongoose.Types.ObjectId,
        sessionName: room.name,
        hostId: room.hostId._id,
        hostEmail: room.hostId.email,
        sessionEndedAt: new Date(),
        studentResults,
    });
    
    await finalReport.save();
    console.log(`✅ [SessionReport] Successfully generated summary report for session ${room.name}`);
    console.log(`📋 [SessionReport] Report ID: ${finalReport._id}`);
}

// // --- NEW HELPER FUNCTION TO BE ADDED AT THE BOTTOM OF setup.ts ---
// async function generateAndSaveSessionReport(roomId: string) {
//     // Find the ended room and populate host details
//     const room = await Room.findById(roomId).populate<{ hostId: typeof User.prototype }>('hostId');
//     if (!room) throw new Error("Room not found for report generation");
    
//     // Get all individual poll answers for this room
//     const individualReports = await Report.find({ roomId }).sort({ createdAt: 'asc' });
//     if (individualReports.length === 0) {
//         console.log(`No reports found for room ${roomId}, skipping summary generation.`);
//         return;
//     }
    
//     // Get all polls that were launched in this room to find the total count
//     const pollsLaunched = await Poll.find({ _id: { $in: individualReports.map(r => r.pollId) } }) as Array<{ _id: mongoose.Types.ObjectId }>;
//     const totalPollsInSession = new Set(pollsLaunched.map(p => p._id.toString())).size;

//     // Group reports by user to calculate individual stats
//     const reportsByUser = individualReports.reduce((acc, report) => {
//         const userId = report.userId.toString();
//         if (!acc[userId]) {
//             acc[userId] = [];
//         }
//         acc[userId].push(report);
//         return acc;
//     }, {} as Record<string, (typeof Report.prototype)[]>);

//     const studentResults = [];

//     for (const userId in reportsByUser) {
//         const userReports = reportsByUser[userId];
//         const userDetails = await User.findById(userId);
//         if (!userDetails) continue;

//         // Calculate stats for this user
//         const totalPoints = userReports.reduce((sum, r) => sum + r.points, 0);
//         const correctAnswers = userReports.filter(r => r.isCorrect).length;
//         const pollsAttempted = userReports.length;
//         const totalTimeTaken = userReports.reduce((sum, r) => sum + r.timeTaken, 0);
//         const averageTime = pollsAttempted > 0 ? totalTimeTaken / pollsAttempted : 0;
//         const accuracy = pollsAttempted > 0 ? (correctAnswers / pollsAttempted) * 100 : 0;
        
//         // Calculate longest streak
//         let longestStreak = 0;
//         let currentStreak = 0;
//         for (const report of userReports) {
//             if (report.isCorrect) {
//                 currentStreak++;
//             } else {
//                 longestStreak = Math.max(longestStreak, currentStreak);
//                 currentStreak = 0;
//             }
//         }
//         longestStreak = Math.max(longestStreak, currentStreak);

//         studentResults.push({
//             userId: userDetails._id,
//             studentEmail: userDetails.email,
//             studentName: userDetails.fullName,
//             totalPolls: totalPollsInSession,
//             pollsAttempted,
//             correctAnswers,
//             totalPoints,
//             streak: longestStreak,
//             averageTime: parseFloat(averageTime.toFixed(2)),
//             accuracy: parseFloat(accuracy.toFixed(2)),
//         });
//     }

//     // Create and save the final summary report
//     const finalReport = new SessionReport({
//         sessionId: room._id,
//         sessionName: room.name,
//         hostId: room.hostId._id,
//         hostEmail: room.hostId.email,
//         sessionEndedAt: new Date(),
//         studentResults,
//     });
    
//     await finalReport.save();
//     console.log(`Successfully generated summary report for session ${room.name}`);
// }