import React from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Activity, Square } from 'lucide-react';
import { useGlobalAudioControls } from '../hooks/useGlobalAudioControls';

interface MiniAudioStatusProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Small audio status indicator that can be embedded in any component
 * Shows current recording status with optional text
 */
const MiniAudioStatus: React.FC<MiniAudioStatusProps> = ({ 
  className = '', 
  showText = true,
  size = 'sm'
}) => {
  const { isRecording, isMuted, status, transcriptCount } = useGlobalAudioControls();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const getStatusColor = () => {
    if (isRecording && !isMuted) return 'text-green-400';
    if (isRecording && isMuted) return 'text-orange-400';
    if (status === 'connecting') return 'text-yellow-400';
    if (status === 'error') return 'text-red-400';
    return 'text-gray-400';
  };

  const getStatusIcon = () => {
    const iconClass = sizeClasses[size];
    
    if (isRecording && isMuted) return <MicOff className={iconClass} />;
    if (isRecording) return <Mic className={iconClass} />;
    if (status === 'connecting') return <Activity className={`${iconClass} animate-pulse`} />;
    return <Square className={iconClass} />;
  };

  const getStatusText = () => {
    if (isRecording && isMuted) return 'Recording (Muted)';
    if (isRecording) return 'Recording';
    if (status === 'connecting') return 'Connecting...';
    return 'Stopped';
  };

  // Don't render if no active session
  if (status === 'stopped' && !isRecording) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 ${className}`}
    >
      {/* Status Icon */}
      <div className={`${getStatusColor()} flex items-center`}>
        {getStatusIcon()}
        
        {/* Recording pulse animation */}
        {isRecording && !isMuted && (
          <motion.div
            className="absolute w-2 h-2 bg-green-400 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>

      {/* Status Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {transcriptCount > 0 && (
            <span className="text-xs text-gray-500">
              {transcriptCount} transcripts
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default MiniAudioStatus;