import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SegmentationState {
  isCurrentlyPaused: boolean;
  pauseStartTime: number | null;
  currentPauseDuration: number;
  segmentCount: number;
  interimSegmentCount: number;
  validSegmentCount: number;
  timelineProgress: number;
  remainingTime: number;
  hasReceivedTranscripts: boolean;
  waitingForSpeech: boolean;
}

interface GlobalSegmentationTimelineProps {
  segmentationState: SegmentationState;
  isRecording: boolean;
  isSegmentationEnabled: boolean;
}

const GlobalSegmentationTimeline: React.FC<GlobalSegmentationTimelineProps> = ({
  segmentationState,
  isRecording,
  isSegmentationEnabled
}) => {
  if (!isRecording || !isSegmentationEnabled) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-blue-300">Segmentation</span>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
              {segmentationState.segmentCount}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            10s pause → AI questions
          </div>
        </div>

        {segmentationState.waitingForSpeech ? (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-yellow-300">Waiting for transcript...</span>
          </div>
        ) : segmentationState.isCurrentlyPaused ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-orange-300 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                Pause Detected
              </span>
              <span className="text-xs text-orange-300 font-mono">
                {Math.ceil(segmentationState.remainingTime / 1000)}s
              </span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-1.5">
              <motion.div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${segmentationState.timelineProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div className="text-xs text-gray-400 text-center">
              {segmentationState.timelineProgress.toFixed(1)}% → Questions
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-300">Monitoring speech...</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalSegmentationTimeline;