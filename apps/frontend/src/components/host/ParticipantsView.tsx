import React, { useState } from 'react';

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  joinTime: string;
  totalPolls: number;
  answered: number;
  correct: number;
  accuracy: number;
  lastActivity: string;
  engagement: 'high' | 'medium' | 'low';
}

const ParticipantsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'away' | 'offline'>('all');

  const participants: Participant[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      avatar: '👩‍💼',
      status: 'online',
      joinTime: '2:30 PM',
      totalPolls: 20,
      answered: 19,
      correct: 18,
      accuracy: 95,
      lastActivity: '2 min ago',
      engagement: 'high'
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike.c@company.com',
      avatar: '👨‍💻',
      status: 'online',
      joinTime: '2:25 PM',
      totalPolls: 20,
      answered: 16,
      correct: 13,
      accuracy: 81,
      lastActivity: '1 min ago',
      engagement: 'medium'
    },
    {
      id: '3',
      name: 'Emily Davis',
      email: 'emily.d@company.com',
      avatar: '👩‍🎓',
      status: 'away',
      joinTime: '2:35 PM',
      totalPolls: 20,
      answered: 18,
      correct: 16,
      accuracy: 89,
      lastActivity: '5 min ago',
      engagement: 'high'
    },
    {
      id: '4',
      name: 'Alex Rodriguez',
      email: 'alex.r@company.com',
      avatar: '👨‍🔬',
      status: 'online',
      joinTime: '2:40 PM',
      totalPolls: 20,
      answered: 12,
      correct: 8,
      accuracy: 67,
      lastActivity: '30 sec ago',
      engagement: 'low'
    },
    {
      id: '5',
      name: 'Lisa Wang',
      email: 'lisa.w@company.com',
      avatar: '👩‍🏫',
      status: 'offline',
      joinTime: '2:20 PM',
      totalPolls: 15,
      answered: 10,
      correct: 7,
      accuracy: 70,
      lastActivity: '15 min ago',
      engagement: 'low'
    }
  ];

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || participant.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'away': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-4">Participants Management</h2>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search participants..."
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="away">Away</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-blue-600">{participants.length}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Online</p>
            <p className="text-2xl font-bold text-green-600">
              {participants.filter(p => p.status === 'online').length}
            </p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Away</p>
            <p className="text-2xl font-bold text-yellow-600">
              {participants.filter(p => p.status === 'away').length}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">Offline</p>
            <p className="text-2xl font-bold text-gray-600">
              {participants.filter(p => p.status === 'offline').length}
            </p>
          </div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Polls Answered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Accuracy
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engagement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredParticipants.map((participant) => (
              <tr key={participant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{participant.avatar}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                      <div className="text-sm text-gray-500">{participant.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(participant.status)}`}>
                    {participant.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {participant.joinTime}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {participant.answered}/{participant.totalPolls}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{participant.accuracy}%</span>
                    <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{width: `${participant.accuracy}%`}}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEngagementColor(participant.engagement)}`}>
                    {participant.engagement}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {participant.lastActivity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredParticipants.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No participants found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ParticipantsView;
