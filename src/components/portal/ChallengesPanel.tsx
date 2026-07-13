"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Flame,
  Zap,
  CheckCircle,
  Clock,
  Calendar,
  Gift,
  Lock,
  Crown,
  TrendingUp,
  BookOpen,
  Image as ImageIcon,
  MessageSquare,
  Share2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PromptBuilderGame } from "@/components/portal/PromptBuilderGame";

interface DailyChallenge {
  id: string;
  description: string;
  reward: number;
  requirement: { type: string; value: number };
  completed: boolean;
}

interface WeeklyMission {
  id: string;
  description: string;
  reward: number;
}

interface WeeklyGoal {
  target: number;
  current: number;
  type: 'lessons' | 'hours' | 'xp';
}

interface ChallengesPanelProps {
  dailyChallenge: DailyChallenge;
  weeklyMission: WeeklyMission | null;
  weeklyGoal: WeeklyGoal;
  streakFreeze: number;
  streak: number;
  isPro: boolean;
  streakCalendar: { date: string; active: boolean }[];
}

const CHALLENGE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  complete_lesson: BookOpen,
  complete_3_lessons: BookOpen,
  study_30min: Clock,
  study_1h: Clock,
  generate_image: ImageIcon,
  generate_3_images: ImageIcon,
  explore_tool: Target,
  share_creation: Share2,
};

const GOAL_TYPE_LABELS: Record<string, string> = {
  lessons: "lições",
  hours: "horas",
  xp: "XP",
};

