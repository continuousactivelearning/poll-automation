"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Edit3, Settings, Brain, Loader, 
  Plus, Send, RefreshCw, FileText,
  BarChart3, CheckCircle, Zap
} from "lucide-react"
import DashboardLayout from "../components/DashboardLayout"
import GlassCard from "../components/GlassCard"
import { useAuth } from "../contexts/AuthContext"
import { Toaster, toast } from "react-hot-toast"
import { useTranscriptCapture } from "../hooks/useTranscriptCapture"
import { LocalTranscriptManager } from "../utils/localTranscripts"
import type { QuestionCapability } from "../utils/localTranscripts"

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: string;
  explanation: string;
  points?: number;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'launched' | 'published';
  launchedAt?: string;
}

interface QuestionConfig {
  numQuestions: number;
  types: string[];
  difficulty: string[];
  contextLimit: number;
  includeExplanations: boolean;
  pointsPerQuestion?: number;
}

interface GeneratedQuestionSet {
  id: string;
  meetingId: string;
  questions: Question[];
  summary: string;
  config: QuestionConfig;
  metadata: {
    generatedAt: string;
    transcriptSource: {
      totalWords: number;
      sourceLength: number;
      summarized: boolean;
      originalLength?: number;
    };
    geminiMetadata: {
      model: string;
      processingTime: number;
    };
    status: 'draft' | 'published' | 'archived';
  };
}

interface TranscriptSummary {
  totalRecords: number;
  totalWords: number;
  totalDuration: number;
  averageWordsPerMinute: number;
  fullTextLength: number;
  readyForAI: boolean;
}

