import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff, Brain, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from '../components/GlassCard';
// Removed: import axios from 'axios'; // No longer directly used here

interface LoginForm {
  email: string;
  password: string;
}

// API_BASE_URL is not directly used in this component anymore, as login is handled by AuthContext
// const API_BASE_URL = 'http://localhost:3000/api/auth'; 

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); // Get the login function from AuthContext
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginForm>();
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect");

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    // Clear previous errors from specific fields and root
    setError('email', { type: 'manual', message: '' });
    setError('password', { type: 'manual', message: '' });
    setError('root.serverError', { type: 'manual', message: '' });

    try {
      // FIXED: Call login from useAuth correctly with email and password
      // The useAuth().login function now handles the axios call, token storage, and user state update.
      await login(data.email, data.password);

      // Redirect based on 'redirect' parameter or default to /host
      if (redirect === 'create-poll') {
        navigate('/host/create-poll');
      } else if (redirect === 'join-poll') {
        navigate('/student/join-poll');
      } else {
        navigate('/host'); 
      }
    } catch (error: any) {
      console.error('Login failed:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';

      // Display error message directly under the fields based on backend response
      if (errorMessage.includes('Invalid credentials')) {
        setError('email', { type: 'manual', message: 'Invalid email or password' });
        setError('password', { type: 'manual', message: '' }); // Clear password error if email is primary issue
      } else if (errorMessage.includes('Please enter all fields')) {
        setError('email', { type: 'manual', message: 'Email and password are required' });
        setError('password', { type: 'manual', message: 'Email and password are required' });
      } else {
        setError('root.serverError', { type: 'manual', message: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md"
      >
        <GlassCard className="p-6 sm:p-8">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6 sm:mb-8"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400 text-sm sm:text-base">Sign in to your account</p>
            {/* Beautiful lines for the user */}
            <p className="mt-4 text-primary-300 text-sm sm:text-base italic font-medium">
              Unlock a world of smart, interactive polling.<br />
              Your next great session is just a sign-in away.<br />
              Let’s make engagement effortless and fun!
            </p>
          </motion.div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2 sm:py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* General server error message (if any) */}
            {errors.root?.serverError && (
              <p className="mt-1 text-sm text-red-400 text-center">{errors.root.serverError.message}</p>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 sm:py-3 px-4 rounded-lg font-medium hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>
          {/* Social Login */}
          <div className="mt-6">
            <div className="flex items-center mb-4">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="mx-3 text-gray-400 text-xs">or sign in with</span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>
            <div className="flex flex-col gap-3">
              {/* Google Login - Backend OAuth endpoint needed */}
              <a
                href="/auth/google" // TODO: Replace with your backend Google OAuth endpoint
                className="flex items-center justify-center gap-2 bg-white text-gray-800 font-semibold py-2 rounded-lg shadow hover:bg-gray-100 transition-all"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Sign in with Google
              </a>
              {/* LinkedIn Login - Backend OAuth endpoint needed */}
              <a
                href="/auth/linkedin" // TODO: Replace with your backend LinkedIn OAuth endpoint
                className="flex items-center justify-center gap-2 bg-[#0077b5] text-white font-semibold py-2 rounded-lg shadow hover:bg-[#005983] transition-all"
              >
                <img src="https://www.svgrepo.com/show/448234/linkedin.svg" alt="LinkedIn" className="w-5 h-5 bg-white rounded" />
                Sign in with LinkedIn
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="mt-4 sm:mt-6 text-center space-y-2">
            <Link
              to="/forgot-password"
              className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
            >
              Forgot your password?
            </Link>
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                to={`/register${redirect ? `?redirect=${redirect}` : ""}`}
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default LoginPage;
