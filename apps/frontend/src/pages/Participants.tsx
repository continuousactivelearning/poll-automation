import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  //UserIcon, // Keep UserIcon if used elsewhere, otherwise remove
  MailIcon,
  XIcon,
  Search,
  Eye,
  TrendingUp,
  Clock,
  Target,
  Download,
  Award,
  Loader2,
  Users // Added Users icon import
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
//import { utils, writeFile } from "xlsx";
import { toast, Toaster } from "react-hot-toast";
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationContext } from '../contexts/NotificationContext';

// Define the structure of a joined participant as received from the backend
// AND extended with dummy performance data for UI display
interface JoinedParticipant {
  userId: string; // This will be the string representation of ObjectId
  fullName: string;
  email: string;
  joinedAt: string; // ISO date string
  // Dummy performance metrics for UI display (not from backend yet)
  accuracy?: string;
  avgTime?: string;
  polls?: number;
  streak?: number;
  lastActive?: string;
  recentActivity?: { action: string; time: string; }[];
}

// Define the structure of a session needed by this component
interface SessionInfo {
  _id: string;
  roomCode: string;
  sessionTitle: string;
  host: string;
  isActive: boolean;
  joinedParticipants: JoinedParticipant[];
}

const API_BASE_URL = 'http://localhost:3000/api';
const POLL_STORAGE_KEY = "activePollSession";

