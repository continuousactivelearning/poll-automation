// apps/frontend/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import type { ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser.id === 'string' && typeof parsedUser.email === 'string' && typeof parsedUser.fullName === 'string') {
          setUser(parsedUser);
          setToken(storedToken);
        } else {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (e) {
        console.error("Failed to parse stored user or token:", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`http://localhost:3000/api/auth/login`, { email, password });
      const { user: userData, token: userToken } = response.data;

      setUser(userData);
      setToken(userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userToken);
    } catch (error: any) {
      console.error('Login failed in AuthContext:', error.response?.data?.message || error.message);
      setUser(null);
      setToken(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  // NEW: Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    user,
    token,
    login, // login is already memoized by useCallback
    logout, // logout is already memoized by useCallback
    isAuthenticated: !!user && !!token, // Derived state
    isLoading,
  }), [user, token, login, logout, isLoading]); // Dependencies for useMemo

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function validatePassword(password: string): string | null {
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character.';
  }
  return null;
}
