import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useGlobalAudio } from './GlobalAudioContext';
import { useAuth } from './AuthContext';

// Timer states
export type TimerStatus = 'idle' | 'running' | 'completed' | 'stopped';

// Timer duration options
export interface TimerDuration {
  label: string;
  minutes: number;
  value: string;
}

export const TIMER_PRESETS: TimerDuration[] = [
  { label: '1 minute (test)', minutes: 1, value: '1min' },
  { label: '5 minutes', minutes: 5, value: '5min' },
  { label: '10 minutes', minutes: 10, value: '10min' },
  { label: '30 minutes', minutes: 30, value: '30min' },
  { label: '60 minutes', minutes: 60, value: '60min' },
];

// Timer transcript data
export interface TimerTranscript {
  id: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  sessionId: string;
}

// Timer session data
export interface TimerSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number; // in milliseconds
  transcripts: TimerTranscript[];
  status: TimerStatus;
  questionsGenerated?: boolean;
  questionsId?: string;
}

// Timer state
export interface TimerAudioState {
  // Timer configuration
  selectedPreset: string | null;
  customDuration: { hours: number; minutes: number };
  totalDuration: number; // in milliseconds
  
  // Timer status
  status: TimerStatus;
  remainingTime: number; // in milliseconds
  startTime: number | null;
  
  // Current session
  currentSession: TimerSession | null;
  sessions: TimerSession[];
  
  // UI state
  showFloatingControl: boolean;
  isTimerControlsVisible: boolean;
  
  // Error handling
  error: string | null;
}