const Participants: React.FC = () => { // Explicitly type as React.FC
  const { user, token, isLoading: authLoading } = useAuth();
  const { showNotification } = useNotificationContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedParticipant, setSelectedParticipant] = useState<JoinedParticipant | null>(null);
  const [activeSession, setActiveSession] = useState<SessionInfo | null>(null);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null);

  // Dummy data for performance metrics (to be merged with fetched participants)
  // In a real app, this would come from the backend, possibly stored per participant
  const getDummyPerformanceData = (participantEmail: string) => {
    // Simple hash-based approach to get somewhat consistent dummy data
    const hash = participantEmail.length % 5; // Use email length for a simple "random" seed
    const accuracy = `${(90 - hash * 2 + (participantEmail.charCodeAt(0) % 5)).toFixed(1)}%`;
    const avgTime = `${(2.0 + hash * 0.5 + (participantEmail.charCodeAt(1) % 3) * 0.1).toFixed(1)}s`;
    const polls = 30 + hash * 5;
    const streak = 5 + hash * 2;
    const lastActive = `${(hash + 1) * 5} minutes ago`;
    const recentActivity = [
      { action: 'Answered question correctly', time: '10 minutes ago' },
      { action: 'Completed Quiz', time: '1 hour ago' },
      { action: 'Answered question incorrectly', time: '2 hours ago' },
    ];
    return { accuracy, avgTime, polls, streak, lastActive, recentActivity };
  };

  const fetchActiveSessionAndParticipants = useCallback(async () => {
    setLoadingParticipants(true);
    const savedSessionId = localStorage.getItem(POLL_STORAGE_KEY);

    if (!user?.id || !token) {
      setLoadingParticipants(false);
      setActiveSession(null);
      showNotification("Please log in to view participants.", "info");
      return;
    }

    if (!savedSessionId || savedSessionId === "null") {
      setLoadingParticipants(false);
      setActiveSession(null);
      showNotification("No active poll session found. Create one first!", "info");
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get<{ message: string, session: SessionInfo }>(
        `${API_BASE_URL}/sessions/${savedSessionId}`,
        config
      );

      const fetchedSession = response.data.session;

      if (fetchedSession.isActive && fetchedSession.host === user.id) {
        // Merge fetched participants with dummy performance data
        const participantsWithMetrics = fetchedSession.joinedParticipants.map(p => ({
          ...p,
          ...getDummyPerformanceData(p.email)
        }));
        setActiveSession({ ...fetchedSession, joinedParticipants: participantsWithMetrics });
        showNotification("Participants loaded successfully.", "success");
      } else {
        setActiveSession(null);
        localStorage.removeItem(POLL_STORAGE_KEY);
        showNotification("Active session not found or not owned by you.", "info");
      }
    } catch (error: any) {
      console.error("Error fetching active session for participants:", error.response?.data || error.message);
      setActiveSession(null);
      localStorage.removeItem(POLL_STORAGE_KEY);
      showNotification(error.response?.data?.message || "Failed to load active session participants.", "error");
    } finally {
      setLoadingParticipants(false);
    }
  }, [user?.id, token, showNotification]);

  useEffect(() => {
    if (!authLoading) {
      fetchActiveSessionAndParticipants();
    }
  }, [authLoading, fetchActiveSessionAndParticipants]);

  const handleRemoveParticipant = async (participantId: string) => {
    if (!activeSession || !token) {
      showNotification("No active session or not authenticated.", "error");
      return;
    }

    setRemovingParticipantId(participantId);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.put<{ message: string, session: SessionInfo }>(
        `${API_BASE_URL}/sessions/${activeSession._id}/remove-participant/${participantId}`,
        {},
        config
      );

      showNotification(response.data.message, "success");
      // Update the active session state directly to reflect the removal
      setActiveSession(prevSession => {
        if (!prevSession) return null;
        const updatedParticipants = prevSession.joinedParticipants.filter(
          p => p.userId !== participantId
        );
        return {
          ...prevSession,
          joinedParticipants: updatedParticipants,
        };
      });
      // If the removed participant was the one in the detail modal, close it
      if (selectedParticipant?.userId === participantId) {
        setSelectedParticipant(null);
      }
    } catch (error: any) {
      console.error("Error removing participant:", error.response?.data || error.message);
      showNotification(error.response?.data?.message || "Failed to remove participant.", "error");
    } finally {
      setRemovingParticipantId(null);
    }
  };

  // Filter and sort participants
  const filteredAndSortedParticipants = (activeSession?.joinedParticipants || [])
    .filter(participant =>
      participant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.fullName.localeCompare(b.fullName);
      }
      if (sortBy === 'joinedAt') {
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      }
      // Add more sorting logic if actual performance data becomes available from backend
      // For now, these are dummy values so sorting by them won't be truly meaningful
      if (sortBy === 'accuracy' && a.accuracy && b.accuracy) {
        return parseFloat(b.accuracy) - parseFloat(a.accuracy);
      }
      if (sortBy === 'avgTime' && a.avgTime && b.avgTime) {
        return parseFloat(a.avgTime) - parseFloat(b.avgTime);
      }
      if (sortBy === 'polls' && a.polls && b.polls) {
        return b.polls - a.polls;
      }
      if (sortBy === 'streak' && a.streak && b.streak) {
        return b.streak - a.streak;
      }
      return 0;
    });

  // Dummy data for overall performance metrics (replace with real data later)
  // This could be calculated from `filteredAndSortedParticipants` if needed
  const calculateOverallMetrics = () => {
    const totalAccuracy = filteredAndSortedParticipants.reduce((sum, p) => sum + (parseFloat(p.accuracy || '0')), 0);
    const totalAvgTime = filteredAndSortedParticipants.reduce((sum, p) => sum + (parseFloat(p.avgTime || '0')), 0);
    const totalPolls = filteredAndSortedParticipants.reduce((sum, p) => sum + (p.polls || 0), 0);
    const maxStreak = filteredAndSortedParticipants.reduce((max, p) => Math.max(max, (p.streak || 0)), 0);

    const count = filteredAndSortedParticipants.length;
    return {
      averageAccuracy: count > 0 ? `${(totalAccuracy / count).toFixed(1)}%` : 'N/A',
      avgResponseTime: count > 0 ? `${(totalAvgTime / count).toFixed(1)}s` : 'N/A',
      totalPolls: totalPolls,
      topStreak: maxStreak,
    };
  };

  const overallPerformanceMetrics = calculateOverallMetrics();

  const handleExportReport = (participant: JoinedParticipant) => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: [
        ['Participant Name', participant.fullName],
        ['Email', participant.email],
        ['Accuracy', participant.accuracy || 'N/A'],
        ['Average Response Time', participant.avgTime || 'N/A'],
        ['Polls Participated', participant.polls || 'N/A'],
        ['Current Streak', participant.streak || 'N/A'],
      ],
      startY: 20,
      headStyles: { fillColor: [68, 189, 255] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save(`${participant.fullName}_report.pdf`);
    toast.success("Report exported successfully!");
  };

  return (
    <>
      <Toaster />
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4 sm:p-6 lg:p-8 text-white"
        >
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Participants</h1>
              <p className="text-gray-400 text-lg">Manage and monitor participant performance</p>
            </motion.div>

            {/* Students Joining This Poll */}
            <GlassCard className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Students Joining This Poll</h2>
                  <span className="text-primary-400 text-lg font-bold">
                    ({activeSession?.joinedParticipants.length || 0} Joined)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSession?.joinedParticipants && activeSession.joinedParticipants.length > 0 ? (
                  activeSession.joinedParticipants.map((participant) => (
                    <motion.div
                      key={participant.userId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 shadow-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {participant.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{participant.fullName}</p>
                          <p className="text-sm text-gray-400">{participant.email}</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveParticipant(participant.userId)}
                        disabled={removingParticipantId === participant.userId}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove Participant"
                      >
                        {removingParticipantId === participant.userId ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <XIcon className="w-5 h-5" />
                        )}
                      </motion.button>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center col-span-full">No students have joined this poll yet.</p>
                )}
              </div>
            </GlassCard>

            {/* Performance Metrics (Overall) */}
            <GlassCard className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Overall Performance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/5 p-4 rounded-xl flex flex-col items-center justify-center space-y-2">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                  <p className="text-2xl font-bold text-white">{overallPerformanceMetrics.averageAccuracy}</p>
                  <p className="text-gray-400 text-sm">Average Accuracy</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl flex flex-col items-center justify-center space-y-2">
                  <Clock className="w-8 h-8 text-yellow-400" />
                  <p className="text-2xl font-bold text-white">{overallPerformanceMetrics.avgResponseTime}</p>
                  <p className="text-gray-400 text-sm">Avg Response Time</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl flex flex-col items-center justify-center space-y-2">
                  <Target className="w-8 h-8 text-blue-400" />
                  <p className="text-2xl font-bold text-white">{overallPerformanceMetrics.totalPolls}</p>
                  <p className="text-gray-400 text-sm">Total Polls</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl flex flex-col items-center justify-center space-y-2">
                  <Award className="w-8 h-8 text-purple-400" />
                  <p className="text-2xl font-bold text-white">{overallPerformanceMetrics.topStreak}</p>
                  <p className="text-gray-400 text-sm">Top Streak</p>
                </div>
              </div>
            </GlassCard>

            {/* Participants List Table */}
            <GlassCard className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
                <h2 className="text-xl font-semibold text-white">All Participants</h2>
                <div className="flex space-x-3 w-full sm:w-auto">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search participants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="accuracy">Sort by Accuracy</option>
                    <option value="avgTime">Sort by Avg Time</option>
                    <option value="polls">Sort by Polls</option>
                    <option value="streak">Sort by Streak</option>
                    <option value="joinedAt">Sort by Joined Date</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tl-lg">
                        Participant
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Accuracy
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Avg Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Polls
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Streak
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider rounded-tr-lg">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredAndSortedParticipants.map((participant) => (
                      <motion.tr
                        key={participant.userId} // Use userId as key
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-white/5"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {participant.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium">{participant.fullName}</p>
                              <p className="text-gray-400 text-sm">{participant.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-green-400 font-medium">
                          {participant.accuracy || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-yellow-400 font-medium">
                          {participant.avgTime || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-white">
                          {participant.polls || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-blue-400">
                          {participant.streak || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-400">
                          {participant.lastActive || 'N/A'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => setSelectedParticipant(participant)} // Pass the actual participant object
                            className="text-primary-400 hover:text-primary-300 mr-3"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleExportReport(participant)}
                            className="text-green-400 hover:text-green-300"
                            title="Export Report"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                    {filteredAndSortedParticipants.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-gray-400">
                          No participants match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 text-center">
                {/* This button would typically load more data from backend if pagination is implemented */}
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:brightness-110 transition-all duration-200">
                  Load More Participants
                </button>
              </div>
            </GlassCard>
          </div>

          {/* Participant Detail Modal */}
          <AnimatePresence>
            {selectedParticipant && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedParticipant(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 50 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="bg-dark-800 rounded-xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative border border-dark-700"
                  onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                >
                  <button
                    onClick={() => setSelectedParticipant(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>

                  <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-4">
                      {selectedParticipant.fullName.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-2xl font-bold text-white">{selectedParticipant.fullName}</h3>
                    <p className="text-gray-400 flex items-center space-x-2 mt-1">
                      <MailIcon className="w-4 h-4" />
                      <span>{selectedParticipant.email}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div className="bg-dark-700 p-3 rounded-lg flex items-center justify-between">
                      <span className="text-gray-300">Accuracy:</span>
                      <span className="text-green-400 font-semibold">{selectedParticipant.accuracy || 'N/A'}</span>
                    </div>
                    <div className="bg-dark-700 p-3 rounded-lg flex items-center justify-between">
                      <span className="text-gray-300">Avg Time:</span>
                      <span className="text-yellow-400 font-semibold">{selectedParticipant.avgTime || 'N/A'}</span>
                    </div>
                    <div className="bg-dark-700 p-3 rounded-lg flex items-center justify-between">
                      <span className="text-gray-300">Polls:</span>
                      <span className="text-white font-semibold">{selectedParticipant.polls || 'N/A'}</span>
                    </div>
                    <div className="bg-dark-700 p-3 rounded-lg flex items-center justify-between">
                      <span className="text-gray-300">Streak:</span>
                      <span className="text-blue-400 font-semibold">{selectedParticipant.streak || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="bg-dark-700 p-4 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-3">Recent Activity</h4>
                    <div className="space-y-2">
                      {selectedParticipant.recentActivity && selectedParticipant.recentActivity.length > 0 ? (
                        selectedParticipant.recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-b-0">
                            <span className="text-gray-300">{activity.action}</span>
                            <span className="text-gray-400 text-sm">{activity.time}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center">No recent activity.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleExportReport(selectedParticipant)}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                    >
                      Export Report
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DashboardLayout>
    </>
  );
};

export default Participants;
