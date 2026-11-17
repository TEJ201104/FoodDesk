import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * AuthGuard:
 * Protects internal routes from unauthenticated access.
 * Unauthenticated users are redirected to the default entry point (/login).
 */
export function AuthGuard({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * RoleGuard:
 * Enforces strict separation between Stall Owner and Super Admin dashboards.
 * - Stall Owners attempting to access Super Admin routes are redirected to /dashboard.
 * - Super Admin attempting to access stall-specific POS/counter routes are redirected to /admin/dashboard.
 */
export function RoleGuard({ children, allowedRoles }) {
  const { user, isSuperAdmin, isStallOwner } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (isStallOwner) {
      return <Navigate to="/dashboard" replace />;
    }
    if (isSuperAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * PublicAuthRoute:
 * Prevents already authenticated users from being stuck on the login page.
 * Automatically routes to their authorized dashboard.
 */
export function PublicAuthRoute({ children }) {
  const { isAuthenticated, isSuperAdmin } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={isSuperAdmin ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return children;
}

