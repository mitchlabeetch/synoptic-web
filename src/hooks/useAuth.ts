"use client";

// src/hooks/useAuth.ts
// PURPOSE: Client-side authentication hook
// ACTION: Provides user state and auth functions
// MECHANISM: Manages auth state via API calls and cookies

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  email: string;
  name?: string;
  tier: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });
  const router = useRouter();

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setState({ user: data.user, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    } catch {
      setState({ user: null, loading: false });
    }
  };

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setState({ user: null, loading: false });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    await checkAuth();
  }, []);

  return { 
    user: state.user, 
    loading: state.loading, 
    logout,
    refreshUser,
    isAuthenticated: !!state.user,
  };
}
