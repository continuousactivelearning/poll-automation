import React, { useState, useEffect } from 'react';

interface Poll {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  timeLimit: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  points: number;
}

const ActivePoll: React.FC = () => {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [meetingCode, setMeetingCode] = useState('');

  // Mock poll for demonstration
  useEffect(() => {
    if (isConnected) {
      const mockPoll: Poll = {
        id: '1',
        question: 'What is the primary benefit of using TypeScript with React?',
        options: [
          'Faster runtime performance',
          'Type safety and better IDE support',
          'Smaller bundle size',
          'Built-in state management'
        ],
        correctAnswer: 1,
        timeLimit: 30,
        difficulty: 'Medium',
        category: 'Programming',
        points: 50
      };
      
      setActivePoll(mockPoll);
      setTimeLeft(30);
      setSubmitted(false);
      setSelectedOption(null);
      setFeedback(null);
      
      // Countdown timer
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isConnected]);

  const handleJoinMeeting = () => {
    if (meetingCode.trim()) {
      setIsConnected(true);
    }
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    
    setSubmitted(true);
    
    // Check if answer is correct
    if (activePoll?.correctAnswer === selectedOption) {
      setFeedback(`🎉 Correct! You earned ${activePoll.points} points!`);
    } else {
      setFeedback(`❌ Incorrect. The correct answer was: ${activePoll?.options[activePoll.correctAnswer || 0]}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join a Poll Session</h2>
            <p className="text-gray-600">Enter the meeting code provided by your instructor</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="meetingCode">
                Meeting Code
              </label>
              <input
                id="meetingCode"
                type="text"
                placeholder="e.g., ABC123 or 123-456-789"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
              />
            </div>
            
            <button
              onClick={handleJoinMeeting}
              disabled={!meetingCode.trim()}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white ${
                meetingCode.trim() 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Join Poll Session
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">💡 How to Join:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Get the meeting code from your instructor</li>
              <li>2. Enter the code above</li>
              <li>3. Start answering polls in real-time!</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="h-3 w-3 bg-green-400 rounded-full mr-2"></span>
            <span className="text-green-800 font-medium">Connected to session: {meetingCode}</span>
          </div>
          <button
            onClick={() => setIsConnected(false)}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Leave Session
          </button>
        </div>
      </div>

      {activePoll ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            {/* Poll Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(activePoll.difficulty)}`}>
                    {activePoll.difficulty}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {activePoll.category}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    {activePoll.points} points
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Poll #{activePoll.id}</h2>
              </div>
              
              {timeLeft !== null && timeLeft > 0 && !submitted && (
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  timeLeft <= 10 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  ⏰ {timeLeft}s remaining
                </div>
              )}
            </div>
            
            <p className="text-lg mb-6 text-gray-700">{activePoll.question}</p>
            
            {!submitted ? (
              <>
                <div className="space-y-3 mb-6">
                  {activePoll.options.map((option, index) => (
                    <label 
                      key={index}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedOption === index 
                          ? 'bg-blue-50 border-blue-500 shadow-md' 
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="poll-option"
                          value={index}
                          checked={selectedOption === index}
                          onChange={() => setSelectedOption(index)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700 font-medium">
                          {String.fromCharCode(65 + index)}. {option}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={selectedOption === null || timeLeft === 0}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                    selectedOption === null || timeLeft === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {timeLeft === 0 ? 'Time\'s Up!' : 'Submit Answer'}
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className={`p-6 mb-6 rounded-lg ${
                  feedback?.includes('Correct') 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : 'bg-red-50 border-2 border-red-200'
                }`}>
                  <div className="text-4xl mb-2">
                    {feedback?.includes('Correct') ? '🎉' : '😔'}
                  </div>
                  <p className={`text-lg font-medium ${
                    feedback?.includes('Correct') ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {feedback}
                  </p>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Waiting for the next poll...
                </p>
                
                <div className="flex justify-center space-x-1">
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Waiting for a poll to start
          </h2>
          <p className="text-gray-600 mb-6">
            Your instructor will start a poll soon. Stay tuned!
          </p>
          <div className="flex justify-center space-x-1">
            <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivePoll;
