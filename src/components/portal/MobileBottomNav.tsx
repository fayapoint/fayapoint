"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Image as ImageIcon,
  Trophy,
  Store,
  Menu,
  X,
  Crown,
  Flame,
  Target,
  Settings,
  Users,
  ShoppingCart,
  Palette,
  Bot,
  Gift,
  Download,
  ShoppingBag,
  Home,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  plan: string;
  stats: {
    level: number;
    xp: number;
    streak: number;
  };
}

const MAIN_NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Início" },
  { id: "courses", icon: BookOpen, label: "Cursos" },
  { id: "studio", icon: ImageIcon, label: "Studio" },
  { id: "store", icon: Store, label: "Loja" },
];

const MORE_NAV_ITEMS = [
  { id: "pod-store", icon: Palette, label: "Loja POD", badge: "NOVO" },
  { id: "cart", icon: ShoppingCart, label: "Carrinho" },
  { id: "profile", icon: Crown, label: "Meu Perfil" },
  { id: "assistant", icon: Bot, label: "Assistente IA", proOnly: true, badge: "PRO" },
  { id: "achievements", icon: Trophy, label: "Conquistas" },
  { id: "leaderboard", icon: Users, label: "Ranking" },
  { id: "challenges", icon: Target, label: "Desafios" },
  { id: "resources", icon: Download, label: "Recursos" },
  { id: "history", icon: ShoppingBag, label: "Histórico" },
  { id: "rewards", icon: Gift, label: "Recompensas", proOnly: true, badge: "PRO" },
];

export function MobileBottomNav({ activeTab, onTabChange, plan, stats }: MobileBottomNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isPro = ["pro", "business", "starter"].includes(plan);

  const isActiveInMore = MORE_NAV_ITEMS.some(item => item.id === activeTab);

  return (
    <>
      {/* More Menu Overlay */}
      {isMoreOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {/* More Menu Panel */}
      {isMoreOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-16 left-0 right-0 bg-gray-950 border-t border-gray-800 rounded-t-3xl z-50 md:hidden max-h-[70vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-950 p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Flame className="text-orange-400" size={16} />
                <span className="font-semibold">{stats.streak}</span>
              </div>
              <div className="h-4 w-px bg-gray-700" />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-purple-400 font-bold">Lv.{stats.level}</span>
              </div>
            </div>
            <button
              onClick={() => setIsMoreOpen(false)}
              className="p-2 hover:bg-white/5 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="p-4 grid grid-cols-3 gap-3">
            {MORE_NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const isLocked = item.proOnly && !isPro;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!isLocked) {
                      onTabChange(item.id);
                      setIsMoreOpen(false);
                    }
                  }}
                  disabled={isLocked}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all",
                    isActive
                      ? "bg-purple-500/20 text-purple-400"
                      : "hover:bg-white/5 text-gray-400",
                    isLocked && "opacity-40"
                  )}
                >
                  <div className="relative">
                    <item.icon size={24} />
                    {item.badge && (
                      <span className={cn(
                        "absolute -top-1 -right-3 text-[8px] px-1 rounded font-bold",
                        item.badge === "PRO" 
                          ? "bg-yellow-500 text-black" 
                          : "bg-purple-500 text-white"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Links */}
          <div className="p-4 border-t border-gray-800 flex gap-3">
            <Link href="/" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 rounded-xl text-gray-400 hover:bg-white/10 transition">
                <Home size={18} />
                <span className="text-sm">Página Inicial</span>
              </button>
            </Link>
            <Link href="/configuracoes" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 rounded-xl text-gray-400 hover:bg-white/10 transition">
                <Settings size={18} />
                <span className="text-sm">Configurações</span>
              </button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 z-50 md:hidden safe-area-pb">
        <div className="flex items-center justify-around h-full px-2">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
                  isActive ? "text-purple-400" : "text-gray-500"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-purple-500 rounded-b-full"
                  />
                )}
                <item.icon size={22} className={isActive ? "scale-110" : ""} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
              isMoreOpen || isActiveInMore ? "text-purple-400" : "text-gray-500"
            )}
          >
            {(isMoreOpen || isActiveInMore) && (
              <motion.div
                layoutId="mobileActiveTab"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-purple-500 rounded-b-full"
              />
            )}
            <Menu size={22} className={isMoreOpen ? "scale-110" : ""} />
            <span className="text-[10px] font-medium">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
