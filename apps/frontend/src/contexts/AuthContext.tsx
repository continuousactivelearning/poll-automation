// apps/frontend/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios'; // Import axios

// Define the structure of the User object
interface User {
  id: string; // From backend _id
  email: string;
  fullName: string;
}

// Define the interface for the AuthContext value
interface AuthContextType {
  user: User | null;
  token: string | null;
  // FIXED: Changed login function signature to accept email and password directly
  login: (email: string, password: string) => Promise<void>; 
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap your application
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to initialize authentication state from localStorage on mount
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
          // Clear invalid stored data
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

  // Effect to set up Axios interceptor whenever the token changes
  useEffect(() => {
    // Request interceptor to add Authorization header
    const interceptor = axios.interceptors.request.use(
      (config) => {
        // Get the current token from localStorage (most up-to-date)
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

    // Cleanup function to remove the interceptor when the component unmounts
    // or when this effect re-runs (e.g., token changes)
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]); // Re-run this effect if the token changes

  // FIXED: Modified login function to accept email and password directly
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
      throw error; // Re-throw to allow component to catch and display error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register function (kept for reference, but not directly used by RegisterPage for auto-login anymore)
  // This function is not used by RegisterPage.tsx for auto-login after registration.
  // RegisterPage now only calls the backend register API and then navigates to login.
  const register = useCallback(async (fullName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // This function might not be called directly from RegisterPage if RegisterPage handles its own axios call
      // and then navigates to login. If you intend to use this, ensure RegisterPage calls it.
      await axios.post(`http://localhost:3000/api/auth/register`, { fullName, email, password });
      // No setUser/setToken here as per new registration flow (redirect to login)
    } catch (error: any) {
      console.error('Registration failed in AuthContext:', error.response?.data?.message || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setUser(null);
    setToken(null); // Clear token state, which will trigger the interceptor useEffect
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  const isAuthenticated = !!user && !!token;

  const contextValue: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Password validation utility (can remain here or be moved to a separate utility file)
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
