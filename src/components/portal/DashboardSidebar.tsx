"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Image as ImageIcon,
  Trophy,
  MessageSquare,
  Target,
  Settings,
  Crown,
  Flame,
  Star,
  Zap,
  ChevronLeft,
  ChevronRight,
  Gift,
  Users,
  Sparkles,
  Bot,
  Download,
  ShoppingBag,
  Store,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { UserAvatarWithBadges } from "@/components/user/UserAvatarWithBadges";

interface Achievement {
  id: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface DashboardSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: {
    name: string;
    image?: string;
    subscription?: { plan: string };
  };
  stats: {
    level: number;
    xp: number;
    xpToNextLevel: number;
    levelProgress: number;
    streak: number;
  };
  plan: string;
  achievements?: Achievement[];
}

const MENU_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", proOnly: false },
  { id: "store", icon: Store, label: "Loja", proOnly: false, badge: "NOVO" },
  { id: "cart", icon: ShoppingCart, label: "Carrinho", proOnly: false },
  { id: "profile", icon: Crown, label: "Meu Perfil", proOnly: false },
  { id: "courses", icon: BookOpen, label: "Meus Cursos", proOnly: false },
  { id: "studio", icon: ImageIcon, label: "Studio AI", proOnly: false, badge: "AI" },
  { id: "assistant", icon: Bot, label: "Assistente IA", proOnly: true, badge: "PRO" },
  { id: "achievements", icon: Trophy, label: "Conquistas", proOnly: false },
  { id: "leaderboard", icon: Users, label: "Ranking", proOnly: false },
  { id: "challenges", icon: Target, label: "Desafios", proOnly: false },
  { id: "resources", icon: Download, label: "Recursos", proOnly: false },
  { id: "history", icon: ShoppingBag, label: "Histórico", proOnly: false },
  { id: "rewards", icon: Gift, label: "Recompensas", proOnly: true, badge: "PRO" },
];

export function DashboardSidebar({ activeTab, onTabChange, user, stats, plan, achievements = [] }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isPro = ["pro", "business", "starter"].includes(plan);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="fixed left-0 top-0 h-screen bg-gray-950 border-r border-gray-800 z-40 flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">FayaPoint</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* User Profile Card */}
      <div className={cn("p-4 border-b border-gray-800", isCollapsed && "px-2")}>
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <UserAvatarWithBadges
            user={user}
            achievements={achievements}
            size={isCollapsed ? "sm" : "md"}
            isPro={isPro}
            showBadges={!isCollapsed}
            maxBadges={3}
          />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn(
                  "text-[10px] px-1.5 h-5",
                  isPro ? "border-yellow-500/50 text-yellow-400" : "border-gray-600 text-gray-400"
                )}>
                  {plan.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1 text-orange-400 text-xs">
                  <Flame size={12} fill="currentColor" />
                  <span>{stats.streak}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Level Progress */}
        {!isCollapsed && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-400">{stats.level}</span>
                </div>
                <span className="text-gray-400">Nível {stats.level}</span>
              </div>
              <span className="text-xs text-gray-500">{stats.xp}/{stats.xpToNextLevel} XP</span>
            </div>
            <Progress value={stats.levelProgress} className="h-2 bg-gray-800" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {MENU_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const isLocked = item.proOnly && !isPro;

            return (
              <button
                key={item.id}
                onClick={() => !isLocked && onTabChange(item.id)}
                disabled={isLocked}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                  isActive 
                    ? "bg-purple-500/20 text-purple-400" 
                    : "hover:bg-white/5 text-gray-400 hover:text-white",
                  isLocked && "opacity-50 cursor-not-allowed",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon size={20} className={cn(
                  "shrink-0 transition-transform",
                  isActive && "scale-110"
                )} />
                
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] px-1.5 h-4",
                          item.badge === "PRO" 
                            ? "border-yellow-500/50 text-yellow-500" 
                            : "border-purple-500/50 text-purple-400"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    {isLocked && (
                      <Crown size={14} className="text-yellow-500" />
                    )}
                  </>
                )}

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Upgrade CTA for free users */}
      {!isPro && !isCollapsed && (
        <div className="p-4 border-t border-gray-800">
          <div className="p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="text-yellow-400" size={18} />
              <span className="font-semibold text-sm">Upgrade para Pro</span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Desbloqueie recursos exclusivos, IA ilimitada e muito mais!
            </p>
            <Link href="/precos">
              <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition">
                Ver Planos
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Settings Link */}
      <div className="p-2 border-t border-gray-800">
        <Link href="/configuracoes">
          <button className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition",
            isCollapsed && "justify-center"
          )}>
            <Settings size={20} />
            {!isCollapsed && <span className="text-sm font-medium">Configurações</span>}
          </button>
        </Link>
      </div>
    </motion.aside>
  );
}
