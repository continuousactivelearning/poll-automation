import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Play, 
  Square, 
  Loader2, 
  CheckCircle,
  Timer,
  Settings,
  X
} from 'lucide-react';
import { useGlobalAudio } from '../contexts/GlobalAudioContext';
import { formatTime } from '../utils/timeUtils';
import GlassCard from './GlassCard';

interface TimerMonitorProps {
  onTimerStart?: (duration: number) => void;
  onTimerStop?: () => void;
  className?: string;
}

const TimerMonitor: React.FC<TimerMonitorProps> = ({ 
  onTimerStart, 
  onTimerStop, 
  className = '' 
}) => {
  const { state, startTimer, stopTimer, getTimerStatus } = useGlobalAudio();
  const [showTimerConfig, setShowTimerConfig] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(5 * 60 * 1000); // Default 5 minutes
  const [customDuration, setCustomDuration] = useState(10);
  const [isStarting, setIsStarting] = useState(false);

  const timerState = state.timerState;

  // Predefined timer durations (in milliseconds)
  const presetDurations = [
    { label: '1 min', value: 1 * 60 * 1000 },
    { label: '5 min', value: 5 * 60 * 1000 },
    { label: '10 min', value: 10 * 60 * 1000 },
    { label: '30 min', value: 30 * 60 * 1000 },
    { label: '60 min', value: 60 * 60 * 1000 },
  ];

  const handleStartTimer = async () => {
    if (isStarting) return;
    
    setIsStarting(true);
    try {
      const duration = selectedDuration === 0 ? customDuration * 60 * 1000 : selectedDuration;
      const success = await startTimer(duration);
      
      if (success) {
        setShowTimerConfig(false);
        onTimerStart?.(duration);
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTimer();
      onTimerStop?.();
    } catch (error) {
      console.error('Failed to stop timer:', error);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (timerState.status) {
      case 'running':
        return <Timer className="w-4 h-4 text-green-400 animate-pulse" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (timerState.status) {
      case 'running':
        return 'Recording';
      case 'processing':
        return 'Generating Questions...';
      case 'completed':
        return 'Completed';
      default:
        return 'Stopped';
    }
  };

  const progressPercentage = timerState.durationSelected > 0 
    ? ((timerState.durationSelected - timerState.remainingTime) / timerState.durationSelected) * 100
    : 0;

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <AnimatePresence>
        {showTimerConfig && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-full right-0 mb-4"
          >
            <GlassCard className="w-80 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Timer Settings</h3>
                <button
                  onClick={() => setShowTimerConfig(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {presetDurations.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setSelectedDuration(preset.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedDuration === preset.value
                            ? 'bg-primary-500 text-white'
                            : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      onClick={() => setSelectedDuration(0)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedDuration === 0
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {selectedDuration === 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Custom Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-dark-600 border border-dark-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleStartTimer}
                    disabled={isStarting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStarting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Start Timer
                  </button>
                  <button
                    onClick={() => setShowTimerConfig(false)}
                    className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        className="relative"
      >
        <GlassCard className={`p-4 ${timerState.isActive ? 'min-w-[280px]' : 'min-w-[200px]'}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm font-medium text-white">
                Timer: {getStatusText()}
              </span>
            </div>

            {!timerState.isActive ? (
              <button
                onClick={() => setShowTimerConfig(true)}
                className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Settings className="w-3 h-3" />
                Configure
              </button>
            ) : (
              <button
                onClick={handleStopTimer}
                className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Square className="w-3 h-3" />
                Stop
              </button>
            )}
          </div>

          {timerState.isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2"
            >
              <div className="flex justify-between text-xs text-gray-300">
                <span>Remaining: {formatDuration(timerState.remainingTime)}</span>
                <span>Segments: {timerState.segmentCount}</span>
              </div>

              <div className="w-full bg-dark-600 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-primary-500 to-green-500 h-2 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="text-xs text-gray-400">
                Duration: {formatDuration(timerState.durationSelected)}
              </div>
            </motion.div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default TimerMonitor;