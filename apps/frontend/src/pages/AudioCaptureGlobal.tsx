import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Activity, 
  Square,
  AlertCircle,
  Download,
  Monitor,
  User,
  VolumeX,
  Trash2,
  Play
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import GlassCard from '../components/GlassCard';
import TimerMonitor from '../components/TimerMonitor';
import { useGlobalAudio } from '../contexts/GlobalAudioContext';
import { useAuth } from '../contexts/AuthContext';
import { useSessionManagement } from '../hooks/useSessionManagement';
import { Toaster, toast } from 'react-hot-toast';

const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString();
};

const AudioCaptureGlobal = () => {
  const { activeRoom } = useAuth();
  const { 
    state, 
    startRecording, 
    toggleMute, 
    clearTranscripts, 
    exportTranscripts,
    setPersistAcrossRoutes,
  } = useGlobalAudio();
  
  const { endSessionWithAudioReset, resetAudioSession } = useSessionManagement();
  
  const [waveformData, setWaveformData] = useState<number[]>(Array(50).fill(0));
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // Generate waveform animation
  React.useEffect(() => {
    let animationFrame: number;
    let isActive = true;
    
    if (state.isRecording && !state.isMuted) {
      const animate = () => {
        if (!isActive) return;
        
        const newWaveform = Array(50).fill(0).map(() => 
          Math.random() * 80 + 10
        );
        setWaveformData(newWaveform);
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
    } else {
      setWaveformData(Array(50).fill(0));
    }

    return () => {
      isActive = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [state.isRecording, state.isMuted]);

  // Auto-scroll transcripts
  React.useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [state.transcriptLines]);

  const handleStartRecording = async () => {
    const success = await startRecording();
    if (success) {
      toast.success('🎤 Recording started successfully!');
    } else {
      toast.error('❌ Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    const success = await resetAudioSession();
    if (success) {
      toast.success('🛑 Recording stopped and session reset for fresh start');
    }
  };

  const handleToggleMute = () => {
    toggleMute();
    toast.success(state.isMuted ? '🎤 Unmuted' : '🔇 Muted');
  };

  const handleClearTranscripts = () => {
    clearTranscripts();
    toast.success('🗑️ Transcripts cleared');
  };

  const handleExportTranscripts = () => {
    if (state.transcriptLines.filter(line => line.isFinal).length === 0) {
      toast.error('No transcripts to export');
      return;
    }
    exportTranscripts();
    toast.success('� Transcripts exported successfully');
  };

  const handleEndSession = async () => {
    if (!activeRoom) {
      toast.error('No active session to end');
      return;
    }
    
    const success = await endSessionWithAudioReset(() => {
      // Navigation will be handled by the destroyRoom function
    });
    
    if (success) {
      // Additional success handling can go here
      console.log('✅ [AUDIO] Session ended successfully with audio reset');
    }
  };

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case 'recording': return 'bg-green-500/20 text-green-400';
      case 'connecting': return 'bg-yellow-500/20 text-yellow-400';
      case 'connected': return 'bg-blue-500/20 text-blue-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      case 'disconnected': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (currentStatus: string) => {
    switch (currentStatus) {
      case 'recording': return <Activity className="w-4 h-4" />;
      case 'connecting': return <Activity className="w-4 h-4 animate-pulse" />;
      case 'connected': return <Play className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  const finalTranscriptCount = state.transcriptLines.filter(line => line.isFinal).length;

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      
      {/* Check if room is created */}
      {!activeRoom ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <GlassCard className="p-8 text-center max-w-md">
            <div className="mb-6">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Create Room First</h2>
              <p className="text-gray-400">
                Please create a session room from either the Create Poll page or AI Questions page before using audio capture.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/host/create-poll'}
                className="w-full btn-primary py-2"
              >
                Go to Create Poll Page
              </button>
              <button
                onClick={() => window.location.href = '/host/ai-questions'}
                className="w-full btn-secondary py-2"
              >
                Go to AI Questions Page
              </button>
            </div>
          </GlassCard>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Global Audio Capture</h1>
              <p className="text-gray-400">
                Audio recording persists across all pages • Controlled globally
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(state.status)}`}>
                {getStatusIcon(state.status)}
                <span className="capitalize">{state.status}</span>
                {state.isMuted && state.isRecording && (
                  <VolumeX className="w-3 h-3 text-orange-400" />
                )}
              </div>
            </div>
          </div>

          {/* Global Audio Status Banner */}
          {state.isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/40 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-full">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-10 h-10 bg-green-500/30 rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-300 flex items-center gap-2">
                      🎤 Global Recording Active
                    </h3>
                    <p className="text-sm text-gray-300">
                      Recording continues across all pages • {finalTranscriptCount} transcripts captured
                      {state.isMuted && <span className="text-orange-300"> • Currently Muted</span>}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Navigate freely - recording persists
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Panel */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Global Audio Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Persistence Settings */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-3 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={state.persistAcrossRoutes}
                      onChange={(e) => setPersistAcrossRoutes(e.target.checked)}
                      className="rounded focus:ring-primary-500 text-primary-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Monitor className="w-4 h-4" />
                      <span>Persist Across Routes</span>
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Keep recording active when navigating between pages
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-300 mb-2">Global Audio Info</h4>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>Status: <span className="text-white">{state.status}</span></div>
                    <div>Recording: <span className="text-white">{state.isRecording ? 'Yes' : 'No'}</span></div>
                    <div>Muted: <span className="text-white">{state.isMuted ? 'Yes' : 'No'}</span></div>
                    <div>Transcripts: <span className="text-white">{finalTranscriptCount}</span></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Start/Stop Recording */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={state.isRecording ? handleStopRecording : handleStartRecording}
                    disabled={state.status === 'connecting'}
                    className={`py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                               disabled:opacity-50 disabled:cursor-not-allowed ${
                      state.isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {state.status === 'connecting' ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        Connecting
                      </>
                    ) : state.isRecording ? (
                      <>
                        <Square className="w-4 h-4" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Start
                      </>
                    )}
                  </motion.button>

                  {/* Mute Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleToggleMute}
                    disabled={!state.isRecording}
                    className={`py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                               disabled:opacity-50 disabled:cursor-not-allowed ${
                      state.isMuted
                        ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                        : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                    }`}
                  >
                    {state.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {state.isMuted ? 'Unmute' : 'Mute'}
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Export */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExportTranscripts}
                    disabled={finalTranscriptCount === 0}
                    className="py-2 px-4 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 
                             disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium 
                             transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </motion.button>

                  {/* Clear */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClearTranscripts}
                    disabled={state.transcriptLines.length === 0}
                    className="py-2 px-4 bg-red-500/20 text-red-300 hover:bg-red-500/30 
                             disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium 
                             transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </motion.button>

                  {/* End Session */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEndSession}
                    disabled={!activeRoom}
                    className="py-2 px-4 bg-orange-600/20 text-orange-300 hover:bg-orange-600/30 
                             disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium 
                             transition-all flex items-center justify-center gap-2 col-span-2 lg:col-span-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    End Session
                  </motion.button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Recording Controls & Waveform */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Waveform Visualizer */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Audio Waveform
              </h3>
              <div className="bg-black/20 rounded-lg p-4 h-32 flex items-end justify-center space-x-1">
                {waveformData.map((height, index) => (
                  <motion.div
                    key={index}
                    animate={{ height: `${Math.max(height, 5)}%` }}
                    transition={{ duration: 0.1 }}
                    className={`w-2 rounded-t-sm min-h-[2px] ${
                      state.isRecording && !state.isMuted
                        ? 'bg-gradient-to-t from-green-500 to-green-300' 
                        : state.isRecording && state.isMuted
                        ? 'bg-gradient-to-t from-orange-500 to-orange-300'
                        : 'bg-gradient-to-t from-gray-500 to-gray-400'
                    }`}
                  />
                ))}
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs text-gray-400">
                  Final Transcripts: {finalTranscriptCount}
                </p>
              </div>
            </GlassCard>

            {/* Quick Navigation */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Navigation</h3>
              <div className="space-y-3">
                <p className="text-sm text-gray-400 mb-4">
                  Audio recording continues while navigating these pages:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => window.location.href = '/host/ai-questions'}
                    className="py-2 px-4 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 
                             rounded-lg text-sm transition-all text-left"
                  >
                    → AI Questions & Generation
                  </button>
                  <button
                    onClick={() => window.location.href = '/host/participants'}
                    className="py-2 px-4 bg-green-500/20 text-green-300 hover:bg-green-500/30 
                             rounded-lg text-sm transition-all text-left"
                  >
                    → Participants Management
                  </button>
                  <button
                    onClick={() => window.location.href = '/host/create-poll'}
                    className="py-2 px-4 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 
                             rounded-lg text-sm transition-all text-left"
                  >
                    → Create New Poll
                  </button>
                </div>
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-xs text-green-300">
                    ✅ Recording persists across all these pages when enabled
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Live Transcription */}
          <GlassCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Live Transcription
              </h3>
              <div className="flex items-center space-x-2">
                {state.isRecording && (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-400">Live</span>
                  </>
                )}
              </div>
            </div>
            
            <div 
              ref={transcriptContainerRef}
              className="bg-black/20 rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto space-y-3"
            >
              <AnimatePresence>
                {state.transcriptLines.length > 0 ? (
                  state.transcriptLines.map((line) => (
                    <motion.div
                      key={line.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-3 rounded-lg border-l-4 ${
                        line.isFinal 
                          ? 'bg-white/5 border-l-green-500' 
                          : 'bg-yellow-500/5 border-l-yellow-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${
                          line.role === 'host' ? 'text-blue-400' : 
                          line.role === 'guest' ? 'text-purple-400' : 'text-green-400'
                        }`}>
                          {line.role === 'host' ? 'Host' : 
                           line.role === 'guest' ? 'Guest' : 'Participant'}
                          {!line.isFinal && ' (partial)'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(line.timestamp)}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${
                        line.isFinal ? 'text-gray-300' : 'text-yellow-300'
                      }`}>
                        {line.text}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-gray-500 text-lg mb-2">
                        {state.isRecording 
                          ? 'Listening for speech...' 
                          : state.status === 'connecting'
                          ? 'Connecting to transcription service...'
                          : 'Start recording to see transcripts here'
                        }
                      </p>
                      {state.isRecording && (
                        <p className="text-xs text-gray-600">
                          Transcripts will appear here in real-time
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>

          {/* Debug Panel */}
          {showDebugPanel && (
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Debug Information</h3>
                <button
                  onClick={() => setShowDebugPanel(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400">Status:</p>
                    <p className="text-white">{state.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Recording:</p>
                    <p className={state.isRecording ? 'text-green-400' : 'text-red-400'}>
                      {state.isRecording ? '✅ Active' : '❌ Inactive'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Muted:</p>
                    <p className={state.isMuted ? 'text-orange-400' : 'text-green-400'}>
                      {state.isMuted ? '🔇 Muted' : '🎤 Active'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Persist Routes:</p>
                    <p className={state.persistAcrossRoutes ? 'text-green-400' : 'text-orange-400'}>
                      {state.persistAcrossRoutes ? '✅ Enabled' : '❌ Disabled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Segmentation:</p>
                    <p className={state.segmentationEnabled ? 'text-green-400' : 'text-orange-400'}>
                      {state.segmentationEnabled ? '🔄 Enabled' : '⏸️ Disabled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Auto Questions:</p>
                    <p className={state.autoQuestionsEnabled ? 'text-blue-400' : 'text-gray-400'}>
                      {state.autoQuestionsEnabled ? '🤖 Enabled' : '🤖 Disabled'}
                    </p>
                  </div>
                </div>
                
                {state.error && (
                  <div>
                    <p className="text-gray-400">Last Error:</p>
                    <p className="text-red-400 break-words">{state.error}</p>
                  </div>
                )}
              </div>
            </GlassCard>
          )}

          {/* Debug Toggle Button */}
          {!showDebugPanel && (
            <button
              onClick={() => setShowDebugPanel(true)}
              className="fixed bottom-20 right-6 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition-colors z-40"
            >
              Debug Info
            </button>
          )}

          {/* Timer Monitor */}
          <TimerMonitor 
            onTimerStart={(duration) => {
              console.log('Timer started with duration:', duration);
            }}
            onTimerStop={() => {
              console.log('Timer stopped');
            }}
          />
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default AudioCaptureGlobal;