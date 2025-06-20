import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private meetingId: string | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);
      console.log('Socket connected');
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket disconnected');
    }
  }

  joinMeeting(meetingId: string) {
    if (this.socket) {
      this.socket.emit('join-meeting', meetingId);
      this.meetingId = meetingId;
      console.log(`Joined meeting: ${meetingId}`);
    }
  }

  leaveMeeting() {
    if (this.socket && this.meetingId) {
      this.socket.emit('leave-meeting', this.meetingId);
      console.log(`Left meeting: ${this.meetingId}`);
      this.meetingId = null;
    }
  }

  launchPoll(poll: any) {
    if (this.socket && this.meetingId) {
      this.socket.emit('launch-poll', {
        meetingId: this.meetingId,
        poll
      });
    }
  }

  endPoll(pollId: string) {
    if (this.socket && this.meetingId) {
      this.socket.emit('end-poll', {
        meetingId: this.meetingId,
        pollId
      });
    }
  }

  submitAnswer(userId: string, pollId: string, answer: number) {
    if (this.socket && this.meetingId) {
      this.socket.emit('submit-answer', {
        meetingId: this.meetingId,
        userId,
        pollId,
        answer
      });
    }
  }

  onNewPoll(callback: (poll: any) => void) {
    if (this.socket) {
      this.socket.on('new-poll', callback);
    }
  }

  onPollAnswer(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('poll-answer', callback);
    }
  }

  onPollEnded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('poll-ended', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new SocketService();
