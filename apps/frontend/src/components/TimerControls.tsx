import React, { useState, useEffect } from 'react';
import { useTimerAudio, TIMER_PRESETS } from '../contexts/TimerAudioContext';
import { useGlobalAudio } from '../contexts/GlobalAudioContext';

const TimerControls: React.FC = () => {
  const { state: globalAudioState } = useGlobalAudio();
  const {
    state: timerState,
    setPreset,
    setCustomDuration,
    startTimer,
    stopTimer,
    resetTimer,
    formatRemainingTime,
    canStartTimer,
    isTimerActive,
    setError,
  } = useTimerAudio();

  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(5);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Show timer controls only when mic is recording
  const shouldShowControls = globalAudioState.isRecording;

  // Update custom duration when values change
  useEffect(() => {
    setCustomDuration(customHours, customMinutes);
  }, [customHours, customMinutes, setCustomDuration]);

  // Handle preset selection
  const handlePresetChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomInput(true);
      setPreset('custom');
    } else {
      setShowCustomInput(false);
      setPreset(value);
    }
    setError(null);
  };

  // Handle start timer
  const handleStartTimer = () => {
    if (!canStartTimer()) {
      setError('Cannot start timer: Please ensure mic is recording and select a valid duration');
      return;
    }
    
    if (timerState.selectedPreset === 'custom' && customHours === 0 && customMinutes === 0) {
      setError('Please enter a valid custom duration');
      return;
    }
    
    startTimer();
  };

  // Handle stop timer
  const handleStopTimer = () => {
    stopTimer();
  };

  // Handle reset timer
  const handleResetTimer = () => {
    resetTimer();
    setShowCustomInput(false);
    setCustomHours(0);
    setCustomMinutes(5);
  };

  // Don't render if controls shouldn't be shown
  if (!shouldShowControls) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        <h3 className="text-lg font-semibold text-gray-800">
          🕒 Timed Transcript Capture
        </h3>
      </div>

      {/* Error Display */}
      {timerState.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{timerState.error}</p>
        </div>
      )}

      {/* Timer Status Display */}
      {isTimerActive() && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800">Timer Running</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                ⏳ {formatRemainingTime(timerState.remainingTime)}
              </div>
              <div className="text-xs text-blue-600">Remaining Time</div>
            </div>
          </div>
          
          {timerState.currentSession && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="flex justify-between text-sm text-blue-700">
                <span>Transcripts captured: {timerState.currentSession.transcripts.length}</span>
                <span>Session: {timerState.currentSession.id.split('_')[1]}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timer Controls */}
      {timerState.status === 'idle' && (
        <div className="space-y-4">
          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Duration
            </label>
            <select
              value={timerState.selectedPreset || ''}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTimerActive()}
            >
              <option value="" disabled>Choose a duration...</option>
              {TIMER_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
              <option value="custom">Custom Duration</option>
            </select>
          </div>

          {/* Custom Duration Input */}
          {showCustomInput && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Custom Duration
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={customHours}
                    onChange={(e) => setCustomHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isTimerActive()}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isTimerActive()}
                  />
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Total: {customHours > 0 ? `${customHours}h ` : ''}{customMinutes}m
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleStartTimer}
            disabled={!canStartTimer()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              canStartTimer()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canStartTimer() ? '🎬 Start Timed Capture' : 'Select Duration & Ensure Mic is On'}
          </button>

          {/* Info Text */}
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">📋 How it works:</p>
            <ul className="space-y-1 text-xs">
              <li>• Timer captures transcripts during the selected duration</li>
              <li>• When time ends, AI generates questions from all captured content</li>
              <li>• Questions appear in the AI Questions page as "Timer-based Questions"</li>
              <li>• You can stop the timer early using the floating control button</li>
            </ul>
          </div>
        </div>
      )}

      {/* Active Timer Controls */}
      {isTimerActive() && (
        <div className="space-y-3">
          <button
            onClick={handleStopTimer}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            ⏹️ Stop Timer & Generate Questions
          </button>
          
          <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
            <p className="font-medium mb-1">⚡ Timer Active:</p>
            <ul className="space-y-1 text-xs">
              <li>• Capturing transcripts in real-time</li>
              <li>• Use the floating button to monitor progress</li>
              <li>• Questions will be generated when timer ends</li>
            </ul>
          </div>
        </div>
      )}

      {/* Completed/Stopped State */}
      {(timerState.status === 'completed' || timerState.status === 'stopped') && (
        <div className="space-y-3">
          <div className={`p-4 rounded-lg ${
            timerState.status === 'completed' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className={`font-medium ${
              timerState.status === 'completed' ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {timerState.status === 'completed' ? '✅ Timer Completed!' : '⏹️ Timer Stopped'}
            </div>
            {timerState.currentSession && (
              <div className={`text-sm mt-1 ${
                timerState.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                Captured {timerState.currentSession.transcripts.length} transcripts
                {timerState.currentSession.questionsGenerated 
                  ? ' • Questions generated ✅' 
                  : ' • Generating questions...'}
              </div>
            )}
          </div>
          
          <button
            onClick={handleResetTimer}
            className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            🔄 Start New Timer Session
          </button>
        </div>
      )}

      {/* Session History */}
      {timerState.sessions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            📊 Session History ({timerState.sessions.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {timerState.sessions.slice(-3).map((session) => (
              <div key={session.id} className="text-xs p-2 bg-gray-50 rounded border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {new Date(session.startTime).toLocaleTimeString()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    session.status === 'completed' ? 'bg-green-100 text-green-800' :
                    session.status === 'stopped' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {session.status}
                  </span>
                </div>
                <div className="text-gray-600 mt-1">
                  {session.transcripts.length} transcripts • {Math.round(session.duration / 60000)}min
                  {session.questionsGenerated && ' • Questions ✅'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimerControls;