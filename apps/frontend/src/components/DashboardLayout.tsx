import React, { useState } from 'react';
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import AIControlPanel from './AIControlPanel';
import { useGlobalAudio } from '../contexts/GlobalAudioContext';
import { useAuth } from '../contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { state: globalAudioState } = useGlobalAudio();
  const { activeRoom } = useAuth();
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [questionsPerPoll, setQuestionsPerPoll] = useState(3);

  // Floating configure button should be enabled when:
  // 1. There's an active room (session created)
  // 2. Global audio recording is active (START button was clicked)
  const shouldShowFloatingButton = Boolean(activeRoom && globalAudioState.isRecording);

  const handleToggleControlPanel = () => {
    setIsControlPanelOpen(!isControlPanelOpen);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 overflow-x-hidden">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {/* Sidebar for mobile (if you have a drawer/modal, render it separately) */}
      <Sidebar /> {/* If Sidebar handles its own mobile visibility, you can keep this. Otherwise, remove or adjust. */}
      <main className="flex-1 w-full md:ml-64 p-6">
        {children}
      </main>
      
      {/* Floating Configure Button - Only show when recording is active */}
      <AIControlPanel
        isOpen={isControlPanelOpen}
        onToggle={handleToggleControlPanel}
        showFloatingButton={shouldShowFloatingButton}
        questionsPerPoll={questionsPerPoll}
        setQuestionsPerPoll={setQuestionsPerPoll}
      />
    </div>
  );
};

export default DashboardLayout;