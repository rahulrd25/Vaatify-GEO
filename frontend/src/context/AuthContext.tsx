'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { detectBrandFromEmail, DetectedBrand } from '@/lib/emailDomain';
import { apiUrl } from '@/lib/api';

export interface UserAccount {
  id: string;
  email: string;
  isWorkEmail: boolean;
  detectedBrand?: DetectedBrand;
}

interface AuthContextType {
  user: UserAccount | null;
  sessionToken: string | null;
  isLoading: boolean;
  onboardingCompleted: boolean;
  detectedBrand: DetectedBrand | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => void;
  refreshStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [detectedBrand, setDetectedBrand] = useState<DetectedBrand | null>(null);

  // Check onboarding status from backend for the authenticated user
  const checkOnboardingStatus = useCallback(async (userId: string, token?: string | null) => {
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(apiUrl(`/api/v1/onboarding/status?user_id=${encodeURIComponent(userId)}`), { headers });
      if (res.ok) {
        const data = await res.json();
        setOnboardingCompleted(Boolean(data.onboarding_completed));
      }
    } catch (err) {
      console.error('Failed to verify brand onboarding status:', err);
    }
  }, []);

  // Initialize and subscribe to real Supabase Auth events
  useEffect(() => {
    let isMounted = true;

    // Initialize and subscribe to real Supabase Auth events
    async function initSession() {
      setIsLoading(true);
      try {
        // Handle PKCE code exchange if redirected from email confirmation link
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const code = url.searchParams.get('code');
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data?.session) {
              url.searchParams.delete('code');
              window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : '') + url.hash);
            }
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const token = session.access_token || null;
          setSessionToken(token);
          const detected = detectBrandFromEmail(session.user.email || '');
          const account: UserAccount = {
            id: session.user.id,
            email: session.user.email || '',
            isWorkEmail: detected.isWorkEmail,
            detectedBrand: detected,
          };
          setUser(account);
          setDetectedBrand(detected.isWorkEmail ? detected : null);
          await checkOnboardingStatus(account.id, token);
        } else if (isMounted) {
          setSessionToken(null);
        }
      } catch (err) {
        console.error('Error fetching Supabase auth session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    // Listen to real-time Supabase auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const token = session.access_token || null;
          setSessionToken(token);
          const detected = detectBrandFromEmail(session.user.email || '');
          const account: UserAccount = {
            id: session.user.id,
            email: session.user.email || '',
            isWorkEmail: detected.isWorkEmail,
            detectedBrand: detected,
          };
          setUser(account);
          setDetectedBrand(detected.isWorkEmail ? detected : null);
          await checkOnboardingStatus(account.id, token);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSessionToken(null);
        setDetectedBrand(null);
        setOnboardingCompleted(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [checkOnboardingStatus]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Invalid email or password' };
      }

      const token = data.session?.access_token || null;
      setSessionToken(token);

      const detected = detectBrandFromEmail(data.user.email || email);
      const account: UserAccount = {
        id: data.user.id,
        email: data.user.email || email,
        isWorkEmail: detected.isWorkEmail,
        detectedBrand: detected,
      };

      setUser(account);
      setDetectedBrand(detected.isWorkEmail ? detected : null);
      await checkOnboardingStatus(account.id, token);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed due to unexpected error.';
      return { success: false, error: msg };
    }
  };

  const signup = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        const errLower = error.message.toLowerCase();
        if (
          errLower.includes('already registered') ||
          errLower.includes('already exists') ||
          errLower.includes('user already registered')
        ) {
          // Automatic sign-in fallback if account already exists with this email
          const loginRes = await login(email, password);
          if (loginRes.success) {
            return { success: true };
          }
          if (loginRes.error?.toLowerCase().includes('not confirmed') || loginRes.error?.toLowerCase().includes('unconfirmed')) {
            return {
              success: false,
              error: `Your account exists but email (${email}) has not been confirmed yet. Please check your inbox.`,
            };
          }
          return {
            success: false,
            error: 'An account with this email already exists, but the password was incorrect.',
          };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Registration failed. Please try again.' };
      }

      // Check if user already exists (Supabase returns empty identities when email is taken and email confirmation is on)
      if (data.user.identities && data.user.identities.length === 0) {
        // Automatic sign-in fallback if account already exists with this email
        const loginRes = await login(email, password);
        if (loginRes.success) {
          return { success: true };
        }
        if (loginRes.error?.toLowerCase().includes('not confirmed') || loginRes.error?.toLowerCase().includes('unconfirmed')) {
          return {
            success: false,
            error: `Your account exists but email (${email}) has not been confirmed yet. Please check your inbox.`,
          };
        }
        return {
          success: false,
          error: 'An account with this email already exists, but the password was incorrect.',
        };
      }

      // If session is null, Supabase has email confirmation enabled
      if (!data.session) {
        return {
          success: true,
          requiresEmailConfirmation: true,
        };
      }

      const token = data.session?.access_token || null;
      setSessionToken(token);

      const detected = detectBrandFromEmail(data.user.email || email);
      const account: UserAccount = {
        id: data.user.id,
        email: data.user.email || email,
        isWorkEmail: detected.isWorkEmail,
        detectedBrand: detected,
      };

      setUser(account);
      setDetectedBrand(detected.isWorkEmail ? detected : null);
      setOnboardingCompleted(false);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed due to unexpected error.';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSessionToken(null);
    setDetectedBrand(null);
    setOnboardingCompleted(false);
  };

  const refreshStatus = async () => {
    if (user?.id) {
      await checkOnboardingStatus(user.id, sessionToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        isLoading,
        onboardingCompleted,
        detectedBrand,
        login,
        signup,
        logout,
        setOnboardingCompleted,
        refreshStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
