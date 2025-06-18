import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'host' | 'participant' | null;

interface User {
  uid: string;
  email: string | null;
  role: UserRole;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  setUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock authentication - check localStorage for existing user
    const savedUser = localStorage.getItem('mockUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mock sign in - just create a user object
    const role = localStorage.getItem('userRole') as UserRole || 'participant';
    const mockUser: User = {
      uid: 'mock-user-' + Date.now(),
      email: email,
      role: role
    };
    setCurrentUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
  };

  const signUp = async (email: string, password: string, role: UserRole) => {
    // Mock sign up - create a user object
    const mockUser: User = {
      uid: 'mock-user-' + Date.now(),
      email: email,
      role: role || 'participant'
    };
    setCurrentUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    if (role) {
      localStorage.setItem('userRole', role);
    }
  };

  const signOut = async () => {
    setCurrentUser(null);
    localStorage.removeItem('mockUser');
    localStorage.removeItem('userRole');
  };

  const setUserRole = (role: UserRole) => {
    if (role) {
      localStorage.setItem('userRole', role);
    } else {
      localStorage.removeItem('userRole');
    }

    if (currentUser) {
      setCurrentUser({...currentUser, role});
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signUp,
    signOut,
    setUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
