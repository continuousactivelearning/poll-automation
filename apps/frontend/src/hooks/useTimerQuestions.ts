import { useState, useEffect, useCallback } from 'react';
import { useGlobalAudio } from '../contexts/GlobalAudioContext';
import { apiService } from '../utils/api';

export interface TimerQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  explanation: string;
  points: number;
  source?: 'timer-transcript';
  generatedAt?: string;
  transcriptLength?: number;
}

export interface TimerQuestionSet {
  _id: string;
  sessionId: string;
  questions: TimerQuestion[];
  summary?: string;
  generatedAt: string;
  status: string;
  timerSession?: {
    sessionId: string;
    duration: number;
    transcriptCount: number;
    segmentCount: number;
    combinedTranscript: string;
  };
}

export const useTimerQuestions = (roomId: string) => {
  const [timerQuestions, setTimerQuestions] = useState<TimerQuestionSet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state } = useGlobalAudio();

  // Fetch timer-based questions from backend
  const fetchTimerQuestions = useCallback(async () => {
    if (!roomId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`📋 [TIMER-QUESTIONS] Fetching timer questions for room: ${roomId}`);
      
      // Get timer transcripts with generated questions for this room
      const response = await apiService.getTimerTranscriptsWithQuestions(roomId);
      
      if (response.data.success && response.data.data) {
        const timerQuestionSets = response.data.data;
        console.log(`📋 [TIMER-QUESTIONS] Found ${timerQuestionSets.length} timer question sets`);
        
        setTimerQuestions(timerQuestionSets);
      } else {
        console.log('📋 [TIMER-QUESTIONS] No timer questions found');
        setTimerQuestions([]);
      }
    } catch (err) {
      console.error('❌ [TIMER-QUESTIONS] Error fetching timer questions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setTimerQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  // Initial fetch
  useEffect(() => {
    fetchTimerQuestions();
  }, [fetchTimerQuestions]);

  // Listen for timer completion events
  useEffect(() => {
    const handleTimerQuestionsGenerated = (event: CustomEvent) => {
      console.log('🔄 [TIMER-QUESTIONS] Timer questions generated event received');
      
      // Add the new questions to state
      const { questions, timerTranscriptId, sessionId } = event.detail;
      
      const newQuestionSet: TimerQuestionSet = {
        _id: timerTranscriptId,
        sessionId: sessionId,
        questions: questions,
        summary: `Timer session completed`,
        generatedAt: new Date().toISOString(),
        status: 'completed',
        timerSession: {
          sessionId: sessionId,
          duration: state.timerState.durationSelected,
          transcriptCount: 1,
          segmentCount: state.timerState.segmentCount,
          combinedTranscript: state.timerState.combinedTranscript
        }
      };
      
      setTimerQuestions(prev => [newQuestionSet, ...prev]);
    };

    window.addEventListener('timerQuestionsGenerated', handleTimerQuestionsGenerated as EventListener);
    
    return () => {
      window.removeEventListener('timerQuestionsGenerated', handleTimerQuestionsGenerated as EventListener);
    };
  }, [state.timerState]);

  // Refresh questions manually
  const refreshQuestions = useCallback(() => {
    fetchTimerQuestions();
  }, [fetchTimerQuestions]);

  // Get total question count across all timer sessions
  const getTotalTimerQuestionCount = useCallback(() => {
    return timerQuestions.reduce((total, set) => total + set.questions.length, 0);
  }, [timerQuestions]);

  // Clear questions from UI (doesn't delete from backend)
  const clearTimerQuestions = useCallback(() => {
    setTimerQuestions([]);
    console.log('🧹 [TIMER-QUESTIONS] Cleared timer questions from UI');
  }, []);

  return {
    timerQuestions,
    isLoading,
    error,
    refreshQuestions,
    getTotalTimerQuestionCount,
    clearTimerQuestions,
  };
};

export default useTimerQuestions;