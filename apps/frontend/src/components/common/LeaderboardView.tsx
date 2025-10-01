// apps/frontend/src/components/common/LeaderboardView.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Download } from 'lucide-react';
import GlassCard from '../GlassCard';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

// Define the shape of the data this component expects
interface StudentResult {
  userId: string;
  studentName: string;
  totalPoints: number;
  accuracy: number;
  pollsAttempted: number;
  totalPolls: number;
  averageTime: number;
  streak: number;
  rank?: number;
  isCurrentUser?: boolean;
}

interface LeaderboardViewProps {
  reportData: StudentResult[];
  sessionName: string;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ reportData, sessionName }) => {
  const podium = reportData.slice(0, 3);
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-8 h-8 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-7 h-7 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-yellow-600" />;
    return <span className="font-bold text-gray-400">{rank}</span>;
  };
  
  const handleExport = () => {
    const dataToExport = reportData.map(result => ({
      'Rank': result.rank,
      'Name': result.studentName,
      'Total Points': result.totalPoints,
      'Accuracy (%)': result.accuracy.toFixed(1),
      'Polls Answered': `${result.pollsAttempted} / ${result.totalPolls}`,
      'Average Time (s)': result.averageTime.toFixed(2),
      'Longest Streak': result.streak,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leaderboard Report");
    XLSX.writeFile(workbook, `Leaderboard_${sessionName.replace(/ /g, "_")}.xlsx`);
    toast.success("Report downloaded!");
  };

  return (
    <div className="space-y-8">
      {/* Podium UI */}
      {podium.length > 0 && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center items-end gap-4">
          {/* Second Place */}
          {podium[1] && <div className="text-center w-1/4">...podium UI for 2nd...</div>}
          {/* First Place */}
          {podium[0] && <div className="text-center w-1/3">...podium UI for 1st...</div>}
          {/* Third Place */}
          {podium[2] && <div className="text-center w-1/4">...podium UI for 3rd...</div>}
        </motion.div>
      )}

      {/* Leaderboard Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-white/5">
            <h2 className="text-2xl font-bold text-white">Final Rankings</h2>
            <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
                <Download size={16}/>
                Export CSV
            </button>
        </div>
       <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-sm text-gray-400">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Student</th>
                      <th className="p-3 text-center">Total Points</th>
                      <th className="p-3 text-center">Accuracy</th>
                      <th className="p-3 text-center">Polls Attempted</th>
                      <th className="p-3 text-center">Avg. Time</th>
                      <th className="p-3 text-center">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map(student => (
                      <tr key={student.userId} className={`border-b border-white/5 ${student.isCurrentUser ? 'bg-primary-500/10' : ''}`}>
                        <td className="p-3 font-bold">{getRankIcon(student.rank || 0)}</td>
                        <td className="p-3 font-semibold">{student.studentName}</td>
                        <td className="p-3 text-center font-bold text-primary-300">{student.totalPoints}</td>
                        <td className="p-3 text-center">{student.accuracy.toFixed(0)}%</td>
                        <td className="p-3 text-center">{student.pollsAttempted} / {student.totalPolls}</td>
                        <td className="p-3 text-center">{student.averageTime}s</td>
                        <td className="p-3 text-center">{student.streak}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
      </GlassCard>
    </div>
  );
};

export default LeaderboardView;

// // apps/frontend/src/components/student/StudentLeaderboard.tsx
// "use client"
// import React, { useState, useEffect } from "react"
// import { motion } from "framer-motion"
// import { Trophy, Crown, Medal, Users, Target, Clock, Zap, CheckCircle, BarChart } from "lucide-react"
// import { useAuth } from "../../contexts/AuthContext"
// import { useLocation, Link } from "react-router-dom"
// import GlassCard from "../GlassCard"
// import { apiService } from "../../utils/api"
// import toast from 'react-hot-toast'
// import LeaderboardView from "../../components/common/LeaderboardView" // <-- IMPORT THE REUSABLE COMPONENT

// // This interface now matches our SessionReport model
// interface StudentResult {
//   userId: string;
//   studentName: string;
//   studentEmail: string;
//   totalPoints: number;
//   accuracy: number;
//   pollsAttempted: number;
//   totalPolls: number;
//   streak: number;
//   averageTime: number;
//   rank?: number; // We'll add this client-side
//   isCurrentUser?: boolean;
// }

// const StudentLeaderboard: React.FC = () => {
//   const { user } = useAuth();
//   const location = useLocation();
//   const { sessionId } = location.state || {}; // Get sessionId from navigation state

//   const [reportData, setReportData] = useState<StudentResult[]>([]);
//   const [sessionInfo, setSessionInfo] = useState<{ name: string, date: string } | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     if (!sessionId) {
//       toast.error("Session ID not found. Cannot display report.");
//       setIsLoading(false);
//       return;
//     }

//     const fetchReport = async () => {
//       setIsLoading(true);
//       try {
//         const res = await apiService.getReportForSession(sessionId);
//         const { sessionName, sessionEndedAt, studentResults } = res.data;
        
//         // Sort by points to determine rank
//         const sortedResults = studentResults.sort((a: StudentResult, b: StudentResult) => b.totalPoints - a.totalPoints);
        
//         const rankedData = sortedResults.map((p: StudentResult, index: number) => ({
//           ...p,
//           rank: index + 1,
//           isCurrentUser: p.userId === user?.id,
//         }));

//         setReportData(rankedData);
//         setSessionInfo({ name: sessionName, date: new Date(sessionEndedAt).toLocaleDateString() });
//       } catch (err) {
//         toast.error("Could not load session report.");
//         setReportData([]);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchReport();
//   }, [sessionId, user?.id]);

//   // --- Rendering Logic (Podium + Table) ---
//   // Your existing rendering logic for podium and table can be adapted to use the new `reportData`
//   // For example, instead of `participant.points`, you'll use `participant.totalPoints`
//   // Instead of `participant.name`, you'll use `participant.studentName`
  
//   const getRankIcon = (rank: number) => {
//     if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
//     // ... same as before
//   };
  
//   const currentUserData = reportData.find(p => p.isCurrentUser);

//   return (
//     <div className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-gray-900 to-primary-900 text-white">
//       <div className="max-w-7xl mx-auto space-y-8">
//         <div className="text-center">
//           <motion.h1 initial={{y:-20, opacity:0}} animate={{y:0, opacity:1}} className="text-4xl font-bold text-white mb-2">Session Report</motion.h1>
//           {sessionInfo && <p className="text-gray-400">Results for "{sessionInfo.name}" on {sessionInfo.date}</p>}
//         </div>

//         {isLoading ? (
//           <GlassCard className="p-8 text-center text-gray-400">Generating Your Final Report...</GlassCard>
//         ) : !reportData.length ? (
//           <GlassCard className="p-8 text-center">
//             <BarChart className="w-16 h-16 mx-auto text-gray-600 mb-4" />
//             <h3 className="text-xl font-bold text-white">Report Not Available</h3>
//             <p className="text-gray-400">Could not find the report for this session.</p>
//           </GlassCard>
//         ) : (
//           <>
//             {/* --- Your amazing podium UI here, using `reportData[0]`, `reportData[1]`, `reportData[2]` --- */}
//             {/* For example, for the winner: */}
//             {/* <h4>{reportData[0].studentName}</h4> */}
//             {/* <p>{reportData[0].totalPoints} pts</p> */}

//             {/* --- Your Table of Results --- */}
//             <GlassCard className="p-6">
//               <h2 className="text-2xl font-bold text-white mb-4">Final Rankings</h2>
//               <div className="overflow-x-auto">
//                 <table className="w-full text-left">
//                   <thead>
//                     <tr className="border-b border-white/10 text-sm text-gray-400">
//                       <th className="p-3">Rank</th>
//                       <th className="p-3">Student</th>
//                       <th className="p-3 text-center">Total Points</th>
//                       <th className="p-3 text-center">Accuracy</th>
//                       <th className="p-3 text-center">Polls Attempted</th>
//                       <th className="p-3 text-center">Avg. Time</th>
//                       <th className="p-3 text-center">Streak</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {reportData.map(student => (
//                       <tr key={student.userId} className={`border-b border-white/5 ${student.isCurrentUser ? 'bg-primary-500/10' : ''}`}>
//                         <td className="p-3 font-bold">{getRankIcon(student.rank || 0)}</td>
//                         <td className="p-3 font-semibold">{student.studentName}</td>
//                         <td className="p-3 text-center font-bold text-primary-300">{student.totalPoints}</td>
//                         <td className="p-3 text-center">{student.accuracy.toFixed(0)}%</td>
//                         <td className="p-3 text-center">{student.pollsAttempted} / {student.totalPolls}</td>
//                         <td className="p-3 text-center">{student.averageTime}s</td>
//                         <td className="p-3 text-center">{student.streak}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </GlassCard>
//           </>
//         )}
//         <div className="text-center mt-8">
//             <Link to="/student" className="btn-secondary">Back to Dashboard</Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StudentLeaderboard;


