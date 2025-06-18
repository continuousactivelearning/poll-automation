import React, { useState } from 'react';

interface PollResponse {
  id: string;
  pollQuestion: string;
  participantName: string;
  participantAvatar: string;
  selectedOption: string;
  isCorrect: boolean;
  responseTime: number; // in seconds
  timestamp: string;
}

const ResponsesView: React.FC = () => {
  const [selectedPoll, setSelectedPoll] = useState<string>('all');
  const [filterCorrect, setFilterCorrect] = useState<'all' | 'correct' | 'incorrect'>('all');

  const polls = [
    { id: 'poll1', question: 'What is the primary target audience for our new product?' },
    { id: 'poll2', question: 'Which marketing channel should we prioritize?' },
    { id: 'poll3', question: 'What is the most important feature for customers?' },
    { id: 'poll4', question: 'When should we launch the product?' }
  ];

  const responses: PollResponse[] = [
    {
      id: '1',
      pollQuestion: 'What is the primary target audience for our new product?',
      participantName: 'Sarah Johnson',
      participantAvatar: '👩‍💼',
      selectedOption: 'Enterprise customers',
      isCorrect: true,
      responseTime: 12,
      timestamp: '3:45 PM'
    },
    {
      id: '2',
      pollQuestion: 'What is the primary target audience for our new product?',
      participantName: 'Mike Chen',
      participantAvatar: '👨‍💻',
      selectedOption: 'Small businesses',
      isCorrect: false,
      responseTime: 8,
      timestamp: '3:45 PM'
    },
    {
      id: '3',
      pollQuestion: 'Which marketing channel should we prioritize?',
      participantName: 'Emily Davis',
      participantAvatar: '👩‍🎓',
      selectedOption: 'Content marketing',
      isCorrect: true,
      responseTime: 15,
      timestamp: '3:42 PM'
    },
    {
      id: '4',
      pollQuestion: 'Which marketing channel should we prioritize?',
      participantName: 'Alex Rodriguez',
      participantAvatar: '👨‍🔬',
      selectedOption: 'Social media',
      isCorrect: false,
      responseTime: 20,
      timestamp: '3:42 PM'
    },
    {
      id: '5',
      pollQuestion: 'What is the most important feature for customers?',
      participantName: 'Lisa Wang',
      participantAvatar: '👩‍🏫',
      selectedOption: 'User-friendly interface',
      isCorrect: true,
      responseTime: 10,
      timestamp: '3:40 PM'
    },
    {
      id: '6',
      pollQuestion: 'When should we launch the product?',
      participantName: 'David Kim',
      participantAvatar: '👨‍💼',
      selectedOption: 'Q2 2024',
      isCorrect: true,
      responseTime: 18,
      timestamp: '3:38 PM'
    }
  ];

  const filteredResponses = responses.filter(response => {
    const matchesPoll = selectedPoll === 'all' || response.pollQuestion === polls.find(p => p.id === selectedPoll)?.question;
    const matchesCorrect = filterCorrect === 'all' || 
                          (filterCorrect === 'correct' && response.isCorrect) ||
                          (filterCorrect === 'incorrect' && !response.isCorrect);
    return matchesPoll && matchesCorrect;
  });

  const getResponseTimeColor = (time: number) => {
    if (time <= 10) return 'text-green-600';
    if (time <= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalResponses = responses.length;
  const correctResponses = responses.filter(r => r.isCorrect).length;
  const averageResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Poll Responses</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Total Responses</p>
            <p className="text-2xl font-bold text-blue-600">{totalResponses}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Correct</p>
            <p className="text-2xl font-bold text-green-600">{correctResponses}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Incorrect</p>
            <p className="text-2xl font-bold text-red-600">{totalResponses - correctResponses}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Avg Time</p>
            <p className="text-2xl font-bold text-purple-600">{averageResponseTime.toFixed(1)}s</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Poll</label>
            <select
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedPoll}
              onChange={(e) => setSelectedPoll(e.target.value)}
            >
              <option value="all">All Polls</option>
              {polls.map((poll) => (
                <option key={poll.id} value={poll.id}>
                  {poll.question.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Accuracy</label>
            <select
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterCorrect}
              onChange={(e) => setFilterCorrect(e.target.value as any)}
            >
              <option value="all">All Responses</option>
              <option value="correct">Correct Only</option>
              <option value="incorrect">Incorrect Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responses List */}
      <div className="space-y-4">
        {filteredResponses.map((response) => (
          <div key={response.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">{response.participantAvatar}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{response.participantName}</h4>
                    <p className="text-sm text-gray-500">{response.timestamp}</p>
                  </div>
                </div>
                
                <div className="ml-11">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Question:</strong> {response.pollQuestion}
                  </p>
                  <p className="text-sm">
                    <strong>Answer:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-md text-xs font-medium ${
                      response.isCorrect 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {response.selectedOption}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center space-x-2">
                  {response.isCorrect ? (
                    <span className="text-green-600 text-lg">✅</span>
                  ) : (
                    <span className="text-red-600 text-lg">❌</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Response Time</p>
                  <p className={`text-sm font-medium ${getResponseTimeColor(response.responseTime)}`}>
                    {response.responseTime}s
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredResponses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No responses found matching your criteria.</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            📊 Export Responses
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
            📧 Send Summary
          </button>
          <button className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600">
            📈 Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponsesView;
