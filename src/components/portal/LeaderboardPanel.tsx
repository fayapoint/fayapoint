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

const PLAN_LABEL: Record<string, string> = {
  free: "FREE",
  starter: "EXPLORADOR",
  explorador: "EXPLORADOR",
  pro: "PRO",
  profissional: "PRO",
  business: "EXPERT",
  expert: "EXPERT",
};

/* Avatar com foto real quando existir (o campo image era ignorado) */
function RankAvatar({ user, className }: { user: LeaderboardUser; className?: string }) {
  return user.image ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={user.image}
      alt={user.name}
      className={cn("rounded-full object-cover", className)}
    />
  ) : (
    <div className={cn("rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center font-bold", className)}>
      {user.name?.substring(0, 2).toUpperCase() || "??"}
    </div>
  );
}

const RANK_STYLES: Record<number, { bg: string; icon: React.ReactNode; glow: string }> = {
  1: { 
    bg: "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50", 
    icon: <Crown className="text-yellow-400" size={24} />,
    glow: "shadow-[0_0_30px_rgba(234,179,8,0.3)]"
  },
  2: { 
    bg: "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50", 
    icon: <Medal className="text-muted-foreground" size={22} />,
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
    <div className="space-y-4 md:space-y-6 min-w-0 overflow-hidden">
      {/* Header — arte contextual §12 */}
      <Card className="relative overflow-hidden border-border bg-card p-4 flex flex-row items-center justify-between gap-3 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/portal/dash/ranking.webp" alt="" aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-56 object-cover opacity-30" style={{ WebkitMaskImage: "linear-gradient(to left, black 35%, transparent)", maskImage: "linear-gradient(to left, black 35%, transparent)" }} />
        <div className="relative min-w-0 flex-1">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shrink-0">
              <Trophy size={18} className="text-white md:hidden" />
              <Trophy size={22} className="text-white hidden md:block" />
            </div>
            <span className="truncate">Ranking Semanal</span>
          </h2>
          <p className="text-muted-foreground text-xs md:text-sm mt-1 truncate">Compete com outros alunos e ganhe XP extra!</p>
        </div>

        <Card className="relative bg-amber-500/10 border-amber-500/30 px-3 py-1.5 md:px-4 md:py-2 shrink-0">
          <p className="text-[10px] md:text-xs text-muted-foreground">Sua posição</p>
          <p className="text-xl md:text-2xl font-bold text-amber-400">#{userRank}</p>
        </Card>
      </Card>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8">
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
              className={cn("flex flex-col items-center min-w-0", isFirst && "order-2", podiumIdx === 1 && "order-1", podiumIdx === 2 && "order-3")}
            >
              <Card className={cn(
                "w-full p-3 md:p-6 text-center relative overflow-hidden transition-all hover:scale-105",
                RANK_STYLES[user.rank]?.bg || "bg-secondary border-border",
                RANK_STYLES[user.rank]?.glow,
                isFirst && "pt-8 md:pt-10"
              )}>
                {isFirst && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                      <Crown className="text-white hidden md:block" size={32} />
                      <Crown className="text-white md:hidden" size={20} />
                    </div>
                  </div>
                )}

                <div className={cn(
                  "mx-auto rounded-full flex items-center justify-center mb-2 md:mb-4 relative",
                  isFirst ? "w-14 h-14 md:w-20 md:h-20" : "w-10 h-10 md:w-16 md:h-16"
                )}>
                  <RankAvatar
                    user={user}
                    className={cn(
                      "w-full h-full text-sm md:text-xl",
                      user.isCurrentUser && "ring-2 md:ring-4 ring-amber-500 ring-offset-1 md:ring-offset-2 ring-offset-gray-900"
                    )}
                  />

                  {!isFirst && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-card rounded-full flex items-center justify-center">
                      {RANK_STYLES[user.rank]?.icon}
                    </div>
                  )}
                </div>

                <h3 className={cn("font-bold truncate", isFirst ? "text-sm md:text-lg" : "text-xs md:text-sm")}>
                  {user.name}
                  {user.isCurrentUser && <span className="text-amber-400 ml-1 text-[10px] md:text-sm">(você)</span>}
                </h3>

                <div className="flex items-center justify-center gap-1 md:gap-2 mt-1 md:mt-2 flex-wrap">
                  <Badge variant="outline" className={cn(
                    "text-[8px] md:text-[10px]",
                    user.plan !== 'free' ? "border-yellow-500/50 text-yellow-400" : "border-border text-muted-foreground"
                  )}>
                    {PLAN_LABEL[user.plan] || user.plan.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                    <Flame size={10} className="text-amber-400 md:hidden" />
                    <Flame size={12} className="text-amber-400 hidden md:block" />
                    <span>Lvl {user.level}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1 md:gap-2 mt-2 md:mt-3">
                  <Zap className="text-yellow-400 shrink-0" size={14} />
                  <span className={cn("font-bold", isFirst ? "text-lg md:text-2xl" : "text-base md:text-xl")}>
                    {user.weeklyXp.toLocaleString()}
                  </span>
                  <span className="text-[10px] md:text-xs text-muted-foreground">XP</span>
                </div>
              </Card>

              {/* Podium Base */}
              <div className={cn(
                "w-full mt-1 md:mt-2 rounded-t-lg flex items-center justify-center font-bold text-lg md:text-2xl",
                isFirst ? "h-14 md:h-20 bg-gradient-to-b from-yellow-500/30 to-yellow-600/10" :
                podiumIdx === 1 ? "h-10 md:h-14 bg-gradient-to-b from-gray-400/30 to-gray-500/10" :
                "h-8 md:h-10 bg-gradient-to-b from-amber-700/30 to-amber-800/10"
              )}>
                #{user.rank}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rest of Rankings */}
      <Card className="bg-secondary border-border overflow-hidden">
        <div className="divide-y divide-gray-800">
          {users.slice(3).map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className={cn(
                "flex items-center gap-2 md:gap-4 p-3 md:p-4 transition-colors hover:bg-secondary min-w-0",
                user.isCurrentUser && "bg-amber-500/10"
              )}
            >
              <div className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shrink-0",
                user.isCurrentUser ? "bg-amber-500 text-white" : "bg-secondary text-muted-foreground"
              )}>
                {user.rank}
              </div>

              <RankAvatar user={user} className="w-9 h-9 md:w-12 md:h-12 text-xs md:text-base shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 md:gap-2 min-w-0">
                  <span className="font-semibold text-sm md:text-base truncate">{user.name}</span>
                  {user.isCurrentUser && <Badge className="bg-amber-500 text-[10px] md:text-xs shrink-0">Você</Badge>}
                  {user.plan !== 'free' && (
                    <Crown size={12} className="text-yellow-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground">Nível {user.level}</p>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center gap-1">
                  <Zap className="text-yellow-400" size={14} />
                  <span className="font-bold text-sm md:text-base">{user.weeklyXp.toLocaleString()}</span>
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">XP esta semana</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Você fora do top? Linha fixada com sua posição real */}
        {userRank > 0 && !users.some((u) => u.isCurrentUser) && (
          <div className="flex items-center gap-2 md:gap-4 p-3 md:p-4 border-t-2 border-amber-500/30 bg-amber-500/10">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs md:text-sm shrink-0">
              {userRank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm md:text-base">Você</span>
                <Badge className="bg-amber-500 text-[10px] shrink-0">Sua posição</Badge>
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                Ganhe XP em aulas, quizzes e minigames para subir no ranking
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Weekly Rewards Info */}
      <Card className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border-amber-500/30 p-3 md:p-6">
        <div className="flex items-start gap-3 md:gap-4 min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="text-amber-400 md:hidden" size={20} />
            <TrendingUp className="text-amber-400 hidden md:block" size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base md:text-lg mb-1">Recompensas Semanais</h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
              Os top 3 do ranking semanal ganham bonus exclusivos:
            </p>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-[10px] md:text-xs">
                1st: +500 XP + Badge
              </Badge>
              <Badge className="bg-gray-400/20 text-muted-foreground border-gray-400/50 text-[10px] md:text-xs">
                2nd: +300 XP
              </Badge>
              <Badge className="bg-amber-700/20 text-amber-500 border-amber-700/50 text-[10px] md:text-xs">
                3rd: +150 XP
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
