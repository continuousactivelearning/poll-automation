import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

const JoinMeeting: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { currentUser } = useAuth();
  const { joinMeeting, isConnected, connectSocket } = useSocket();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [rollNumber, setRollNumber] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // Connect to socket if not already connected
  React.useEffect(() => {
    if (!isConnected) {
      connectSocket();
    }
  }, [isConnected, connectSocket]);
  
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!meetingId) {
      setError('Invalid meeting ID');
      return;
    }
    
    if (!name || !email || !rollNumber) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsJoining(true);
    setError('');
    
    try {
      // Emit a verification event and wait for response
      const socket = await new Promise<boolean>((resolve) => {
        if (!isConnected) {
          setError('Not connected to server');
          setIsJoining(false);
          resolve(false);
          return;
        }
        
        // This would be handled by your socket service
        // Here we're simulating the verification process
        const participantInfo = { name, email, rollNumber };
        
        // In a real implementation, you'd emit an event and wait for a response
        // socket.emit('verify-participant', { meetingId, ...participantInfo }, (response) => {
        //   resolve(response.allowed);
        // });
        
        // For now, we'll just simulate success
        setTimeout(() => resolve(true), 1000);
      });
      
      if (socket) {
        // Join the meeting
        joinMeeting(meetingId);
        
        // Store participant info in localStorage for persistence
        localStorage.setItem('participantInfo', JSON.stringify({ name, email, rollNumber }));
        
        // Navigate to the active poll page
        navigate(`/participant/meeting/${meetingId}`);
      } else {
        setError('You are not authorized to join this meeting');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join meeting');
    } finally {
      setIsJoining(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Join Meeting</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleJoin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="rollNumber">
              Roll Number
            </label>
            <input
              id="rollNumber"
              type="text"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            disabled={isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Meeting'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinMeeting;