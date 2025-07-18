"use client"

import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { Mail, Lock, Eye, EyeOff, Brain, Loader, User as UserIcon } from "lucide-react"
import { useAuth, validatePassword } from "../contexts/AuthContext"
import { useNotificationContext } from '../contexts/NotificationContext';
import GlassCard from "../components/GlassCard"
import axios from "axios";

interface RegisterForm {
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

const API_BASE_URL = 'http://localhost:3000/api/auth';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // Removed login from useAuth here, as we won't auto-login after registration
  // const { login } = useAuth() 
  const { showNotification } = useNotificationContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, setError, formState: { errors }, watch } = useForm<RegisterForm>();
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect");

  const newPasswordWatch = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('fullName', { type: 'manual', message: '' });
    setError('email', { type: 'manual', message: '' });
    setError('password', { type: 'manual', message: '' });
    setError('confirmPassword', { type: 'manual', message: '' });
    setError('root.serverError', { type: 'manual', message: '' });

    const passwordError = validatePassword(data.password);
    if (passwordError) {
      setError('password', { type: 'manual', message: passwordError });
      setIsLoading(false);
      return;
    }

    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { type: 'manual', message: 'Passwords do not match.' });
      setIsLoading(false);
      return;
    }

    try {
      // Make the registration API call
      await axios.post(`${API_BASE_URL}/register`, {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });

      // Removed automatic login here. User will be redirected to login page.
      // const { token, user: userData } = response.data;
      // login(userData, token);

      showNotification('Registration successful! Please log in with your new account.', 'success');
      // Redirect to login page after successful registration
      navigate(`/login${redirect ? `?redirect=${redirect}` : ""}`);

    } catch (error: any) {
      console.error('Registration failed:', error.response?.data || error.message);
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('User with that email already exists')) { // Updated message check
          setError('email', { type: 'manual', message: 'This email is already registered.' });
        } else {
          setError('root.serverError', { type: 'manual', message: error.response.data.message });
        }
      } else {
        setError('root.serverError', { type: 'manual', message: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm sm:max-w-md"
      >
        <GlassCard className="p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Create Your Account</h1>
            <p className="text-gray-400 text-sm sm:text-base">Sign up to get started with Automatic Poll Generation</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="fullName"
                  {...register('fullName', { required: 'Full Name is required' })}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 pl-12 bg-white/5 text-white border border-white/10 rounded-lg focus:ring-2 focus:ring-primary-500/50 placeholder-gray-400"
                  disabled={isLoading}
                  autoComplete="name"
                />
                <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.fullName && (
                <p className="mt-2 text-sm text-red-400">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address',
                    },
                  })}
                  placeholder="your@example.com"
                  className="w-full px-4 py-3 pl-12 bg-white/5 text-white border border-white/10 rounded-lg focus:ring-2 focus:ring-primary-500/50 placeholder-gray-400"
                  disabled={isLoading}
                  autoComplete="email"
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  {...register('password', {
                    required: 'Password is required',
                  })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pl-12 pr-12 bg-white/5 text-white border border-white/10 rounded-lg focus:ring-2 focus:ring-primary-500/50 placeholder-gray-400"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  {...register('confirmPassword', {
                    required: 'Confirm Password is required',
                    validate: (value) =>
                      value === newPasswordWatch || 'Passwords do not match',
                  })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pl-12 pr-12 bg-white/5 text-white border border-white/10 rounded-lg focus:ring-2 focus:ring-primary-500/50 placeholder-gray-400"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* General Server Error */}
            {errors.root?.serverError && (
              <p className="mt-2 text-sm text-red-400 text-center">{errors.root.serverError.message}</p>
            )}

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                  Signing Up...
                </div>
              ) : (
                'Sign Up'
              )}
            </motion.button>
          </form>

          {/* Social Logins */}
          <div className="text-center text-gray-400 text-sm my-3 sm:my-4 md:my-6">
            Or sign up with
          </div>
          <div className="space-y-3 sm:space-y-4">
            {/* Google Register - Backend OAuth endpoint needed */}
            <a
              href={`${API_BASE_URL}/google`} // TODO: Verify this URL with your backend
              className="flex items-center justify-center gap-2 bg-white text-gray-800 font-semibold py-2 rounded-lg shadow hover:bg-gray-100 transition-all"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Sign up with Google
            </a>
            {/* LinkedIn Register - Backend OAuth endpoint needed */}
            <a
              href={`${API_BASE_URL}/linkedin`} // TODO: Verify this URL with your backend
              className="flex items-center justify-center gap-2 bg-[#0077b5] text-white font-semibold py-2 rounded-lg shadow hover:bg-[#005983] transition-all"
            >
              <img src="https://www.svgrepo.com/show/448234/linkedin.svg" alt="LinkedIn" className="w-5 h-5 bg-white rounded" />
              Sign up with LinkedIn
            </a>
          </div>

          {/* Links */}
          <div className="mt-3 sm:mt-4 md:mt-6 text-center">
            <p className="text-gray-400 text-xs sm:text-sm">
              Already have an account?{" "}
              <Link
                to={`/login${redirect ? `?redirect=${redirect}` : ""}`}
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
