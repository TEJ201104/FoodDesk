/**
 * Stall Context (StallContext.jsx)
 * Dedicated context and state provider for multi-stall workspace management.
 * Decouples stall domain logic from authentication.
 * Manages active stall profile, authorized stalls array, reactive cache invalidation keys,
 * and client-side self-healing recovery.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { storageService } from '../services/storageService.js';

const StallContext = createContext(null);

export function StallProvider({ children }) {
  const { user, activeStall: authActiveStall, switchStall: authSwitchStall, isStallOwner } = useAuth();

  // Cache invalidation key: Increments on every stall change to trigger reactive updates in consumers
  const [stallChangeKey, setStallChangeKey] = useState(0);

  // Active Stall Profile State (strictly initialized to an authorized stall only)
  const [currentStall, setCurrentStall] = useState(() => {
    const authorizedList = Array.isArray(user?.authorizedStalls) ? user.authorizedStalls : [];

    // 1. If authActiveStall is valid and authorized
    if (authActiveStall && (!isStallOwner || authorizedList.includes(authActiveStall.id))) {
      return authActiveStall;
    }
    // 2. If stored session activeStall is authorized
    const session = storageService.getSession();
    if (session?.activeStall && (!isStallOwner || authorizedList.includes(session.activeStall.id))) {
      return session.activeStall;
    }
    // 3. Fallback to primary authorized stall for owner
    if (user && isStallOwner && authorizedList.length > 0) {
      return storageService.getStallById(authorizedList[0]);
    }
    return null;
  });

  // Synchronize currentStall whenever authActiveStall or user changes
  useEffect(() => {
    if (isStallOwner) {
      const authorizedList = Array.isArray(user?.authorizedStalls) ? user.authorizedStalls : [];
      if (authActiveStall && authorizedList.includes(authActiveStall.id)) {
        setCurrentStall(authActiveStall);
      } else if (authorizedList.length > 0) {
        setCurrentStall(storageService.getStallById(authorizedList[0]));
      } else {
        setCurrentStall(null);
      }
    } else {
      setCurrentStall(null);
    }
  }, [authActiveStall, user, isStallOwner]);

  // Compute full authorized stall profiles for the current owner
  const authorizedStalls = useMemo(() => {
    if (!user || !isStallOwner || !Array.isArray(user.authorizedStalls)) {
      return [];
    }
    return user.authorizedStalls
      .map((stallId) => storageService.getStallById(stallId))
      .filter(Boolean);
  }, [user, isStallOwner]);

  const isMultiStall = authorizedStalls.length > 1;

  /**
   * Switch active stall workspace.
   * Enforces that the target stall must be authorized for this owner.
   * Increments stallChangeKey for reactive cache invalidation.
   */
  const switchStall = useCallback(
    async (targetStallId) => {
      if (!user || !isStallOwner) {
        throw new Error('Only authenticated stall owners can switch stalls.');
      }

      if (!user.authorizedStalls.includes(targetStallId)) {
        throw new Error('Unauthorized stall switch attempt.');
      }

      const updatedSession = await authSwitchStall(targetStallId);
      setCurrentStall(updatedSession.activeStall);
      setStallChangeKey((prev) => prev + 1);
      return updatedSession.activeStall;
    },
    [user, isStallOwner, authSwitchStall]
  );

  /**
   * Client-Side Tamper Recovery:
   * Invoked by StallGuard if unauthorized localStorage manipulation is detected.
   * Restores session and active stall to the primary authorized stall.
   */
  const recoverAuthorizedStall = useCallback(
    async (authorizedStallId) => {
      if (!user || !isStallOwner || !authorizedStallId) return;

      const fallbackStall = storageService.getStallById(authorizedStallId);
      if (!fallbackStall) return;

      const currentSession = storageService.getSession();
      if (currentSession) {
        const repairedSession = {
          ...currentSession,
          activeStall: fallbackStall,
        };
        storageService.setSession(repairedSession);
      }

      if (typeof authSwitchStall === 'function') {
        try {
          await authSwitchStall(authorizedStallId);
        } catch (e) {}
      }

      setCurrentStall(fallbackStall);
      setStallChangeKey((prev) => prev + 1);
    },
    [user, isStallOwner, authSwitchStall]
  );

  const value = useMemo(
    () => ({
      currentStall,
      authorizedStalls,
      isMultiStall,
      stallChangeKey,
      switchStall,
      recoverAuthorizedStall,
    }),
    [
      currentStall,
      authorizedStalls,
      isMultiStall,
      stallChangeKey,
      switchStall,
      recoverAuthorizedStall,
    ]
  );

  return <StallContext.Provider value={value}>{children}</StallContext.Provider>;
}

export function useStall() {
  const context = useContext(StallContext);
  if (!context) {
    throw new Error('useStall must be used within a StallProvider');
  }
  return context;
}

