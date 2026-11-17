/**
 * Mock Authentication Service
 * Implements the 3-credential Stall Owner validation gate and dedicated Super Admin login.
 * Validates against centralized demo storage and maintains session state.
 */

import { storageService } from './storageService.js';

export const mockAuthService = {
  /**
   * Stall Owner Login — 3 Credentials Required:
   * 1. Registered Email
   * 2. Password
   * 3. Unique Stall ID
   * All three must match an authorized active stall for that user.
   */
  async loginStallOwner({ email, password, stallId }) {
    // Artificial slight delay for realistic UX feedback
    await new Promise((res) => setTimeout(res, 200));

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();
    const cleanStallId = (stallId || '').trim().toLowerCase();

    if (!cleanEmail || !cleanPassword || !cleanStallId) {
      throw new Error('Email, password, and Stall ID are all required.');
    }

    const users = storageService.getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
    );

    // General non-revealing error for wrong user, wrong password, or wrong role
    if (!user || user.role !== 'stall_owner') {
      throw new Error('Invalid credentials or unauthorized stall access.');
    }

    // Strict multi-tenant verification: does this owner own the specified stall ID?
    if (!user.authorizedStalls || !user.authorizedStalls.includes(cleanStallId)) {
      throw new Error('Invalid credentials or unauthorized stall access.');
    }

    // Retrieve stall profile and verify status
    const stall = storageService.getStallById(cleanStallId);
    if (!stall) {
      throw new Error('Stall profile could not be found.');
    }

    if (stall.status !== 'active') {
      throw new Error('This stall profile is currently pending approval or suspended.');
    }

    const session = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        authorizedStalls: user.authorizedStalls,
      },
      activeStall: stall,
      token: `demo-owner-jwt-${user.id}-${Date.now()}`,
      loginAt: new Date().toISOString(),
    };

    storageService.setSession(session);
    return session;
  },

  /**
   * Super Admin Login — 2 Credentials Required (Email + Password, No Stall ID)
   */
  async loginSuperAdmin({ email, password }) {
    await new Promise((res) => setTimeout(res, 200));

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('Email and password are required.');
    }

    const users = storageService.getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPassword
    );

    if (!user || user.role !== 'super_admin') {
      throw new Error('Invalid administrator credentials.');
    }

    const session = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        authorizedStalls: [],
      },
      activeStall: null, // Super Admin oversees all stalls
      token: `demo-admin-jwt-${Date.now()}`,
      loginAt: new Date().toISOString(),
    };

    storageService.setSession(session);
    return session;
  },

  /**
   * Switch Active Stall (for multi-stall owners such as Owner 1)
   */
  async switchStall(targetStallId) {
    const currentSession = storageService.getSession();
    if (!currentSession || !currentSession.user) {
      throw new Error('No active authenticated session.');
    }

    const user = currentSession.user;
    if (!user.authorizedStalls.includes(targetStallId)) {
      throw new Error('Unauthorized stall switch attempt.');
    }

    const targetStall = storageService.getStallById(targetStallId);
    if (!targetStall || targetStall.status !== 'active') {
      throw new Error('Target stall is not currently active.');
    }

    const updatedSession = {
      ...currentSession,
      activeStall: targetStall,
    };

    storageService.setSession(updatedSession);
    return updatedSession;
  },

  /**
   * Logout
   */
  logout() {
    storageService.clearSession();
  },

  /**
   * Read Current Session from Storage
   */
  getCurrentSession() {
    return storageService.getSession();
  },
};
