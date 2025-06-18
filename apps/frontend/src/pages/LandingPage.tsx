import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'host' | 'participant'>('participant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate(role === 'host' ? '/host' : '/participant');
      } else {
        await signUp(email, password, role);
        navigate(role === 'host' ? '/host' : '/participant');
      }
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(err);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      {/* Background Animation Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-600/20 rounded-full blur-3xl float" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-12 relative z-10">
        <div className="flex flex-col justify-center slide-in-left">
          <div className="mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full border border-blue-200/50 mb-6 fade-in-up stagger-1">
              <span className="text-sm font-medium gradient-text-blue">🚀 AI-Powered Education Platform</span>
            </div>
            <h1 className="text-hero font-heading gradient-text mb-6 fade-in-up stagger-2">
              Smart Poll Generation
            </h1>
            <p className="text-large text-gray-600 mb-8 leading-relaxed fade-in-up stagger-3">
              Transform your virtual meetings with <span className="font-semibold gradient-text-blue">AI-powered real-time polls</span>.
              Get instant feedback, boost engagement, and create interactive learning experiences.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/20 hover-lift fade-in-up stagger-4">
            <h2 className="text-title font-heading gradient-text-purple mb-6">✨ Key Features</h2>
            <div className="space-y-4">
              <div className="flex items-center group hover-scale">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI-Generated Polls</h3>
                  <p className="text-sm text-gray-600">Smart questions based on meeting context</p>
                </div>
              </div>

              <div className="flex items-center group hover-scale">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-xl">📊</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Real-time Analytics</h3>
                  <p className="text-sm text-gray-600">Instant results and engagement insights</p>
                </div>
              </div>

              <div className="flex items-center group hover-scale">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-xl">🎤</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Voice Recognition</h3>
                  <p className="text-sm text-gray-600">Generate polls from your speech</p>
                </div>
              </div>

              <div className="flex items-center group hover-scale">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-xl">🏆</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gamification</h3>
                  <p className="text-sm text-gray-600">Leaderboards and achievement system</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/90 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-white/30 slide-in-right">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 bounce-in">
              <span className="text-white text-2xl">🎯</span>
            </div>
            <h2 className="text-title font-heading gradient-text mb-2">
              {isLogin ? 'Welcome Back!' : 'Join PollGen AI'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to continue your journey' : 'Create your account to get started'}
            </p>
          </div>
          
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 fade-in">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                {error}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6 fade-in-up stagger-1">
              <label className="block text-gray-700 font-medium mb-3" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-8 fade-in-up stagger-2">
              <label className="block text-gray-700 font-medium mb-3" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {!isLogin && (
              <div className="mb-8 fade-in-up stagger-3">
                <label className="block text-gray-700 font-medium mb-4">
                  Choose your role:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover-lift ${
                    role === 'host'
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="host"
                      checked={role === 'host'}
                      onChange={() => setRole('host')}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎯</div>
                      <div className="font-semibold text-gray-900">Meeting Host</div>
                      <div className="text-sm text-gray-600">Create and manage polls</div>
                    </div>
                  </label>

                  <label className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover-lift ${
                    role === 'participant'
                      ? 'border-green-500 bg-gradient-to-r from-green-50 to-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="participant"
                      checked={role === 'participant'}
                      onChange={() => setRole('participant')}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎓</div>
                      <div className="font-semibold text-gray-900">Participant</div>
                      <div className="text-sm text-gray-600">Join and answer polls</div>
                    </div>
                  </label>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover-lift btn-animate disabled:opacity-50 disabled:cursor-not-allowed fade-in-up stagger-4"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                <span>{isLogin ? '🚀 Sign In' : '✨ Create Account'}</span>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center fade-in-up stagger-5">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-purple-600 font-medium transition-colors duration-200"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200/50 text-center fade-in-up stagger-6">
            <p className="text-gray-600 mb-4 font-medium">Or continue with</p>
            <div className="flex justify-center space-x-4">
              <button className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover-lift shadow-lg">
                <span className="text-xl font-bold">Z</span>
              </button>
              <button className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 hover-lift shadow-lg">
                <span className="text-xl font-bold">G</span>
              </button>
              <button className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 transition-all duration-200 hover-lift shadow-lg">
                <span className="text-xl font-bold">M</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
