import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { AudioStreamer } from '../utils/audioStreamer';
import type { TranscriptMessage } from '../utils/audioStreamer';
import { useAuth } from './AuthContext';
import { useTranscriptSegmentation } from '../hooks/useTranscriptSegmentation';
import { useAutoQuestions } from '../hooks/useAutoQuestions';

// Types
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

interface TimerState {
  isActive: boolean;
  durationSelected: number; // in milliseconds
  startTime: number | null;
  remainingTime: number;
  status: 'stopped' | 'running' | 'completed' | 'processing';
  combinedTranscript: string;
  sessionId: string | null;
  segmentCount: number;
  questionsGenerated: boolean; // Track if questions have been generated
}

interface GlobalAudioState {
  isRecording: boolean;
  isMuted: boolean;
  isConnected: boolean;
  status: 'stopped' | 'connecting' | 'connected' | 'recording' | 'paused' | 'error' | 'disconnected';
  transcriptLines: TranscriptLine[];
  audioStreamer: AudioStreamer | null;
  error: string | null;
  lastError: string | null;
  persistAcrossRoutes: boolean;
  // Segmentation and auto-questions state
  segmentationEnabled: boolean;
  autoQuestionsEnabled: boolean;
  segmentationState: SegmentationState;
  // Timer-based transcript state
  timerState: TimerState;
}

interface TranscriptLine {
  id: string;
  role: 'host' | 'participant' | 'guest';
  displayName?: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  startTime: number;
  endTime: number;
}

type GlobalAudioAction =
  | { type: 'SET_RECORDING'; payload: boolean }
  | { type: 'SET_MUTED'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_STATUS'; payload: GlobalAudioState['status'] }
  | { type: 'ADD_TRANSCRIPT'; payload: TranscriptLine }
  | { type: 'CLEAR_TRANSCRIPTS' }
  | { type: 'SET_AUDIO_STREAMER'; payload: AudioStreamer | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_ERROR'; payload: string }
  | { type: 'SET_PERSIST_ACROSS_ROUTES'; payload: boolean }
  | { type: 'SET_SEGMENTATION_ENABLED'; payload: boolean }
  | { type: 'SET_AUTO_QUESTIONS_ENABLED'; payload: boolean }
  | { type: 'UPDATE_SEGMENTATION_STATE'; payload: Partial<SegmentationState> }
  | { type: 'RESTORE_STATE'; payload: Partial<GlobalAudioState> }
  | { type: 'START_TIMER'; payload: { duration: number; sessionId: string } }
  | { type: 'UPDATE_TIMER'; payload: Partial<TimerState> }
  | { type: 'STOP_TIMER' }
  | { type: 'COMPLETE_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'ADD_TO_TIMER_TRANSCRIPT'; payload: string }
  | { type: 'INCREMENT_TIMER_SEGMENT_COUNT'; payload: { segmentNumber: number; message: string } }
  | { type: 'MARK_TIMER_QUESTIONS_GENERATED' };

interface GlobalAudioContextType {
  state: GlobalAudioState;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<void>;
  toggleMute: () => void;
  clearTranscripts: () => void;
  exportTranscripts: () => void;
  resetSession: () => Promise<boolean>;
  setPersistAcrossRoutes: (persist: boolean) => void;
  setSegmentationEnabled: (enabled: boolean) => void;
  setAutoQuestionsEnabled: (enabled: boolean) => void;
  // Timer-based methods
  startTimer: (duration: number) => Promise<boolean>;
  stopTimer: () => Promise<void>;
  getTimerStatus: () => TimerState;
  // Segment tracking for timer sessions
  onTimerSegmentSaved: (segmentNumber: number, transcriptText: string, message?: string) => void;
}

// Initial state
const initialState: GlobalAudioState = {
  isRecording: false,
  isMuted: false,
  isConnected: false,
  status: 'stopped',
  transcriptLines: [],
  audioStreamer: null,
  error: null,
  lastError: null,
  persistAcrossRoutes: true, // Default to persist
  segmentationEnabled: true, // Default to enable segmentation
  autoQuestionsEnabled: true, // Default to enable auto-questions
  segmentationState: {
    isCurrentlyPaused: false,
    pauseStartTime: null,
    currentPauseDuration: 0,
    segmentCount: 0,
    interimSegmentCount: 0,
    validSegmentCount: 0,
    timelineProgress: 0,
    remainingTime: 10000,
    hasReceivedTranscripts: false,
    waitingForSpeech: false,
  },
  timerState: {
    isActive: false,
    durationSelected: 0,
    startTime: null,
    remainingTime: 0,
    status: 'stopped',
    combinedTranscript: '',
    sessionId: null,
    segmentCount: 0,
    questionsGenerated: false,
  },
};

// Reducer
function globalAudioReducer(state: GlobalAudioState, action: GlobalAudioAction): GlobalAudioState {
  switch (action.type) {
    case 'SET_RECORDING':
      return { ...state, isRecording: action.payload };
    case 'SET_MUTED':
      return { ...state, isMuted: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'ADD_TRANSCRIPT':
      return {
        ...state,
        transcriptLines: state.transcriptLines.filter(line => line.isFinal || line.id !== action.payload.id)
          .concat([action.payload])
      };
    case 'CLEAR_TRANSCRIPTS':
      return { ...state, transcriptLines: [] };
    case 'SET_AUDIO_STREAMER':
      return { ...state, audioStreamer: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LAST_ERROR':
      return { ...state, lastError: action.payload };
    case 'SET_PERSIST_ACROSS_ROUTES':
      return { ...state, persistAcrossRoutes: action.payload };
    case 'SET_SEGMENTATION_ENABLED':
      return { ...state, segmentationEnabled: action.payload };
    case 'SET_AUTO_QUESTIONS_ENABLED':
      return { ...state, autoQuestionsEnabled: action.payload };
    case 'UPDATE_SEGMENTATION_STATE':
      return { 
        ...state, 
        segmentationState: { ...state.segmentationState, ...action.payload } 
      };
    case 'RESTORE_STATE':
      return { ...state, ...action.payload };
    case 'START_TIMER':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          isActive: true,
          durationSelected: action.payload.duration,
          startTime: Date.now(),
          remainingTime: action.payload.duration,
          status: 'running',
          sessionId: action.payload.sessionId,
          combinedTranscript: '',
          segmentCount: 0,
          questionsGenerated: false, // Reset questions generated flag
        }
      };
    case 'UPDATE_TIMER':
      return {
        ...state,
        timerState: { ...state.timerState, ...action.payload }
      };
    case 'STOP_TIMER':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          isActive: false,
          status: 'stopped',
          remainingTime: 0,
        }
      };
    case 'COMPLETE_TIMER':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          isActive: false,
          status: 'completed',
          remainingTime: 0,
        }
      };
    case 'RESET_TIMER':
      return {
        ...state,
        timerState: {
          isActive: false,
          durationSelected: 0,
          startTime: null,
          remainingTime: 0,
          status: 'stopped',
          combinedTranscript: '',
          sessionId: null,
          segmentCount: 0,
          questionsGenerated: false,
        }
      };
    case 'ADD_TO_TIMER_TRANSCRIPT':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          combinedTranscript: state.timerState.combinedTranscript + 
            (state.timerState.combinedTranscript ? ' ' : '') + action.payload,
          // DO NOT increment segmentCount here - only when segments are actually saved to database
        }
      };
    case 'INCREMENT_TIMER_SEGMENT_COUNT':
      console.log(`📈 [GlobalAudio] Timer segment saved to database:`, action.payload);
      return {
        ...state,
        timerState: {
          ...state.timerState,
          segmentCount: action.payload.segmentNumber,
        }
      };
    case 'MARK_TIMER_QUESTIONS_GENERATED':
      return {
        ...state,
        timerState: {
          ...state.timerState,
          questionsGenerated: true,
        }
      };
    default:
      return state;
  }
}

