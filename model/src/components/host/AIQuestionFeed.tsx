import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Play, Edit, Trash2, CheckCircle, XCircle, Settings, Zap } from 'lucide-react';
import GlassCard from '../GlassCard';
import toast from 'react-hot-toast';

interface AIQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  confidence: number;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

const AIQuestionFeed: React.FC = () => {
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading existing questions
    loadQuestions();
  }, []);

  const loadQuestions = () => {
    // Mock data - in real app, fetch from API
    const mockQuestions: AIQuestion[] = [
      {
        id: '1',
        question: 'What is the derivative of x²?',
        options: ['2x', 'x', '2', 'x²'],
        correctAnswer: 0,
        confidence: 0.95,
        topic: 'Calculus',
        difficulty: 'Easy',
        status: 'pending',
        createdAt: new Date(),
      },
      {
        id: '2',
        question: 'Which of the following represents Newton\'s second law?',
        options: ['F = ma', 'E = mc²', 'PV = nRT', 'F = kx'],
        correctAnswer: 0,
        confidence: 0.92,
        topic: 'Physics',
        difficulty: 'Medium',
        status: 'approved',
        createdAt: new Date(Date.now() - 300000),
      },
      {
        id: '3',
        question: 'What is the integral of sin(x)?',
        options: ['-cos(x) + C', 'cos(x) + C', '-sin(x) + C', 'sin(x) + C'],
        correctAnswer: 0,
        confidence: 0.88,
        topic: 'Calculus',
        difficulty: 'Medium',
        status: 'pending',
        createdAt: new Date(Date.now() - 600000),
      },
    ];
    setQuestions(mockQuestions);
  };

  const generateQuestions = async () => {
    setIsGenerating(true);
    toast.loading('AI is generating new questions...', { id: 'generating' });
    
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newQuestions: AIQuestion[] = [
      {
        id: Date.now().toString(),
        question: 'What is the pH of pure water at 25°C?',
        options: ['6', '7', '8', '14'],
        correctAnswer: 1,
        confidence: 0.91,
        topic: 'Chemistry',
        difficulty: 'Easy',
        status: 'pending',
        createdAt: new Date(),
      },
      {
        id: (Date.now() + 1).toString(),
        question: 'Which organelle is responsible for protein synthesis?',
        options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'],
        correctAnswer: 2,
        confidence: 0.89,
        topic: 'Biology',
        difficulty: 'Medium',
        status: 'pending',
        createdAt: new Date(),
      },
    ];

    setQuestions(prev => [...newQuestions, ...prev]);
    setIsGenerating(false);
    toast.success(`Generated ${newQuestions.length} new questions!`, { id: 'generating' });
  };

  const approveQuestion = (id: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, status: 'approved' as const } : q
    ));
    
    const question = questions.find(q => q.id === id);
    if (question && autoLaunch) {
      launchPoll(question);
    }
    toast.success('Question approved!');
  };

  const rejectQuestion = (id: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, status: 'rejected' as const } : q
    ));
    toast.success('Question rejected');
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    toast.success('Question deleted');
  };

  const launchPoll = (question: AIQuestion) => {
    // In real app, this would emit to socket
    toast.success(`Poll launched: ${question.question.substring(0, 50)}...`);
  };

  const filteredQuestions = questions.filter(q => 
    selectedTopic === 'all' || q.topic.toLowerCase() === selectedTopic.toLowerCase()
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'Medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'Hard': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">AI Question Feed</h1>
        <p className="text-gray-300">AI-generated questions from your lecture content</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-electric-cyan" />
            AI Generator
          </h3>
          
          <motion.button
            onClick={generateQuestions}
            disabled={isGenerating}
            className="w-full btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Generating...
              </div>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Questions
              </>
            )}
          </motion.button>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-vibrant-magenta" />
            Auto-Launch
          </h3>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Auto-launch approved polls</span>
            <motion.button
              onClick={() => setAutoLaunch(!autoLaunch)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoLaunch ? 'bg-electric-cyan' : 'bg-gray-600'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                animate={{ x: autoLaunch ? 24 : 0 }}
                transition={{ duration: 0.2 }}
              />
            </motion.button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Filter</h3>
          
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="glass-input w-full"
          >
            <option value="all">All Topics</option>
            <option value="calculus">Calculus</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
            <option value="biology">Biology</option>
          </select>
        </GlassCard>
      </div>

      {/* Questions List */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            Generated Questions ({filteredQuestions.length})
          </h3>
          
          <div className="flex space-x-2">
            <span className="status-indicator status-pending">
              {filteredQuestions.filter(q => q.status === 'pending').length} Pending
            </span>
            <span className="status-indicator status-active">
              {filteredQuestions.filter(q => q.status === 'approved').length} Approved
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-lg p-6 border border-white/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`status-indicator ${
                        question.status === 'approved' ? 'status-active' :
                        question.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'status-pending'
                      }`}>
                        {question.status}
                      </span>
                      
                      <span className={`status-indicator ml-2 ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                      
                      <span className="text-gray-400 text-sm ml-4">
                        {question.topic}
                      </span>
                    </div>
                    
                    <h4 className="text-lg font-medium text-white mb-3">
                      {question.question}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {question.options.map((option, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded text-sm ${
                            idx === question.correctAnswer
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-white/5 text-gray-300'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}. {option}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-gray-400 text-sm mr-4">
                        Confidence: {(question.confidence * 100).toFixed(0)}%
                      </span>
                      <div className="progress-bar w-24 mr-4">
                        <div
                          className="progress-fill"
                          style={{ width: `${question.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-sm">
                        {question.createdAt.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {question.status === 'pending' && (
                      <>
                        <motion.button
                          onClick={() => approveQuestion(question.id)}
                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </motion.button>
                        
                        <motion.button
                          onClick={() => rejectQuestion(question.id)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <XCircle className="w-5 h-5" />
                        </motion.button>
                      </>
                    )}
                    
                    {question.status === 'approved' && (
                      <motion.button
                        onClick={() => launchPoll(question)}
                        className="p-2 bg-electric-cyan/20 text-electric-cyan rounded-lg hover:bg-electric-cyan/30 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-5 h-5" />
                      </motion.button>
                    )}
                    
                    <motion.button
                      onClick={() => setEditingQuestion(question.id)}
                      className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit className="w-5 h-5" />
                    </motion.button>
                    
                    <motion.button
                      onClick={() => deleteQuestion(question.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No questions yet</h3>
              <p className="text-gray-500">Generate your first AI questions to get started</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default AIQuestionFeed;