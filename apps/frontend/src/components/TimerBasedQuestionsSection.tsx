import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Play, 
  Trash2, 
  RefreshCw,
  Clock,
  Brain,
  Target
} from 'lucide-react';
import GlassCard from './GlassCard';
import { apiService } from '../utils/api';
import { toast } from 'react-hot-toast';

interface TimerQuestion {
  id: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'SHORT';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options?: string[];
  correctAnswer: string;
  correctIndex?: number;
  explanation: string;
  points: number;
  source: string;
  isTimerBased: boolean;
  createdAt: string;
}

interface TimerQuestionSet {
  _id: string;
  sessionId: string;
  questions: TimerQuestion[];
  summary: string;
  generatedAt: string;
  status: string;
  segmentNumber: number;
  timerSession: {
    sessionId: string;
    duration: number;
    transcriptCount: number;
    segmentCount: number;
    combinedTranscript: string;
  };
}

interface TimerBasedQuestionsSectionProps {
  roomId: string;
  onLaunchQuestion?: (question: TimerQuestion) => void;
}

const TimerBasedQuestionsSection: React.FC<TimerBasedQuestionsSectionProps> = ({
  roomId,
  onLaunchQuestion
}) => {
  const [timerQuestions, setTimerQuestions] = useState<TimerQuestionSet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch creative timer questions from backend
  const fetchTimerQuestions = useCallback(async () => {
    if (!roomId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🎯 [TIMER-QUESTIONS-UI] Fetching creative timer questions for room: ${roomId}`);
      
      const response = await apiService.getCreativeTimerQuestions(roomId);
      
      if (response.data.success && response.data.data) {
        const questionSets = response.data.data;
        console.log(`🎯 [TIMER-QUESTIONS-UI] Found ${questionSets.length} timer question sets`);
        console.log(`🎯 [TIMER-QUESTIONS-UI] Total questions: ${response.data.totalQuestions}`);
        
        setTimerQuestions(questionSets);
        
        if (questionSets.length > 0) {
          toast.success(`🎯 Found ${response.data.totalQuestions} creative timer questions!`, {
            duration: 3000,
            icon: '🕒'
          });
        }
      } else {
        console.log('🎯 [TIMER-QUESTIONS-UI] No timer questions found');
        setTimerQuestions([]);
      }
    } catch (err) {
      console.error('❌ [TIMER-QUESTIONS-UI] Error fetching timer questions:', err);
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
    const handleTimerQuestionsGenerated = () => {
      console.log('🔄 [TIMER-QUESTIONS-UI] Timer questions generated event received');
      
      // Refresh questions after new generation
      setTimeout(() => {
        fetchTimerQuestions();
      }, 1000);
    };

    window.addEventListener('timerQuestionsGenerated', handleTimerQuestionsGenerated as EventListener);
    
    return () => {
      window.removeEventListener('timerQuestionsGenerated', handleTimerQuestionsGenerated as EventListener);
    };
  }, [fetchTimerQuestions]);

  // Get total question count
  const getTotalQuestionCount = useCallback(() => {
    return timerQuestions.reduce((total, set) => total + set.questions.length, 0);
  }, [timerQuestions]);

  // Clear questions from UI
  const clearTimerQuestions = useCallback(() => {
    setTimerQuestions([]);
    toast.success('🧹 Cleared timer questions from UI', { duration: 3000 });
  }, []);

  // Handle question launch - Convert timer question to format expected by launchQuestion
  const handleLaunchQuestion = (question: TimerQuestion) => {
    if (onLaunchQuestion) {
      // Convert timer question format to the format expected by launchQuestion function
      let correctIndex = question.correctIndex;
      
      // If correctIndex is not available, try to calculate it from correctAnswer and options
      if (correctIndex === undefined && question.options && question.correctAnswer) {
        if (question.type === 'MCQ') {
          // Find the index of the correct answer in the options array
          correctIndex = question.options.findIndex(option => 
            option.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
          );
          
          // If not found by exact match, try to parse as letter (A, B, C, D)
          if (correctIndex === -1) {
            const letterToIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
            const answerLetter = question.correctAnswer.toUpperCase().trim();
            correctIndex = letterToIndex[answerLetter as keyof typeof letterToIndex];
          }
          
          // If still not found, try to parse as number
          if (correctIndex === undefined || correctIndex === -1) {
            const answerNum = parseInt(question.correctAnswer) - 1; // Convert 1-based to 0-based
            if (answerNum >= 0 && answerNum < question.options.length) {
              correctIndex = answerNum;
            }
          }
          
          console.log('🔍 [TIMER-LAUNCH] Calculated correctIndex:', {
            correctAnswer: question.correctAnswer,
            options: question.options,
            calculatedIndex: correctIndex
          });
        } else if (question.type === 'TRUE_FALSE') {
          // For true/false questions, convert string answer to index
          const answer = question.correctAnswer.toLowerCase().trim();
          correctIndex = (answer === 'true' || answer === '1') ? 0 : 1;
          
          console.log('🔍 [TIMER-LAUNCH] TRUE_FALSE question correctIndex:', {
            correctAnswer: question.correctAnswer,
            normalizedAnswer: answer,
            calculatedIndex: correctIndex
          });
        }
      }
      
      const convertedQuestion = {
        id: question.id,
        type: question.type === 'MCQ' ? 'multiple_choice' : 
              question.type === 'TRUE_FALSE' ? 'true_false' : 'short_answer',
        difficulty: question.difficulty,
        questionText: question.questionText || question.question, // Handle both field names
        options: question.options,
        correctAnswer: question.correctAnswer,
        correctIndex: correctIndex,
        explanation: question.explanation,
        points: question.points
      };
      
      console.log('🚀 [TIMER-LAUNCH] Converting timer question for launch:', {
        original: question,
        converted: convertedQuestion
      });
      
      onLaunchQuestion(convertedQuestion);
    } else {
      console.error('❌ [TIMER-LAUNCH] Question launch handler not available');
      toast.error('Question launch handler not available');
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Get type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'MCQ': return 'bg-blue-500/20 text-blue-300';
      case 'TRUE_FALSE': return 'bg-purple-500/20 text-purple-300';
      case 'SHORT': return 'bg-orange-500/20 text-orange-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (timerQuestions.length === 0 && !isLoading && !error) {
    return null; // Don't show section if no questions
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🕒 Timer-Based Questions
              <span className="text-sm bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">
                CREATIVE
              </span>
            </h2>
            <p className="text-gray-400">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading creative questions...
                </span>
              ) : (
                <>
                  🎯 {getTotalQuestionCount()} creative questions from {timerQuestions.length} timer sessions
                  <br />
                  <span className="text-sm italic">
                    "These questions are generated after analyzing the complete session content."
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchTimerQuestions}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors text-sm"
            title="Refresh timer questions"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={clearTimerQuestions}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
            title="Clear all timer questions from UI"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">Error: {error}</p>
        </div>
      )}

      <div className="space-y-6">
        {timerQuestions.map((timerSet, setIndex) => (
          <motion.div
            key={timerSet._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: setIndex * 0.1 }}
            className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg p-5 border border-orange-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    Creative Timer Session {setIndex + 1}
                    <Target className="w-4 h-4 text-orange-400" />
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>
                      ⏱️ Generated after {Math.ceil(timerSet.timerSession.duration / 60000)}-minute timer
                    </span>
                    <span>📝 {timerSet.questions.length} creative questions</span>
                    <span>🎯 {timerSet.timerSession.segmentCount} segments analyzed</span>
                    <span>📅 {new Date(timerSet.generatedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {timerSet.summary && (
              <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-orange-300 text-sm italic">"{timerSet.summary}"</p>
              </div>
            )}

            <div className="space-y-4">
              {timerSet.questions.map((question, questionIndex) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (setIndex * 0.1) + (questionIndex * 0.05) }}
                  className="bg-black/20 rounded-lg p-4 border border-gray-600/30 hover:border-orange-500/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getTypeBadgeColor(question.type)}`}>
                          {question.type.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full bg-gray-600/30 ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty.toUpperCase()}
                        </span>
                        <span className="text-xs bg-gradient-to-r from-orange-600/20 to-yellow-600/20 text-orange-300 px-2 py-1 rounded-full border border-orange-500/30">
                          🎯 CREATIVE
                        </span>
                        <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full">
                          TIMER-BASED
                        </span>
                      </div>
                      
                      <p className="text-white font-medium mb-3 text-lg leading-relaxed">
                        {question.questionText}
                      </p>
                      
                      {question.options && question.options.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {question.options.map((option, optIndex) => (
                            <div 
                              key={optIndex} 
                              className={`p-3 rounded-lg border transition-all ${
                                question.correctIndex === optIndex 
                                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                                  : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                  question.correctIndex === optIndex 
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-700 text-gray-300'
                                }`}>
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                                <span className="flex-1">{option}</span>
                                {question.correctIndex === optIndex && (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.type === 'TRUE_FALSE' && (
                        <div className="flex space-x-4 mb-3">
                          {['True', 'False'].map((option, optIndex) => (
                            <div 
                              key={option}
                              className={`p-3 rounded-lg border flex-1 text-center transition-all ${
                                (question.correctAnswer === 'true' && option === 'True') ||
                                (question.correctAnswer === 'false' && option === 'False') ||
                                (question.correctIndex === optIndex)
                                  ? 'bg-green-500/20 border-green-500/50 text-green-300'
                                  : 'bg-gray-800/50 border-gray-700 text-gray-300'
                              }`}
                            >
                               <div className="flex items-center justify-center space-x-2">
                                <span>{option}</span>
                                {((question.correctAnswer === 'true' && option === 'True') ||
                                  (question.correctAnswer === 'false' && option === 'False') ||
                                  (question.correctIndex === optIndex)) && (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                )}
                              </div> 
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {question.explanation && (
                        <div className="p-3 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded border-l-4 border-orange-500">
                          <p className="text-xs text-gray-300">
                            <strong className="text-orange-400">💡 Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleLaunchQuestion(question)}
                      className="ml-4 px-4 py-3 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white rounded-lg flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Play className="w-4 h-4" />
                      <span>Launch</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {isLoading && timerQuestions.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-400">Loading creative timer questions...</p>
        </div>
      )}

      {!isLoading && timerQuestions.length === 0 && !error && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No Timer Questions Yet</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Complete a timer session to generate creative, attention-grabbing questions from your discussion content.
          </p>
          <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg max-w-md mx-auto">
            <p className="text-orange-300 text-sm">
              🎯 <strong>Tip:</strong> Timer questions are different from segment questions - they analyze your entire discussion holistically!
            </p>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

export default TimerBasedQuestionsSection;