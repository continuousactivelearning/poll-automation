// apps/frontend/src/components/student/JoinPollPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hash, Users, Clock, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE_URL = 'http://localhost:3000/api/sessions'; // Your backend API base URL for sessions

// Define the structure of a session returned from the backend (partial, as needed by this page)
interface SessionInfo {
  _id: string;
  roomCode: string;
  sessionTitle: string;
  hostName: string;
  isActive: boolean;
  endedAt: string; // ISO date string
  timeRemaining?: string; // For frontend display
  participants?: string; // For frontend display (placeholder for now)
}

const JoinPollPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, token } = useAuth(); // Get auth states including token

  const [roomCode, setRoomCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [joinStatus, setJoinStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Helper to format time remaining
  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 0) return 'Expired';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Function to validate room code with backend
  const handleValidateRoomCode = useCallback(async (codeToValidate: string) => {
    // Ensure room code is exactly 6 characters before validating
    if (codeToValidate.length !== 6) {
      setRoomInfo(null);
      setError('Room code must be 6 characters.');
      setIsValidating(false);
      return;
    }

    // Crucial: Only proceed if authentication is fully loaded and user is authenticated AND token is present
    if (authLoading || !isAuthenticated || !token) {
      console.log('Debug: handleValidateRoomCode skipped - Authentication not ready, not authenticated, or token missing.');
      setRoomInfo(null);
      setError('Please log in to validate and join a session.');
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    setError('');
    setRoomInfo(null);

    try {
      // Axios interceptor will automatically add Authorization header
      const response = await axios.get(`${API_BASE_URL}/by-code/${codeToValidate}`);
      
      const sessionData = response.data.session;
      // Calculate time remaining for display
      const now = new Date().getTime();
      const endedAtTime = new Date(sessionData.endedAt).getTime();
      const remainingSeconds = Math.max(0, Math.floor((endedAtTime - now) / 1000));

      setRoomInfo({
        title: sessionData.sessionTitle,
        host: sessionData.hostName,
        participants: sessionData.joinedParticipants ? sessionData.joinedParticipants.length : 0,
        timeRemaining: formatTime(remainingSeconds),
        isActive: sessionData.isActive,
      });
      setJoinStatus('idle');
      console.log('Debug: Room code validation successful:', sessionData);

    } catch (err: any) {
      console.error('Error validating room code:', err);
      const errorMessage = err.response?.data?.message || 'Failed to validate room code. Please try again.';
      setError(errorMessage);
      setJoinStatus('error');
      setRoomInfo(null);
    } finally {
      setIsValidating(false);
    }
  }, [isAuthenticated, authLoading, token, formatTime]); // Dependencies for useCallback

  // Effect to trigger validation with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      // Only trigger validation if roomCode is exactly 6 chars AND authentication is ready AND token is present
      if (roomCode.length === 6 && isAuthenticated && !authLoading && token) {
        handleValidateRoomCode(roomCode);
      } else if (roomCode.length < 6) {
        setRoomInfo(null);
        setError('');
        setIsValidating(false);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(debounceTimer); // Cleanup on unmount or dependency change
  }, [roomCode, isAuthenticated, authLoading, token, handleValidateRoomCode]); // Dependencies for useEffect

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputCode = e.target.value.replace(/[^A-Z0-9]/g, '').toUpperCase();
    setRoomCode(inputCode);
    // Clear previous validation results immediately on input change
    setError('');
    setRoomInfo(null);
    setJoinStatus('idle');
  };

  // Handle joining the poll
  const handleJoinPoll = async () => {
    if (!roomInfo || !roomInfo.isActive) {
      setError('Cannot join. Poll is not active or not found.');
      return;
    }
    if (!isAuthenticated || !token) {
        setError('Please log in to join a poll.');
        return;
    }

    setIsJoining(true);
    setError('');

    try {
      // Axios interceptor will automatically add Authorization header
      const response = await axios.post(`${API_BASE_URL}/join`, { roomCode: roomCode });
      console.log('Successfully joined poll:', response.data);
      setJoinStatus('success');
      // Navigate to the poll questions page or a success page
      navigate(`/student/poll-questions?roomCode=${roomCode}`);
    } catch (err: any) {
      console.error('Error joining poll:', err);
      const errorMessage = err.response?.data?.message || 'Failed to join poll. Please try again.';
      setError(errorMessage);
      setJoinStatus('error');
    } finally {
      setIsJoining(false);
    }
  };

  // If authentication is still loading, show a loading indicator
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin mr-2" /> Loading authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-gray-800/50 backdrop-blur-lg rounded-xl shadow-2xl p-6 sm:p-8 border border-gray-700 relative overflow-hidden"
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 -z-10 rounded-xl pointer-events-none"
             style={{ background: 'radial-gradient(circle at top left, rgba(79, 70, 229, 0.2), transparent 50%), radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.2), transparent 50%)' }}>
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <Hash className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Join a Poll Session</h1>
          <p className="text-gray-300 text-sm sm:text-base">
            Enter the room code provided by your host.
          </p>
        </div>

        <div className="space-y-4">
          {joinStatus === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center bg-green-600/20 text-green-300 p-4 rounded-lg flex flex-col items-center justify-center space-y-2"
            >
              <CheckCircle className="w-8 h-8 text-green-400" />
              <p className="font-semibold text-lg">Successfully Joined!</p>
              <p className="text-sm">Redirecting you to the poll questions...</p>
            </motion.div>
          ) : (
            <>
              {/* Room Code Input */}
              <div>
                <label htmlFor="roomCode" className="block text-gray-300 text-sm font-medium mb-2">
                  Room Code
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="roomCode"
                    className="w-full pl-10 pr-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white placeholder-gray-400 transition-all duration-200"
                    placeholder="e.g., ABC123"
                    value={roomCode}
                    onChange={handleRoomCodeChange}
                    maxLength={6}
                    disabled={isValidating || isJoining}
                  />
                  {isValidating && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 animate-spin" />
                  )}
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm mt-2 flex items-center"
                  >
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Room Info Display */}
              {roomInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-700/40 p-4 rounded-lg space-y-2 border border-gray-600"
                >
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Hash className="w-5 h-5 mr-2 text-primary-400" />
                    {roomInfo.title}
                  </h3>
                  <p className="text-gray-300 text-sm flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <strong>Host:</strong> {roomInfo.host}
                  </p>
                  <p className="text-gray-300 text-sm flex items-center">
                    <Users className="w-4 h-4 mr-2 text-gray-400" />
                    <strong>Participants:</strong> {roomInfo.participants}
                  </p>
                  <p className="text-gray-300 text-sm flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <strong>Status:</strong> {roomInfo.isActive ? 'Active' : 'Inactive'}
                  </p>
                </motion.div>
              )}

              {/* Join Button */}
              <button
                onClick={handleJoinPoll}
                disabled={!roomInfo || !roomInfo.isActive || isJoining || authLoading || !isAuthenticated}
                className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 text-white ${
                  roomInfo && roomInfo.isActive && !isJoining && isAuthenticated && !authLoading
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:brightness-110"
                    : "bg-white/10 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isJoining ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Joining...
                  </div>
                ) : (
                  "Join Poll"
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer Tips */}
        {joinStatus !== "success" && (
          <div className="mt-6 text-sm text-gray-400 text-center">
            Room codes are 6 characters long (e.g., ABC123). Ask your instructor for the code.
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default JoinPollPage;
