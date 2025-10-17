import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { updateUser, setAuthToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      // Save token (use the same key the app expects) and update context
      setAuthToken(token);

      (async () => {
        try {
          // Set token in localStorage first using the correct key that AuthContext expects
          localStorage.setItem('token', token);
          
          const res = await fetch(`${API_BASE}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            // Update local storage and AuthContext so Settings page shows user info
            localStorage.setItem('user', JSON.stringify(data));
            // update user in context so Settings and other pages can read it
            updateUser({ 
              fullName: data.fullName, 
              avatar: data.avatar, 
              email: data.email,
              role: data.role 
            });
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          // Still navigate even if profile fetch fails
        } finally {
          // Token processing complete - navigation handled by separate effect
        }
      })();
    } else {
      navigate('/login');
    }
  }, [navigate, updateUser, setAuthToken]);

  // Separate effect to handle navigation once authentication is confirmed
  const { isAuthenticated, user } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    
    // Only navigate once authentication is confirmed and we haven't navigated yet
    if (isAuthenticated && user && !hasNavigated) {
      setHasNavigated(true);
      
      if (redirect === 'create-poll') {
        // User came from "Create Poll" button - go to host dashboard
        navigate('/host');
      } else if (redirect === 'join-poll') {
        // User came from "Join Poll" button - go to student dashboard
        navigate('/student');
      } else {
        // No redirect parameter - determine from user role
        if (user.role === 'host') {
          navigate('/host');
        } else {
          navigate('/student');
        }
      }
    }
  }, [isAuthenticated, user, navigate, hasNavigated]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-white">Signing you in...</div>
    </div>
  );
};

export default GoogleAuthCallback;