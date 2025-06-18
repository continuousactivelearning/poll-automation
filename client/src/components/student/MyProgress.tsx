import React, { useState } from 'react';

interface ProgressData {
  date: string;
  accuracy: number;
  pollsAnswered: number;
  pointsEarned: number;
}

interface SubjectProgress {
  subject: string;
  accuracy: number;
  totalPolls: number;
  correctAnswers: number;
  averageTime: number;
  improvement: number;
}

const MyProgress: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'semester'>('week');

  const progressData: ProgressData[] = [
    { date: '2024-01-15', accuracy: 85, pollsAnswered: 12, pointsEarned: 480 },
    { date: '2024-01-16', accuracy: 78, pollsAnswered: 8, pointsEarned: 320 },
    { date: '2024-01-17', accuracy: 92, pollsAnswered: 15, pointsEarned: 690 },
    { date: '2024-01-18', accuracy: 88, pollsAnswered: 10, pointsEarned: 440 },
    { date: '2024-01-19', accuracy: 95, pollsAnswered: 14, pointsEarned: 665 },
    { date: '2024-01-20', accuracy: 82, pollsAnswered: 9, pointsEarned: 369 },
    { date: '2024-01-21', accuracy: 90, pollsAnswered: 11, pointsEarned: 495 }
  ];

  const subjectProgress: SubjectProgress[] = [
    {
      subject: 'Mathematics',
      accuracy: 92,
      totalPolls: 45,
      correctAnswers: 41,
      averageTime: 12.5,
      improvement: 8
    },
    {
      subject: 'Science',
      accuracy: 88,
      totalPolls: 38,
      correctAnswers: 33,
      averageTime: 15.2,
      improvement: 5
    },
    {
      subject: 'Programming',
      accuracy: 85,
      totalPolls: 52,
      correctAnswers: 44,
      averageTime: 18.7,
      improvement: 12
    },
    {
      subject: 'History',
      accuracy: 79,
      totalPolls: 28,
      correctAnswers: 22,
      averageTime: 14.8,
      improvement: -2
    }
  ];

  const overallStats = {
    totalPolls: 163,
    correctAnswers: 140,
    totalPoints: 3459,
    averageAccuracy: 86,
    currentStreak: 7,
    bestStreak: 15,
    timeSpent: '24h 35m',
    rank: 3,
    improvement: '+12%'
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-600';
    if (improvement < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return '📈';
    if (improvement < 0) return '📉';
    return '➡️';
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🎯</span>
            <div>
              <p className="text-sm text-gray-500">Overall Accuracy</p>
              <p className="text-2xl font-bold text-blue-600">{overallStats.averageAccuracy}%</p>
              <p className="text-xs text-green-600">{overallStats.improvement} this month</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⭐</span>
            <div>
              <p className="text-sm text-gray-500">Total Points</p>
              <p className="text-2xl font-bold text-purple-600">{overallStats.totalPoints}</p>
              <p className="text-xs text-gray-500">Rank #{overallStats.rank}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🔥</span>
            <div>
              <p className="text-sm text-gray-500">Current Streak</p>
              <p className="text-2xl font-bold text-orange-600">{overallStats.currentStreak}</p>
              <p className="text-xs text-gray-500">Best: {overallStats.bestStreak} days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⏱️</span>
            <div>
              <p className="text-sm text-gray-500">Time Spent</p>
              <p className="text-2xl font-bold text-green-600">{overallStats.timeSpent}</p>
              <p className="text-xs text-gray-500">This semester</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">📊 Performance Trends</h3>
          <select
            className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="semester">This Semester</option>
          </select>
        </div>

        <div className="space-y-4">
          {progressData.map((data, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-20 text-sm text-gray-500">
                {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Accuracy: {data.accuracy}%</span>
                  <span>{data.pollsAnswered} polls • {data.pointsEarned} points</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{width: `${data.accuracy}%`}}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject-wise Progress */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">📚 Subject-wise Performance</h3>
        
        <div className="space-y-4">
          {subjectProgress.map((subject, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">{subject.subject}</h4>
                  <p className="text-sm text-gray-500">
                    {subject.correctAnswers}/{subject.totalPolls} correct answers
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center">
                    <span className="text-lg mr-1">{getImprovementIcon(subject.improvement)}</span>
                    <span className={`text-sm font-medium ${getImprovementColor(subject.improvement)}`}>
                      {subject.improvement > 0 ? '+' : ''}{subject.improvement}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Accuracy</p>
                  <p className="font-bold text-blue-600">{subject.accuracy}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg Time</p>
                  <p className="font-bold text-gray-700">{subject.averageTime}s</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Polls</p>
                  <p className="font-bold text-gray-700">{subject.totalPolls}</p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    subject.accuracy >= 90 ? 'bg-green-500' :
                    subject.accuracy >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{width: `${subject.accuracy}%`}}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goals and Targets */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">🎯 Goals & Targets</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-blue-900">Maintain 90% Accuracy</p>
              <p className="text-sm text-blue-700">Current: {overallStats.averageAccuracy}%</p>
            </div>
            <div className="text-2xl">
              {overallStats.averageAccuracy >= 90 ? '✅' : '🎯'}
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
            <div>
              <p className="font-medium text-orange-900">10-day Study Streak</p>
              <p className="text-sm text-orange-700">Current: {overallStats.currentStreak} days</p>
            </div>
            <div className="text-2xl">
              {overallStats.currentStreak >= 10 ? '✅' : '🔥'}
            </div>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
            <div>
              <p className="font-medium text-purple-900">Reach 5000 Points</p>
              <p className="text-sm text-purple-700">Current: {overallStats.totalPoints} points</p>
            </div>
            <div className="text-2xl">
              {overallStats.totalPoints >= 5000 ? '✅' : '⭐'}
            </div>
          </div>
        </div>
      </div>

      {/* Study Recommendations */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
        <h3 className="text-lg font-medium mb-4">💡 Personalized Recommendations</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <span className="text-yellow-300 mr-2">📚</span>
            <p className="text-sm">Focus more on History - your accuracy is below average</p>
          </div>
          <div className="flex items-start">
            <span className="text-yellow-300 mr-2">⚡</span>
            <p className="text-sm">Try to answer faster in Programming polls to earn speed bonuses</p>
          </div>
          <div className="flex items-start">
            <span className="text-yellow-300 mr-2">🎯</span>
            <p className="text-sm">You're close to reaching the top 3! Keep up the great work!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProgress;
