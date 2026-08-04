// File: frontend/src/routes/ProtectedRoute.tsx
// Route wrapper for React Router v6 to protect routes and enforce role-based access

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactElement;
  roles?: string[]; // allowed roles
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F6B4B] text-white">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-3 border-white border-t-transparent"></div>
          <span className="text-sm font-bold tracking-tight text-white">Loading SmartServe AI...</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth/login" replace />;
  if (roles && roles.length > 0 && !roles.includes(user.role || '')) {
    return <Navigate to="/auth/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
