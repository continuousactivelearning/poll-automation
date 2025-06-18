import React, { useState } from 'react';
import AudioRecorder from './AudioRecorder';

const LiveMeeting: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [generatedPolls, setGeneratedPolls] = useState<any[]>([]);

  const connectToMeeting = () => {
    if (!meetingId.trim()) {
      alert('Please enter a Zoom Meeting ID');
      return;
    }

    // In a real app, this would connect to Zoom API
    setIsConnected(true);

    // Mock transcript data
    const mockTranscript = [
      "Hello everyone, welcome to today's meeting about the new product launch.",
      "We'll be discussing the marketing strategy and timeline.",
      "Let's start by reviewing the key features of our product.",
      "What do you think about the pricing strategy?",
      "Should we focus more on enterprise customers or small businesses?"
    ];

    setTranscript(mockTranscript);
  };

  const handlePollsGenerated = (polls: any[]) => {
    setGeneratedPolls(polls);
    console.log('Generated polls:', polls);
  };

  const disconnectFromMeeting = () => {
    setIsConnected(false);
    setMeetingId('');
    setTranscript([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Meeting Connection</h2>
        
        {!isConnected ? (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <h3 className="text-blue-800 font-medium mb-2">📋 How it works:</h3>
              <ol className="text-blue-700 text-sm space-y-1">
                <li><strong>Step 1:</strong> Enter your Zoom Meeting ID below</li>
                <li><strong>Step 2:</strong> Click "Connect to Meeting" to join</li>
                <li><strong>Step 3:</strong> Go to "Poll Control" tab to start generating polls</li>
                <li><strong>Step 4:</strong> Polls will be created automatically based on conversation</li>
              </ol>
            </div>

            <p className="text-gray-600 mb-4">
              Connect to your Zoom meeting to start generating polls based on the conversation.
            </p>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="meetingId">
                Zoom Meeting ID
              </label>
              <input
                id="meetingId"
                type="text"
                placeholder="e.g., 123-456-789 or 123456789"
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                You can find this in your Zoom meeting invitation or Zoom app
              </p>
            </div>

            <button
              onClick={connectToMeeting}
              disabled={!meetingId.trim()}
              className={`px-4 py-2 rounded-md text-white ${
                meetingId.trim()
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Connect to Meeting
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <span className="h-2 w-2 mr-1 bg-green-400 rounded-full"></span>
                  Connected
                </span>
                <span className="ml-2 text-gray-600">Meeting ID: {meetingId}</span>
              </div>
              
              <button
                onClick={disconnectFromMeeting}
                className="text-red-600 hover:text-red-800"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
      
      {isConnected && (
        <div className="space-y-6">
          {/* Audio Recorder Component */}
          <AudioRecorder
            meetingId={meetingId}
            onPollsGenerated={handlePollsGenerated}
          />

          {/* Generated Polls Display */}
          {generatedPolls.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                🤖 AI Generated Polls ({generatedPolls.length})
              </h3>
              <div className="space-y-4">
                {generatedPolls.map((poll, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">{poll.question}</h4>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          poll.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          poll.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {poll.difficulty}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {poll.category}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {poll.options.map((option: string, optIndex: number) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded border text-sm ${
                            optIndex === poll.correctAnswer
                              ? 'bg-green-100 border-green-300 text-green-800'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                          {optIndex === poll.correctAnswer && ' ✓'}
                        </div>
                      ))}
                    </div>
                    {poll.explanation && (
                      <p className="text-sm text-gray-600 italic">
                        <strong>Explanation:</strong> {poll.explanation}
                      </p>
                    )}
                    <div className="mt-3 flex space-x-2">
                      <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                        Launch Poll
                      </button>
                      <button className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Transcript */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">📝 Live Transcript</h3>
            <div className="bg-gray-50 rounded-md p-4 h-64 overflow-y-auto">
              {transcript.length > 0 ? (
                <div className="space-y-3">
                  {transcript.map((line, index) => (
                    <p key={index} className="text-gray-700">{line}</p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Waiting for transcript...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMeeting;