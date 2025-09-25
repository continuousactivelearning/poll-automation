import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserIcon,
  MailIcon,
  XIcon,
  Search,
  Eye,
  TrendingUp,
  Clock,
  Target,
  Download,
  Award
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { utils, writeFile } from "xlsx";
import { toast, Toaster } from "react-hot-toast";


const Participants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('accuracy');
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);

  // --- Dummy students currently joining the poll ---
  const [joiningStudents, setJoiningStudents] = useState([
    { id: 101, name: 'Priya Sharma', email: 'priya.sharma@student.edu' },
    { id: 102, name: 'Rahul Verma', email: 'rahul.verma@student.edu' },
    { id: 103, name: 'Sara Lee', email: 'sara.lee@student.edu' },
    { id: 104, name: 'Mohit Singh', email: 'mohit.singh@student.edu' },
    { id: 105, name: 'Emily Chen', email: 'emily.chen@student.edu' },
  ]);

  const handleRemoveStudent = (id: number) => {
    setJoiningStudents(prev => prev.filter(student => student.id !== id));
  };

  const mockParticipantReports = [
    { name: "John Doe", email: "john@example.com", accuracy: "91%", score: 85, participation: 52 },
    { name: "Jane Smith", email: "jane@example.com", accuracy: "86%", score: 78, participation: 47 },
    { name: "Mike Lee", email: "mike@example.com", accuracy: "93%", score: 90, participation: 60 },
    { name: "Sara Kim", email: "sara@example.com", accuracy: "89%", score: 82, participation: 49 },
  ];

  const [showExportOptions, setShowExportOptions] = useState(false);

  // Mock participants data
  const participants = [
    {
      id: 1,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      accuracy: 92.5,
      avgTime: 2.1,
      pollsAttempted: 48,
      totalTime: 156,
      lastActive: '2 minutes ago',
      status: 'online',
      streak: 12
    },
    {
      id: 2,
      name: 'Bob Smith',
      email: 'bob@example.com',
      accuracy: 87.3,
      avgTime: 3.2,
      pollsAttempted: 35,
      totalTime: 98,
      lastActive: '5 minutes ago',
      status: 'online',
      streak: 8
    },
    {
      id: 3,
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      accuracy: 78.9,
      avgTime: 4.1,
      pollsAttempted: 52,
      totalTime: 203,
      lastActive: '1 hour ago',
      status: 'offline',
      streak: 5
    },
    {
      id: 4,
      name: 'Diana Prince',
      email: 'diana@example.com',
      accuracy: 95.1,
      avgTime: 1.8,
      pollsAttempted: 41,
      totalTime: 78,
      lastActive: '10 minutes ago',
      status: 'online',
      streak: 15
    },
    {
      id: 5,
      name: 'Ethan Hunt',
      email: 'ethan@example.com',
      accuracy: 83.6,
      avgTime: 2.9,
      pollsAttempted: 39,
      totalTime: 134,
      lastActive: '3 hours ago',
      status: 'offline',
      streak: 3
    }
  ];
  const mockParticipant = {
  id: "1",
  name: "Diana Prince",
  email: "diana@example.com",
  accuracy: 95.1,
  avgTime: 1.8,
  polls: 41,
  streak: 15,
  recentActivity: [
    { activity: "Answered question correctly", timeAgo: "2 minutes ago" },
    { activity: "Joined poll session", timeAgo: "15 minutes ago" },
    { activity: "Completed quiz", timeAgo: "1 hour ago" },
    { activity: "Answered question incorrectly", timeAgo: "2 hours ago" },
  ],
}


  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    switch (sortBy) {
      case 'accuracy':
        return b.accuracy - a.accuracy;
      case 'avgTime':
        return a.avgTime - b.avgTime;
      case 'pollsAttempted':
        return b.pollsAttempted - a.pollsAttempted;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });


