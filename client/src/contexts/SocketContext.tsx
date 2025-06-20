import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

interface Poll {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
}

interface PollAnswer {
  userId: string;
  pollId: string;
  answer: number;
}

interface SocketContextType {
  isConnected: boolean;
  currentMeetingId: string | null;
  activePoll: Poll | null;
  connectSocket: () => void;
  disconnectSocket: () => void;
  joinMeeting: (meetingId: string) => void;
  leaveMeeting: () => void;
  launchPoll: (poll: Poll) => void;
  endPoll: (pollId: string) => void;
  submitAnswer: (pollId: string, answer: number) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);

  const connectSocket = () => {
    const socket = socketService.connect();
    setIsConnected(true);

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Set up event listeners
    socketService.onNewPoll((poll) => {
      console.log('New poll received:', poll);
      setActivePoll(poll);
    });

    socketService.onPollEnded((data) => {
      console.log('Poll ended:', data);
      if (activePoll && activePoll.id === data.pollId) {
        setActivePoll(null);
      }
    });
  };

  const disconnectSocket = () => {
    socketService.disconnect();
    setIsConnected(false);
    setCurrentMeetingId(null);
    setActivePoll(null);
  };

  const joinMeeting = (meetingId: string) => {
    socketService.joinMeeting(meetingId);
    setCurrentMeetingId(meetingId);
  };

  const leaveMeeting = () => {
    socketService.leaveMeeting();
    setCurrentMeetingId(null);
    setActivePoll(null);
  };

  const launchPoll = (poll: Poll) => {
    socketService.launchPoll(poll);
  };

  const endPoll = (pollId: string) => {
    socketService.endPoll(pollId);
    if (activePoll && activePoll.id === pollId) {
      setActivePoll(null);
    }
  };

  const submitAnswer = (pollId: string, answer: number) => {
    if (currentUser) {
      socketService.submitAnswer(currentUser.uid, pollId, answer);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, []);

  const value = {
    isConnected,
    currentMeetingId,
    activePoll,
    connectSocket,
    disconnectSocket,
    joinMeeting,
    leaveMeeting,
    launchPoll,
    endPoll,
    submitAnswer
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};


