"use client";

import { motion } from "framer-motion";
import { Crown, Medal, Trophy, TrendingUp, Zap, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  image?: string;
  weeklyXp: number;
  level: number;
  plan: string;
  isCurrentUser: boolean;
}

interface LeaderboardPanelProps {
  users: LeaderboardUser[];
  userRank: number;
  currentUserId?: string;
}

const RANK_STYLES: Record<number, { bg: string; icon: React.ReactNode; glow: string }> = {
  1: { 
    bg: "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50", 
    icon: <Crown className="text-yellow-400" size={24} />,
    glow: "shadow-[0_0_30px_rgba(234,179,8,0.3)]"
  },
  2: { 
    bg: "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50", 
    icon: <Medal className="text-gray-300" size={22} />,
    glow: "shadow-[0_0_20px_rgba(156,163,175,0.2)]"
  },
  3: { 
    bg: "bg-gradient-to-r from-amber-700/20 to-orange-700/20 border-amber-700/50", 
    icon: <Medal className="text-amber-600" size={20} />,
    glow: "shadow-[0_0_15px_rgba(180,83,9,0.2)]"
  },
};

export function LeaderboardPanel({ users, userRank }: LeaderboardPanelProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Trophy size={22} className="text-white" />
            </div>
            Ranking Semanal
          </h2>
          <p className="text-gray-400 text-sm mt-1">Compete com outros alunos e ganhe XP extra!</p>
        </div>
        
        <Card className="bg-purple-500/10 border-purple-500/30 px-4 py-2">
          <p className="text-xs text-gray-400">Sua posição</p>
          <p className="text-2xl font-bold text-purple-400">#{userRank}</p>
        </Card>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 0, 2].map((podiumIdx) => {
          const user = users[podiumIdx];
          if (!user) return null;
          
          const isFirst = podiumIdx === 0;
          
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: podiumIdx * 0.1 }}
              className={cn("flex flex-col items-center", isFirst && "order-2", podiumIdx === 1 && "order-1", podiumIdx === 2 && "order-3")}
            >
              <Card className={cn(
                "w-full p-6 text-center relative overflow-hidden transition-all hover:scale-105",
                RANK_STYLES[user.rank]?.bg || "bg-white/5 border-white/10",
                RANK_STYLES[user.rank]?.glow,
                isFirst && "pt-10"
              )}>
                {isFirst && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                      <Crown className="text-white" size={32} />
                    </div>
                  </div>
                )}

                <div className={cn(
                  "mx-auto rounded-full flex items-center justify-center mb-4 relative",
                  isFirst ? "w-20 h-20" : "w-16 h-16"
                )}>
                  <div className={cn(
                    "w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold",
                    user.isCurrentUser && "ring-4 ring-purple-500 ring-offset-2 ring-offset-gray-900"
                  )}>
                    {user.name?.substring(0, 2).toUpperCase() || "??"}
                  </div>
                  
                  {!isFirst && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                      {RANK_STYLES[user.rank]?.icon}
                    </div>
                  )}
                </div>

                <h3 className={cn("font-bold truncate", isFirst ? "text-lg" : "text-sm")}>
                  {user.name}
                  {user.isCurrentUser && <span className="text-purple-400 ml-1">(você)</span>}
                </h3>

                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    user.plan !== 'free' ? "border-yellow-500/50 text-yellow-400" : "border-gray-600 text-gray-400"
                  )}>
                    {user.plan.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Flame size={12} className="text-purple-400" />
                    <span>Lvl {user.level}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-3">
                  <Zap className="text-yellow-400" size={18} />
                  <span className={cn("font-bold", isFirst ? "text-2xl" : "text-xl")}>
                    {user.weeklyXp.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">XP</span>
                </div>
              </Card>
              
              {/* Podium Base */}
              <div className={cn(
                "w-full mt-2 rounded-t-lg flex items-center justify-center font-bold text-2xl",
                isFirst ? "h-20 bg-gradient-to-b from-yellow-500/30 to-yellow-600/10" : 
                podiumIdx === 1 ? "h-14 bg-gradient-to-b from-gray-400/30 to-gray-500/10" :
                "h-10 bg-gradient-to-b from-amber-700/30 to-amber-800/10"
              )}>
                #{user.rank}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rest of Rankings */}
      <Card className="bg-white/5 border-white/10 overflow-hidden">
        <div className="divide-y divide-gray-800">
          {users.slice(3).map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-4 transition-colors hover:bg-white/5",
                user.isCurrentUser && "bg-purple-500/10"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                user.isCurrentUser ? "bg-purple-500 text-white" : "bg-gray-800 text-gray-400"
              )}>
                {user.rank}
              </div>

              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/50 to-pink-500/50 flex items-center justify-center font-semibold">
                {user.name?.substring(0, 2).toUpperCase() || "??"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{user.name}</span>
                  {user.isCurrentUser && <Badge className="bg-purple-500 text-xs">Você</Badge>}
                  {user.plan !== 'free' && (
                    <Crown size={14} className="text-yellow-400" />
                  )}
                </div>
                <p className="text-xs text-gray-400">Nível {user.level}</p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Zap className="text-yellow-400" size={16} />
                  <span className="font-bold">{user.weeklyXp.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500">XP esta semana</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Weekly Rewards Info */}
      <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="text-purple-400" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Recompensas Semanais</h3>
            <p className="text-sm text-gray-400 mb-3">
              Os top 3 do ranking semanal ganham bônus exclusivos:
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                🥇 1º: +500 XP + Badge Exclusivo
              </Badge>
              <Badge className="bg-gray-400/20 text-gray-300 border-gray-400/50">
                🥈 2º: +300 XP
              </Badge>
              <Badge className="bg-amber-700/20 text-amber-500 border-amber-700/50">
                🥉 3º: +150 XP
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
