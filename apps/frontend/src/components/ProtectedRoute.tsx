// File: apps/frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FullPageLoader from './FullPageLoader'; // We will create this next

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('host' | 'student')[]; // Optional: Add role-based protection
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // 1. If auth state is still loading, show a loading spinner
  // This prevents a brief flash of the login page for already-logged-in users
  if (isLoading) {
    return <FullPageLoader />;
  }

  // 2. If the user is not authenticated, redirect them to the login page
  if (!isAuthenticated) {
    // We store the page they were trying to access in the state.
    // This allows us to redirect them back after they log in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 3. (Optional but recommended) If a list of allowed roles is provided, check the user's role
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // User is logged in but doesn't have the right role.
    // You could redirect them to a generic dashboard or an "unauthorized" page.
    // For now, we'll send them to the root.
     const redirectTo = user.role === 'host' ? '/host' : '/student';
    return <Navigate to={redirectTo} replace />;
  }

  // 4. If all checks pass, render the child component (the actual page)
  return <>{children}</>;
};

export default ProtectedRoute;