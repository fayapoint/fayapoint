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
      const token = localStorage.getItem('fayai_token');
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      fetch('/api/user/profile', { headers, credentials: 'include', cache: 'no-store' })
        .then(res => {
          if (res.ok) return res.json();
          // If 401/404, user session is invalid — clear stale data
          if (res.status === 401 || res.status === 404) {
            setUserState(null);
            localStorage.removeItem('fayai_user');
            localStorage.removeItem('fayai_token');
          }
          return null;
        })
        .then(data => {
          if (data?.user) {
            // Server is the source of truth — always update from it
            setUserState(data.user);
            localStorage.setItem('fayai_user', JSON.stringify(data.user));
          } else if (data && !data.user && !data.error) {
            // Server returned 200 but no user — session is gone, clear stale data
            setUserState(null);
            localStorage.removeItem('fayai_user');
            localStorage.removeItem('fayai_token');
          }
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
