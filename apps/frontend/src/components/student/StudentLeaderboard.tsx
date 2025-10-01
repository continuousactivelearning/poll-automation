// apps/frontend/src/pages/student/StudentLeaderboard.tsx
"use client"
import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { apiService } from "../../utils/api"
import toast from 'react-hot-toast'
import GlassCard from "../../components/GlassCard"
import LeaderboardView from "../../components/common/LeaderboardView" // <-- IMPORT THE REUSABLE COMPONENT

// Define the shape of the data
interface StudentResult {
  userId: string; studentName: string; totalPoints: number; accuracy: number;
  pollsAttempted: number; totalPolls: number; averageTime: number; streak: number;
  rank?: number; isCurrentUser?: boolean;
}

const StudentLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { sessionId } = location.state || {};

  const [reportData, setReportData] = useState<StudentResult[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🎯 [StudentLeaderboard] useEffect triggered');
    console.log('🆔 [StudentLeaderboard] sessionId from location.state:', sessionId);
    console.log('📍 [StudentLeaderboard] Full location.state:', location.state);
    
    if (!sessionId) {
      console.log('❌ [StudentLeaderboard] No sessionId found');
      toast.error("Session ID not found. Cannot display report.");
      setIsLoading(false); return;
    }

    const fetchReport = async () => {
      console.log('📡 [StudentLeaderboard] Fetching report for sessionId:', sessionId);
      setIsLoading(true);
      try {
        const res = await apiService.getReportForSession(sessionId);
        console.log('✅ [StudentLeaderboard] Report fetched successfully:', res.data);
        const { studentResults } = res.data;
        setSessionName(res.data.sessionName);
        
        const sortedResults = [...studentResults].sort((a: StudentResult, b: StudentResult) => b.totalPoints - a.totalPoints);
        
        const rankedData = sortedResults.map((p: StudentResult, index: number) => ({
          ...p,
          rank: index + 1,
          isCurrentUser: p.userId === user?.id,
        }));

        console.log('📊 [StudentLeaderboard] Processed rankedData:', rankedData);
        setReportData(rankedData);
      } catch (err) {
        console.error('❌ [StudentLeaderboard] Error fetching report:', err);
        toast.error("Could not load session report.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [sessionId, user?.id]);

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-gray-900 to-primary-900 text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <motion.h1 initial={{y:-20, opacity:0}} animate={{y:0, opacity:1}} className="text-4xl font-bold text-white mb-2">Session Report</motion.h1>
          {sessionName && <p className="text-gray-400">Final results for "{sessionName}"</p>}
        </div>

        {isLoading ? (
          <GlassCard className="p-8 text-center text-gray-400">Generating Your Final Report...</GlassCard>
        ) : reportData.length > 0 ? (
          // --- USE THE REUSABLE COMPONENT ---
          <LeaderboardView reportData={reportData} sessionName={sessionName} />
        ) : (
          <GlassCard className="p-8 text-center">...</GlassCard> // Error/empty state
        )}
        <div className="text-center mt-8">
            <Link to="/student" className="btn-secondary">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default StudentLeaderboard;