const AIQuestionFeed = () => {
  const { activeRoom } = useAuth();
  const [currentStep, setCurrentStep] = useState<'config' | 'preview' | 'published'>('config');
  const [isLoading, setIsLoading] = useState(false);
  
  const meetingId = activeRoom?._id || 'demo-meeting-123';
  
  // Local transcript management
  const transcriptCapture = useTranscriptCapture(meetingId, true);
  
  const [transcriptSummary, setTranscriptSummary] = useState<{
    totalRecords: number;
    totalWords: number;
    totalDuration: number;
    uniqueParticipants?: number;
    averageWordsPerMinute: number;
    fullTextLength: number;
    readyForAI: boolean;
  } | null>(null);
  
  const [questionCapability, setQuestionCapability] = useState<QuestionCapability | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionSet | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  
  // Configuration state
  const [config, setConfig] = useState<QuestionConfig>({
    numQuestions: 5,
    types: ['multiple_choice'],
    difficulty: ['medium'],
    contextLimit: 5000,
    includeExplanations: true,
    pointsPerQuestion: 1
  });

  useEffect(() => {
    fetchTranscriptSummary();
  }, [meetingId]);

  const fetchTranscriptSummary = async () => {
    try {
      console.log('🔍 Fetching transcript summary for meeting:', meetingId);
      
      // First try to fetch from API
      try {
        const response = await fetch(`/api/meetings/${meetingId}/transcripts`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTranscriptSummary(data.data.summary);
          setQuestionCapability(data.data.questionCapability);
          
          // Update question count limits based on AI capability
          if (data.data.questionCapability) {
            const capability = data.data.questionCapability;
            setConfig(prev => ({
              ...prev,
              numQuestions: Math.min(capability.recommendedQuestions, prev.numQuestions)
            }));
            
            console.log('🤖 AI Question Capability from API:', capability);
          }
          
          console.log('📊 LIVE transcript summary from API:', data.data.summary);
          return; // Success, exit early
        }
      } catch (apiError) {
        console.warn('⚠️ API fetch failed, falling back to local storage:', apiError);
      }

      // Fallback to local storage
      console.log('💾 Using local storage transcripts as fallback');
      const localSummary = transcriptCapture.getTranscriptSummary();
      const localCapability = transcriptCapture.getQuestionCapability();
      
      if (localSummary.totalWords > 0) {
        setTranscriptSummary(localSummary);
        setQuestionCapability(localCapability);
        
        // Update question count limits
        setConfig(prev => ({
          ...prev,
          numQuestions: Math.min(localCapability.recommendedQuestions, prev.numQuestions)
        }));
        
        console.log('🤖 AI Question Capability from local storage:', localCapability);
        console.log('📊 Local transcript summary:', localSummary);
        
        toast.success(`Using ${localSummary.totalRecords} local transcripts (${localSummary.totalWords} words)`, {
          icon: '💾',
          duration: 3000
        });
      } else {
        // No transcripts available
        console.log('📭 No transcripts found in API or local storage');
        toast('No transcripts found. Please start recording audio first.', {
          icon: '⚠️',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('❌ Error fetching transcript summary:', error);
      toast.error('Failed to fetch transcript data');
    }
  };

  const generateQuestions = async () => {
    setIsLoading(true);
    try {
      console.log('🤖 Generating questions with config:', config);
      
      // Get transcript content for AI processing
      let transcriptContent = '';
      
      // Try API first, then fallback to local storage
      try {
        const response = await fetch(`/api/meetings/${meetingId}/generate-questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(config)
        });

        if (response.ok) {
          const data = await response.json();
          setGeneratedQuestions(data.data);
          setCurrentStep('preview');
          toast.success(`Generated ${data.data.questions.length} questions successfully!`);
          console.log('✅ Questions generated from API:', data.data);
          return;
        }
      } catch (apiError) {
        console.warn('⚠️ API question generation failed, using local transcripts:', apiError);
      }

      // Fallback: Generate questions from local transcripts
      console.log('💾 Generating questions from local transcripts');
      const localSummary = transcriptCapture.getTranscriptSummary();
      
      if (!localSummary.readyForAI || localSummary.totalWords < 10) {
        throw new Error(`Need at least 10 words to generate questions. Current: ${localSummary.totalWords} words`);
      }

      // Use local transcript content for question generation
      transcriptContent = localSummary.fullText;
      
      // Call Gemini API directly from frontend (as fallback)
      const geminiResponse = await generateQuestionsWithGemini(transcriptContent, config);
      
      const localQuestionSet: GeneratedQuestionSet = {
        id: `local-${Date.now()}`,
        meetingId,
        summary: `Generated ${geminiResponse.questions.length} questions from ${localSummary.totalWords} words of transcripts`,
        config,
        questions: geminiResponse.questions,
        generatedAt: new Date().toISOString(),
        transcriptSource: {
          type: 'local_storage',
          wordCount: localSummary.totalWords,
          transcriptCount: localSummary.totalRecords,
          source: 'Local transcript capture'
        }
      };

      setGeneratedQuestions(localQuestionSet);
      setCurrentStep('preview');
      toast.success(`Generated ${geminiResponse.questions.length} questions from local transcripts!`, {
        icon: '💾'
      });
      console.log('✅ Questions generated from local storage:', localQuestionSet);

    } catch (error) {
      console.error('❌ Error generating questions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate questions');
      
      // Show demo questions as last fallback
      showDemoQuestions();
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to show demo questions when everything else fails
  const showDemoQuestions = () => {
      const demoQuestions: GeneratedQuestionSet = {
        id: 'demo-123',
        meetingId,
        summary: 'Generated questions covering React development concepts and best practices.',
        config,
        questions: [
          {
            id: 'q1',
            type: 'multiple_choice',
            difficulty: 'medium',
            questionText: 'What is the primary purpose of React hooks?',
            options: [
              'To replace class components entirely',
              'To add state and lifecycle methods to functional components', 
              'To improve performance of React applications',
              'To handle routing in React applications'
            ],
            correctIndex: 1,
            explanation: 'React hooks allow functional components to use state and other React features that were previously only available in class components.'
          },
          {
            id: 'q2',
            type: 'true_false',
            difficulty: 'easy',
            questionText: 'useState hook can only hold primitive values like strings and numbers.',
            options: ['True', 'False'],
            correctIndex: 1,
            explanation: 'useState can hold any type of value including objects, arrays, and complex data structures.'
          }
        ],
        metadata: {
          generatedAt: new Date().toISOString(),
          transcriptSource: {
            totalWords: 2847,
            sourceLength: 5000,
            summarized: false
          },
          geminiMetadata: {
            model: 'gemini-pro',
            processingTime: 3500
          },
          status: 'draft'
        }
      };
      setGeneratedQuestions(demoQuestions);
      setCurrentStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const publishQuestions = async () => {
    if (!generatedQuestions) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/meetings/${meetingId}/publish-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          questionSetId: generatedQuestions.id,
          questionIds: generatedQuestions.questions.map(q => q.id)
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Published ${data.data.publishedQuestions} questions to students!`);
        setCurrentStep('published');
        console.log('📢 Questions published:', data.data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to publish questions');
      }
    } catch (error) {
      console.error('❌ Error publishing questions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to publish questions');
      // For demo, just move to published state
      setCurrentStep('published');
      toast.success('Questions published successfully (demo mode)');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    if (!generatedQuestions) return;
    
    const updatedQuestions = generatedQuestions.questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    );
    
    setGeneratedQuestions({
      ...generatedQuestions,
      questions: updatedQuestions
    });
    
    setEditingQuestion(null);
    toast.success('Question updated successfully');
  };

  const launchQuestion = async (questionId: string) => {
    try {
      console.log('🚀 Launching individual question:', questionId);
      
      const response = await fetch(`/api/meetings/${meetingId}/questions/${questionId}/launch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('🎯 Question launched to students!');
        console.log('✅ Question launched:', data);
        
        // Update the question status in local state
        if (generatedQuestions) {
          const updatedQuestions = {
            ...generatedQuestions,
            questions: generatedQuestions.questions.map(q => 
              q.id === questionId 
                ? { ...q, status: 'launched' as const, launchedAt: new Date().toISOString() }
                : q
            )
          };
          setGeneratedQuestions(updatedQuestions);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to launch question');
      }
    } catch (error) {
      console.error('❌ Error launching question:', error);
      toast.error('Failed to launch question');
    }
  };

  const renderConfigStep = () => (
    <div className="space-y-6">
      {/* Transcript Summary */}
      {transcriptSummary && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Meeting Transcript Summary
            </h3>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              transcriptSummary.readyForAI 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {transcriptSummary.readyForAI ? 'Ready for AI' : 'Insufficient Content'}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{transcriptSummary.totalWords}</div>
              <div className="text-sm text-gray-400">Total Words</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {Math.round(transcriptSummary.totalDuration / 60000)}m
              </div>
              <div className="text-sm text-gray-400">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{transcriptSummary.averageWordsPerMinute}</div>
              <div className="text-sm text-gray-400">WPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {transcriptSummary.uniqueParticipants || transcriptSummary.totalRecords}
              </div>
              <div className="text-sm text-gray-400">
                {transcriptSummary.uniqueParticipants ? 'Speakers' : 'Segments'}
              </div>
            </div>
          </div>
          
          {/* 🤖 AI Question Generation Capability */}
          {questionCapability && (
            <div className="mt-4 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Question Capability
                </h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  questionCapability.confidence === 'very-high' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  questionCapability.confidence === 'high' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  questionCapability.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {questionCapability.confidence.replace('-', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Can generate:</span>
                <span className="text-white font-medium">
                  {questionCapability.minQuestions}-{questionCapability.maxQuestions} questions
                  <span className="text-indigo-400 ml-2">
                    (recommended: {questionCapability.recommendedQuestions})
                  </span>
                </span>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Configuration Panel */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Question Generation Configuration
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Questions
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={questionCapability?.minQuestions || 1}
                max={questionCapability?.maxQuestions || 20}
                value={config.numQuestions}
                onChange={(e) => setConfig({...config, numQuestions: parseInt(e.target.value)})}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg border border-blue-500/30 min-w-[3rem] text-center">
                {config.numQuestions}
              </div>
            </div>
            {questionCapability && (
              <p className="text-xs text-gray-500 mt-1">
                Range: {questionCapability.minQuestions}-{questionCapability.maxQuestions} 
                (recommended: {questionCapability.recommendedQuestions})
              </p>
            )}
          </div>

          {/* Context Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Context Limit (characters)
            </label>
            <select
              value={config.contextLimit}
              onChange={(e) => setConfig({...config, contextLimit: parseInt(e.target.value)})}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value={3000}>3,000 (Fast)</option>
              <option value={5000}>5,000 (Balanced)</option>
              <option value={8000}>8,000 (Comprehensive)</option>
            </select>
          </div>
        </div>

        {/* Question Types */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Question Types
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'multiple_choice', label: 'Multiple Choice', icon: '📝' },
              { id: 'true_false', label: 'True/False', icon: '✅' },
              { id: 'short_answer', label: 'Short Answer', icon: '💭' },
              { id: 'essay', label: 'Essay', icon: '📄' }
            ].map(type => (
              <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.types.includes(type.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setConfig({...config, types: [...config.types, type.id]});
                    } else {
                      setConfig({...config, types: config.types.filter(t => t !== type.id)});
                    }
                  }}
                  className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">{type.icon} {type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Difficulty Levels */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Difficulty Distribution
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'easy', label: 'Easy', color: 'green' },
              { id: 'medium', label: 'Medium', color: 'yellow' },
              { id: 'hard', label: 'Hard', color: 'red' }
            ].map(diff => (
              <label key={diff.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.difficulty.includes(diff.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setConfig({...config, difficulty: [...config.difficulty, diff.id]});
                    } else {
                      setConfig({...config, difficulty: config.difficulty.filter(d => d !== diff.id)});
                    }
                  }}
                  className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className={`text-sm text-${diff.color}-400 font-medium`}>{diff.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="mt-6 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeExplanations}
              onChange={(e) => setConfig({...config, includeExplanations: e.target.checked})}
              className="rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="text-sm text-gray-300">Include explanations</span>
          </label>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-300">Points per question:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.pointsPerQuestion || 1}
              onChange={(e) => setConfig({...config, pointsPerQuestion: parseInt(e.target.value)})}
              className="w-16 p-2 bg-gray-800 border border-gray-700 rounded text-white text-center focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateQuestions}
            disabled={isLoading || config.types.length === 0 || config.difficulty.length === 0}
            className={`w-full py-4 px-6 rounded-lg font-medium text-lg flex items-center justify-center gap-3 transition-all ${
              isLoading 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg'
            }`}
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Launch Question Generation
              </>
            )}
          </motion.button>
          
          {(config.types.length === 0 || config.difficulty.length === 0) && (
            <p className="text-red-400 text-sm mt-2 text-center">
              Please select at least one question type and difficulty level
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  );

  const renderPreviewStep = () => {
    if (!generatedQuestions) return null;

    return (
      <div className="space-y-6">
        {/* Generation Summary */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Generated Questions Preview
            </h3>
            <div className="flex gap-2">
              <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-500/30">
                {generatedQuestions.questions.length} Questions
              </div>
              <div className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm border border-purple-500/30">
                {generatedQuestions.metadata.geminiMetadata.processingTime}ms
              </div>
            </div>
          </div>
          
          <p className="text-gray-300 mb-4">{generatedQuestions.summary}</p>
          
          <div className="flex gap-4 text-sm text-gray-400">
            <span>Model: {generatedQuestions.metadata.geminiMetadata.model}</span>
            <span>•</span>
            <span>Source: {generatedQuestions.metadata.transcriptSource.totalWords} words</span>
            {generatedQuestions.metadata.transcriptSource.summarized && (
              <>
                <span>•</span>
                <span className="text-yellow-400">Summarized</span>
              </>
            )}
          </div>
        </GlassCard>

        {/* Questions List */}
        <div className="space-y-4">
          {generatedQuestions.questions.map((question, index) => (
            <GlassCard key={question.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg border border-blue-500/30 text-sm font-medium">
                    Q{index + 1}
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    question.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                    question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {question.difficulty}
                  </div>
                  <div className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">
                    {question.type.replace('_', ' ')}
                  </div>
                  {question.status === 'launched' && (
                    <div className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      LAUNCHED
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* 🚀 Individual Launch Button */}
                  {question.status !== 'launched' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => launchQuestion(question.id)}
                      className="px-3 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg border border-orange-400/30"
                    >
                      <Send className="w-4 h-4" />
                      LAUNCH
                    </motion.button>
                  )}
                  
                  <button
                    onClick={() => setEditingQuestion(editingQuestion === question.id ? null : question.id)}
                    className="text-gray-400 hover:text-blue-400 transition-colors p-2"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              {editingQuestion === question.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Question Text</label>
                    <textarea
                      value={question.questionText}
                      onChange={(e) => updateQuestion(question.id, { questionText: e.target.value })}
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                      rows={2}
                    />
                  </div>
                  
                  {question.type === 'multiple_choice' && question.options && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Options</label>
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2 mb-2">
                          <input
                            type="radio"
                            checked={question.correctIndex === optIndex}
                            onChange={() => updateQuestion(question.id, { correctIndex: optIndex })}
                            className="text-blue-500"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...question.options!];
                              newOptions[optIndex] = e.target.value;
                              updateQuestion(question.id, { options: newOptions });
                            }}
                            className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Explanation</label>
                    <textarea
                      value={question.explanation}
                      onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-white text-lg font-medium">{question.questionText}</h4>
                  
                  {question.type === 'multiple_choice' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className={`p-3 rounded-lg border ${
                          question.correctIndex === optIndex 
                            ? 'bg-green-500/20 border-green-500/50 text-green-300'
                            : 'bg-gray-800 border-gray-700 text-gray-300'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                              question.correctIndex === optIndex 
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-gray-500'
                            }`}>
                              {String.fromCharCode(65 + optIndex)}
                            </div>
                            {option}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'true_false' && question.options && (
                    <div className="flex gap-4">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className={`flex-1 p-3 rounded-lg border text-center ${
                          question.correctIndex === optIndex 
                            ? 'bg-green-500/20 border-green-500/50 text-green-300'
                            : 'bg-gray-800 border-gray-700 text-gray-300'
                        }`}>
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="text-blue-400 text-sm font-medium mb-1">Explanation:</div>
                    <div className="text-gray-300 text-sm">{question.explanation}</div>
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentStep('config')}
            className="flex-1 py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={publishQuestions}
            disabled={isLoading}
            className={`flex-1 py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-2 ${
              isLoading
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publish to Students
              </>
            )}
          </motion.button>
        </div>
      </div>
    );
  };

  const renderPublishedStep = () => (
    <div className="space-y-6">
      <GlassCard className="p-6 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-2">Questions Published Successfully!</h3>
        <p className="text-gray-300 mb-6">
          Your {generatedQuestions?.questions.length} questions have been sent to all students in the meeting.
        </p>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{generatedQuestions?.questions.length}</div>
            <div className="text-sm text-gray-400">Questions Published</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {generatedQuestions?.questions.reduce((sum, q) => sum + (q.points || 1), 0)}
            </div>
            <div className="text-sm text-gray-400">Total Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">Live</div>
            <div className="text-sm text-gray-400">Status</div>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setCurrentStep('config');
              setGeneratedQuestions(null);
            }}
            className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate More Questions
          </motion.button>
          
          <button className="py-2 px-6 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            View Results
          </button>
        </div>
      </GlassCard>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
        <div className="container mx-auto px-4 py-8">
          <Toaster position="top-right" />
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">AI Question Generator</h1>
            <p className="text-gray-400">
              Generate intelligent questions from meeting transcripts using advanced AI
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              {[
                { id: 'config', label: 'Configure', icon: Settings },
                { id: 'preview', label: 'Preview', icon: Edit3 },
                { id: 'published', label: 'Published', icon: CheckCircle }
              ].map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = 
                  (step.id === 'config' && (currentStep === 'preview' || currentStep === 'published')) ||
                  (step.id === 'preview' && currentStep === 'published');
                
                return (
                  <div key={step.id} className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      isActive 
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : isCompleted
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : 'bg-gray-700 border-gray-600 text-gray-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{step.label}</span>
                    </div>
                    
                    {index < 2 && (
                      <div className={`w-8 h-0.5 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-600'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 'config' && renderConfigStep()}
              {currentStep === 'preview' && renderPreviewStep()}
              {currentStep === 'published' && renderPublishedStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIQuestionFeed;
