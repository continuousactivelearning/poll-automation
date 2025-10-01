import React, { useState } from "react";
import { Smartphone, LogOut, RefreshCw, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../../components/GlassCard";
import DashboardLayout from "../../components/DashboardLayout";

const mockSessions = [
  {
    id: 1,
    device: "Chrome on Windows",
    location: "Delhi, India",
    lastActive: "Just now",
    current: true,
  },
  {
    id: 2,
    device: "Safari on iPhone",
    location: "Mumbai, India",
    lastActive: "2 hours ago",
    current: false,
  },
  {
    id: 3,
    device: "Edge on Mac",
    location: "Bangalore, India",
    lastActive: "Yesterday",
    current: false,
  },
];

const ActiveSessions: React.FC = () => {
  const [sessions, setSessions] = useState(mockSessions);
  const [loggingOut, setLoggingOut] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleLogoutSession = async (id: number) => {
    setLoggingOut(id);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setLoggingOut(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl w-full mx-auto p-4 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Active Sessions</h1>
          <p className="text-gray-400">
            Manage your logged-in devices. Log out from any session you don't recognize.
          </p>
        </div>

        <GlassCard className="p-6 space-y-6">
          {sessions.length === 0 ? (
            <div className="text-center text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-6">
              All sessions have been logged out!
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl ${
                  session.current
                    ? "bg-purple-500/10 border border-purple-500/20"
                    : "bg-white/5 border border-white/10"
                } transition-all`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">{session.device}</div>
                    <div className="text-gray-400 text-sm">
                      {session.location} • {session.lastActive}
                    </div>
                    {session.current && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                        Current Session
                      </span>
                    )}
                  </div>
                </div>
                {!session.current && (
                  <button
                    onClick={() => handleLogoutSession(session.id)}
                    disabled={loggingOut === session.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium disabled:opacity-50"
                  >
                    {loggingOut === session.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </>
                    )}
                  </button>
                )}
              </div>
            ))
          )}

          <div className="flex justify-center pt-4">
            <button
              onClick={() => navigate("/student/settings")}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
            >
              Back to Settings
            </button>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default ActiveSessions;
