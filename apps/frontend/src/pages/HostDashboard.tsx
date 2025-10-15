import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Target, TrendingUp, Clock, Brain, Mic, Trophy, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import { apiService } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const HostDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Explicit per-metric state (easier to bind to UI)
  const [totalPolls, setTotalPolls] = useState<number | null>(null);
  const [accuracyRate, setAccuracyRate] = useState<number | null>(null);
  const [totalSessions, setTotalSessions] = useState<number | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<number | null>(null);
  const [avgResponseTime, setAvgResponseTime] = useState<number | null>(null);

  // Participation data used for chart
  const participationData = stats?.participationTrends?.map((p: any) => ({ name: p.date.slice(5), participants: p.participants })) || [];

  // recentSessions will be provided by backend (latest 5 sessions with accuracyRate)
  const recentSessionsData = stats?.recentSessions?.map((s: any) => ({
    name: s.sessionName || String(s.sessionId).slice(-4),
    accuracy: s.accuracyRate
  })) || [];

  const statsCards = [
    {
      title: 'Total Sessions',
      value: totalSessions !== null ? String(totalSessions) : '—',
      change: '',
      icon: Trophy,
      color: 'from-indigo-500 to-blue-600',
    },
    {
      title: 'Total Polls',
      value: totalPolls !== null ? String(totalPolls) : '—',
      change: '',
      icon: Target,
      color: 'from-primary-500 to-purple-600',
    },
    {
      title: 'Accuracy Rate',
      value: accuracyRate !== null ? `${accuracyRate}%` : '—',
      change: '',
      icon: TrendingUp,
      color: 'from-secondary-500 to-blue-600',
    },
    {
      title: 'Active Participants',
      value: activeParticipants !== null ? String(activeParticipants) : '—',
      change: '',
      icon: Users,
      color: 'from-accent-500 to-teal-600',
    },
    {
      title: 'Avg Response Time',
      value: avgResponseTime !== null ? `${avgResponseTime}s` : '—',
      change: '',
      icon: Clock,
      color: 'from-orange-500 to-red-600',
    },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.getHostStats();
        const data = res.data;
        setStats(data);
        // set explicit states
        setTotalPolls(data.totalPolls ?? 0);
  setTotalSessions(data.totalSessions ?? 0);
        setAccuracyRate(data.accuracyRate ?? 0);
        setActiveParticipants(data.activeParticipants ?? 0);
        setAvgResponseTime(data.avgResponseTime ?? 0);
      } catch (err: any) {
        console.error('Failed to fetch stats', err);
        setError(err.message || 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Recent sessions (host-specific)
  const { socket, user } = useAuth();
  const [connStatus, setConnStatus] = useState<'active' | 'connecting' | 'disconnected'>('connecting');
  const [recentSessions, setRecentSessions] = useState<Array<{ sessionId?: string; sessionName?: string; sessionEndedAt?: string; accuracyRate?: number; studentCount?: number }>>([]);

  // When stats are loaded, populate recentSessions from stats.recentSessions
  useEffect(() => {
    if (stats?.recentSessions) {
      // Map to local display shape
      const mapped = stats.recentSessions.map((s: any) => ({
        sessionId: s.sessionId,
        sessionName: s.sessionName,
        sessionEndedAt: s.sessionEndedAt,
        accuracyRate: s.accuracyRate,
        // backend may include studentResultsCount; if not, we'll fetch it below
        studentCount: s.studentResultsCount ?? undefined,
      }));
      setRecentSessions(mapped.slice(0, 5));

      // If any entries are missing studentCount, fetch the session report for those
      const missing = mapped.filter((m: any) => m.studentCount == null).map((m: any) => m.sessionId).filter(Boolean);
      if (missing.length > 0) {
        (async () => {
          try {
            const promises = missing.map((sid: any) => apiService.getReportForSession(sid));
            const responses = await Promise.all(promises);
            const updates: Record<string, number> = {};
            responses.forEach((r: any) => {
              const rep = r.data;
              if (rep && Array.isArray(rep.studentResults)) {
                updates[rep.sessionId || rep.session_id || ''] = rep.studentResults.length;
              }
            });

            setRecentSessions(prev => prev.map(entry => ({
              ...entry,
              studentCount: entry.studentCount ?? updates[entry.sessionId as string] ?? entry.studentCount
            })));
          } catch (err) {
            console.error('Failed to fetch missing session reports', err);
          }
        })();
      }
    }
  }, [stats]);

  useEffect(() => {
    if (!socket) return;

    const onSessionEndedHost = async (data: any) => {
      try {
        const sessionId = data?.sessionId || data?.session_id || data?.id;
        if (!sessionId) return;

        // Fetch the final session report for details
        const res = await apiService.getReportForSession(sessionId);
        const report = res.data;

        // compute average accuracy and student count
        const studentResults = Array.isArray(report.studentResults) ? report.studentResults : [];
        const studentCount = studentResults.length;
        const avgAccuracy = studentCount ? Number((studentResults.reduce((sum: number, r: any) => sum + (r.accuracy ?? 0), 0) / studentCount).toFixed(2)) : 0;

        const newEntry = {
          sessionId: report.sessionId || sessionId,
          sessionName: report.sessionName || `Session ${String(sessionId).slice(-4)}`,
          sessionEndedAt: report.sessionEndedAt || new Date().toISOString(),
          accuracyRate: avgAccuracy,
          studentCount,
        };

        setRecentSessions(prev => [newEntry, ...prev].slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch session report after session-ended-host', err);
      }
    };

    socket.on('session-ended-host', onSessionEndedHost);

    return () => {
      socket.off('session-ended-host', onSessionEndedHost);
    };
  }, [socket]);

  // Monitor socket connection status and update System Active tag
  useEffect(() => {
    // If socket is not created yet, show connecting and fallback to disconnected after a timeout
    if (!socket) {
      setConnStatus('connecting');
      const to = setTimeout(() => setConnStatus('disconnected'), 5000);
      return () => clearTimeout(to);
    }

    // At this point socket exists
    setConnStatus(socket.connected ? 'active' : 'connecting');

    const handleConnect = () => setConnStatus('active');
    const handleDisconnect = () => setConnStatus('disconnected');
    const handleConnectError = () => setConnStatus('disconnected');
    const handleReconnectAttempt = () => setConnStatus('connecting');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnect_attempt', handleReconnectAttempt);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnect_attempt', handleReconnectAttempt);
    };
  }, [socket]);

  const quickActions = [
    {
      title: 'Start Audio Capture',
      description: 'Begin recording and real-time transcription',
      icon: Mic,
      color: 'from-primary-500 to-purple-600',
      href: '/host/audio',
    },
    {
      title: 'AI Question Feed',
      description: 'Review and manage AI-generated questions',
      icon: Brain,
      color: 'from-secondary-500 to-blue-600',
      href: '/host/ai-questions',
    },
    {
      title: 'View Leaderboard',
      description: 'Check top performing participants',
      icon: Trophy,
      color: 'from-accent-500 to-teal-600',
      href: '/host/leaderboard',
    },
    {
      title: 'Generate Reports',
      description: 'Export detailed analytics and insights',
      icon: FileText,
      color: 'from-orange-500 to-red-600',
      href: '/host/reports',
    },
  ];

  return (
    <>
      <DashboardLayout>
        <div >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Host Dashboard</h1>
                <p className="text-gray-400 text-sm sm:text-base">Welcome back! Here's your polling system overview.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                {/* System Active Tag */}
                <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-full sm:w-auto text-center ${connStatus === 'active' ? 'bg-green-500/20 text-green-400' : connStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                  {connStatus === 'active' ? 'System Active' : connStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </div>
                {/* Switch to Student Button */}
                <button
                  onClick={() => navigate('/student')}
                  className="ml-0 sm:ml-4 mt-2 sm:mt-0 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs sm:text-sm font-medium w-full sm:w-auto text-center transition"
                >
                  Switch to Student
                </button>
              </div>
            </div>

            {/* Stats Cards: show 5 in a row on large screens; reduce padding so they fit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {statsCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <GlassCard className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center`}>
                        <card.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">{card.value}</div>
                        <div className="text-xs text-green-400">{card.change}</div>
                      </div>
                    </div>
                    <h3 className="text-gray-300 text-sm font-medium">{card.title}</h3>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Participation Trends */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Participation Trends</h3>
                  <div className="h-64 min-w-0">
                    {loading ? (
                      <div className="text-gray-400">Loading chart...</div>
                    ) : error ? (
                      <div className="text-red-400">{error}</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={participationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="participants"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                        />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </GlassCard>
              </motion.div>

              {/* Recent Sessions Accuracy */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Sessions Accuracy</h3>
                  <div className="h-64 min-w-0">
                    {loading ? (
                      <div className="text-gray-400">Loading...</div>
                    ) : error ? (
                      <div className="text-red-400">{error}</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={recentSessionsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="name" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(17, 24, 39, 0.8)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                          />
                          <Bar dataKey="accuracy" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action) => (
                    <motion.a
                      key={action.title}
                      href={action.href}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="block p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200"
                    >
                      <div className={`w-10 h-10 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-medium text-white mb-1">{action.title}</h4>
                      <p className="text-sm text-gray-400">{action.description}</p>
                    </motion.a>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <GlassCard className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentSessions.length === 0 ? (
                    <div className="text-gray-400">No recent sessions yet.</div>
                  ) : (
                    recentSessions.map((s, i) => (
                      <div key={s.sessionId || i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 gap-1">
                        <div>
                          <p className="text-white font-medium">{s.sessionName}</p>
                          <p className="text-sm text-gray-400">{(s.studentCount ?? 0)} participants • Accuracy: {s.accuracyRate != null ? `${s.accuracyRate}%` : '—'}</p>
                        </div>
                        <div className="text-sm text-gray-400">{s.sessionEndedAt ? new Date(s.sessionEndedAt).toLocaleString() : '-'}</div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default HostDashboard;