// apps/frontend/src/components/student/DashboardHomePage.tsx
import { motion } from "framer-motion";
import WelcomeSection from "./WelcomeSection";
import QuickAccessCards from "./QuickAccessCards";
import GlassCard from "../GlassCard";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiService } from '../../utils/api';

interface RecentItem {
  sessionId: string;
  sessionName: string;
  sessionEndedAt: string;
  studentResult?: any;
}

const DashboardHomePage = () => {
  const navigate = useNavigate();
  const [recent, setRecent] = useState<RecentItem[]>([])
  const { socket } = useAuth()

  const [socketStatus, setSocketStatus] = useState<string>(() => {
    if (!socket) return 'connecting'
    return socket.connected ? 'active' : 'connecting'
  })

  // Update status reactively when socket emits lifecycle events
  useEffect(() => {
    if (!socket) {
      setSocketStatus('connecting')
      return
    }

    // Initialize
    setSocketStatus(socket.connected ? 'active' : 'connecting')

    const onConnect = () => setSocketStatus('active')
    const onDisconnect = () => setSocketStatus('disconnected')
    const onConnectError = () => setSocketStatus('connecting')

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)

    return () => {
      try {
        socket.off('connect', onConnect)
        socket.off('disconnect', onDisconnect)
        socket.off('connect_error', onConnectError)
      } catch (e) {
        // ignore
      }
    }
  }, [socket])

  const handleReconnect = () => {
    try {
      if (socket) {
        // Force reconnect
        socket.connect()
      } else {
        // fallback: reload to trigger AuthContext socket setup
        window.location.reload()
      }
    } catch (e) {
      console.error('Reconnect failed', e)
    }
  }

  useEffect(() => {
    let mounted = true
    const fetchRecent = async () => {
      try {
        const res = await apiService.getMyRecentSessions()
        const data = res.data?.recent || []
        if (mounted) setRecent(data)
      } catch (err) {
        console.error('Failed to fetch recent sessions for student', err)
      }
    }
    fetchRecent()
    return () => { mounted = false }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Welcome Section and Switch Button */}
      <WelcomeSection>
        <div className="flex items-center justify-end mb-4 space-x-3">
          {/* Socket status badge */}
          <div className="flex items-center space-x-2">
            <div
              className={
                `px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ` +
                (socketStatus === 'active'
                  ? 'bg-emerald-600 text-white'
                  : socketStatus === 'connecting'
                  ? 'bg-amber-500 text-white'
                  : 'bg-red-600 text-white')
              }
            >
              {socketStatus === 'active' ? 'System Active' : socketStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
            </div>
            {socketStatus === 'disconnected' && (
              <button onClick={handleReconnect} className="px-3 py-1.5 bg-white/5 text-sm rounded-full border border-white/10 hover:bg-white/10">Reconnect</button>
            )}
          </div>

          <button
            onClick={() => navigate("/host")}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs sm:text-sm font-medium transition"
          >
            Switch to Host
          </button>
        </div>
      </WelcomeSection>
      {/* Today's Highlights and Quick Actions */}
      <QuickAccessCards onSectionChange={(section: string) => { /* handle section change here */ }} />
      {/* Recent Activity */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recent.length === 0 && (
            <div className="text-gray-400">No recent sessions attended yet.</div>
          )}
          {recent.map((r) => (
            <div key={String(r.sessionId)} className="flex items-center justify-between py-2">
              <div>
                <p className="text-white font-medium">{r.sessionName || r.sessionId}</p>
                <p className="text-sm text-gray-400">Ended: {new Date(r.sessionEndedAt).toLocaleString()}</p>
              </div>
              <div className="text-sm text-green-400">{r.studentResult ? `${Math.round((r.studentResult.accuracy || 0) * 10) / 10}%` : ''}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default DashboardHomePage;