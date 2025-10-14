// File: apps/frontend/src/components/PublicRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FullPageLoader from './FullPageLoader';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loader while we check auth status
  if (isLoading) {
    return <FullPageLoader />;
  }

  // If the user IS authenticated, redirect them away from the public page
  if (isAuthenticated) {
    // Redirect based on their role
    const redirectTo = user?.role === 'host' ? '/host' : '/student';
    return <Navigate to={redirectTo} replace />;
  }

  // If the user is NOT authenticated, show the child component (Login, Register page, etc.)
  return <>{children}</>;
};

export default PublicRoute;