// Call this with participant object
const handleExportReport = (participant: {
  id: string
  name: string
  email: string
  accuracy: number
  avgTime: number
  polls: number
  streak: number
  recentActivity: { activity: string; timeAgo: string }[]
}) => {
  try {
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text("Participant Report", 20, 20)

    doc.setFontSize(12)
    doc.text(`Name: ${participant.name}`, 20, 40)
    doc.text(`Email: ${participant.email}`, 20, 48)

    doc.text(`Accuracy: ${participant.accuracy}%`, 20, 60)
    doc.text(`Avg Time: ${participant.avgTime}s`, 20, 68)
    doc.text(`Polls Attempted: ${participant.polls}`, 20, 76)
    doc.text(`Streak: ${participant.streak}`, 20, 84)

    autoTable(doc, {
      startY: 100,
      head: [["Activity", "Time"]],
      body: participant.recentActivity.map((item) => [item.activity, item.timeAgo]),
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
    })

    doc.save(`${participant.name.replace(" ", "_")}_report.pdf`)
    toast.success("PDF file downloaded successfully!")
  } catch (error) {
    console.error("PDF Export Error:", error)
    toast.error("Failed to export PDF")
  }
}

  const handleExport = (type: "PDF" | "Excel") => {
    try {
      const filename = "AllParticipantsReport";

      if (type === "PDF") {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("All Participants Report", 20, 20);

        autoTable(doc, {
          startY: 30,
          head: [Object.keys(mockParticipantReports[0])],
          body: mockParticipantReports.map((row) => Object.values(row)),
          headStyles: { fillColor: [139, 92, 246] },
          theme: "striped",
        });

        doc.save(`${filename}.pdf`);
      } else {
        const worksheet = utils.json_to_sheet(mockParticipantReports);
        const workbook = utils.book_new();
        utils.book_append_sheet(workbook, worksheet, "Participants");
        writeFile(workbook, `${filename}.xlsx`);
      }

      toast.success(`${type} file downloaded successfully!`);
    } catch (err) {
      console.error("Export All Error:", err);
      toast.error("Failed to export file");
    } finally {
      setShowExportOptions(false);
    }
  };

  const handleViewDetails = (participantId: number) => {
    setSelectedParticipant(participantId);
  };

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'text-green-400' : 'text-gray-400';
  };

  const getStatusDot = (status: string) => {
    return status === 'online' ? 'bg-green-400' : 'bg-gray-400';
  };

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "#1e1e1e",
            color: "#fff",
            borderRadius: "8px",
          },
        }}
      />
      <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 overflow-x-hidden"
        >

          {/* --- Students Joining Current Poll Section --- */}
          <GlassCard className="p-6 mb-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <UserIcon className="w-6 h-6 text-primary-400" />
                <h2 className="text-xl font-bold text-white">Students Joining This Poll</h2>
                <span className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-xs font-medium">
                  {joiningStudents.length} Joined
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {joiningStudents.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-6">
                  No students are currently joining this poll.
                </div>
              ) : (
                joiningStudents.map((student, idx) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3 shadow hover:bg-primary-500/10 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          <UserIcon className="w-4 h-4 text-primary-400" />
                          <span className="text-white font-medium">{student.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MailIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300 text-xs">{student.email}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
                      className="ml-4 p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors"
                      title="Remove from poll"
                    >
                      <XIcon className="w-4 h-4 text-red-400" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Participants</h1>
              <p className="text-gray-400">Manage and monitor participant performance</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-green-400 text-sm">
                  {participants.filter(p => p.status === 'online').length} Online
                </span>
              </div>
              <div className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-full text-sm font-medium">
                {participants.length} Total
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Average Accuracy</p>
                  <p className="text-2xl font-bold text-white">
                    {(participants.reduce((acc, p) => acc + p.accuracy, 0) / participants.length).toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Response Time</p>
                  <p className="text-2xl font-bold text-white">
                    {(participants.reduce((acc, p) => acc + p.avgTime, 0) / participants.length).toFixed(1)}s
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Polls</p>
                  <p className="text-2xl font-bold text-white">
                    {participants.reduce((acc, p) => acc + p.pollsAttempted, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Top Streak</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.max(...participants.map(p => p.streak))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="accuracy" className="bg-gray-800">Sort by Accuracy</option>
                <option value="avgTime" className="bg-gray-800">Sort by Response Time</option>
                <option value="pollsAttempted" className="bg-gray-800">Sort by Polls Attempted</option>
                <option value="name" className="bg-gray-800">Sort by Name</option>
              </select>
            </div>
            <div className="relative inline-block text-left">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExportOptions((prev) => !prev)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 justify-center w-full sm:w-auto"
              >
                <Download className="w-4 h-4" />
                <span>Export All</span>
              </motion.button>

              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-40 rounded-lg shadow-lg bg-white dark:bg-gray-900 border border-white/10 z-50">
                  <button
                    onClick={() => handleExport("PDF")}
                    className="block w-full px-4 py-2 text-sm text-left text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleExport("Excel")}
                    className="block w-full px-4 py-2 text-sm text-left text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    Export as Excel
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Participants Table */}
          <GlassCard className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Participant</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Accuracy</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Avg Time</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Polls</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Streak</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Last Active</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedParticipants.map((participant, index) => (
                    <motion.tr
                      key={participant.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-gray-800 hover:bg-white/5 transition-colors duration-200"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {participant.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusDot(participant.status)} rounded-full border-2 border-gray-900`} />
                          </div>
                          <div>
                            <p className="text-white font-medium">{participant.name}</p>
                            <p className="text-gray-400 text-sm">{participant.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{participant.accuracy}%</span>
                          <div className="w-16 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary-500 rounded-full h-2"
                              style={{ width: `${participant.accuracy}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-white">{participant.avgTime}s</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-white">{participant.pollsAttempted}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4 text-yellow-400" />
                          <span className="text-white">{participant.streak}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={getStatusColor(participant.status)}>
                          {participant.lastActive}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleViewDetails(participant.id)}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors duration-200"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleExportReport(mockParticipant)}
                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors duration-200"
                          >
                            <Download className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Participant Detail Modal */}
          {selectedParticipant && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedParticipant(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const participant = participants.find(p => p.id === selectedParticipant);
                  if (!participant) return null;

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-white">Participant Details</h3>
                        <button
                          onClick={() => setSelectedParticipant(null)}
                          className="text-gray-400 hover:text-white"
                        >
                          ×
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-lg font-medium text-white mb-2">{participant.name}</h4>
                            <p className="text-gray-400">{participant.email}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-lg p-4">
                              <p className="text-gray-400 text-sm">Accuracy</p>
                              <p className="text-xl font-bold text-white">{participant.accuracy}%</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                              <p className="text-gray-400 text-sm">Avg Time</p>
                              <p className="text-xl font-bold text-white">{participant.avgTime}s</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                              <p className="text-gray-400 text-sm">Polls</p>
                              <p className="text-xl font-bold text-white">{participant.pollsAttempted}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                              <p className="text-gray-400 text-sm">Streak</p>
                              <p className="text-xl font-bold text-white">{participant.streak}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-white">Recent Activity</h4>
                          <div className="space-y-2">
                            {[
                              { action: 'Answered question correctly', time: '2 minutes ago' },
                              { action: 'Joined poll session', time: '15 minutes ago' },
                              { action: 'Completed quiz', time: '1 hour ago' },
                              { action: 'Answered question incorrectly', time: '2 hours ago' },
                            ].map((activity, index) => (
                              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-800">
                                <span className="text-gray-300">{activity.action}</span>
                                <span className="text-gray-400 text-sm">{activity.time}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-end space-x-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleExportReport(mockParticipant)}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                        >
                          Export Report
                        </motion.button>
                      </div>

                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </DashboardLayout>
    </>
  );
};

export default Participants;
