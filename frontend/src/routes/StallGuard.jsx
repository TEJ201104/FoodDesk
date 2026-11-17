/**
 * Stall Guard (StallGuard.jsx)
 * Runtime route interceptor and active stall integrity guard for FoodDesk.
 *
 * Validates that:
 * 1. The authenticated stall owner's active workspace corresponds to an authorized stall.
 * 2. Any client-side manipulation (e.g. direct DevTools edits to localStorage session)
 *    is detected on route transitions and automatically recovered to the primary authorized stall.
 *
 * NOTE: Client-side tamper detection and recovery safeguard. This is a frontend state
 * resilience layer for the prototype, not production-grade security.
 */

import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStall } from '../context/StallContext';
import { useNotification } from '../context/NotificationContext';
import { storageService } from '../services/storageService.js';

export function StallGuard({ children }) {
  const { user, isStallOwner, isAuthenticated } = useAuth();
  const { currentStall, recoverAuthorizedStall } = useStall();
  const { showToast } = useNotification();
  const location = useLocation();
  const hasRecoveredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !isStallOwner || !user) return;

    const authorizedList = Array.isArray(user.authorizedStalls) ? user.authorizedStalls : [];
    if (authorizedList.length === 0) return;

    // Check 1: In-memory active stall anomaly (stall ID exists, but does not belong to authorized stalls)
    const isCurrentStallUnauthorized = currentStall?.id && !authorizedList.includes(currentStall.id);

    // Check 2: Raw localStorage session anomaly (detects manual DevTools edits to activeStall)
    const rawSession = storageService.getSession();
    const isStoredStallUnauthorized = rawSession?.activeStall?.id && !authorizedList.includes(rawSession.activeStall.id);

    // If an actual unauthorized stall is detected, trigger client-side recovery and alert the user
    if (isCurrentStallUnauthorized || isStoredStallUnauthorized) {
      if (!hasRecoveredRef.current) {
        hasRecoveredRef.current = true;
        const fallbackStallId = authorizedList[0];
        recoverAuthorizedStall(fallbackStallId);
        showToast(
          'Unauthorized stall configuration detected. Automatically recovered to authorized workspace.',
          'warning'
        );
      }
    } else {
      hasRecoveredRef.current = false;
    }
  }, [location.pathname, currentStall, user, isStallOwner, isAuthenticated, recoverAuthorizedStall, showToast]);

  // If user has zero authorized stalls, deny entry
  if (isStallOwner && (!user?.authorizedStalls || user.authorizedStalls.length === 0)) {
    return <Navigate to="/login" replace />;
  }

  // If active stall is momentarily unauthorized while recovery runs, display seamless syncing card
  const authorizedList = Array.isArray(user?.authorizedStalls) ? user.authorizedStalls : [];
  if (isStallOwner && currentStall?.id && authorizedList.length > 0 && !authorizedList.includes(currentStall.id)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <div className="text-center p-6 bg-navy-900 border border-slate-800 rounded-2xl max-w-md shadow-card">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">Synchronizing Authorized Workspace...</p>
          <p className="text-xs text-slate-400 mt-1">Connecting to your primary authorized stall.</p>
        </div>
      </div>
    );
  }

  return children;
}

