"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Package,
  Database,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Bell,
  ShoppingCart,
  Layers,
  Zap,
  Globe,
  Menu,
  X,
  TrendingUp,
  Bot,
  Workflow,
  BarChart3,
  CreditCard,
  Palette,
  BookOpen,
  MessageSquare,
  Calendar,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/contexts/AdminContext";

// Menu structure with sections
const MENU_SECTIONS = [
  {
    title: "Principal",
    items: [
      { id: "dashboard", path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { id: "analytics", path: "/admin/analytics", icon: BarChart3, label: "Analytics", badge: "NOVO" },
    ]
  },
  {
    title: "Negócios",
    items: [
      { id: "users", path: "/admin/users", icon: Users, label: "Usuários" },
      { id: "products", path: "/admin/products", icon: Package, label: "Produtos" },
      { id: "orders", path: "/admin/orders", icon: ShoppingCart, label: "Pedidos" },
      { id: "payments", path: "/admin/payments", icon: CreditCard, label: "Pagamentos" },
    ]
  },
  {
    title: "Conteúdo",
    items: [
      { id: "courses", path: "/admin/courses", icon: BookOpen, label: "Cursos" },
      { id: "creations", path: "/admin/creations", icon: Palette, label: "Criações AI" },
      { id: "dropshipping", path: "/admin/dropshipping", icon: Globe, label: "Dropshipping", badge: "AI" },
    ]
  },
  {
    title: "Automação",
    items: [
      { id: "automations", path: "/admin/automations", icon: Workflow, label: "Automações", badge: "NOVO" },
      { id: "integrations", path: "/admin/integrations", icon: Layers, label: "Integrações" },
      { id: "ai-settings", path: "/admin/ai-settings", icon: Bot, label: "Config. IA" },
    ]
  },
  {
    title: "Sistema",
    items: [
      { id: "database", path: "/admin/database", icon: Database, label: "Banco de Dados" },
      { id: "logs", path: "/admin/logs", icon: FileText, label: "Logs" },
      { id: "settings", path: "/admin/settings", icon: Settings, label: "Configurações" },
    ]
  }
];

// Flat menu for mobile bottom nav (most important items)
const MOBILE_NAV_ITEMS = [
  { id: "dashboard", path: "/admin", icon: LayoutDashboard, label: "Home" },
  { id: "users", path: "/admin/users", icon: Users, label: "Usuários" },
  { id: "orders", path: "/admin/orders", icon: ShoppingCart, label: "Pedidos" },
  { id: "automations", path: "/admin/automations", icon: Workflow, label: "Automação" },
  { id: "more", path: "", icon: Menu, label: "Mais" },
];

// Mobile Bottom Navigation Component
export function AdminMobileNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "pt-BR";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0a0a1a]/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const fullPath = item.path ? `/${locale}${item.path}` : "";
          const isActive = item.path && (pathname === fullPath || 
            (item.path !== "/admin" && pathname?.includes(item.path)));
          
          if (item.id === "more") {
            return (
              <button
                key={item.id}
                onClick={onOpenMenu}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl text-gray-400 hover:text-white transition-colors"
              >
                <item.icon size={22} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link key={item.id} href={fullPath}>
              <div className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px]",
                isActive 
                  ? "text-violet-400" 
                  : "text-gray-400 hover:text-white"
              )}>
                <div className={cn(
                  "relative",
                  isActive && "after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-violet-400 after:rounded-full"
                )}>
                  <item.icon size={22} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Mobile Drawer Menu
