import React, { useState } from 'react';
import { useTimerAudio } from '../contexts/TimerAudioContext';
import { useGlobalAudio } from '../contexts/GlobalAudioContext';

const FloatingTimerControl: React.FC = () => {
  const { state: globalAudioState } = useGlobalAudio();
  const {
    state: timerState,
    stopTimer,
    resetTimer,
    formatRemainingTime,
    isTimerActive,
  } = useTimerAudio();

  const [isExpanded, setIsExpanded] = useState(false);

  // Only show when timer is active
  if (!timerState.showFloatingControl || !isTimerActive()) {
    return null;
  }

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStopTimer = () => {
    stopTimer();
    setIsExpanded(false);
  };

  const handleResetTimer = () => {
    resetTimer();
    setIsExpanded(false);
  };

  return (
    <>
      {/* Overlay for expanded state */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Expanded Panel */}
        {isExpanded && (
          <div className="mb-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 transform transition-all duration-200 ease-in-out">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="font-semibold text-gray-800">Timer Active</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            {/* Timer Display */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-900 mb-1">
                  ⏳ {formatRemainingTime(timerState.remainingTime)}
                </div>
                <div className="text-sm text-blue-600">Remaining Time</div>
              </div>
              
              {timerState.currentSession && (
                <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-blue-800">
                      {timerState.currentSession.transcripts.length}
                    </div>
                    <div className="text-xs text-blue-600">Transcripts</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-800">
                      {Math.ceil((Date.now() - timerState.currentSession.startTime) / 60000)}m
                    </div>
                    <div className="text-xs text-blue-600">Elapsed</div>
                  </div>
                </div>
              )}
            </div>

            {/* Mic Status */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${
                globalAudioState.isRecording ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                Microphone: {globalAudioState.isRecording ? 'Recording' : 'Off'}
              </span>
              {globalAudioState.isMuted && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Muted
                </span>
              )}
            </div>

            {/* Control Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleStopTimer}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                ⏹️ Stop & Generate Questions
              </button>
              
              <button
                onClick={handleResetTimer}
                className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                🔄 Reset Timer
              </button>
            </div>

            {/* Warning */}
            {!globalAudioState.isRecording && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                ⚠️ Microphone is off. No new transcripts will be captured.
              </div>
            )}
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={handleToggleExpanded}
          className={`
            w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg 
            flex items-center justify-center transition-all duration-200 transform
            ${isExpanded ? 'scale-110 bg-blue-700' : 'hover:scale-105'}
          `}
        >
          {isExpanded ? (
            <span className="text-xl">×</span>
          ) : (
            <div className="text-center">
              <div className="text-xs font-bold leading-none">
                {formatRemainingTime(timerState.remainingTime).split(':')[0]}
              </div>
              <div className="text-xs leading-none">
                {formatRemainingTime(timerState.remainingTime).split(':')[1]}
              </div>
            </div>
          )}
        </button>

        {/* Pulse Animation */}
        {!isExpanded && (
          <div className="absolute inset-0 w-14 h-14 bg-blue-400 rounded-full animate-ping opacity-20"></div>
        )}
      </div>
    </>
  );
};

export default FloatingTimerControl;