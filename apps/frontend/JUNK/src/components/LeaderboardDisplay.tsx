// // apps/frontend/src/components/LeaderboardDisplay.tsx

// "use client";

// import React from 'react';
// import { motion } from 'framer-motion';
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
// import { Crown, Target, Zap, Clock } from 'lucide-react';
// import GlassCard from './GlassCard';

// // Define the structure of a single student's result
// interface StudentResult {
//     userId: string;
//     studentName: string;
//     totalPoints: number;
//     accuracy: number;
//     averageTime: number;
//     streak: number;
//     // We'll add the avatar in the parent component
//     avatar?: string;
// }

// // Define the props that this component will receive
// interface LeaderboardDisplayProps {
//     studentResults: StudentResult[];
//     sessionName: string;
// }

// const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

// const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({ studentResults, sessionName }) => {
    
//     // Sort results by total points for ranking
//     const rankedResults = [...studentResults].sort((a, b) => b.totalPoints - a.totalPoints);
    
//     // Data for the charts
//     const accuracyData = rankedResults.map(r => ({ name: r.studentName, value: r.accuracy }));
//     const pointsData = rankedResults.map(r => ({ name: r.studentName, value: r.totalPoints }));

//     const getRankIcon = (rank: number) => {
//         if (rank === 0) return <Crown className="w-5 h-5 text-yellow-400" />;
//         if (rank === 1) return <Crown className="w-5 h-5 text-gray-300" />;
//         if (rank === 2) return <Crown className="w-5 h-5 text-amber-600" />;
//         return <span className="font-bold text-lg w-6 text-center text-gray-400">{rank + 1}</span>;
//     };

//     return (
//         <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="space-y-8"
//         >
//             <div className="text-center">
//                 <h1 className="text-3xl font-bold text-white">Session Report</h1>
//                 <p className="text-lg text-gray-400">Results for: <span className='font-semibold text-primary-300'>"{sessionName}"</span></p>
//             </div>

//             {/* Charts Section */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <GlassCard className="p-6">
//                     <h3 className="text-xl font-semibold text-white mb-4">Total Points</h3>
//                     <ResponsiveContainer width="100%" height={300}>
//                         <BarChart data={pointsData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
//                             <XAxis type="number" stroke="#9ca3af" />
//                             <YAxis type="category" dataKey="name" width={80} stroke="#9ca3af" tick={{ fill: '#d1d5db' }}/>
//                             <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.1)'}} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
//                             <Bar dataKey="value" name="Points" barSize={20}>
//                                 {pointsData.map((_entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                 ))}
//                             </Bar>
//                         </BarChart>
//                     </ResponsiveContainer>
//                 </GlassCard>
//                 <GlassCard className="p-6">
//                     <h3 className="text-xl font-semibold text-white mb-4">Accuracy</h3>
//                      <ResponsiveContainer width="100%" height={300}>
//                         <BarChart data={accuracyData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
//                             <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" tickFormatter={(tick) => `${tick}%`} />
//                             <YAxis type="category" dataKey="name" width={80} stroke="#9ca3af" tick={{ fill: '#d1d5db' }}/>
//                             <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.1)'}} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} formatter={(value) => `${value}%`}/>
//                             <Bar dataKey="value" name="Accuracy" barSize={20}>
//                                {accuracyData.map((_entry, index) => (
//                                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                                 ))}
//                             </Bar>
//                         </BarChart>
//                     </ResponsiveContainer>
//                 </GlassCard>
//             </div>

//             {/* Full Leaderboard Table */}
//             <GlassCard className="p-0 overflow-hidden">
//                 <div className="overflow-x-auto">
//                     <table className="w-full min-w-[800px] text-left">
//                         <thead className='bg-white/5'>
//                            <tr>
//                                 <th className="p-4 text-gray-300 text-sm font-semibold">Rank</th>
//                                 <th className="p-4 text-gray-300 text-sm font-semibold">Participant</th>
//                                 <th className="p-4 text-gray-300 text-sm font-semibold text-center">Total Points</th>
//                                 <th className="p-4 text-gray-300 text-sm font-semibold text-center">Accuracy</th>
//                                 <th className="p-4 text-gray-300 text-sm font-semibold text-center">Avg. Time</th>
//                                 <th className="p-4 text-gray-300 text-sm font-semibold text-center">Longest Streak</th>
//                            </tr>
//                         </thead>
//                         <tbody>
//                             {rankedResults.map((result, index) => (
//                                 <tr key={result.userId} className='border-b border-white/10'>
//                                     <td className='p-4'>
//                                         <div className='flex items-center justify-center'>{getRankIcon(index)}</div>
//                                     </td>
//                                     <td className='p-4'>
//                                         <div className='flex items-center gap-3'>
//                                             <img src={result.avatar || 'https://www.gravatar.com/avatar/?d=mp'} alt={result.studentName} className='w-10 h-10 rounded-full object-cover'/>
//                                             <div>
//                                                 <p className='font-medium text-white'>{result.studentName}</p>
//                                                 <p className='text-xs text-gray-400'>{result.studentEmail}</p>
//                                             </div>
//                                         </div>
//                                     </td>
//                                     <td className='p-4 text-white font-bold text-center'>{result.totalPoints}</td>
//                                     <td className='p-4 text-gray-300 text-center flex items-center justify-center gap-1'><Target size={14}/> {result.accuracy}%</td>
//                                     <td className='p-4 text-gray-300 text-center flex items-center justify-center gap-1'><Clock size={14}/> {result.averageTime}s</td>
//                                     <td className='p-4 text-gray-300 text-center flex items-center justify-center gap-1'><Zap size={14}/> {result.streak}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </GlassCard>
//         </motion.div>
//     );
// };

// export default LeaderboardDisplay;