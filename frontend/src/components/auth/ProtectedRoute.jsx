import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIntelStore } from '../../store/useIntelStore';

/**
 * ProtectedRoute - Guard for Vidzai Enterprise Pages
 * Redirects unauthenticated users to the /login page while preserving
 * the intended destination in transition state.
 */
export default function ProtectedRoute({ children }) {
  const isAuthenticated = useIntelStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
