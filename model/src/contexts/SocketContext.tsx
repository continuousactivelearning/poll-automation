import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface SocketContextType {
  isConnected: boolean;
  activePoll: any | null;
  participants: number;
  sendMessage: (event: string, data: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activePoll, setActivePoll] = useState(null);
  const [participants, setParticipants] = useState(0);

  useEffect(() => {
    if (user) {
      // Simulate WebSocket connection
      setIsConnected(true);
      setParticipants(Math.floor(Math.random() * 50) + 10);
      
      // Simulate periodic updates
      const interval = setInterval(() => {
        setParticipants(prev => prev + Math.floor(Math.random() * 3) - 1);
      }, 5000);

      return () => clearInterval(interval);
    } else {
      setIsConnected(false);
    }
  }, [user]);

  const sendMessage = (event: string, data: any) => {
    // In a real app, this would emit to the actual socket
    console.log('Socket event:', event, data);
    
    if (event === 'poll:launch') {
      setActivePoll(data);
      // Simulate poll ending after 30 seconds
      setTimeout(() => setActivePoll(null), 30000);
    }
  };

  const value = {
    isConnected,
    activePoll,
    participants,
    sendMessage,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};