import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Edit3, Settings, Brain, Loader, 
  Plus, Send, RefreshCw, FileText,
  BarChart3, CheckCircle, Zap, Trash2
} from "lucide-react"
import DashboardLayout from "../components/DashboardLayout"
import GlassCard from "../components/GlassCard"
import { useAuth } from "../contexts/AuthContext"
import { toast } from "react-hot-toast"
import { useTranscriptCapture } from "../hooks/useTranscriptCapture"
import { LocalTranscriptManager } from "../utils/localTranscripts"
import { generateQuestionsWithGemini } from "../utils/geminiQuestions"
import type { QuestionCapability } from "../utils/localTranscripts"

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  points: number;
}

interface GeneratedQuestionSet {
  id: string;
  meetingId: string;
  summary: string;
  config: QuestionConfig;
  questions: Question[];
  transcriptSource?: {
    type: 'database' | 'local_storage';
    wordCount: number;
    transcriptCount: number;
    source: string;
  };
}

interface QuestionConfig {
  numQuestions: number;
  types: ('multiple_choice' | 'true_false' | 'short_answer')[];
  difficulty: ('easy' | 'medium' | 'hard')[];
  contextLimit: number;
  includeExplanations: boolean;
  pointsPerQuestion: number;
}

const AIQuestionFeed = () => {
  const { activeRoom } = useAuth();
  const [currentStep, setCurrentStep] = useState<'config' | 'preview' | 'published'>('config');
  const [isLoading, setIsLoading] = useState(false);
  
  const meetingId = activeRoom?._id || 'demo-meeting-123';
  
  // Dynamic meeting ID to handle transcript captures from different meetings
  const [activeMeetingId, setActiveMeetingId] = useState(meetingId);
  
  // Check for any existing transcripts and use the most recent meeting
  useEffect(() => {
    const transcriptManager = LocalTranscriptManager.getInstance();
    
    // Clear any demo data on startup to ensure we only use real transcripts
    console.log('🧹 [AI-QUESTIONS-LOCAL] Clearing any existing demo data...');
    transcriptManager.clearTranscripts('demo-meeting-123');
    
    const allTranscripts = transcriptManager.getTranscripts();
    console.log(`🔍 [AI-QUESTIONS-LOCAL] Found ${allTranscripts.length} total transcripts after cleanup`);
    
    if (allTranscripts.length > 0) {
      // Group transcripts by meeting (excluding demo data)
      const meetingGroups = allTranscripts
        .filter(t => t.meetingId !== 'demo-meeting-123') // Exclude any remaining demo data
        .reduce((acc, transcript) => {
          if (!acc[transcript.meetingId]) {
            acc[transcript.meetingId] = [];
          }
          acc[transcript.meetingId].push(transcript);
          return acc;
        }, {} as Record<string, typeof allTranscripts>);
      
      // Find the meeting with the most recent activity
      const mostRecentMeeting = Object.entries(meetingGroups)
        .map(([meetingId, transcripts]) => ({
          meetingId,
          lastActivity: Math.max(...transcripts.map(t => t.timestamp)),
          count: transcripts.length
        }))
        .sort((a, b) => b.lastActivity - a.lastActivity)[0];
        
      if (mostRecentMeeting) {
        console.log(`🔍 [AI-QUESTIONS-LOCAL] Found active meeting with real transcripts: ${mostRecentMeeting.meetingId} (${mostRecentMeeting.count} transcripts)`);
        setActiveMeetingId(mostRecentMeeting.meetingId);
      } else {
        console.log('📭 [AI-QUESTIONS-LOCAL] No real transcripts found - waiting for voice input');
        setActiveMeetingId('test-room-id'); // Default to the actual room
      }
    } else {
      console.log('📭 [AI-QUESTIONS-LOCAL] No transcripts found - waiting for voice input');
      setActiveMeetingId('test-room-id'); // Default to the actual room
    }
  }, []);
  
  // Listen for new transcript captures and auto-switch to active meeting
  useEffect(() => {
    const handleTranscriptCaptured = (event: CustomEvent) => {
      console.log('🎤 [AI-QUESTIONS-LOCAL] New transcript captured:', event.detail);
      
      // Switch to the meeting that just had a transcript
      if (event.detail.meetingId && event.detail.meetingId !== activeMeetingId) {
        console.log(`🔄 [AI-QUESTIONS-LOCAL] Switching to active meeting: ${event.detail.meetingId}`);
        setActiveMeetingId(event.detail.meetingId);
      } else {
        // Refresh summary for current meeting
        setTimeout(() => fetchTranscriptSummary(), 500);
      }
    };

    window.addEventListener('transcript-captured', handleTranscriptCaptured as EventListener);
    
    return () => {
      window.removeEventListener('transcript-captured', handleTranscriptCaptured as EventListener);
    };
  }, [activeMeetingId]);
  
  // Local transcript management - use dynamic meeting ID
  const transcriptCapture = useTranscriptCapture(activeMeetingId, true);
  
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
  }, [activeMeetingId]);

  const fetchTranscriptSummary = async () => {
    try {
      console.log('🔍 Fetching transcript summary for meeting:', activeMeetingId);
      
      // Always try local storage first for better UX
      const localSummary = transcriptCapture.getTranscriptSummary();
      const localCapability = transcriptCapture.getQuestionCapability();
      
      if (localSummary.totalWords > 0) {
        console.log('✅ Found local transcripts:', localSummary);
        setTranscriptSummary(localSummary);
        setQuestionCapability(localCapability);
        
        // Update question count limits
        if (localCapability.confidence === 'high') {
          setConfig(prev => ({...prev, numQuestions: Math.min(prev.numQuestions, localCapability.maxQuestions)}));
        }
        
        return; // Use local data if available
      }
      
      // Fallback: Try to fetch from backend API if no local data
      console.log('📡 No local transcripts found, trying backend API...');
      try {
        const response = await fetch(`/api/transcripts/${activeMeetingId}`);
        if (response.ok) {
          const backendData = await response.json();
          console.log('✅ Backend API response:', backendData);
          
          if (backendData.success && backendData.data?.length > 0) {
            // Convert backend transcripts to local format and store them
            const backendTranscripts = backendData.data.map((t: any, index: number) => ({
              text: t.text,
              timestamp: new Date(t.timestamp).getTime(),
              speaker: t.role === 'host' ? 'host' as const : 'guest' as const,
              participantId: t.participantId || `backend-${index}`,
              meetingId: activeMeetingId,
              confidence: 0.9
            }));
            
            // Store in localStorage for future use
            const transcriptManager = LocalTranscriptManager.getInstance();
            backendTranscripts.forEach((transcript: any) => {
              transcriptManager.addTranscript(transcript);
            });
            
            console.log(`💾 Stored ${backendTranscripts.length} backend transcripts to localStorage`);
            
            // Update summary with the new data
            const newSummary = transcriptCapture.getTranscriptSummary();
            const newCapability = transcriptCapture.getQuestionCapability();
            setTranscriptSummary(newSummary);
            setQuestionCapability(newCapability);
            
            toast.success(`Loaded ${backendTranscripts.length} transcripts from database`);
            return;
          } else {
            console.log('📭 Backend API returned no transcripts');
          }
        } else {
          console.warn(`⚠️ Backend API request failed: ${response.status} ${response.statusText}`);
        }
      } catch (apiError) {
        console.warn('⚠️ Backend API fetch failed:', apiError);
      }
      
      // No data found anywhere
      console.log('📭 No transcripts found in localStorage or backend API');
      setTranscriptSummary({
        totalRecords: 0,
        totalWords: 0,
        totalDuration: 0,
        averageWordsPerMinute: 0,
        fullTextLength: 0,
        readyForAI: false
      });
      setQuestionCapability(null);
      
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
        
        toast.success(`Found ${localSummary.totalRecords} transcripts (${localSummary.totalWords} words)`, {
          icon: '💾',
          duration: 3000
        });
      } else {
        // No transcripts available
        console.log('📭 No transcripts found in local storage');
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
      const localSummary = transcriptCapture.getTranscriptSummary();
      
      if (!localSummary.readyForAI || localSummary.totalWords < 10) {
        throw new Error(`Need at least 10 words to generate questions. Current: ${localSummary.totalWords} words`);
      }

      // Generate questions using Gemini
      console.log('🤖 Generating questions with config:', config);
      console.log('💾 Generating questions from local transcripts');
      const transcriptContent = localSummary.fullText;
      
      // Convert config to the format expected by the new Gemini function
      const geminiConfig = {
        numQuestions: config.numQuestions,
        types: config.types.map(type => type.replace('_', ' ')),
        difficulty: config.difficulty
      };
      
      const geminiResponse = await generateQuestionsWithGemini(transcriptContent, geminiConfig);
      
      const localQuestionSet: GeneratedQuestionSet = {
        id: `local-${Date.now()}`,
        meetingId: activeMeetingId,
        summary: `Generated ${geminiResponse.questions.length} questions from ${localSummary.totalWords} words of transcripts`,
        config,
        questions: geminiResponse.questions,
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
        icon: '🤖'
      });
      console.log('✅ Questions generated from local storage:', localQuestionSet);

    } catch (error) {
      console.error('❌ Error generating questions:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate questions');
      
      // Show demo questions as fallback
      showDemoQuestions();
    } finally {
      setIsLoading(false);
    }
  };

  const showDemoQuestions = () => {
    const demoQuestions: GeneratedQuestionSet = {
      id: 'demo-123',
      meetingId,
      summary: 'Demo questions for testing the AI Questions system.',
      config,
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          difficulty: 'medium',
          questionText: 'What is the main topic discussed in this meeting?',
          options: ['Artificial Intelligence', 'Machine Learning', 'Neural Networks', 'All of the above'],
          correctAnswer: 3,
          explanation: 'The meeting covered various aspects of AI including machine learning and neural networks.',
          points: config.pointsPerQuestion
        }
      ],
      transcriptSource: {
        type: 'local_storage',
        wordCount: 0,
        transcriptCount: 0,
        source: 'Demo data'
      }
    };
    
    setGeneratedQuestions(demoQuestions);
    setCurrentStep('preview');
    toast('Using demo questions for testing', { icon: '🎭' });
  };

  const clearTranscripts = () => {
    transcriptCapture.clearTranscripts();
    setTranscriptSummary(null);
    setQuestionCapability(null);
    setGeneratedQuestions(null);
    setCurrentStep('config');
    toast.success('Transcripts cleared! Ready for new recording.', {
      icon: '🗑️',
      duration: 3000
    });
  };

  const launchQuestion = async (questionId: string) => {
    try {
      toast.success(`Question launched to students!`, {
        icon: '🚀',
        duration: 2000
      });
      console.log('🚀 Question launched:', questionId);
    } catch (error) {
      console.error('❌ Error launching question:', error);
      toast.error('Failed to launch question');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Questions</h1>
              <p className="text-gray-400">Generate intelligent questions from your meeting transcripts</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchTranscriptSummary}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={clearTranscripts}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Transcripts</span>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center space-x-8 mb-8">
          {[
            { id: 'config', label: 'Configure', icon: Settings },
            { id: 'preview', label: 'Preview', icon: FileText },
            { id: 'published', label: 'Launch', icon: Send }
          ].map((step, index) => {
            const isActive = currentStep === step.id;
            const isComplete = ['config', 'preview', 'published'].indexOf(currentStep) > index;
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  isActive 
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400' 
                    : isComplete 
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-gray-600 bg-gray-800 text-gray-400'
                }`}>
                  {isComplete && !isActive ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? 'text-blue-400' : isComplete ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < 2 && (
                  <div className={`w-12 h-0.5 ${isComplete ? 'bg-green-500' : 'bg-gray-600'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Transcript Summary */}
        {transcriptSummary && (
          <GlassCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                Live Transcript Summary
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{transcriptSummary.totalRecords}</div>
                  <div className="text-sm text-gray-400">Records</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{transcriptSummary.totalWords}</div>
                  <div className="text-sm text-gray-400">Words</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">{transcriptSummary.averageWordsPerMinute}</div>
                  <div className="text-sm text-gray-400">WPM</div>
                </div>
                <div className="bg-gray-800/50 p-3 rounded-lg">
                  <div className={`text-2xl font-bold ${transcriptSummary.readyForAI ? 'text-green-400' : 'text-red-400'}`}>
                    {transcriptSummary.readyForAI ? 'Ready' : 'Not Ready'}
                  </div>
                  <div className="text-sm text-gray-400">AI Status</div>
                </div>
              </div>

              {questionCapability && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    AI Question Generation Capability
                  </h4>
                  <div className="text-white">
                    Can generate <strong>{questionCapability.minQuestions}-{questionCapability.maxQuestions}</strong> questions 
                    (recommended: <strong>{questionCapability.recommendedQuestions}</strong>)
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    Confidence: <span className={`capitalize ${
                      questionCapability.confidence === 'very-high' ? 'text-green-400' :
                      questionCapability.confidence === 'high' ? 'text-blue-400' :
                      questionCapability.confidence === 'medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>{questionCapability.confidence.replace('-', ' ')}</span>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Configuration Step */}
        {currentStep === 'config' && (
          <GlassCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-400" />
                Question Generation Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Questions
                  </label>
                  <select
                    value={config.numQuestions}
                    onChange={(e) => setConfig(prev => ({ ...prev, numQuestions: parseInt(e.target.value) }))}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {questionCapability && [...Array(questionCapability.maxQuestions - questionCapability.minQuestions + 1)].map((_, i) => {
                      const num = questionCapability.minQuestions + i;
                      return <option key={num} value={num}>{num}</option>;
                    })}
                    {!questionCapability && (
                      <>
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={8}>8</option>
                        <option value={10}>10</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Question Types
                  </label>
                  <div className="space-y-2">
                    {['multiple_choice', 'true_false', 'short_answer'].map(type => (
                      <label key={type} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={config.types.includes(type as any)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConfig(prev => ({ ...prev, types: [...prev.types, type as any] }));
                            } else {
                              setConfig(prev => ({ ...prev, types: prev.types.filter(t => t !== type) }));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-white capitalize">{type.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={generateQuestions}
                  disabled={isLoading || !transcriptSummary?.readyForAI}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-lg flex items-center space-x-2 transition-all disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      <span>Generate Questions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Preview Step */}
        {currentStep === 'preview' && generatedQuestions && (
          <GlassCard>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-400" />
                  Generated Questions Preview
                </h3>
                <button
                  onClick={() => setCurrentStep('config')}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Config</span>
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2">Generation Summary</h4>
                <p className="text-white">{generatedQuestions.summary}</p>
                {generatedQuestions.transcriptSource && (
                  <div className="text-sm text-gray-400 mt-2">
                    Source: {generatedQuestions.transcriptSource.source} 
                    ({generatedQuestions.transcriptSource.wordCount} words, {generatedQuestions.transcriptSource.transcriptCount} transcripts)
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {generatedQuestions.questions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800/50 p-6 rounded-xl border border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-medium">Question {index + 1}</div>
                          <div className="text-sm text-gray-400 capitalize">
                            {question.type.replace('_', ' ')} • {question.difficulty} • {question.points} point{question.points !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => launchQuestion(question.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg flex items-center space-x-1 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Launch</span>
                      </button>
                    </div>

                    <h4 className="text-white text-lg font-medium mb-4">{question.questionText}</h4>
                    
                    {question.type === 'multiple_choice' && question.options && (
                      <div className="space-y-2 mb-4">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className={`p-3 rounded-lg border ${
                            question.correctAnswer === optIndex 
                              ? 'bg-green-500/20 border-green-500/50 text-green-300'
                              : 'bg-gray-800 border-gray-700 text-gray-300'
                          }`}>
                            <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {option}
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === 'true_false' && (
                      <div className="flex space-x-4 mb-4">
                        <div className={`p-3 rounded-lg border ${
                          question.correctAnswer === 'true'
                            ? 'bg-green-500/20 border-green-500/50 text-green-300'
                            : 'bg-gray-800 border-gray-700 text-gray-300'
                        }`}>
                          True
                        </div>
                        <div className={`p-3 rounded-lg border ${
                          question.correctAnswer === 'false'
                            ? 'bg-green-500/20 border-green-500/50 text-green-300'
                            : 'bg-gray-800 border-gray-700 text-gray-300'
                        }`}>
                          False
                        </div>
                      </div>
                    )}

                    {question.type === 'short_answer' && (
                      <div className="mb-4">
                        <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
                          <strong>Expected Answer:</strong> {question.correctAnswer}
                        </div>
                      </div>
                    )}

                    {question.explanation && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <strong className="text-blue-400">Explanation:</strong>
                        <p className="text-gray-300 mt-1">{question.explanation}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setCurrentStep('published')}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium rounded-lg flex items-center space-x-2 transition-all"
                >
                  <Send className="w-5 h-5" />
                  <span>Launch All Questions</span>
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Published Step */}
        {currentStep === 'published' && (
          <GlassCard>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Questions Successfully Launched!</h3>
              <p className="text-gray-400 mb-6">
                Your AI-generated questions have been sent to all participants in the meeting.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setCurrentStep('config');
                    setGeneratedQuestions(null);
                  }}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Generate New Questions</span>
                </button>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AIQuestionFeed;