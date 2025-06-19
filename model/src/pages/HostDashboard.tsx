// src/pages/HostDashboard.tsx

import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from '../components/host/Sidebar';
import DashboardOverview from '../components/host/DashboardOverview';
import AudioCapturePanel from '../components/host/AudioCapturePanel';
import PollDisplay, { PollData as DisplayPollData } from '../components/host/PollDisplay';
import AIQuestionFeed from '../components/host/AIQuestionFeed';
import MeetingTracker from '../components/host/MeetingTracker';
import PollAnalytics from '../components/host/PollAnalytics';
import ParticipantsPanel from '../components/host/ParticipantsPanel';
import Leaderboard from '../components/host/Leaderboard';
import Reports from '../components/host/Reports';
import Settings from '../components/host/Settings';

const HostDashboard: React.FC = () => {
  const [currentPoll, setCurrentPoll] = useState<DisplayPollData | null>(null);

  // This handler now only sets the current poll to be displayed.
  // History is managed inside the AudioCapturePanel.
  const handlePollGenerated = (poll: DisplayPollData) => {
    setCurrentPoll(poll);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-space-blue via-charcoal to-gradient-start">
      <Sidebar />
      <div className="flex-1 overflow-hidden p-4 relative">
        <main className="h-full overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/host/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardOverview />} />

            {/* Audio Route */}
            <Route
              path="/audio"
              element={
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div className="col-span-1">
                    {/* The onPollGenerated prop is passed down */}
                    <AudioCapturePanel onPollGenerated={handlePollGenerated} />
                  </div>

                  <div className="col-span-1">
                    <h2 className="text-2xl font-bold text-white mb-4">Generated Poll</h2>
                    {currentPoll ? (
                      <PollDisplay poll={currentPoll} />
                    ) : (
                      <div className="text-center text-gray-400 bg-charcoal/20 p-8 rounded-lg h-full flex items-center justify-center">
                        <p>A poll will appear here once it's generated.</p>
                      </div>
                    )}
                  </div>
                </div>
              }
            />

            <Route path="/ai-questions" element={<AIQuestionFeed />} />
            <Route path="/meetings" element={<MeetingTracker />} />
            <Route path="/analytics" element={<PollAnalytics />} />
            <Route path="/participants" element={<ParticipantsPanel />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export  default HostDashboard;