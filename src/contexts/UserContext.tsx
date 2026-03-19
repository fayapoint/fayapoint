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
    plan: 'free' | 'starter' | 'pro' | 'business';
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

  // Load user from localStorage on mount, or hydrate from cookie-based session
  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('fayai_user');
      const storedToken = localStorage.getItem('fayai_token');

      if (storedUser) {
        try {
          setUserState(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('fayai_user');
        }
      } else if (!storedToken) {
        // No localStorage data — check if there's a cookie-based session
        // (e.g., from Google OAuth callback which sets httpOnly cookie)
        fetch('/api/user/profile', { credentials: 'include' })
          .then(res => {
            if (res.ok) return res.json();
            return null;
          })
          .then(data => {
            if (data?.user) {
              setUserState(data.user);
              localStorage.setItem('fayai_user', JSON.stringify(data.user));
              // Note: we can't read the httpOnly token, but the cookie handles auth
            }
          })
          .catch(() => {
            // No session — user is not logged in, this is fine
          });
      }
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
