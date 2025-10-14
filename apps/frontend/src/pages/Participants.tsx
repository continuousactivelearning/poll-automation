// apps/frontend/src/pages/Participants.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import toast from 'react-hot-toast';

// --- TYPE DEFINITIONS ---
interface Participant {
  userId: string;
  name: string;
  avatar: string;
    email: string; // <-- ADDED EMAIL

}

interface FinalResult {
  userId: string;
  studentName: string;
  accuracy: number;
  averageTime: number;
  pollsAttempted: number;
  totalPolls: number;
}

const ParticipantsPage: React.FC = () => {
  const { socket, activeRoom } = useAuth(); // Use global activeRoom
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [finalResults, setFinalResults] = useState<FinalResult[]>([]);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- EFFECT 1: Fetch initial participants and set up listeners ---
  // useEffect(() => {
  //   if (!activeRoom || !socket) {
  //     setIsLoading(false);
  //     return;
  //   }

  //   // Fetch the initial list of participants
  //   apiService.getLiveParticipants(activeRoom._id)
  //     .then(response => {
  //       setParticipants(response.data);
  //     })
  //     .catch(() => toast.error("Could not load participant list."))
  //     .finally(() => setIsLoading(false));

  //   // Listen for real-time updates
  //   const handleParticipantsUpdate = (updatedList: Participant[]) => {
  //     setParticipants(updatedList);
  //   };

   useEffect(() => {
    // Don't do anything if there's no active room or socket connection
    if (!activeRoom || !socket) {
      setIsLoading(false);
      setParticipants([]); // Clear list if no active room
      return;
    }

    setIsLoading(true);
    
    // 1. Fetch the initial list of participants for the active room
    apiService.getLiveParticipants(activeRoom._id)
      .then(response => {
        setParticipants(response.data);
      })
      .catch(() => toast.error("Could not load the current participant list."))
      .finally(() => setIsLoading(false));

    // 2. Set up Socket.IO listeners for real-time updates
    const handleParticipantsUpdate = (updatedList: Participant[]) => {
      console.log('📥 [Participants] Received participant list update:', updatedList);
      console.log('📊 Updated participant count:', updatedList.length);
      setParticipants(updatedList);
    };
    
    // Listen for the session ending to fetch final results
    const handleSessionEnded = async () => {
        toast.success("Session ended. Fetching final results...");
        setIsSessionEnded(true);
        try {
            // We need a way to find the report for this session.
            // Let's assume a new API endpoint. We'll add it to the backend.
            const response = await apiService.getReportForSession(activeRoom._id); // You will need to create this API endpoint
            setFinalResults(response.data.studentResults);
        } catch (error) {
            toast.error("Could not fetch final session report.");
        }
    };

    socket.on('participant-list-updated', handleParticipantsUpdate);
    socket.on('session-ended', handleSessionEnded);
    
    console.log('🎧 [Participants] Socket event listeners set up');
    console.log('🏠 [Participants] Active room ID:', activeRoom._id);

    return () => {
      socket.off('participant-list-updated', handleParticipantsUpdate);
      socket.off('session-ended', handleSessionEnded);
    };
  }, [activeRoom, socket]);

  // --- EXPORT TO EXCEL FUNCTIONALITY ---
  const handleExport = () => {
    if (finalResults.length === 0) {
        toast.error("No final report data to export.");
        return;
    }

    const dataToExport = finalResults.map(result => ({
      'Participant Name': result.studentName,
      'Polls Answered': `${result.pollsAttempted} / ${result.totalPolls}`,
      'Accuracy (%)': result.accuracy,
      'Average Time (s)': result.averageTime,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Session Report");
    XLSX.writeFile(workbook, `PollReport_${activeRoom?.name || 'Session'}.xlsx`);
  };

  // const tableData = participants.map(p => {
  //   const result = finalResults.find(r => r.userId === p.userId);
  //   return {
  //     ...p,
  //     accuracy: result ? `${result.accuracy}%` : "In Progress",
  //     avgTime: result ? `${result.averageTime}s` : "In Progress",
  //     pollsAnswered: result ? `${result.pollsAttempted}/${result.totalPolls}` : "In Progress",
  //   };
  // });

  if (isLoading) {
    return (
        <DashboardLayout>
            <div className='flex justify-center items-center h-64'><Loader2 className="animate-spin w-8 h-8 text-white"/></div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 p-4 md:p-8"
      >
        <div className="flex flex-wrap justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users /> Participants
            </h1>
            {isSessionEnded && (
                 <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                    <Download className="w-4 h-4"/>
                    Export Report
                </button>
            )}
        </div>
        
        {!activeRoom ? (
             <GlassCard className="p-12 text-center text-gray-400">
                There is no active session. Please start one to view participants.
             </GlassCard>
        ) : (
            <GlassCard className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left">
                        <thead className='bg-white/5'>
                           <tr>
                                <th className="p-4 text-gray-300 text-sm font-semibold">Participant</th>
                                <th className="p-4 text-gray-300 text-sm font-semibold">Student Email</th>
                               
                           </tr>
                        </thead>
                        <tbody>
                            {/* --- MODIFIED TABLE BODY --- */}
                            {participants.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="text-center py-10 text-gray-500">
                                        Waiting for participants to join...
                                    </td>
                                </tr>
                            ) : (
                                participants.map((p) => (
                                    <tr key={p.userId} className='border-b border-white/10'>
                                        <td className='p-4'>
                                            <div className='flex items-center gap-3'>
                                                <img src={p.avatar} alt={p.name} className='w-10 h-10 rounded-full object-cover'/>
                                                <div>
                                                    <p className='font-medium text-white'>{p.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='p-4 text-gray-300'>{p.email}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default ParticipantsPage;