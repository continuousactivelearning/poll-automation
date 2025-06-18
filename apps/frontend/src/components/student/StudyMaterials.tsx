import React, { useState } from 'react';

interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'quiz' | 'interactive';
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  isCompleted: boolean;
  progress: number;
  rating: number;
  downloadUrl?: string;
  thumbnailUrl?: string;
}

const StudyMaterials: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const studyMaterials: StudyMaterial[] = [
    {
      id: '1',
      title: 'Introduction to React Hooks',
      description: 'Learn the fundamentals of React Hooks including useState, useEffect, and custom hooks.',
      type: 'video',
      category: 'Programming',
      difficulty: 'Beginner',
      duration: '45 min',
      isCompleted: true,
      progress: 100,
      rating: 4.8,
      thumbnailUrl: '🎥'
    },
    {
      id: '2',
      title: 'TypeScript Best Practices',
      description: 'Comprehensive guide to writing clean and maintainable TypeScript code.',
      type: 'document',
      category: 'Programming',
      difficulty: 'Intermediate',
      duration: '30 min',
      isCompleted: false,
      progress: 65,
      rating: 4.9,
      thumbnailUrl: '📄'
    },
    {
      id: '3',
      title: 'Calculus Practice Quiz',
      description: 'Test your understanding of derivatives and integrals with this interactive quiz.',
      type: 'quiz',
      category: 'Mathematics',
      difficulty: 'Advanced',
      duration: '20 min',
      isCompleted: false,
      progress: 0,
      rating: 4.6,
      thumbnailUrl: '📝'
    },
    {
      id: '4',
      title: 'Interactive Chemistry Lab',
      description: 'Virtual chemistry experiments to understand molecular structures and reactions.',
      type: 'interactive',
      category: 'Science',
      difficulty: 'Intermediate',
      duration: '60 min',
      isCompleted: false,
      progress: 25,
      rating: 4.7,
      thumbnailUrl: '🧪'
    },
    {
      id: '5',
      title: 'World War II Timeline',
      description: 'Interactive timeline covering major events of World War II.',
      type: 'interactive',
      category: 'History',
      difficulty: 'Beginner',
      duration: '35 min',
      isCompleted: true,
      progress: 100,
      rating: 4.5,
      thumbnailUrl: '📚'
    },
    {
      id: '6',
      title: 'Advanced JavaScript Concepts',
      description: 'Deep dive into closures, prototypes, and asynchronous programming.',
      type: 'video',
      category: 'Programming',
      difficulty: 'Advanced',
      duration: '90 min',
      isCompleted: false,
      progress: 40,
      rating: 4.9,
      thumbnailUrl: '🎥'
    }
  ];

  const categories = ['all', ...Array.from(new Set(studyMaterials.map(material => material.category)))];
  const types = ['all', 'video', 'document', 'quiz', 'interactive'];

  const filteredMaterials = studyMaterials.filter(material => {
    const matchesCategory = filterCategory === 'all' || material.category === filterCategory;
    const matchesType = filterType === 'all' || material.type === filterType;
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesType && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'document': return '📄';
      case 'quiz': return '📝';
      case 'interactive': return '🎮';
      default: return '📚';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800';
      case 'document': return 'bg-blue-100 text-blue-800';
      case 'quiz': return 'bg-purple-100 text-purple-800';
      case 'interactive': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}>
        ⭐
      </span>
    ));
  };

  const completedCount = studyMaterials.filter(m => m.isCompleted).length;
  const totalProgress = studyMaterials.reduce((sum, m) => sum + m.progress, 0) / studyMaterials.length;

  return (
    <div className="space-y-6">
      {/* Study Progress Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{studyMaterials.length}</p>
            <p className="text-sm text-gray-500">Total Materials</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{Math.round(totalProgress)}%</p>
            <p className="text-sm text-gray-500">Overall Progress</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">4.7</p>
            <p className="text-sm text-gray-500">Avg Rating</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search study materials..."
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Study Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => (
          <div key={material.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{material.thumbnailUrl}</div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(material.type)}`}>
                    {getTypeIcon(material.type)} {material.type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(material.difficulty)}`}>
                    {material.difficulty}
                  </span>
                </div>
              </div>

              {/* Content */}
              <h3 className="font-bold text-lg text-gray-900 mb-2">{material.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{material.description}</p>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{material.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      material.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{width: `${material.progress}%`}}
                  ></div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{material.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{material.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rating:</span>
                  <div className="flex items-center">
                    {renderStars(material.rating)}
                    <span className="ml-1 text-xs text-gray-500">({material.rating})</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button className={`w-full py-2 px-4 rounded-md font-medium text-white ${
                  material.isCompleted 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : material.progress > 0 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'bg-purple-500 hover:bg-purple-600'
                }`}>
                  {material.isCompleted ? '✅ Completed' : material.progress > 0 ? '▶️ Continue' : '🚀 Start'}
                </button>
                
                {material.type === 'document' && (
                  <button className="w-full py-2 px-4 rounded-md font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
                    📥 Download
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No study materials found</h3>
          <p className="text-gray-600">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Study Recommendations */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg shadow-sm p-6 text-white">
        <h3 className="text-lg font-medium mb-4">📖 Recommended for You</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Based on your performance:</h4>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• Review calculus fundamentals to improve math scores</li>
              <li>• Practice more programming quizzes for speed</li>
              <li>• Explore advanced topics in your strongest subjects</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Popular this week:</h4>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• "React Performance Optimization" (Video)</li>
              <li>• "Statistics Made Simple" (Interactive)</li>
              <li>• "World History Quiz Challenge" (Quiz)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyMaterials;
