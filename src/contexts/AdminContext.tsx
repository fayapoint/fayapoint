"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Admin {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: string;
}

interface AdminContextType {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAdmin: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("fayapoint_admin_token");
    const storedAdmin = localStorage.getItem("fayapoint_admin");
    
    if (storedToken && storedAdmin) {
      try {
        setToken(storedToken);
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        localStorage.removeItem("fayapoint_admin_token");
        localStorage.removeItem("fayapoint_admin");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Erro ao fazer login" };
      }

      // Store credentials
      localStorage.setItem("fayapoint_admin_token", data.token);
      localStorage.setItem("fayapoint_admin", JSON.stringify(data.admin));
      
      setToken(data.token);
      setAdmin(data.admin);

      return { success: true };
    } catch (error) {
      console.error("Admin login error:", error);
      return { success: false, error: "Erro de conexão" };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("fayapoint_admin_token");
    localStorage.removeItem("fayapoint_admin");
    setToken(null);
    setAdmin(null);
    router.push("/admin/login");
  }, [router]);

  const refreshAdmin = useCallback(async () => {
    const storedToken = localStorage.getItem("fayapoint_admin_token");
    if (!storedToken) return;

    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
        }
      }
    } catch {
      // Silent fail
    }
  }, [logout]);

  return (
    <AdminContext.Provider
      value={{
        admin,
        token,
        isLoading,
        isAuthenticated: !!admin && !!token,
        login,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
