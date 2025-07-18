import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff, Brain, Loader, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNotificationContext } from '../contexts/NotificationContext';
import GlassCard from '../components/GlassCard';
import axios from 'axios';

interface ResetPasswordForm {
  newPassword: string;
  confirmNewPassword: string;
}

const API_BASE_URL = 'http://localhost:3000/api/auth'; // Your backend API base URL

const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false); // State for New Password eye icon
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for Confirm New Password eye icon
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { token } = useParams<{ token: string }>();
  const { showNotification } = useNotificationContext();
  const navigate = useNavigate();

  const { register, handleSubmit, setError, formState: { errors }, watch } = useForm<ResetPasswordForm>();

  const newPasswordWatch = watch('newPassword'); // Watch new password for real-time strength and match validation

  // Function to determine password strength
  const getPasswordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++; // Minimum length
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++; // Mixed case
    if (/\d/.test(pw)) score++; // Numbers
    if (/[^a-zA-Z0-9]/.test(pw)) score++; // Special characters

    if (score <= 1) return "Weak";
    if (score === 2) return "Medium";
    if (score >= 3) return "Strong";
    return ""; // For empty password
  };

  useEffect(() => {
    console.log('ResetPasswordPage loaded.');
    if (token) {
      console.log('Token found in URL params:', token);
    } else {
      console.log('No token found in URL params.');
    }
  }, [token]);


  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    // Clear previous errors
    setError('newPassword', { type: 'manual', message: '' });
    setError('confirmNewPassword', { type: 'manual', message: '' });
    setError('root.serverError', { type: 'manual', message: '' });

    if (data.newPassword !== data.confirmNewPassword) {
      setError('confirmNewPassword', { type: 'manual', message: 'Passwords do not match.' });
      setIsLoading(false);
      return;
    }

    if (!token) {
      showNotification('Password reset token is missing. Please request a new link.', 'error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/resetpassword/${token}`, {
        newPassword: data.newPassword,
      });

      setIsSuccess(true);
      showNotification(response.data.message || 'Password has been reset successfully!', 'success');

      localStorage.removeItem('token'); // Clear any existing token from local storage

      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error: any) {
      console.error('Password reset failed:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Invalid or expired token.';

      // The "New password cannot be the same as your old password" check is now removed from backend,
      // so this specific error handling is removed from frontend too.
      // if (errorMessage.includes('New password cannot be the same as your old password')) {
      //   setError('newPassword', { type: 'manual', message: errorMessage });
      // } else 
      if (errorMessage.includes('Invalid or expired password reset token')) {
        setError('root.serverError', { type: 'manual', message: 'Invalid or expired reset link. Please request a new one.' });
      } else if (errorMessage.includes('Please provide a new password')) {
        setError('newPassword', { type: 'manual', message: 'New password is required.' });
      } else {
        showNotification(errorMessage, 'error');
        setError('root.serverError', { type: 'manual', message: errorMessage });
      }
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <GlassCard className="p-8">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {isSuccess ? (
                <CheckCircle className="w-8 h-8 text-white" />
              ) : (
                <Brain className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isSuccess ? 'Password Reset!' : 'Set New Password'}
            </h1>
            <p className="text-gray-400">
              {isSuccess 
                ? 'Your password has been successfully updated. Redirecting to login...'
                : 'Enter your new password below'
              }
            </p>
          </motion.div>

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-sm">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to login</span>
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('newPassword', { 
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    className="w-full pl-10 pr-10 py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {newPasswordWatch && ( // Display strength only if password is not empty
                  <p
                    className={`mt-1 text-sm ${
                      getPasswordStrength(newPasswordWatch) === "Strong"
                        ? "text-green-400"
                        : getPasswordStrength(newPasswordWatch) === "Medium"
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    Strength: {getPasswordStrength(newPasswordWatch)}
                  </p>
                )}
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmNewPassword', { 
                      required: 'Confirm new password is required',
                      validate: value => value === newPasswordWatch || 'Passwords do not match' // Real-time match validation
                    })}
                    className="w-full pl-10 pr-10 py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmNewPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmNewPassword.message}</p>
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
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    Resetting password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </motion.button>

              {/* Back Link */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
