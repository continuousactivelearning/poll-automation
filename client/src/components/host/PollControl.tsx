import React, { useState } from 'react';

interface PollQuestion {
  id: string;
  question: string;
  options: string[];
  isAuto: boolean;
}

const PollControl: React.FC = () => {
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [pollFrequency, setPollFrequency] = useState(5);
  const [suggestedPolls, setSuggestedPolls] = useState<PollQuestion[]>([
    {
      id: '1',
      question: 'What is the primary target audience for our new product?',
      options: ['Small businesses', 'Enterprise customers', 'Individual consumers', 'Government agencies'],
      isAuto: true
    },
    {
      id: '2',
      question: 'Which marketing channel should we prioritize?',
      options: ['Social media', 'Email campaigns', 'Content marketing', 'Paid advertising'],
      isAuto: true
    }
  ]);
  const [activePoll, setActivePoll] = useState<PollQuestion | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customOptions, setCustomOptions] = useState(['', '', '', '']);

  const launchPoll = (poll: PollQuestion) => {
    setActivePoll(poll);
    // In a real app, this would send the poll to participants via Socket.IO
  };

  const endPoll = () => {
    setActivePoll(null);
    // In a real app, this would notify participants that the poll has ended
  };

  const handleCustomOptionChange = (index: number, value: string) => {
    const newOptions = [...customOptions];
    newOptions[index] = value;
    setCustomOptions(newOptions);
  };

  const createCustomPoll = () => {
    if (!customQuestion || customOptions.filter(opt => opt.trim()).length < 2) {
      return;
    }

    const newPoll: PollQuestion = {
      id: Date.now().toString(),
      question: customQuestion,
      options: customOptions.filter(opt => opt.trim()),
      isAuto: false
    };

    setSuggestedPolls([...suggestedPolls, newPoll]);
    setCustomQuestion('');
    setCustomOptions(['', '', '', '']);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Poll Settings</h2>
        
        <div className="flex items-center mb-4">
          <div className="mr-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="pollMode"
                checked={isAutoMode}
                onChange={() => setIsAutoMode(true)}
              />
              <span className="ml-2">Automatic Mode</span>
            </label>
          </div>
          <div>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="pollMode"
                checked={!isAutoMode}
                onChange={() => setIsAutoMode(false)}
              />
              <span className="ml-2">Manual Mode</span>
            </label>
          </div>
        </div>
        
        {isAutoMode && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">
              Poll Frequency (minutes)
            </label>
            <input
              type="range"
              min="1"
              max="15"
              value={pollFrequency}
              onChange={(e) => setPollFrequency(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
            </div>
            <p className="mt-2 text-gray-600">
              A new poll will be generated every {pollFrequency} minute{pollFrequency !== 1 ? 's' : ''}.
            </p>
          </div>
        )}
      </div>
      
      {activePoll ? (
        <div className="mb-6 p-4 border border-blue-200 rounded-md bg-blue-50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-medium text-gray-900">Active Poll</h3>
              <p className="text-blue-800 font-medium mt-1">{activePoll.question}</p>
            </div>
            <button
              onClick={endPoll}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
            >
              End Poll
            </button>
          </div>
          
          <div className="space-y-2">
            {activePoll.options.map((option, index) => (
              <div key={index} className="flex items-center">
                <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full mr-2 text-sm font-medium">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Suggested Polls</h3>
          
          {suggestedPolls.length > 0 ? (
            <div className="space-y-4">
              {suggestedPolls.map((poll) => (
                <div key={poll.id} className="p-4 border rounded-md hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{poll.question}</p>
                      <div className="mt-2 space-y-1">
                        {poll.options.map((option, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {String.fromCharCode(65 + index)}. {option}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center">
                      {poll.isAuto && (
                        <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                          Auto
                        </span>
                      )}
                      <button
                        onClick={() => launchPoll(poll)}
                        className="bg-primary hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Launch
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No suggested polls available.</p>
          )}
        </div>
      )}
      
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Create Custom Poll</h3>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="customQuestion">
            Question
          </label>
          <input
            id="customQuestion"
            type="text"
            placeholder="Enter your question"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Options (at least 2)
          </label>
          {customOptions.map((option, index) => (
            <div key={index} className="mb-2 flex items-center">
              <span className="mr-2 text-gray-500">{index + 1}.</span>
              <input
                type="text"
                placeholder={`Option ${index + 1}`}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={option}
                onChange={(e) => handleCustomOptionChange(index, e.target.value)}
              />
            </div>
          ))}
        </div>
        
        <button
          onClick={createCustomPoll}
          className="bg-secondary hover:bg-green-600 text-white px-4 py-2 rounded-md"
        >
          Create Poll
        </button>
      </div>
    </div>
  );
};

export default PollControl;
