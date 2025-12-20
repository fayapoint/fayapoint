"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { AdminProvider, useAdmin } from "@/contexts/AdminContext";
import { AdminSidebar, AdminMobileNav, AdminMobileDrawer } from "@/components/admin/AdminSidebar";
import { Bell, Search, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

// Mobile Header Component
function AdminMobileHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { admin } = useAdmin();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-[#0a0a1a]/95 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center justify-between h-14 px-4">
        <button
          onClick={onOpenMenu}
          className="p-2 -ml-2 rounded-lg hover:bg-white/10 text-gray-400"
        >
          <Menu size={22} />
        </button>
        
        <span className="font-bold text-white">Admin</span>
        
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
            {admin?.name?.[0]?.toUpperCase() || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}

// Desktop Header Component
function AdminDesktopHeader({ isCollapsed }: { isCollapsed: boolean }) {
  const { admin } = useAdmin();
  const pathname = usePathname();
  
  // Get page title from path
  const getPageTitle = () => {
    const path = pathname?.split("/").pop() || "dashboard";
    const titles: Record<string, string> = {
      admin: "Dashboard",
      users: "Usuários",
      products: "Produtos",
      orders: "Pedidos",
      payments: "Pagamentos",
      courses: "Cursos",
      creations: "Criações AI",
      dropshipping: "Dropshipping",
      automations: "Automações",
      integrations: "Integrações",
      "ai-settings": "Configurações IA",
      database: "Banco de Dados",
      logs: "Logs",
      settings: "Configurações",
      analytics: "Analytics",
    };
    return titles[path] || "Admin";
  };

  return (
    <header 
      className={cn(
        "hidden lg:flex fixed top-0 right-0 z-30 h-14 items-center justify-between px-6 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300",
        isCollapsed ? "left-[72px]" : "left-[260px]"
      )}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar..."
            className="w-64 pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        
        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white relative transition">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
        </button>
        
        {/* Profile Quick Access */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="text-right hidden xl:block">
            <p className="text-sm font-medium text-white">{admin?.name}</p>
            <p className="text-[10px] text-gray-500">Administrador</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
            {admin?.name?.[0]?.toUpperCase() || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if current path is login page (handles locale prefix)
  const isLoginPage = pathname?.endsWith("/admin/login");

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      const locale = pathname?.split("/")[1] || "pt-BR";
      router.push(`/${locale}/admin/login`);
    }
  }, [isAuthenticated, isLoading, pathname, router, isLoginPage]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Carregando...</p>
        </motion.div>
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
      {/* Desktop Sidebar */}
      <AdminSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Desktop Header */}
      <AdminDesktopHeader isCollapsed={sidebarCollapsed} />
      
      {/* Mobile Header */}
      <AdminMobileHeader onOpenMenu={() => setMobileMenuOpen(true)} />
      
      {/* Mobile Drawer */}
      <AdminMobileDrawer 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
      
      {/* Mobile Bottom Navigation */}
      <AdminMobileNav onOpenMenu={() => setMobileMenuOpen(true)} />
      
      {/* Main Content */}
      <main 
        className={cn(
          "min-h-screen transition-all duration-300",
          // Mobile: padding for header and bottom nav
          "pt-14 pb-20 px-4",
          // Desktop: sidebar offset and header
          "lg:pt-14 lg:pb-6 lg:px-6",
          sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
        )}
      >
        <div className="pt-4 lg:pt-6">
          {children}
        </div>
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
