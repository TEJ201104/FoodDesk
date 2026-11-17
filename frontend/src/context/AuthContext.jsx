import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockAuthService } from '../services/mockAuthService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => mockAuthService.getCurrentSession());
  const [loading, setLoading] = useState(false);

  // Sync state with storage on mount
  useEffect(() => {
    const current = mockAuthService.getCurrentSession();
    if (current) {
      setSession(current);
    }
  }, []);

  const loginOwner = useCallback(async ({ email, password, stallId }) => {
    setLoading(true);
    try {
      const newSession = await mockAuthService.loginStallOwner({ email, password, stallId });
      setSession(newSession);
      return newSession;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAdmin = useCallback(async ({ email, password }) => {
    setLoading(true);
    try {
      const newSession = await mockAuthService.loginSuperAdmin({ email, password });
      setSession(newSession);
      return newSession;
    } finally {
      setLoading(false);
    }
  }, []);

  const switchStall = useCallback(async (targetStallId) => {
    setLoading(true);
    try {
      const updatedSession = await mockAuthService.switchStall(targetStallId);
      setSession(updatedSession);
      return updatedSession;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    mockAuthService.logout();
    setSession(null);
  }, []);

  const user = session?.user || null;
  const activeStall = session?.activeStall || null;
  const isAuthenticated = Boolean(user && session?.token);
  const isSuperAdmin = user?.role === 'super_admin';
  const isStallOwner = user?.role === 'stall_owner';
  const authorizedStalls = user?.authorizedStalls || [];

  const value = {
    user,
    activeStall,
    isAuthenticated,
    isSuperAdmin,
    isStallOwner,
    authorizedStalls,
    loading,
    loginOwner,
    loginAdmin,
    switchStall,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