export function ChallengesPanel({
  dailyChallenge,
  weeklyMission,
  weeklyGoal,
  streakFreeze,
  streak,
  isPro,
  streakCalendar,
}: ChallengesPanelProps) {
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const ChallengeIcon = CHALLENGE_ICONS[dailyChallenge.id] || Target;
  const goalProgress = Math.min(100, (weeklyGoal.current / weeklyGoal.target) * 100);

  const handleClaimReward = async () => {
    setIsClaimingReward(true);
    // API call would go here
    setTimeout(() => setIsClaimingReward(false), 1000);
  };

  // Get day names for calendar
  const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="space-y-4 md:space-y-6 min-w-0 overflow-hidden">
      {/* Minigame da trilha — Monte o Prompt (F4) */}
      <PromptBuilderGame />

      {/* Streak Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        {/* Current Streak */}
        <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/30 p-3 md:p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 md:mb-4 min-w-0">
            <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base">
              <Flame className="text-orange-400 shrink-0" size={18} />
              Streak Atual
            </h3>
            {streakFreeze > 0 && (
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-[10px] md:text-xs shrink-0">
                ❄️ {streakFreeze} freeze
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-2 mb-3 md:mb-4">
            <span className="text-4xl md:text-5xl font-bold text-orange-400">{streak}</span>
            <span className="text-muted-foreground text-sm">dias</span>
          </div>

          <p className="text-xs md:text-sm text-muted-foreground">
            {streak === 0
              ? "Complete uma lição hoje para iniciar seu streak!"
              : streak < 7
                ? "Continue assim! Faltam " + (7 - streak) + " dias para a primeira conquista de streak."
                : "Incrível! Mantenha o ritmo! 🔥"}
          </p>

          {isPro && streakFreeze < 3 && (
            <Button variant="outline" size="sm" className="mt-3 md:mt-4 w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 text-xs md:text-sm">
              <Gift size={14} className="mr-2 shrink-0" />
              Comprar Streak Freeze (50 XP)
            </Button>
          )}
        </Card>

        {/* Streak Calendar */}
        <Card className="bg-secondary border-border p-3 md:p-6 lg:col-span-2">
          <h3 className="font-semibold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
            <Calendar className="text-amber-400 shrink-0" size={18} />
            <span className="truncate">Calendário de Atividade (últimos 30 dias)</span>
          </h3>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* Day headers */}
            {dayNames.map((day, i) => (
              <div key={i} className="text-center text-[10px] md:text-xs text-muted-foreground mb-1">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {streakCalendar.map((day, idx) => (
              <motion.div
                key={day.date}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.01 }}
                className={cn(
                  "aspect-square rounded-md flex items-center justify-center text-[10px] md:text-xs",
                  day.active
                    ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white font-semibold"
                    : "bg-secondary/50 text-gray-600"
                )}
                title={day.date}
              >
                {new Date(day.date).getDate()}
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-3 md:gap-4 mt-3 md:mt-4 text-[10px] md:text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-gradient-to-br from-green-500 to-emerald-600 shrink-0" />
              <span>Ativo</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded bg-secondary shrink-0" />
              <span>Inativo</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Challenge */}
      <Card className={cn(
        "p-3 md:p-6 relative overflow-hidden transition-all",
        dailyChallenge.completed
          ? "bg-green-900/20 border-green-500/30"
          : "bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border-amber-500/30"
      )}>
        <div className="flex items-start gap-3 md:gap-4 min-w-0">
          <div className={cn(
            "w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0",
            dailyChallenge.completed
              ? "bg-green-500/20"
              : "bg-amber-500/20"
          )}>
            {dailyChallenge.completed ? (
              <>
                <CheckCircle size={24} className="text-green-400 md:hidden" />
                <CheckCircle size={32} className="text-green-400 hidden md:block" />
              </>
            ) : (
              <>
                <ChallengeIcon size={24} className="text-amber-400 md:hidden" />
                <ChallengeIcon size={32} className="text-amber-400 hidden md:block" />
              </>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2 flex-wrap">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50 text-[10px] md:text-xs">
                Desafio Diário
              </Badge>
              <div className="flex items-center gap-1 text-yellow-400">
                <Zap size={12} />
                <span className="text-xs md:text-sm font-semibold">+{dailyChallenge.reward} XP</span>
              </div>
            </div>

            <h3 className="text-base md:text-xl font-bold mb-1.5 md:mb-2 line-clamp-2">{dailyChallenge.description}</h3>

            {dailyChallenge.completed ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={16} className="shrink-0" />
                <span className="font-medium text-xs md:text-sm">Desafio Completo! +{dailyChallenge.reward} XP conquistados</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 md:gap-4">
                <Progress value={0} className="flex-1 h-2 bg-gray-700 max-w-xs" />
                <span className="text-xs md:text-sm text-muted-foreground shrink-0">0/{dailyChallenge.requirement.value}</span>
              </div>
            )}

            {/* Claim button moves inline on mobile */}
            {dailyChallenge.completed && (
              <Button
                onClick={handleClaimReward}
                disabled={isClaimingReward}
                size="sm"
                className="bg-green-600 hover:bg-green-700 mt-2 md:hidden text-xs"
              >
                <Gift size={14} className="mr-1.5" />
                Resgatar
              </Button>
            )}
          </div>

          {dailyChallenge.completed && (
            <Button
              onClick={handleClaimReward}
              disabled={isClaimingReward}
              className="bg-green-600 hover:bg-green-700 hidden md:flex shrink-0"
            >
              <Gift size={18} className="mr-2" />
              Resgatar
            </Button>
          )}
        </div>

        {/* Timer */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 flex items-center gap-1 md:gap-2 text-[10px] md:text-xs text-muted-foreground">
          <Clock size={12} />
          <span>Renova em 24h</span>
        </div>
      </Card>

      {/* Weekly Mission (Pro Only) */}
      {weeklyMission ? (
        <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30 p-3 md:p-6">
          <div className="flex items-start gap-3 md:gap-4 min-w-0">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <Crown size={24} className="text-yellow-400 md:hidden" />
              <Crown size={32} className="text-yellow-400 hidden md:block" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2 flex-wrap">
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-[10px] md:text-xs">
                  <Crown size={10} className="mr-1" />
                  Missão Semanal PRO
                </Badge>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Zap size={12} />
                  <span className="text-xs md:text-sm font-semibold">+{weeklyMission.reward} XP</span>
                </div>
              </div>

              <h3 className="text-base md:text-xl font-bold mb-1.5 md:mb-2 line-clamp-2">{weeklyMission.description}</h3>

              <div className="flex items-center gap-2 md:gap-4">
                <Progress value={0} className="flex-1 h-2 bg-gray-700 max-w-xs" />
                <span className="text-xs md:text-sm text-muted-foreground shrink-0">Em progresso</span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-card/50 border-border p-3 md:p-6 relative overflow-hidden">
          <div className="flex items-center gap-3 md:gap-4 opacity-60 min-w-0">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
              <Lock size={24} className="text-gray-600 md:hidden" />
              <Lock size={32} className="text-gray-600 hidden md:block" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-base md:text-lg font-bold">Missões Semanais</h3>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-[10px] md:text-xs shrink-0">PRO</Badge>
              </div>
              <p className="text-muted-foreground text-xs md:text-sm">
                Upgrade para Pro para desbloquear missões semanais com recompensas maiores!
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Weekly Goal */}
      <Card className="bg-secondary border-border p-3 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4 min-w-0 gap-2">
          <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base">
            <TrendingUp className="text-blue-400 shrink-0" size={18} />
            Meta Semanal
          </h3>
          <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">
            {weeklyGoal.current}/{weeklyGoal.target} {GOAL_TYPE_LABELS[weeklyGoal.type]}
          </Badge>
        </div>

        <Progress value={goalProgress} className="h-3 md:h-4 bg-secondary mb-3 md:mb-4" />

        <div className="flex items-center justify-between text-xs md:text-sm gap-2">
          <span className="text-muted-foreground">
            {goalProgress >= 100
              ? "🎉 Meta cumprida! Parabéns!"
              : `Faltam ${weeklyGoal.target - weeklyGoal.current} ${GOAL_TYPE_LABELS[weeklyGoal.type]}`}
          </span>
          {goalProgress >= 100 && (
            <div className="flex items-center gap-1 text-green-400 shrink-0">
              <Zap size={14} />
              <span className="font-semibold">+100 XP Bônus</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
