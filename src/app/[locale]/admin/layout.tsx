"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminProvider, useAdmin } from "@/contexts/AdminContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  // Check if current path is login page (handles locale prefix)
  const isLoginPage = pathname?.endsWith("/admin/login");

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      // Get current locale from pathname
      const locale = pathname?.split("/")[1] || "pt-BR";
      router.push(`/${locale}/admin/login`);
    }
  }, [isAuthenticated, isLoading, pathname, router, isLoginPage]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Login page - no sidebar
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Protected routes - require authentication
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <AdminSidebar />
      <main className="ml-[280px] min-h-screen p-6 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminProvider>
  );
}