// Timer actions
export type TimerAudioAction =
  | { type: 'SET_PRESET'; preset: string }
  | { type: 'SET_CUSTOM_DURATION'; hours: number; minutes: number }
  | { type: 'START_TIMER'; duration: number }
  | { type: 'TICK_TIMER'; currentTime: number }
  | { type: 'STOP_TIMER' }
  | { type: 'COMPLETE_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'ADD_TRANSCRIPT'; transcript: TimerTranscript }
  | { type: 'SET_QUESTIONS_GENERATED'; sessionId: string; questionsId: string }
  | { type: 'SET_FLOATING_CONTROL'; show: boolean }
  | { type: 'SET_TIMER_CONTROLS_VISIBLE'; visible: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLEAR_SESSIONS' };

// Initial state
const initialState: TimerAudioState = {
  selectedPreset: null,
  customDuration: { hours: 0, minutes: 5 },
  totalDuration: 0,
  status: 'idle',
  remainingTime: 0,
  startTime: null,
  currentSession: null,
  sessions: [],
  showFloatingControl: false,
  isTimerControlsVisible: false,
  error: null,
};

// Reducer
function timerAudioReducer(state: TimerAudioState, action: TimerAudioAction): TimerAudioState {
  switch (action.type) {
    case 'SET_PRESET':
      const preset = TIMER_PRESETS.find(p => p.value === action.preset);
      return {
        ...state,
        selectedPreset: action.preset,
        totalDuration: preset ? preset.minutes * 60 * 1000 : 0,
        error: null,
      };

    case 'SET_CUSTOM_DURATION':
      const customDurationMs = (action.hours * 60 + action.minutes) * 60 * 1000;
      return {
        ...state,
        customDuration: { hours: action.hours, minutes: action.minutes },
        totalDuration: state.selectedPreset === 'custom' ? customDurationMs : state.totalDuration,
        error: null,
      };

    case 'START_TIMER':
      const sessionId = `timer_${Date.now()}`;
      const newSession: TimerSession = {
        id: sessionId,
        startTime: Date.now(),
        duration: action.duration,
        transcripts: [],
        status: 'running',
      };
      
      return {
        ...state,
        status: 'running',
        remainingTime: action.duration,
        startTime: Date.now(),
        currentSession: newSession,
        sessions: [...state.sessions, newSession],
        showFloatingControl: true,
        error: null,
      };

    case 'TICK_TIMER':
      if (state.status !== 'running' || !state.startTime) return state;
      
      const elapsed = action.currentTime - state.startTime;
      const remaining = Math.max(0, state.totalDuration - elapsed);
      
      if (remaining === 0) {
        // Timer completed
        const completedSession = state.currentSession ? {
          ...state.currentSession,
          endTime: action.currentTime,
          status: 'completed' as TimerStatus,
        } : null;
        
        return {
          ...state,
          status: 'completed',
          remainingTime: 0,
          currentSession: completedSession,
          sessions: completedSession 
            ? state.sessions.map(s => s.id === completedSession.id ? completedSession : s)
            : state.sessions,
        };
      }
      
      return {
        ...state,
        remainingTime: remaining,
      };

    case 'STOP_TIMER':
      const stoppedSession = state.currentSession ? {
        ...state.currentSession,
        endTime: Date.now(),
        status: 'stopped' as TimerStatus,
      } : null;
      
      return {
        ...state,
        status: 'stopped',
        remainingTime: 0,
        currentSession: stoppedSession,
        sessions: stoppedSession 
          ? state.sessions.map(s => s.id === stoppedSession.id ? stoppedSession : s)
          : state.sessions,
        showFloatingControl: false,
      };

    case 'COMPLETE_TIMER':
      return {
        ...state,
        status: 'completed',
        remainingTime: 0,
        showFloatingControl: false,
      };

    case 'RESET_TIMER':
      return {
        ...state,
        status: 'idle',
        remainingTime: 0,
        startTime: null,
        currentSession: null,
        showFloatingControl: false,
        error: null,
      };

    case 'ADD_TRANSCRIPT':
      if (!state.currentSession || state.status !== 'running') return state;
      
      const updatedSession = {
        ...state.currentSession,
        transcripts: [...state.currentSession.transcripts, action.transcript],
      };
      
      return {
        ...state,
        currentSession: updatedSession,
        sessions: state.sessions.map(s => s.id === updatedSession.id ? updatedSession : s),
      };

    case 'SET_QUESTIONS_GENERATED':
      return {
        ...state,
        sessions: state.sessions.map(s => 
          s.id === action.sessionId 
            ? { ...s, questionsGenerated: true, questionsId: action.questionsId }
            : s
        ),
      };

    case 'SET_FLOATING_CONTROL':
      return {
        ...state,
        showFloatingControl: action.show,
      };

    case 'SET_TIMER_CONTROLS_VISIBLE':
      return {
        ...state,
        isTimerControlsVisible: action.visible,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
      };

    case 'CLEAR_SESSIONS':
      return {
        ...state,
        sessions: [],
        currentSession: null,
      };

    default:
      return state;
  }
}

// Context
interface TimerAudioContextType {
  state: TimerAudioState;
  
  // Timer controls
  setPreset: (preset: string) => void;
  setCustomDuration: (hours: number, minutes: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  
  // Utility functions
  formatRemainingTime: (ms: number) => string;
  getDurationFromSelection: () => number;
  isTimerActive: () => boolean;
  canStartTimer: () => boolean;
  
  // Session management
  getCurrentSession: () => TimerSession | null;
  getCompletedSessions: () => TimerSession[];
  markQuestionsGenerated: (sessionId: string, questionsId: string) => void;
  
  // UI controls
  setFloatingControlVisible: (show: boolean) => void;
  setTimerControlsVisible: (visible: boolean) => void;
  
  // Error handling
  setError: (error: string | null) => void;
}

const TimerAudioContext = createContext<TimerAudioContextType | null>(null);

// Hook to use timer context
export const useTimerAudio = (): TimerAudioContextType => {
  const context = useContext(TimerAudioContext);
  if (!context) {
    throw new Error('useTimerAudio must be used within a TimerAudioProvider');
  }
  return context;
};

// Provider component
export const TimerAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(timerAudioReducer, initialState);
  const { state: globalAudioState } = useGlobalAudio();
  const { activeRoom } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer tick effect
  useEffect(() => {
    if (state.status === 'running') {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'TICK_TIMER', currentTime: Date.now() });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.status]);

  // Handle timer completion
  useEffect(() => {
    if (state.status === 'completed' && state.currentSession) {
      console.log('🕒 [TIMER] Timer completed, triggering question generation');
      dispatch({ type: 'COMPLETE_TIMER' });
      
      // Trigger question generation for the completed session
      if (state.currentSession) {
        generateQuestionsForSession(state.currentSession);
      }
    }
  }, [state.status]);

  // Monitor global audio state to show/hide timer controls
  useEffect(() => {
    if (globalAudioState.isRecording && state.status === 'idle') {
      // Show timer controls when recording starts and timer is idle
      dispatch({ type: 'SET_TIMER_CONTROLS_VISIBLE', visible: true });
    } else if (!globalAudioState.isRecording && state.status === 'idle') {
      // Hide timer controls when recording stops and timer is idle
      dispatch({ type: 'SET_TIMER_CONTROLS_VISIBLE', visible: false });
    }
  }, [globalAudioState.isRecording, state.status]);

  // Listen to global audio transcripts and add them to timer session
  useEffect(() => {
    if (state.status === 'running' && state.currentSession && globalAudioState.transcriptLines) {
      // Get the latest transcript lines that are final
      const latestTranscripts = globalAudioState.transcriptLines
        .filter(line => line.isFinal && line.timestamp > (state.startTime || 0))
        .map(line => ({
          id: `timer_${line.timestamp}_${Date.now()}`,
          text: line.text,
          timestamp: line.timestamp,
          isFinal: line.isFinal,
          sessionId: state.currentSession!.id,
        }));

      // Add new transcripts to current session
      latestTranscripts.forEach(transcript => {
        // Check if transcript is already in session to avoid duplicates
        const existsInSession = state.currentSession?.transcripts.some(
          t => t.timestamp === transcript.timestamp && t.text === transcript.text
        );
        
        if (!existsInSession) {
          dispatch({ type: 'ADD_TRANSCRIPT', transcript });
        }
      });
    }
  }, [globalAudioState.transcriptLines, state.status, state.currentSession]);

  // Generate questions for completed session
  const generateQuestionsForSession = async (session: TimerSession) => {
    try {
      if (session.transcripts.length === 0) {
        console.log('🕒 [TIMER] No transcripts to generate questions from');
        return;
      }

      console.log(`🕒 [TIMER] Generating questions for session ${session.id} with ${session.transcripts.length} transcripts`);
      
      // Combine all transcripts from the session
      const combinedText = session.transcripts
        .map(t => t.text.trim())
        .filter(text => text.length > 0)
        .join(' ');

      if (combinedText.length < 50) {
        console.log('🕒 [TIMER] Combined transcript too short for question generation');
        return;
      }

      // Call the existing question generation API
      const response = await fetch('/api/questions/generate-from-timer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptText: combinedText,
          sessionId: session.id,
          meetingId: activeRoom?._id || 'default-room',
          timerDuration: session.duration,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`🕒 [TIMER] Questions generated successfully: ${result.questionsId}`);
        dispatch({ 
          type: 'SET_QUESTIONS_GENERATED', 
          sessionId: session.id, 
          questionsId: result.questionsId 
        });
      } else {
        throw new Error(`Failed to generate questions: ${response.statusText}`);
      }
    } catch (error) {
      console.error('🕒 [TIMER] Error generating questions:', error);
      dispatch({ type: 'SET_ERROR', error: 'Failed to generate questions for timer session' });
    }
  };

  // Context methods
  const setPreset = useCallback((preset: string) => {
    dispatch({ type: 'SET_PRESET', preset });
  }, []);

  const setCustomDuration = useCallback((hours: number, minutes: number) => {
    dispatch({ type: 'SET_CUSTOM_DURATION', hours, minutes });
  }, []);

  const startTimer = useCallback(() => {
    const duration = getDurationFromSelection();
    if (duration > 0) {
      dispatch({ type: 'START_TIMER', duration });
    } else {
      dispatch({ type: 'SET_ERROR', error: 'Please select a valid duration' });
    }
  }, [state.selectedPreset, state.customDuration]);

  const stopTimer = useCallback(() => {
    dispatch({ type: 'STOP_TIMER' });
  }, []);

  const resetTimer = useCallback(() => {
    console.log('🔄 [TIMER] Resetting timer and clearing all sessions');
    dispatch({ type: 'RESET_TIMER' });
    // Also clear all sessions when resetting
    dispatch({ type: 'CLEAR_SESSIONS' });
  }, []);

  const formatRemainingTime = useCallback((ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const getDurationFromSelection = useCallback((): number => {
    if (state.selectedPreset === 'custom') {
      return (state.customDuration.hours * 60 + state.customDuration.minutes) * 60 * 1000;
    } else if (state.selectedPreset) {
      const preset = TIMER_PRESETS.find(p => p.value === state.selectedPreset);
      return preset ? preset.minutes * 60 * 1000 : 0;
    }
    return 0;
  }, [state.selectedPreset, state.customDuration]);

  const isTimerActive = useCallback((): boolean => {
    return state.status === 'running';
  }, [state.status]);

  const canStartTimer = useCallback((): boolean => {
    return state.status === 'idle' && getDurationFromSelection() > 0 && globalAudioState.isRecording;
  }, [state.status, getDurationFromSelection, globalAudioState.isRecording]);

  const getCurrentSession = useCallback((): TimerSession | null => {
    return state.currentSession;
  }, [state.currentSession]);

  const getCompletedSessions = useCallback((): TimerSession[] => {
    return state.sessions.filter(s => s.status === 'completed');
  }, [state.sessions]);

  const markQuestionsGenerated = useCallback((sessionId: string, questionsId: string) => {
    dispatch({ type: 'SET_QUESTIONS_GENERATED', sessionId, questionsId });
  }, []);

  const setFloatingControlVisible = useCallback((show: boolean) => {
    dispatch({ type: 'SET_FLOATING_CONTROL', show });
  }, []);

  const setTimerControlsVisible = useCallback((visible: boolean) => {
    dispatch({ type: 'SET_TIMER_CONTROLS_VISIBLE', visible });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', error });
  }, []);

  const contextValue: TimerAudioContextType = {
    state,
    setPreset,
    setCustomDuration,
    startTimer,
    stopTimer,
    resetTimer,
    formatRemainingTime,
    getDurationFromSelection,
    isTimerActive,
    canStartTimer,
    getCurrentSession,
    getCompletedSessions,
    markQuestionsGenerated,
    setFloatingControlVisible,
    setTimerControlsVisible,
    setError,
  };

  return (
    <TimerAudioContext.Provider value={contextValue}>
      {children}
    </TimerAudioContext.Provider>
  );
};

export default TimerAudioContext;