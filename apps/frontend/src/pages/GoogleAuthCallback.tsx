import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser, setAuthToken, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    const intent = params.get('intent'); // Get intent from URL parameters
    const provider = params.get('provider') || 'google'; // Default to google for backward compatibility

    // Handle errors first
    if (error) {
      console.error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth error:`, error);
      setStatus('Authentication failed. Redirecting to login...');
      setTimeout(() => {
        navigate('/login?error=' + error);
      }, 2000);
      return;
    }

    if (token) {
      setStatus('Completing sign-in...');
      
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (res.ok) {
            const userData = await res.json();
            
            console.log(`✅ ${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth success for user:`, userData.email, 'Role:', userData.role);
            console.log('🎯 Intent received:', intent);
            
            // Set authentication data FIRST
            setAuthToken(token);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Update AuthContext user state
            updateUser({ 
              fullName: userData.fullName, 
              avatar: userData.avatar, 
              email: userData.email,
              role: userData.role 
            });
            
            // Determine redirect path based on intent
            let redirectPath;
            
            if (intent === 'create-poll') {
              redirectPath = '/host/create-poll';
            } else if (intent === 'join-poll') {
              redirectPath = '/student/join-poll';
            } else {
              // Default redirect based on user role
              redirectPath = userData.role === 'student' ? '/student' : '/host';
            }
            
            console.log('🔄 Navigating to intended path:', redirectPath);
            
            setStatus('Sign-in successful! Redirecting...');
            
            // Wait longer to ensure authentication state is fully established
            setTimeout(() => {
              console.log('🔐 Authentication state before redirect:', { isAuthenticated, user: userData });
              navigate(redirectPath, { replace: true });
            }, 1500);
            
          } else {
            console.error('Failed to fetch user profile:', res.status);
            setStatus('Profile fetch failed. Redirecting to login...');
            setTimeout(() => navigate('/login?error=profile_fetch_failed'), 2000);
          }
        } catch (err) {
          console.error('Profile fetch error:', err);
          setStatus('Connection error. Redirecting to login...');
          setTimeout(() => navigate('/login?error=connection_failed'), 2000);
        }
      })();
    } else {
      console.error(`No token received from ${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth`);
      setStatus('No authentication token received. Redirecting to login...');
      setTimeout(() => navigate('/login?error=no_token'), 2000);
    }
  }, [navigate, updateUser, setAuthToken, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-white text-lg">{status}</div>
        <div className="text-gray-400 text-sm mt-2">Please wait while we complete your sign-in...</div>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;