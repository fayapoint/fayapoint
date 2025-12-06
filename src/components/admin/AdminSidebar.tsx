"use client";

import { useState } from "react";
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
  CreditCard,
  Layers,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/contexts/AdminContext";

const MENU_ITEMS = [
  { id: "dashboard", path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { id: "users", path: "/admin/users", icon: Users, label: "Usuários" },
  { id: "products", path: "/admin/products", icon: Package, label: "Produtos" },
  { id: "orders", path: "/admin/orders", icon: ShoppingCart, label: "Pedidos" },
  { id: "database", path: "/admin/database", icon: Database, label: "Banco de Dados" },
  { id: "logs", path: "/admin/logs", icon: FileText, label: "Logs" },
  { id: "integrations", path: "/admin/integrations", icon: Layers, label: "Integrações" },
  { id: "settings", path: "/admin/settings", icon: Settings, label: "Configurações" },
];

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { admin, logout } = useAdmin();
  
  // Extract locale from pathname (e.g., /pt-BR/admin -> pt-BR)
  const locale = pathname?.split("/")[1] || "pt-BR";

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="fixed left-0 top-0 h-screen z-50 flex flex-col"
      style={{
        background: "linear-gradient(135deg, rgba(15, 15, 35, 0.95) 0%, rgba(25, 25, 55, 0.98) 100%)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg bg-gradient-to-r from-violet-200 to-purple-300 bg-clip-text text-transparent">
                  Admin Panel
                </span>
                <p className="text-[10px] text-gray-500 -mt-0.5">FayaPoint</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Admin Profile */}
      {admin && (
        <div className={cn(
          "p-4 border-b border-white/5",
          isCollapsed && "px-3"
        )}>
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center"
          )}>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                {admin.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-gray-900" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{admin.name}</p>
                <p className="text-xs text-gray-500 truncate">{admin.email}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Stats - Only when expanded */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-white/5">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Activity size={12} />
                <span className="text-[10px]">Sistema</span>
              </div>
              <p className="text-xs font-semibold text-white mt-0.5">Online</p>
            </div>
            <div className="p-2 rounded-lg bg-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Bell size={12} />
                <span className="text-[10px]">Alertas</span>
              </div>
              <p className="text-xs font-semibold text-white mt-0.5">0</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {MENU_ITEMS.map((item) => {
            const fullPath = `/${locale}${item.path}`;
            const isActive = pathname === fullPath || 
              (item.path !== "/admin" && pathname?.includes(item.path));

            return (
              <Link key={item.id} href={fullPath}>
                <div
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-violet-500/20 to-purple-500/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  {/* Glow effect for active item */}
                  {isActive && (
                    <motion.div
                      layoutId="adminActiveTab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/20 to-purple-500/10 border border-violet-500/30"
                      style={{ boxShadow: "0 0 20px rgba(139, 92, 246, 0.15)" }}
                    />
                  )}
                  
                  <item.icon
                    size={20}
                    className={cn(
                      "relative z-10 shrink-0 transition-transform",
                      isActive && "text-violet-400"
                    )}
                  />
                  
                  {!isCollapsed && (
                    <span className="relative z-10 flex-1 text-sm font-medium">
                      {item.label}
                    </span>
                  )}

                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-violet-400 to-purple-500 rounded-r-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Performance Section */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-medium text-gray-300">Performance</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-gray-500">API Response</span>
                  <span className="text-emerald-400">~45ms</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full w-[90%] bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-gray-500">DB Uptime</span>
                  <span className="text-violet-400">99.9%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full w-[99%] bg-gradient-to-r from-violet-400 to-purple-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="p-2 border-t border-white/5">
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </motion.aside>
  );
}
