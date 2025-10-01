// apps/frontend/src/components/host/HostPollLauncher.tsx

"use client"

import React, { useState, useEffect } from 'react';
import { apiService } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Play, Loader, BarChart, Clock } from 'lucide-react';

// Define the shape of a poll object
interface Poll {
  _id: string;
  title: string;
  type: 'mcq' | 'truefalse';
  options: string[];
  timerDuration: number;
}

// Define the props this component expects
interface HostPollLauncherProps {
  activeRoomId: string | null;
}

const HostPollLauncher: React.FC<HostPollLauncherProps> = ({ activeRoomId }) => {
  const { socket } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [launchingPollId, setLaunchingPollId] = useState<string | null>(null);

  useEffect(() => {
    // Join the host to their own room when the component mounts
    if (socket && activeRoomId) {
      console.log('🏠 Host joining their own room:', activeRoomId);
      socket.emit('host-join-room', activeRoomId);
    }
  }, [socket, activeRoomId]);

  useEffect(() => {
    const fetchPolls = async () => {
        if (!activeRoomId) {
        setPolls([]); // Ensure the list is empty
        setIsLoading(false);
        return;
      }
     try {
        setIsLoading(true);
        // --- MODIFIED: Pass the activeRoomId to the API service ---
        const response = await apiService.getHostPolls(activeRoomId);
        setPolls(response.data);
      } catch (error) {
        toast.error("Failed to load polls for this session.");
        setPolls([]); // Clear polls on error
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPolls();
  }, [activeRoomId]);

  const handleLaunchPoll = (pollId: string) => {
    console.log('🚀 Host launching poll:', { pollId, activeRoomId });
    
    if (!activeRoomId) {
      toast.error("You must have an active session to launch a poll.");
      return;
    }
    if (!socket) {
      toast.error("Real-time connection not established. Please refresh.");
      return;
    }

    console.log('🔌 Socket connected:', socket.connected);
    
    setLaunchingPollId(pollId);

    // This is the critical event that tells the backend to start the poll
    console.log('📤 Emitting host-launch-poll with:', { roomId: activeRoomId, pollId });
    socket.emit('host-launch-poll', {
      roomId: activeRoomId,
      pollId: pollId,
    });

    // Add a small delay to give the server time to process before resetting the button
    setTimeout(() => {
      toast.success("Poll launched successfully to all participants!");
      setLaunchingPollId(null);
    }, 1000);
  };

  if (isLoading) {
    return <div className="text-center text-gray-400 p-4">Loading your polls...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Polls for this Session</h3>
       {polls.length === 0 && !isLoading ? (
        <p className="text-gray-400 text-sm p-4 text-center bg-white/5 rounded-lg">
          No polls have been created for this session yet. Use the form on the left to create one.
        </p>
      ) : (
        polls.map((poll) => (
          <div key={poll._id} className="bg-white/5 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-bold text-white">{poll.title}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                <span className='flex items-center gap-1'><BarChart size={14}/> {poll.options.length} options</span>
                <span className='flex items-center gap-1'><Clock size={14}/> {poll.timerDuration}s</span>
              </div>
            </div>
            <button
              onClick={() => handleLaunchPoll(poll._id)}
              disabled={!activeRoomId || !!launchingPollId}
              className="btn-primary px-4 py-2 flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {launchingPollId === poll._id ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Launching...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Launch
                </>
              )}
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default HostPollLauncher;