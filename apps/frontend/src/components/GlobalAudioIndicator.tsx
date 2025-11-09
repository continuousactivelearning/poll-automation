import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Square, 
  Activity, 
  Volume2,
  VolumeX,
  Download,
  Trash2,
  Settings,
  X,
  Maximize2
} from 'lucide-react';
import { useGlobalAudio } from '../contexts/GlobalAudioContext';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from './GlassCard';
import GlobalSegmentationTimeline from './GlobalSegmentationTimeline';

const GlobalAudioIndicator: React.FC = () => {
  const { 
    state, 
    startRecording, 
    stopRecording, 
    toggleMute, 
    clearTranscripts, 
    exportTranscripts,
    setSegmentationEnabled,
    setAutoQuestionsEnabled
  } = useGlobalAudio();
  const { activeRoom } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Don't show if no room is active
  if (!activeRoom) {
    return null;
  }

  const handleToggleRecording = async () => {
    if (state.isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const getStatusColor = () => {
    if (state.isRecording && !state.isMuted) return 'from-green-500 to-green-600';
    if (state.isRecording && state.isMuted) return 'from-orange-500 to-orange-600';
    if (state.status === 'connecting') return 'from-yellow-500 to-yellow-600';
    if (state.status === 'error') return 'from-red-500 to-red-600';
    return 'from-gray-500 to-gray-600';
  };

  const getStatusIcon = () => {
    if (state.isRecording && state.isMuted) return <MicOff className="w-5 h-5 text-white" />;
    if (state.isRecording) return <Mic className="w-5 h-5 text-white" />;
    if (state.status === 'connecting') return <Activity className="w-5 h-5 text-white animate-pulse" />;
    return <Square className="w-4 h-4 text-white" />;
  };

  const finalTranscriptCount = state.transcriptLines.filter(line => line.isFinal).length;

  return (
    <>
      {/* Main Floating Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        {/* Compact Indicator */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative"
            >
              {/* Main Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExpanded(true)}
                className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${getStatusColor()} 
                           shadow-lg shadow-black/25 border-2 border-white/20 
                           flex items-center justify-center transition-all duration-200
                           hover:shadow-xl hover:shadow-black/30`}
                title={`Audio: ${state.status}${state.isRecording ? ' - Recording' : ''}`}
              >
                {getStatusIcon()}
                
                {/* Recording Pulse Animation */}
                {state.isRecording && !state.isMuted && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-green-300"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.7, 0, 0.7],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
                
                {/* Muted Indicator */}
                {state.isRecording && state.isMuted && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                    <VolumeX className="w-2 h-2 text-white" />
                  </div>
                )}
              </motion.button>
              
              {/* Transcript Count Badge */}
              {finalTranscriptCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-2 -left-2 min-w-[20px] h-5 bg-blue-500 text-white text-xs 
                             rounded-full flex items-center justify-center px-1 border-2 border-white shadow-md"
                >
                  {finalTranscriptCount}
                </motion.div>
              )}

              {/* Status Text */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute right-16 top-1/2 transform -translate-y-1/2 
                           bg-black/80 text-white text-xs px-2 py-1 rounded-lg 
                           whitespace-nowrap border border-white/20 shadow-lg"
              >
                {state.isRecording ? (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    {state.isMuted ? 'Muted' : 'Recording'}
                  </div>
                ) : (
                  <span className="capitalize">{state.status}</span>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded Controls */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <GlassCard className="p-4 min-w-[280px] max-w-[320px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${getStatusColor()}`} />
                    <span className="text-sm font-medium text-white">Global Audio</span>
                    {state.isRecording && (
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Status Display */}
                <div className="mb-4 p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Status</span>
                    <span className={`text-xs font-medium ${
                      state.isRecording ? 'text-green-400' : 
                      state.status === 'error' ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {state.isRecording ? (state.isMuted ? 'Recording (Muted)' : 'Recording') : state.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Transcripts</span>
                    <span className="text-xs text-white">{finalTranscriptCount}</span>
                  </div>
                  {state.error && (
                    <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300">
                      {state.error}
                    </div>
                  )}
                </div>

                {/* Segmentation Timeline */}
                <GlobalSegmentationTimeline
                  segmentationState={state.segmentationState}
                  isRecording={state.isRecording}
                  isSegmentationEnabled={state.segmentationEnabled}
                />

                {/* Main Controls */}
                <div className="space-y-3">
                  {/* Record/Stop Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleToggleRecording}
                    disabled={state.status === 'connecting'}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                               disabled:opacity-50 disabled:cursor-not-allowed ${
                      state.isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {state.status === 'connecting' ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : state.isRecording ? (
                      <>
                        <Square className="w-4 h-4" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Start Recording
                      </>
                    )}
                  </motion.button>

                  {/* Secondary Controls */}
                  <div className="flex items-center gap-2">
                    {/* Mute Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={toggleMute}
                      disabled={!state.isRecording}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all 
                                 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                        state.isMuted
                          ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                          : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                      }`}
                    >
                      {state.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      {state.isMuted ? 'Unmute' : 'Mute'}
                    </motion.button>

                    {/* More Controls Toggle */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowControls(!showControls)}
                      className="p-2 bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 rounded-lg transition-all"
                    >
                      <Settings className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Additional Controls */}
                  <AnimatePresence>
                    {showControls && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        <div className="flex items-center gap-2">
                          {/* Export */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={exportTranscripts}
                            disabled={finalTranscriptCount === 0}
                            className="flex-1 py-2 px-3 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 
                                     disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium 
                                     transition-all flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Export
                          </motion.button>

                          {/* Clear */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={clearTranscripts}
                            disabled={state.transcriptLines.length === 0}
                            className="flex-1 py-2 px-3 bg-red-500/20 text-red-300 hover:bg-red-500/30 
                                     disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium 
                                     transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Clear
                          </motion.button>
                        </div>

                        {/* AI Features Controls */}
                        <div className="space-y-2">
                          {/* Segmentation Toggle */}
                          <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-white">Transcript Segmentation</span>
                              <span className="text-xs text-gray-400">Auto-segment on 10s pause</span>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSegmentationEnabled(!state.segmentationEnabled)}
                              className={`w-10 h-5 rounded-full transition-all relative ${
                                state.segmentationEnabled 
                                  ? 'bg-green-500' 
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                layout
                                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                                className={`w-4 h-4 bg-white rounded-full absolute top-0.5 ${
                                  state.segmentationEnabled ? 'right-0.5' : 'left-0.5'
                                }`}
                              />
                            </motion.button>
                          </div>

                          {/* Auto-Questions Toggle */}
                          <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-white">Auto Questions</span>
                              <span className="text-xs text-gray-400">Generate AI questions</span>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setAutoQuestionsEnabled(!state.autoQuestionsEnabled)}
                              className={`w-10 h-5 rounded-full transition-all relative ${
                                state.autoQuestionsEnabled 
                                  ? 'bg-blue-500' 
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                layout
                                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                                className={`w-4 h-4 bg-white rounded-full absolute top-0.5 ${
                                  state.autoQuestionsEnabled ? 'right-0.5' : 'left-0.5'
                                }`}
                              />
                            </motion.button>
                          </div>
                        </div>

                        {/* Go to Audio Capture Page */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => window.location.href = '/host/audio'}
                          className="w-full py-2 px-3 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 
                                   rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <Maximize2 className="w-4 h-4" />
                          Full Audio Capture
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Quick Room Info */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="text-xs text-gray-400 text-center">
                    Room: <span className="text-white">{activeRoom?.name || 'Active Session'}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default GlobalAudioIndicator;
