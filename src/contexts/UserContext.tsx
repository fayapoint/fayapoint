"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  _id?: string;
  name: string;
  email: string;
  role?: string;
  image?: string;
  interest?: string;
  billing?: {
    phone?: string;
    cpfCnpj?: string;
    postalCode?: string;
    addressNumber?: string;
    address?: string;
    city?: string;
    state?: string;
  };
  subscription?: {
    plan: 'free' | 'starter' | 'pro' | 'business' | 'explorador' | 'profissional' | 'expert';
    status: string;
  };
  profile?: {
    bio?: string;
    linkedin?: string;
    company?: string;
    position?: string;
    website?: string;
    location?: string;
  };
  progress?: {
    level: number;
    points: number;
    xp?: number;
    currentStreak: number;
    coursesCompleted: number;
    coursesInProgress: number;
    totalHours: number;
    certificates?: number;
  };
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoggedIn: boolean;
  logout: () => Promise<void>;
  mounted: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load user from localStorage on mount, then ALWAYS revalidate against server.
  // This prevents stale localStorage from showing wrong user data (e.g., after
  // Google OAuth which only sets cookies, not localStorage).
  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('fayai_user');

      // Show stored user immediately for fast initial render
      if (storedUser) {
        try {
          setUserState(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('fayai_user');
        }
      }

      // ALWAYS revalidate against server to catch session mismatches.
      // This handles: expired tokens, Google OAuth sessions, different accounts.
      // IMPORTANT: Do NOT send localStorage token here. Use only httpOnly cookies
      // (via credentials: 'include') so the server sees the freshest session.
      // Google OAuth only sets cookies (not localStorage), so sending a stale
      // localStorage token would override the correct cookie-based session.
      //
      // RESILIENCE (13/07/2026): a missing/invalid cookie is NOT enough to log
      // the user out. Before clearing anything we try POST /api/auth/refresh
      // with the localStorage Bearer token — if it's still valid the server
      // re-issues the cookies and the session heals itself. Only a confirmed
      // rejection of BOTH credentials logs the user out.
      const applyServerUser = (serverUser: User & { _id?: string; id?: string }) => {
        const prevStored = localStorage.getItem('fayai_user');
        let prevId: string | null = null;
        try {
          const prev = prevStored ? JSON.parse(prevStored) : null;
          prevId = prev?._id || prev?.id || null;
        } catch { /* ignore */ }

        const serverId = serverUser._id || serverUser.id;
        if (prevId && serverId && prevId !== serverId) {
          // Session changed (e.g., Google OAuth replaced a stale session).
          // Remove the old Bearer token so other API calls use cookies.
          localStorage.removeItem('fayai_token');
        }

        // Server is the source of truth — always update from it
        setUserState(serverUser);
        localStorage.setItem('fayai_user', JSON.stringify(serverUser));
      };

      const clearSession = () => {
        setUserState(null);
        localStorage.removeItem('fayai_user');
        localStorage.removeItem('fayai_token');
      };

      const tryRefreshThenDecide = async () => {
        const bearer = localStorage.getItem('fayai_token');
        if (!bearer) {
          clearSession();
          return;
        }
        try {
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
            headers: { Authorization: `Bearer ${bearer}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.user) {
              if (data.token) localStorage.setItem('fayai_token', data.token);
              applyServerUser(data.user);
              return;
            }
          }
          // Refresh rejected both credentials — the session is truly gone
          if (res.status === 401) {
            clearSession();
          }
          // 5xx / anything else: transient server trouble — keep local session
        } catch {
          // Network error — keep existing localStorage data as fallback
        }
      };

      fetch('/api/user/profile', { credentials: 'include', cache: 'no-store' })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            if (data?.user) {
              applyServerUser(data.user);
            } else if (data && !data.user && !data.error) {
              // 200 with no user — cookie missing/invalid. Try to heal before
              // clearing (this was the "ghost logout" bug).
              await tryRefreshThenDecide();
            }
            return;
          }
          if (res.status === 401 || res.status === 404) {
            await tryRefreshThenDecide();
          }
          // Other statuses (429/5xx): transient — keep local session
        })
        .catch(() => {
          // Network error — keep existing localStorage data as fallback
        });
    }
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (typeof window !== 'undefined') {
      if (newUser) {
        localStorage.setItem('fayai_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('fayai_user');
      }
    }
  };

  const logout = async () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fayai_token');
      localStorage.removeItem('fayai_user');
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        });
      } catch {
        // Best effort; local state is already cleared.
      }
    }
  };

  const isLoggedIn = mounted && !!user;

  return (
    <UserContext.Provider value={{ user, setUser, isLoggedIn, logout, mounted }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
