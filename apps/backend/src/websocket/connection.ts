import { Server } from 'socket.io';
import http from 'http';

export function setupWebSocketServer(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Handle meeting join
    socket.on('join-meeting', (meetingId: string) => {
      socket.join(meetingId);
      console.log(`👥 User ${socket.id} joined meeting: ${meetingId}`);
      socket.to(meetingId).emit('user-joined', { userId: socket.id });
    });

    // Handle poll launch
    socket.on('launch-poll', (data: { meetingId: string; poll: any }) => {
      console.log('📊 Poll launched:', data.poll.question);
      socket.to(data.meetingId).emit('new-poll', data.poll);
    });

    // Handle poll responses
    socket.on('submit-answer', (data: { meetingId: string; userId: string; pollId: string; answer: any }) => {
      console.log('✅ Answer submitted:', data.answer);
      socket.to(data.meetingId).emit('poll-response', data);
    });

    // Handle audio streaming
    socket.on('audio-chunk', (data: { meetingId: string; audioChunk: any; chunkIndex: number }) => {
      console.log('🎤 Audio chunk received:', data.chunkIndex);
      // Process audio chunk here
      socket.to(data.meetingId).emit('audio-processed', {
        chunkIndex: data.chunkIndex,
        transcript: 'Processing...' // Placeholder
      });
    });

    // Handle real-time transcript updates
    socket.on('transcript-update', (data: { meetingId: string; transcript: string; timestamp: number }) => {
      console.log('📝 Transcript update:', data.transcript.substring(0, 50) + '...');
      socket.to(data.meetingId).emit('realtime-transcript-update', data);
    });

    // Handle poll generation from transcript
    socket.on('generate-poll', (data: { meetingId: string; transcript: string }) => {
      console.log('🤖 Generating poll from transcript...');
      // This would integrate with your AI service
      const generatedPoll = {
        id: Date.now().toString(),
        question: 'Sample question based on: ' + data.transcript.substring(0, 30) + '...',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        timestamp: Date.now()
      };
      
      socket.to(data.meetingId).emit('realtime-poll-generated', {
        poll: generatedPoll,
        timestamp: Date.now()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });
  });

  return io;
}