// Storage keys
const STORAGE_KEY = 'global-audio-state';
const TRANSCRIPTS_KEY = 'global-audio-transcripts';

// Context
const GlobalAudioContext = createContext<GlobalAudioContextType | undefined>(undefined);

// Provider
interface GlobalAudioProviderProps {
  children: ReactNode;
}

export const GlobalAudioProvider: React.FC<GlobalAudioProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(globalAudioReducer, initialState);
  const { user, activeRoom } = useAuth();

  // Handle when a segment is saved during a timer session
  const onTimerSegmentSaved = React.useCallback((segmentNumber: number, transcriptText: string, message?: string) => {
    if (state.timerState.isActive) {
      console.log(`🎯 [GlobalAudio] Timer session segment saved: ${segmentNumber}`);
      console.log(`📝 [GlobalAudio] Segment content (${transcriptText.length} chars):`, transcriptText.substring(0, 100) + '...');
      
      // Add the segment transcript to timer's combined transcript
      dispatch({ type: 'ADD_TO_TIMER_TRANSCRIPT', payload: transcriptText });
      
      // Update timer segment count
      dispatch({ 
        type: 'INCREMENT_TIMER_SEGMENT_COUNT', 
        payload: { 
          segmentNumber, 
          message: message || `Segment ${segmentNumber} saved during timer session` 
        } 
      });
      
      // Show detailed user feedback
      toast.success(`📝 Timer Segment ${segmentNumber} saved! (${transcriptText.length} chars collected)`, {
        duration: 4000,
        icon: '⏱️'
      });
      
      // Show progress update
      const newTotalLength = state.timerState.combinedTranscript.length + transcriptText.length;
      console.log(`📊 [GlobalAudio] Timer progress: ${segmentNumber} segments saved, ${newTotalLength} characters collected`);
      
      // Show milestone notifications
      if (segmentNumber % 3 === 0) { // Every 3rd segment
        toast(`🎯 Milestone: ${segmentNumber} segments collected during timer session!`, {
          duration: 3000,
          icon: '🏆'
        });
      }
    }
  }, [state.timerState.isActive, state.timerState.combinedTranscript.length]);

  // Prepare final transcripts for segmentation
  const finalTranscripts = React.useMemo(() => {
    const finalLines = state.transcriptLines
      .filter(line => line.isFinal && line.text.trim().length > 15) // Increase minimum length
      .sort((a, b) => a.timestamp - b.timestamp);

    // Advanced deduplication and cleaning
    const cleanedTranscripts = [];
    let lastProcessedText = '';
    
    // Helper function to calculate text similarity
    const calculateTextSimilarity = (text1: string, text2: string): number => {
      if (!text1 || !text2) return 0;
      const words1 = text1.split(' ');
      const words2 = text2.split(' ');
      const allWords = new Set([...words1, ...words2]);
      
      let commonWords = 0;
      for (const word of allWords) {
        if (words1.includes(word) && words2.includes(word)) {
          commonWords++;
        }
      }
      
      return allWords.size > 0 ? (2 * commonWords) / (words1.length + words2.length) : 0;
    };
    
    for (const line of finalLines) {
      // Clean and normalize the text
      let cleanText = line.text
        .trim()
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[^\w\s.,;:!?-]/g, '') // Remove special characters except punctuation
        .toLowerCase(); // Normalize case for comparison
      
      // Skip if text is too short or contains obvious errors
      if (cleanText.length < 20) continue;
      if (cleanText.includes('undefined') || cleanText.includes('null')) continue;
      
      // Check for substantial overlap with previous text
      if (lastProcessedText) {
        const similarity = calculateTextSimilarity(cleanText, lastProcessedText);
        if (similarity > 0.7) { // 70% similarity threshold
          console.log(`🚫 [GlobalAudio] Skipping similar text (${Math.round(similarity * 100)}% similar)`);
          continue;
        }
      }
      
      // Restore original casing for final text
      const finalText = line.text.trim().replace(/\s+/g, ' ');
      
      cleanedTranscripts.push({
        ...line,
        text: finalText
      });
      
      lastProcessedText = cleanText;
    }

    console.log(`🧹 [GlobalAudio] Advanced cleaning: ${finalLines.length} → ${cleanedTranscripts.length} transcripts`);
    return cleanedTranscripts;
  }, [state.transcriptLines]);

  // Use transcript segmentation hook (only when enabled and recording)
  const shouldSegment = state.segmentationEnabled && state.isRecording;
  
  // Use segmentation hook with memoized transcripts
  const segmentationHookState = useTranscriptSegmentation(
    activeRoom?._id || '',
    shouldSegment,
    finalTranscripts,
    10000, // 10 seconds pause threshold
    onTimerSegmentSaved // Pass the callback for timer segment tracking
  );

  // Update global segmentation state when hook state changes
  React.useEffect(() => {
    if (segmentationHookState?.segmentationState) {
      dispatch({ 
        type: 'UPDATE_SEGMENTATION_STATE', 
        payload: segmentationHookState.segmentationState 
      });
    }
  }, [segmentationHookState?.segmentationState]);

  // Use auto-questions hook
  useAutoQuestions({
    meetingId: activeRoom?._id || '',
    enabled: state.autoQuestionsEnabled && state.isRecording
  });

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      const savedTranscripts = localStorage.getItem(TRANSCRIPTS_KEY);
      
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'RESTORE_STATE', payload: parsedState });
        console.log('🔄 [GlobalAudio] Restored audio state from localStorage');
      }
      
      if (savedTranscripts) {
        const parsedTranscripts = JSON.parse(savedTranscripts);
        dispatch({ type: 'RESTORE_STATE', payload: { transcriptLines: parsedTranscripts } });
        console.log(`📋 [GlobalAudio] Restored ${parsedTranscripts.length} transcripts from localStorage`);
      }
    } catch (error) {
      console.warn('⚠️ [GlobalAudio] Failed to restore state from localStorage:', error);
    }
  }, []);

  // Persist state to localStorage when it changes
  useEffect(() => {
    if (state.persistAcrossRoutes) {
      try {
        const stateToSave = {
          isRecording: state.isRecording,
          isMuted: state.isMuted,
          isConnected: state.isConnected,
          status: state.status,
          persistAcrossRoutes: state.persistAcrossRoutes,
          segmentationEnabled: state.segmentationEnabled,
          autoQuestionsEnabled: state.autoQuestionsEnabled,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        localStorage.setItem(TRANSCRIPTS_KEY, JSON.stringify(state.transcriptLines));
        console.log('💾 [GlobalAudio] Persisted audio state to localStorage');
      } catch (error) {
        console.warn('⚠️ [GlobalAudio] Failed to persist state to localStorage:', error);
      }
    }
  }, [state, state.persistAcrossRoutes]);

  // Initialize AudioStreamer when user and room are available
  useEffect(() => {
    if (!user || !activeRoom || state.audioStreamer) return;

    console.log('🔄 [GlobalAudio] Initializing AudioStreamer for room:', activeRoom._id);

    const getWebSocketUrl = () => {
      const backendUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      return backendUrl.replace(/^https?:/, backendUrl.startsWith('https:') ? 'wss:' : 'ws:') + '/ws/asr';
    };

    const audioStreamer = new AudioStreamer(
      getWebSocketUrl(),
      activeRoom._id,
      user.id,
      user.role === 'host' ? 'host' : 'participant'
    );

    audioStreamer.setCallbacks({
      onTranscript: (message: TranscriptMessage) => {
        console.log('📝 [GlobalAudio] Received transcript:', message);
        
        // Filter out system messages
        const isSystemMessage = 
          !message.text || 
          message.text.includes('ASR system connected') ||
          message.text.includes('[Speech detected') ||
          message.text.includes('[Speech recognition') ||
          message.text.includes('[Speech Error:') ||
          message.text.includes('[Fallback]') ||
          message.text.match(/^\[.*\]$/) ||
          message.text.trim().length < 3;

        if (isSystemMessage) {
          console.log('🚫 [GlobalAudio] Filtered out system message:', message.text);
          return;
        }

        const newLine: TranscriptLine = {
          id: `${message.timestamp}-${Math.random()}`,
          role: message.role,
          displayName: message.displayName,
          text: message.text,
          timestamp: message.timestamp,
          isFinal: message.type === 'final',
          startTime: message.startTime,
          endTime: message.endTime
        };

        dispatch({ type: 'ADD_TRANSCRIPT', payload: newLine });

        // If timer is active and this is a final transcript, add to combined transcript
        if (state.timerState.isActive && message.type === 'final' && message.text.trim().length > 10) {
          console.log('⏱️ [GlobalAudio] Adding to timer transcript:', message.text);
          console.log('⏱️ [GlobalAudio] Current timer state:', {
            isActive: state.timerState.isActive,
            sessionId: state.timerState.sessionId,
            segmentCount: state.timerState.segmentCount,
            currentTranscriptLength: state.timerState.combinedTranscript.length
          });
          
          // Show periodic status updates (every 5th transcript)
          const newLength = state.timerState.combinedTranscript.length + message.text.length;
          if (newLength > 0 && newLength % 200 === 0) { // Every ~200 characters
            toast(`📝 Timer collecting: ${Math.floor(newLength / 100)} segments of text captured`, {
              duration: 2000,
              icon: '⏱️'
            });
          }
          
          dispatch({ type: 'ADD_TO_TIMER_TRANSCRIPT', payload: message.text });
        }
      },
      
      onStatusChange: (newStatus) => {
        console.log('🔄 [GlobalAudio] Status change:', newStatus);
        dispatch({ type: 'SET_STATUS', payload: newStatus as GlobalAudioState['status'] });
        dispatch({ type: 'SET_CONNECTED', payload: newStatus === 'connected' || newStatus === 'recording' });
      },
      
      onError: (error) => {
        console.error('❌ [GlobalAudio] Error:', error);
        dispatch({ type: 'SET_ERROR', payload: error });
        dispatch({ type: 'SET_LAST_ERROR', payload: error });
      }
    });

    dispatch({ type: 'SET_AUDIO_STREAMER', payload: audioStreamer });

    return () => {
      console.log('🧹 [GlobalAudio] Cleaning up AudioStreamer');
      if (state.persistAcrossRoutes && state.isRecording) {
        console.log('💾 [GlobalAudio] Preserving recording session across route change');
        // Don't cleanup if we're persisting across routes and recording
        return;
      }
      audioStreamer.cleanup();
    };
  }, [user, activeRoom, state.audioStreamer, state.persistAcrossRoutes, state.isRecording]);

  // Timer countdown effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (state.timerState.isActive && state.timerState.status === 'running') {
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsed = now - (state.timerState.startTime || now);
        const remaining = Math.max(0, state.timerState.durationSelected - elapsed);

        if (remaining <= 0) {
          // Timer completed
          console.log('⏰ [GlobalAudio] Timer reached end!');
          dispatch({ type: 'COMPLETE_TIMER' });
        } else {
          // Update remaining time
          dispatch({ 
            type: 'UPDATE_TIMER', 
            payload: { remainingTime: remaining } 
          });
        }
      }, 1000); // Update every second
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [state.timerState.isActive, state.timerState.status, state.timerState.startTime, state.timerState.durationSelected]);

  // Handle timer completion with delay to allow final segment save
  useEffect(() => {
    // Debug logging to understand the current state
    console.log('🔍 [GlobalAudio] Timer completion useEffect triggered:', {
      status: state.timerState.status,
      isActive: state.timerState.isActive,
      questionsGenerated: state.timerState.questionsGenerated,
      hasTranscript: !!state.timerState.combinedTranscript.trim(),
      transcriptLength: state.timerState.combinedTranscript.length,
      sessionId: state.timerState.sessionId
    });

    if (state.timerState.status === 'completed' && 
        !state.timerState.isActive && 
        !state.timerState.questionsGenerated) { // Only proceed if questions haven't been generated yet
      
      console.log('⏰ [GlobalAudio] Timer completed - waiting for final segment...');
      
      const timeoutId = setTimeout(() => {
        console.log('⏰ [GlobalAudio] Timer completion after delay!');
        console.log('⏰ [GlobalAudio] Final timer state:', {
          combinedTranscript: state.timerState.combinedTranscript,
          transcriptLength: state.timerState.combinedTranscript.length,
          segmentCount: state.timerState.segmentCount,
          actualSegmentCount: state.segmentationState.segmentCount,
          sessionId: state.timerState.sessionId,
          questionsGenerated: state.timerState.questionsGenerated
        });
        
        // Show timer completion notification - use segmentation count for accuracy
        const actualSegmentCount = state.segmentationState.segmentCount;
        toast.success(`⏰ Timer Completed! Collected ${actualSegmentCount} segments`, {
          duration: 5000,
          icon: '✅'
        });
        
        // Check if we have transcript content to save
        if (state.timerState.combinedTranscript.trim()) {
          // Save combined transcript and trigger question generation
          console.log('💾 [GlobalAudio] Timer has transcript - calling saveTimerTranscript...');
          
          // Show processing notification - use segmentation count for accuracy  
          toast(`🔄 Processing timer session: Combining ${actualSegmentCount} segments into whole transcript...`, {
            duration: 4000,
            icon: '⚡'
          });
          
          // Call saveTimerTranscript without marking questions as generated yet
          // The flag will be set inside saveTimerTranscript after successful question generation
          saveTimerTranscript('completed');
        } else {
          console.warn('⚠️ [GlobalAudio] Timer completed but no transcript to save!');
          toast.error('⚠️ Timer completed but no transcript was collected. Please try recording again.', {
            duration: 5000
          });
          // Still mark as processed to prevent infinite retries
          dispatch({ 
            type: 'UPDATE_TIMER', 
            payload: { questionsGenerated: true } 
          });
        }
      }, 2000); // 2 second delay to allow final segment save to complete
      
      return () => clearTimeout(timeoutId);
    } else if (state.timerState.status === 'completed' && state.timerState.questionsGenerated) {
      // Timer completed and questions already generated - reset after a delay
      console.log('✅ [GlobalAudio] Timer completed and questions generated - scheduling reset...');
      
      const resetTimeoutId = setTimeout(() => {
        console.log('🔄 [GlobalAudio] Resetting timer state after completion...');
        dispatch({ type: 'RESET_TIMER' });
        toast.success('Timer session completed and reset. Ready for new timer!', {
          duration: 3000,
          icon: '🔄'
        });
      }, 5000); // Reset after 5 seconds
      
      return () => clearTimeout(resetTimeoutId);
    }
  }, [
    state.timerState.status, 
    state.timerState.isActive, 
    state.timerState.combinedTranscript, 
    state.timerState.questionsGenerated,
    state.segmentationState.segmentCount
  ]);

  // Reset timer when session resets
  useEffect(() => {
    if (!state.isRecording && state.timerState.isActive) {
      console.log('🔄 [GlobalAudio] Session stopped - resetting timer');
      dispatch({ type: 'RESET_TIMER' });
    }
  }, [state.isRecording, state.timerState.isActive]);

  // Start recording
  const startRecording = async (): Promise<boolean> => {
    if (!state.audioStreamer) {
      dispatch({ type: 'SET_ERROR', payload: 'Audio system not initialized' });
      return false;
    }

    try {
      dispatch({ type: 'SET_STATUS', payload: 'connecting' });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Initialize audio
      const audioInitialized = await state.audioStreamer.initializeSimpleMicrophoneAudio();
      if (!audioInitialized) {
        throw new Error('Audio initialization failed');
      }

      // Start recording
      const recordingStarted = await state.audioStreamer.startRecording();
      if (recordingStarted) {
        dispatch({ type: 'SET_RECORDING', payload: true });
        dispatch({ type: 'SET_STATUS', payload: 'recording' });
        console.log('✅ [GlobalAudio] Recording started successfully');
        return true;
      } else {
        throw new Error('Recording failed to start');
      }
    } catch (error) {
      console.error('❌ [GlobalAudio] Failed to start recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_STATUS', payload: 'error' });
      return false;
    }
  };

  // Stop recording with enhanced session cleanup
  const stopRecording = async (): Promise<void> => {
    if (!state.audioStreamer) return;

    try {
      console.log('🛑 [GlobalAudio] Stopping recording and resetting session...');
      
      // Use comprehensive session reset for clean stop
      await resetSession();
      
      console.log('✅ [GlobalAudio] Recording stopped and session completely reset');
    } catch (error) {
      console.error('❌ [GlobalAudio] Failed to stop recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Even if there's an error, reset the UI state
      dispatch({ type: 'SET_RECORDING', payload: false });
      dispatch({ type: 'SET_STATUS', payload: 'stopped' });
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (!state.audioStreamer) return;

    if (state.isMuted) {
      state.audioStreamer.resumeSpeechRecognition();
      dispatch({ type: 'SET_MUTED', payload: false });
      console.log('🎤 [GlobalAudio] Unmuted');
    } else {
      state.audioStreamer.pauseSpeechRecognition();
      dispatch({ type: 'SET_MUTED', payload: true });
      console.log('🔇 [GlobalAudio] Muted');
    }
  };

  // Clear transcripts
  const clearTranscripts = () => {
    dispatch({ type: 'CLEAR_TRANSCRIPTS' });
    try {
      localStorage.removeItem(TRANSCRIPTS_KEY);
    } catch (error) {
      console.warn('⚠️ [GlobalAudio] Failed to clear transcripts from localStorage:', error);
    }
    console.log('🗑️ [GlobalAudio] Transcripts cleared');
  };

  // Export transcripts
  const exportTranscripts = () => {
    if (state.transcriptLines.length === 0) {
      console.warn('⚠️ [GlobalAudio] No transcripts to export');
      return;
    }

    const formatTimestamp = (timestamp: number) => {
      return new Date(timestamp).toLocaleString();
    };

    const transcriptContent = state.transcriptLines
      .filter(line => line.isFinal)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(line => {
        const roleLabel = line.role === 'host' ? 'HOST' : 
                         line.role === 'guest' ? 'GUEST' : 'PARTICIPANT';
        return `[${formatTimestamp(line.timestamp)}] ${roleLabel}: ${line.text}`;
      })
      .join('\n\n');

    if (!transcriptContent.trim()) {
      console.warn('⚠️ [GlobalAudio] No final transcripts available to export');
      return;
    }

    const blob = new Blob([transcriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-session-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📤 [GlobalAudio] Transcripts exported successfully');
  };

  // Complete session reset - stops recording, clears all state, resets segment counters
  const resetSession = async () => {
    console.log('🔄 [GlobalAudio] Starting complete session reset...');

    try {
      // Step 1: Stop recording if active
      if (state.isRecording && state.audioStreamer) {
        console.log('🛑 [GlobalAudio] Stopping active recording...');
        await state.audioStreamer.stopRecording();
      }

      // Step 2: Cleanup audio resources completely
      if (state.audioStreamer) {
        console.log('🧹 [GlobalAudio] Cleaning up audio streamer...');
        state.audioStreamer.cleanup();
      }

      // Step 3: Reset all audio state
      dispatch({ type: 'SET_RECORDING', payload: false });
      dispatch({ type: 'SET_STATUS', payload: 'stopped' });
      dispatch({ type: 'SET_CONNECTED', payload: false });
      dispatch({ type: 'SET_MUTED', payload: false });
      dispatch({ type: 'SET_AUDIO_STREAMER', payload: null });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Step 4: Clear all transcripts
      dispatch({ type: 'CLEAR_TRANSCRIPTS' });
      
      // Step 5: Reset segmentation state to start from Segment 1
      dispatch({ 
        type: 'UPDATE_SEGMENTATION_STATE', 
        payload: {
          isCurrentlyPaused: false,
          pauseStartTime: null,
          currentPauseDuration: 0,
          segmentCount: 0, // Reset to 0 so next segment will be 1
          interimSegmentCount: 0,
          validSegmentCount: 0,
          timelineProgress: 0,
          remainingTime: 10000,
          hasReceivedTranscripts: false,
          waitingForSpeech: false,
        }
      });

      // Step 5.5: Reset timer state completely
      dispatch({ type: 'RESET_TIMER' });
      console.log('⏱️ [GlobalAudio] Timer state reset');

      // Step 6: Clear all localStorage data
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TRANSCRIPTS_KEY);
        // Clear any session-specific audio storage
        const audioKeys = Object.keys(localStorage).filter(key => 
          key.includes('audioCapture_') || 
          key.includes('-status') ||
          key.includes('transcript_')
        );
        audioKeys.forEach(key => localStorage.removeItem(key));
        console.log('🗑️ [GlobalAudio] Cleared all session storage');
      } catch (error) {
        console.warn('⚠️ [GlobalAudio] Failed to clear localStorage:', error);
      }

      // Step 7: Force a small delay to ensure all cleanup is processed
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('✅ [GlobalAudio] Complete session reset successful - ready for fresh session');
      return true;

    } catch (error) {
      console.error('❌ [GlobalAudio] Session reset failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Session reset failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return false;
    }
  };

  // Set persist across routes
  const setPersistAcrossRoutes = (persist: boolean) => {
    dispatch({ type: 'SET_PERSIST_ACROSS_ROUTES', payload: persist });
    console.log(`🔄 [GlobalAudio] Persist across routes ${persist ? 'enabled' : 'disabled'}`);
  };

  // Set segmentation enabled
  const setSegmentationEnabled = (enabled: boolean) => {
    dispatch({ type: 'SET_SEGMENTATION_ENABLED', payload: enabled });
    console.log(`🔄 [GlobalAudio] Segmentation ${enabled ? 'enabled' : 'disabled'}`);
  };

  // Set auto-questions enabled
  const setAutoQuestionsEnabled = (enabled: boolean) => {
    dispatch({ type: 'SET_AUTO_QUESTIONS_ENABLED', payload: enabled });
    console.log(`🔄 [GlobalAudio] Auto-questions ${enabled ? 'enabled' : 'disabled'}`);
  };

  // Timer-based transcript methods
  const startTimer = async (duration: number): Promise<boolean> => {
    try {
      console.log(`⏱️ [GlobalAudio] Starting timer for ${duration}ms`);
      
      // Show user notification for timer start
      toast(`⏱️ Timer Started: ${duration / 1000 / 60} minutes`, {
        duration: 4000,
        icon: '🚀'
      });
      
      // Generate a unique session ID for this timer session
      const sessionId = `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🆔 [GlobalAudio] Generated timer session ID: ${sessionId}`);
      
      // Start the timer
      dispatch({ 
        type: 'START_TIMER', 
        payload: { duration, sessionId } 
      });
      
      // Show configuration status
      toast(`📊 Timer Configuration: Session ${sessionId.split('_')[1]} ready for segment tracking`, {
        duration: 3000,
        icon: '⚙️'
      });

      // Start recording if not already recording
      if (!state.isRecording) {
        console.log(`🎤 [GlobalAudio] Starting recording for timer session...`);
        toast(`🎤 Starting audio recording for timer session...`, {
          duration: 3000,
          icon: '🔴'
        });
        
        const recordingStarted = await startRecording();
        if (!recordingStarted) {
          console.error(`❌ [GlobalAudio] Failed to start recording for timer`);
          toast.error(`❌ Failed to start recording for timer session`, { duration: 4000 });
          dispatch({ type: 'STOP_TIMER' });
          return false;
        }
        
        console.log(`✅ [GlobalAudio] Recording started successfully for timer`);
        toast.success(`✅ Recording active - Timer session is collecting transcripts`, {
          duration: 4000,
          icon: '🎙️'
        });
      } else {
        console.log(`🎤 [GlobalAudio] Recording already active - timer will use existing session`);
        toast(`🎤 Using existing recording session for timer`, {
          duration: 3000,
          icon: '🔄'
        });
      }

      console.log(`✅ [GlobalAudio] Timer started successfully with session ID: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ [GlobalAudio] Failed to start timer:', error);
      dispatch({ type: 'STOP_TIMER' });
      return false;
    }
  };

  const stopTimer = async (): Promise<void> => {
    try {
      console.log('🛑 [GlobalAudio] Stopping timer...');
      
      if (state.timerState.isActive) {
        // Mark timer as stopped
        dispatch({ type: 'STOP_TIMER' });
        
        // Save the current combined transcript if any
        if (state.timerState.combinedTranscript.trim()) {
          await saveTimerTranscript('stopped');
        }
      }
      
      console.log('✅ [GlobalAudio] Timer stopped successfully');
    } catch (error) {
      console.error('❌ [GlobalAudio] Failed to stop timer:', error);
    }
  };

  const getTimerStatus = (): TimerState => {
    return state.timerState;
  };

  // Helper function to save timer transcript to backend
  const saveTimerTranscript = async (status: 'completed' | 'stopped') => {
    let savingToast: string | undefined;
    
    try {
      console.log('🚀 [GlobalAudio] saveTimerTranscript called with status:', status);
      console.log('🚀 [GlobalAudio] Current timer state:', {
        sessionId: state.timerState.sessionId,
        combinedTranscript: state.timerState.combinedTranscript,
        transcriptLength: state.timerState.combinedTranscript.length,
        segmentCount: state.timerState.segmentCount,
        userId: user?.id,
        roomId: activeRoom?._id
      });

      if (!state.timerState.sessionId || !state.timerState.combinedTranscript.trim()) {
        console.warn('⚠️ [GlobalAudio] No timer session or transcript to save');
        console.warn('⚠️ [GlobalAudio] SessionId:', state.timerState.sessionId);
        console.warn('⚠️ [GlobalAudio] Transcript length:', state.timerState.combinedTranscript.length);
        toast('⚠️ No timer transcript to save', { duration: 3000, icon: '⚠️' });
        return;
      }

      // Show user notification that we're saving
      savingToast = toast.loading('📝 Combining and saving timer transcript...');

      const timerData = {
        sessionId: state.timerState.sessionId,
        hostId: user?.id || 'unknown',
        roomId: activeRoom?._id,
        startTime: new Date(state.timerState.startTime || Date.now()),
        endTime: new Date(),
        durationSelected: state.timerState.durationSelected,
        combinedTranscript: state.timerState.combinedTranscript,
        status: status,
        segmentCount: state.segmentationState.segmentCount, // Use actual segment count from segmentation
      };

      console.log('💾 [GlobalAudio] Saving timer transcript to backend...');
      
      // Import apiService dynamically to avoid circular imports
      const { apiService } = await import('../utils/api');
      const response = await apiService.saveTimerTranscript(timerData);
      
      console.log('✅ [GlobalAudio] Timer transcript saved:', response.data);
      
      // Show success notification - use actual segment count
      toast.success(`✅ Timer transcript saved! Combined ${state.segmentationState.segmentCount} segments (${state.timerState.combinedTranscript.length} characters)`, {
        id: savingToast,
        duration: 4000
      });
      
      // If completed, trigger question generation
      if (status === 'completed' && response.data?.data?.id && !state.timerState.questionsGenerated) {
        console.log('🤖 [GlobalAudio] Timer completed - triggering question generation...');
        console.log('🤖 [GlobalAudio] Timer transcript ID:', response.data.data.id);
        console.log('🤖 [GlobalAudio] Questions generated flag:', state.timerState.questionsGenerated);
        
        // Show user notification for question generation
        const questionToast = toast.loading('🤖 Generating questions from timer transcript...');
        
        try {
          const questionsResponse = await apiService.generateTimerQuestions(response.data.data.id);
          console.log('✅ [GlobalAudio] Timer questions generated:', questionsResponse.data);
          
          // Validate the response has questions
          const questions = questionsResponse.data?.data?.questions;
          if (questions && Array.isArray(questions) && questions.length > 0) {
            console.log(`✅ [GlobalAudio] Successfully generated ${questions.length} questions`);
            
            // Update timer state to completed with questions generated
            dispatch({ 
              type: 'UPDATE_TIMER', 
              payload: { 
                status: 'completed',
                questionsGenerated: true 
              } 
            });
            
            // Show success notification for questions
            toast.success(`🎯 Questions generated! Created ${questions.length} questions from timer session`, {
              id: questionToast,
              duration: 5000
            });
            
            // Emit event for AI Questions page to refresh
            if (window.dispatchEvent) {
              console.log('📡 [GlobalAudio] Emitting timerQuestionsGenerated event');
              window.dispatchEvent(new CustomEvent('timerQuestionsGenerated', {
                detail: {
                  questions: questions,
                  timerTranscriptId: response.data.data.id,
                  sessionId: state.timerState.sessionId
                }
              }));
            }
          } else {
            console.warn('⚠️ [GlobalAudio] Question generation returned empty or invalid response:', questionsResponse.data);
            throw new Error('No questions generated from transcript');
          }
          
        } catch (questionError) {
          console.error('❌ [GlobalAudio] Failed to generate timer questions:', questionError);
          dispatch({ 
            type: 'UPDATE_TIMER', 
            payload: { 
              status: 'completed',
              questionsGenerated: true // Still mark as generated to prevent retries
            } 
          });
          
          // Show error notification for question generation
          toast.error('❌ Failed to generate questions from timer transcript. Please check AI Questions page later.', {
            id: questionToast,
            duration: 6000
          });
        }
      } else if (status === 'completed' && state.timerState.questionsGenerated) {
        console.log('ℹ️ [GlobalAudio] Questions already generated for this timer session, skipping...');
      } else if (status === 'completed' && !response.data?.data?.id) {
        console.error('❌ [GlobalAudio] No timer transcript ID returned from save operation');
        toast.error('❌ Failed to save timer transcript - no ID returned', { duration: 4000 });
      }
      
    } catch (error) {
      console.error('❌ [GlobalAudio] Failed to save timer transcript:', error);
      dispatch({ type: 'UPDATE_TIMER', payload: { status: 'completed' } });
      
      // Show error notification for transcript saving
      const errorToastOptions: any = {
        duration: 8000
      };
      if (savingToast) {
        errorToastOptions.id = savingToast;
      }
      
      toast.error('❌ Failed to save timer transcript to database. Please try again or check the Admin Panel.', errorToastOptions);
    }
  };

  const contextValue: GlobalAudioContextType = {
    state,
    startRecording,
    stopRecording,
    toggleMute,
    clearTranscripts,
    exportTranscripts,
    resetSession,
    setPersistAcrossRoutes,
    setSegmentationEnabled,
    setAutoQuestionsEnabled,
    startTimer,
    stopTimer,
    getTimerStatus,
    onTimerSegmentSaved,
  };

  return (
    <GlobalAudioContext.Provider value={contextValue}>
      {children}
    </GlobalAudioContext.Provider>
  );
};

// Hook
export const useGlobalAudio = () => {
  const context = useContext(GlobalAudioContext);
  if (context === undefined) {
    throw new Error('useGlobalAudio must be used within a GlobalAudioProvider');
  }
  return context;
};

export default GlobalAudioContext;
