import React from 'react';

interface ParticipantStats {
  id: string;
  name: string;
  correctAnswers: number;
  totalAnswers: number;
  averageResponseTime: number;
}

const PerformanceDashboard: React.FC = () => {
  // Mock data for demonstration
  const participantStats: ParticipantStats[] = [
    {
      id: '1',
      name: 'John Doe',
      correctAnswers: 8,
      totalAnswers: 10,
      averageResponseTime: 4.2
    },
    {
      id: '2',
      name: 'Jane Smith',
      correctAnswers: 9,
      totalAnswers: 10,
      averageResponseTime: 3.8
    },
    {
      id: '3',
      name: 'Bob Johnson',
      correctAnswers: 7,
      totalAnswers: 10,
      averageResponseTime: 5.1
    },
    {
      id: '4',
      name: 'Alice Williams',
      correctAnswers: 10,
      totalAnswers: 10,
      averageResponseTime: 4.5
    }
  ];

  // Sort by correct answers (descending)
  const sortedParticipants = [...participantStats].sort((a, b) => 
    b.correctAnswers - a.correctAnswers || 
    a.averageResponseTime - b.averageResponseTime
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-6">Performance Dashboard</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Response Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedParticipants.map((participant, index) => (
                <tr key={participant.id} className={index < 3 ? "bg-blue-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {index === 0 && <span className="text-yellow-500">🥇</span>}
                      {index === 1 && <span className="text-gray-400">🥈</span>}
                      {index === 2 && <span className="text-yellow-700">🥉</span>}
                      {index > 2 && `${index + 1}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{participant.correctAnswers}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {Math.round((participant.correctAnswers / participant.totalAnswers) * 100)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{participant.averageResponseTime.toFixed(1)}s</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Poll Participation</h3>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500 italic">Chart will be displayed here</p>
            {/* In a real app, you would use Chart.js or Recharts here */}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Response Time Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500 italic">Chart will be displayed here</p>
            {/* In a real app, you would use Chart.js or Recharts here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;