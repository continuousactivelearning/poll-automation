import React, { useState } from 'react';

interface PollHistoryItem {
  id: string;
  question: string;
  yourAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  responseTime: number;
  points: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  date: string;
  sessionName: string;
}

const PollHistory: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const pollHistory: PollHistoryItem[] = [
    {
      id: '1',
      question: 'What is the primary benefit of using TypeScript with React?',
      yourAnswer: 'Type safety and better IDE support',
      correctAnswer: 'Type safety and better IDE support',
      isCorrect: true,
      responseTime: 12,
      points: 50,
      difficulty: 'Medium',
      category: 'Programming',
      date: '2024-01-21T10:30:00Z',
      sessionName: 'React Fundamentals'
    },
    {
      id: '2',
      question: 'Which of the following is NOT a JavaScript primitive type?',
      yourAnswer: 'Array',
      correctAnswer: 'Array',
      isCorrect: true,
      responseTime: 8,
      points: 45,
      difficulty: 'Easy',
      category: 'Programming',
      date: '2024-01-21T10:25:00Z',
      sessionName: 'React Fundamentals'
    },
    {
      id: '3',
      question: 'What is the formula for calculating compound interest?',
      yourAnswer: 'A = P(1 + r/n)^(nt)',
      correctAnswer: 'A = P(1 + r/n)^(nt)',
      isCorrect: true,
      responseTime: 18,
      points: 60,
      difficulty: 'Hard',
      category: 'Mathematics',
      date: '2024-01-20T14:15:00Z',
      sessionName: 'Financial Mathematics'
    },
    {
      id: '4',
      question: 'Who wrote "To Kill a Mockingbird"?',
      yourAnswer: 'Harper Lee',
      correctAnswer: 'Harper Lee',
      isCorrect: true,
      responseTime: 6,
      points: 40,
      difficulty: 'Easy',
      category: 'Literature',
      date: '2024-01-20T11:45:00Z',
      sessionName: 'American Literature'
    },
    {
      id: '5',
      question: 'What is the capital of Australia?',
      yourAnswer: 'Sydney',
      correctAnswer: 'Canberra',
      isCorrect: false,
      responseTime: 5,
      points: 0,
      difficulty: 'Medium',
      category: 'Geography',
      date: '2024-01-19T16:20:00Z',
      sessionName: 'World Geography'
    },
    {
      id: '6',
      question: 'Which planet is known as the Red Planet?',
      yourAnswer: 'Mars',
      correctAnswer: 'Mars',
      isCorrect: true,
      responseTime: 4,
      points: 35,
      difficulty: 'Easy',
      category: 'Science',
      date: '2024-01-19T15:30:00Z',
      sessionName: 'Solar System Basics'
    }
  ];

  const categories = ['all', ...Array.from(new Set(pollHistory.map(poll => poll.category)))];

  const filteredHistory = pollHistory.filter(poll => {
    const matchesCategory = filterCategory === 'all' || poll.category === filterCategory;
    const matchesResult = filterResult === 'all' || 
                         (filterResult === 'correct' && poll.isCorrect) ||
                         (filterResult === 'incorrect' && !poll.isCorrect);
    const matchesSearch = poll.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         poll.sessionName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesResult && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResponseTimeColor = (time: number) => {
    if (time <= 10) return 'text-green-600';
    if (time <= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPolls = pollHistory.length;
  const correctPolls = pollHistory.filter(p => p.isCorrect).length;
  const totalPoints = pollHistory.reduce((sum, p) => sum + p.points, 0);
  const averageTime = pollHistory.reduce((sum, p) => sum + p.responseTime, 0) / pollHistory.length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{totalPolls}</p>
            <p className="text-sm text-gray-500">Total Polls</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{correctPolls}</p>
            <p className="text-sm text-gray-500">Correct Answers</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{totalPoints}</p>
            <p className="text-sm text-gray-500">Points Earned</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{averageTime.toFixed(1)}s</p>
            <p className="text-sm text-gray-500">Avg Response Time</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search polls or sessions..."
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value as any)}
            >
              <option value="all">All Results</option>
              <option value="correct">Correct Only</option>
              <option value="incorrect">Incorrect Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Poll History List */}
      <div className="space-y-4">
        {filteredHistory.map((poll) => (
          <div key={poll.id} className="bg-white rounded-lg shadow-sm border-l-4 border-l-blue-500 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(poll.difficulty)}`}>
                    {poll.difficulty}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {poll.category}
                  </span>
                  <span className="text-sm text-gray-500">{poll.sessionName}</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{poll.question}</h3>
              </div>
              <div className="text-right">
                <div className={`text-2xl mb-1 ${poll.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                  {poll.isCorrect ? '✅' : '❌'}
                </div>
                <p className="text-sm text-gray-500">{formatDate(poll.date)}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Your Answer:</p>
                <p className={`p-2 rounded-md text-sm ${
                  poll.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {poll.yourAnswer}
                </p>
              </div>
              {!poll.isCorrect && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Correct Answer:</p>
                  <p className="p-2 rounded-md text-sm bg-green-50 text-green-800">
                    {poll.correctAnswer}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-sm">
              <div className="flex space-x-4">
                <span className="text-gray-600">
                  Response Time: <span className={`font-medium ${getResponseTimeColor(poll.responseTime)}`}>
                    {poll.responseTime}s
                  </span>
                </span>
                <span className="text-gray-600">
                  Points: <span className="font-medium text-purple-600">{poll.points}</span>
                </span>
              </div>
              <button className="text-blue-600 hover:text-blue-800 font-medium">
                Review Question
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Export & Analysis</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            📄 Export to PDF
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
            📊 Download CSV
          </button>
          <button className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600">
            📈 Performance Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default PollHistory;