export function AdminMobileDrawer({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "pt-BR";
  const { admin, logout } = useAdmin();

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          />
          
          {/* Drawer */}
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-[320px] z-50 lg:hidden overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(10, 10, 26, 0.98) 0%, rgba(20, 20, 45, 0.98) 100%)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg text-white">Admin</span>
                  <p className="text-[10px] text-gray-500">FayaPoint</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Admin Profile */}
            {admin && (
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                      {admin.name?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a1a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{admin.name}</p>
                    <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] bg-violet-500/20 text-violet-400 border border-violet-500/30">
                      <Shield size={10} />
                      Administrador
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Sections */}
            <nav className="flex-1 overflow-y-auto py-4">
              {MENU_SECTIONS.map((section, sectionIndex) => (
                <div key={section.title} className={cn(sectionIndex > 0 && "mt-4")}>
                  <p className="px-4 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {section.title}
                  </p>
                  <div className="px-2 space-y-0.5">
                    {section.items.map((item) => {
                      const fullPath = `/${locale}${item.path}`;
                      const isActive = pathname === fullPath || 
                        (item.path !== "/admin" && pathname?.includes(item.path));

                      return (
                        <Link key={item.id} href={fullPath} onClick={onClose}>
                          <div className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-all",
                            isActive
                              ? "bg-violet-500/20 text-white"
                              : "text-gray-400 hover:bg-white/5 hover:text-white"
                          )}>
                            <item.icon size={20} className={isActive ? "text-violet-400" : ""} />
                            <span className="flex-1 text-sm font-medium">{item.label}</span>
                            {"badge" in item && item.badge && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Quick Actions */}
            <div className="p-4 border-t border-white/10 space-y-2">
              <Link href={`/${locale}/admin/settings`} onClick={onClose}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition">
                  <HelpCircle size={20} />
                  <span className="text-sm font-medium">Ajuda</span>
                </div>
              </Link>
              <button
                onClick={() => { logout(); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut size={20} />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// Desktop Sidebar
export function AdminSidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { admin, logout } = useAdmin();
  const locale = pathname?.split("/")[1] || "pt-BR";

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 260 }}
      className="hidden lg:flex fixed left-0 top-0 h-screen z-40 flex-col"
      style={{
        background: "linear-gradient(180deg, rgba(10, 10, 26, 0.98) 0%, rgba(15, 15, 35, 0.98) 100%)",
        borderRight: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-base bg-gradient-to-r from-violet-200 to-purple-300 bg-clip-text text-transparent">
                  Admin
                </span>
                <p className="text-[9px] text-gray-500 -mt-0.5">FayaPoint</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Admin Profile - Compact */}
      {admin && (
        <div className={cn("p-3 border-b border-white/5", isCollapsed && "px-2")}>
          <div className={cn("flex items-center gap-2", isCollapsed && "justify-center")}>
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                {admin.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a0a1a]" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs text-white truncate">{admin.name}</p>
                <p className="text-[10px] text-gray-500 truncate">{admin.email}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
        {MENU_SECTIONS.map((section, sectionIndex) => (
          <div key={section.title} className={cn(sectionIndex > 0 && "mt-4")}>
            {!isCollapsed && (
              <p className="px-3 mb-1.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const fullPath = `/${locale}${item.path}`;
                const isActive = pathname === fullPath || 
                  (item.path !== "/admin" && pathname?.includes(item.path));

                return (
                  <Link key={item.id} href={fullPath}>
                    <div
                      className={cn(
                        "relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all group",
                        isActive
                          ? "bg-violet-500/15 text-white"
                          : "text-gray-400 hover:bg-white/5 hover:text-white",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-r-full" />
                      )}
                      
                      <item.icon
                        size={18}
                        className={cn(
                          "shrink-0",
                          isActive && "text-violet-400"
                        )}
                      />
                      
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-[13px] font-medium truncate">
                            {item.label}
                          </span>
                          {"badge" in item && item.badge && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}

                      {/* Tooltip for collapsed */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 border border-white/10 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl">
                          <span className="text-xs text-white font-medium">{item.label}</span>
                          {"badge" in item && item.badge && (
                            <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Status - Only expanded */}
      {!isCollapsed && (
        <div className="p-3 border-t border-white/5">
          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] font-medium text-gray-400">Sistema</span>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
                <Activity size={10} />
                Online
              </span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full w-[95%] bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="p-2 border-t border-white/5">
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors group",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut size={18} />
          {!isCollapsed && <span className="text-[13px] font-medium">Sair</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 border border-white/10 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
              <span className="text-xs text-red-400 font-medium">Sair</span>
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
