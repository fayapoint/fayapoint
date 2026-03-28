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
    <div className="space-y-6">
      {/* Streak Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Streak */}
        <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/30 p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Flame className="text-orange-400" />
              Streak Atual
            </h3>
            {streakFreeze > 0 && (
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                ❄️ {streakFreeze} freeze
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-5xl font-bold text-orange-400">{streak}</span>
            <span className="text-muted-foreground">dias</span>
          </div>

          <p className="text-sm text-muted-foreground">
            {streak === 0 
              ? "Complete uma lição hoje para iniciar seu streak!" 
              : streak < 7 
                ? "Continue assim! Faltam " + (7 - streak) + " dias para a primeira conquista de streak."
                : "Incrível! Mantenha o ritmo! 🔥"}
          </p>

          {isPro && streakFreeze < 3 && (
            <Button variant="outline" size="sm" className="mt-4 w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
              <Gift size={16} className="mr-2" />
              Comprar Streak Freeze (50 XP)
            </Button>
          )}
        </Card>

        {/* Streak Calendar */}
        <Card className="bg-secondary border-border p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="text-amber-400" />
            Calendário de Atividade (últimos 30 dias)
          </h3>

          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {dayNames.map((day, i) => (
              <div key={i} className="text-center text-xs text-muted-foreground mb-1">
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
                  "aspect-square rounded-md flex items-center justify-center text-xs",
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

          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gradient-to-br from-green-500 to-emerald-600" />
              <span>Ativo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-secondary" />
              <span>Inativo</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Challenge */}
      <Card className={cn(
        "p-6 relative overflow-hidden transition-all",
        dailyChallenge.completed 
          ? "bg-green-900/20 border-green-500/30" 
          : "bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border-amber-500/30"
      )}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0",
            dailyChallenge.completed 
              ? "bg-green-500/20" 
              : "bg-amber-500/20"
          )}>
            {dailyChallenge.completed ? (
              <CheckCircle size={32} className="text-green-400" />
            ) : (
              <ChallengeIcon size={32} className="text-amber-400" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50">
                Desafio Diário
              </Badge>
              <div className="flex items-center gap-1 text-yellow-400">
                <Zap size={14} />
                <span className="text-sm font-semibold">+{dailyChallenge.reward} XP</span>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2">{dailyChallenge.description}</h3>

            {dailyChallenge.completed ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={18} />
                <span className="font-medium">Desafio Completo! +{dailyChallenge.reward} XP conquistados</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Progress value={0} className="flex-1 h-2 bg-gray-700 max-w-xs" />
                <span className="text-sm text-muted-foreground">0/{dailyChallenge.requirement.value}</span>
              </div>
            )}
          </div>

          {dailyChallenge.completed && (
            <Button 
              onClick={handleClaimReward}
              disabled={isClaimingReward}
              className="bg-green-600 hover:bg-green-700"
            >
              <Gift size={18} className="mr-2" />
              Resgatar
            </Button>
          )}
        </div>

        {/* Timer */}
        <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={14} />
          <span>Renova em 24h</span>
        </div>
      </Card>

      {/* Weekly Mission (Pro Only) */}
      {weeklyMission ? (
        <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30 p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <Crown size={32} className="text-yellow-400" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                  <Crown size={12} className="mr-1" />
                  Missão Semanal PRO
                </Badge>
                <div className="flex items-center gap-1 text-yellow-400">
                  <Zap size={14} />
                  <span className="text-sm font-semibold">+{weeklyMission.reward} XP</span>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2">{weeklyMission.description}</h3>

              <div className="flex items-center gap-4">
                <Progress value={0} className="flex-1 h-2 bg-gray-700 max-w-xs" />
                <span className="text-sm text-muted-foreground">Em progresso</span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-card/50 border-border p-6 relative overflow-hidden">
          <div className="flex items-center gap-4 opacity-60">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center">
              <Lock size={32} className="text-gray-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold">Missões Semanais</h3>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">PRO</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Upgrade para Pro para desbloquear missões semanais com recompensas maiores!
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Weekly Goal */}
      <Card className="bg-secondary border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="text-blue-400" />
            Meta Semanal
          </h3>
          <Badge variant="outline">
            {weeklyGoal.current}/{weeklyGoal.target} {GOAL_TYPE_LABELS[weeklyGoal.type]}
          </Badge>
        </div>

        <Progress value={goalProgress} className="h-4 bg-secondary mb-4" />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {goalProgress >= 100 
              ? "🎉 Meta cumprida! Parabéns!" 
              : `Faltam ${weeklyGoal.target - weeklyGoal.current} ${GOAL_TYPE_LABELS[weeklyGoal.type]}`}
          </span>
          {goalProgress >= 100 && (
            <div className="flex items-center gap-1 text-green-400">
              <Zap size={14} />
              <span className="font-semibold">+100 XP Bônus</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
