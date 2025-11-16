"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  name: string;
  email: string;
  role?: string;
  interest?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoggedIn: boolean;
  logout: () => void;
  mounted: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load user from localStorage on mount (client-side only)
  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('fayapoint_user');
      if (storedUser) {
        try {
          setUserState(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('fayapoint_user');
        }
      }
    }
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (typeof window !== 'undefined') {
      if (newUser) {
        localStorage.setItem('fayapoint_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('fayapoint_user');
      }
    }
  };

  const logout = () => {
    setUser(null);
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
