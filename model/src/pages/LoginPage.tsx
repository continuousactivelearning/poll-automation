import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'host' | 'student'>('student');
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let success = false;
      
      if (isLogin) {
        success = await login(email, password);
      } else {
        success = await register(email, password, name, role);
      }
      
      if (success) {
        toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
        navigate(role === 'host' ? '/host' : '/student');
      } else {
        toast.error('Invalid credentials. Try host@demo.com / demo123 or student@demo.com / demo123');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animated-gradient">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-electric-cyan to-vibrant-magenta rounded-full mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">EngageSphere</h1>
          <p className="text-gray-300">Interactive Polling Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input w-full"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-electric-cyan transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'host' | 'student')}
                className="glass-input w-full"
              >
                <option value="student">Student</option>
                <option value="host">Host/Teacher</option>
              </select>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processing...
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-electric-cyan hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-charcoal/50 rounded-lg">
          <p className="text-xs text-gray-400 mb-2">Demo Credentials:</p>
          <p className="text-xs text-gray-300">Host: host@demo.com / demo123</p>
          <p className="text-xs text-gray-300">Student: student@demo.com / demo123</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;