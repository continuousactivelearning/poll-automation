// apps/frontend/src/pages/Leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Clock, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import LeaderboardView from '../components/common/LeaderboardView'; // <-- IMPORT REUSABLE COMPONENT

// Types for data handling
interface SessionReportSummary {
  _id: string;
  sessionName: string;
  sessionEndedAt: string;
  studentCount: number;
}
interface DetailedReport {
  _id: string;
  sessionName: string;
  studentResults: any[];
}

const Leaderboard = () => {
  const { socket, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [reports, setReports] = useState<SessionReportSummary[]>([]);
  const [selectedReport, setSelectedReport] = useState<DetailedReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getHostSessionReports();
      const summaryData = res.data.map((r: any) => ({
        _id: r._id,
        sessionName: r.sessionName,
        sessionEndedAt: new Date(r.sessionEndedAt).toLocaleString(),
        studentCount: r.studentResults.length,
      }));
      setReports(summaryData);
    } catch (err) {
      toast.error("Failed to load session history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    // Listen for the session ending to automatically show the new report
    if (!socket) return;
    
    const handleHostSessionEnded = async ({ sessionId }: { sessionId: string }) => {
      console.log('🎯 Host session ended, fetching report:', sessionId);
      try {
        // Fetch the session report
        const res = await apiService.getReportForSession(sessionId);
        if(res.data) {
          toast.success("Session ended. Displaying final report.");
          handleReportClick(res.data._id, res.data); // Pass the already fetched data
          
          // Also refresh the reports list to include the new report
          await fetchReports();
        }
      } catch (error) {
        console.error('Failed to fetch session report:', error);
        toast.error("Session ended but failed to load report.");
      }
    };
    
    // Listen for host-specific session ended event
    socket.on('session-ended-host', handleHostSessionEnded);
    
    return () => {
      socket.off('session-ended-host', handleHostSessionEnded);
    };
  }, [socket]);

  const handleReportClick = async (reportId: string, preloadedData: DetailedReport | null = null) => {
    if (preloadedData) {
      setSelectedReport(preloadedData);
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await apiService.getSessionReportById(reportId);
      setSelectedReport(res.data);
    } catch (err) {
      toast.error("Could not load the detailed report.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- RENDER DETAILED REPORT VIEW ---
  if (selectedReport) {
    const sortedResults = [...selectedReport.studentResults].sort((a,b) => b.totalPoints - a.totalPoints);
    const rankedData = sortedResults.map((p, index) => ({
      ...p,
      rank: index + 1,
      isCurrentUser: p.userId === user?.id,
    }));

    return (
      <DashboardLayout>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <button onClick={() => { setSelectedReport(null); fetchReports(); }} className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={16}/> Back to History
          </button>
          <div className='text-center'>
            <h1 className="text-3xl font-bold text-white">{selectedReport.sessionName}</h1>
            <p className="text-gray-400">Final Report</p>
          </div>
          <LeaderboardView reportData={rankedData} sessionName={selectedReport.sessionName} />
        </motion.div>
      </DashboardLayout>
    );
  }

  // --- RENDER LIST OF REPORTS VIEW ---
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Session History</h1>

        {isLoading ? <div className='flex justify-center p-8'><Loader2 className='w-8 h-8 animate-spin text-white' /></div> :
        !reports.length ? (
          <GlassCard className="p-8 text-center">
            <BarChart className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-white">No Past Sessions</h3>
            <p className="text-gray-400">Your completed session reports will appear here.</p>
          </GlassCard>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <motion.div key={report._id} whileHover={{ scale: 1.02 }} onClick={() => handleReportClick(report._id)} className="cursor-pointer">
                <GlassCard className="p-4 flex justify-between items-center hover:border-primary-500/50">
                  <div>
                    <p className="font-bold text-white text-lg">{report.sessionName}</p>
                    <p className="text-sm text-gray-400 flex items-center gap-2"><Clock size={14} /> Ended: {report.sessionEndedAt}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-300">{report.studentCount} Participants</span>
                    <ChevronRight className="text-gray-500" />
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default Leaderboard;