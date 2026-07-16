"use client";

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
  Share2,
  ArrowRight,
  Snowflake,
  Footprints,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { FxConfetti } from "@/components/portal/games/GameLearning";
import { getChallengeGuide, type ChallengeDestination } from "@/lib/challenges";

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
  onTabChange: (tab: ChallengeDestination | "rewards") => void;
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
  onTabChange,
}: ChallengesPanelProps) {
  const ChallengeIcon = CHALLENGE_ICONS[dailyChallenge.id] || Target;
  const guide = getChallengeGuide(dailyChallenge.id, dailyChallenge.description);
  const goalProgress = Math.min(100, (weeklyGoal.current / weeklyGoal.target) * 100);

  // Get day names for calendar
  const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="space-y-4 md:space-y-6 min-w-0 overflow-hidden">
      {/* Streak Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        {/* Current Streak */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/30 p-3 md:p-6 lg:col-span-1">
          <img src="/portal/trail/sequencia-3-dias.webp" alt="Sequência de aprendizagem" className="absolute -right-8 -bottom-10 h-36 w-36 object-contain opacity-20" />
          <div className="relative">
          <div className="flex items-center justify-between mb-3 md:mb-4 min-w-0">
            <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base">
              <Flame className="text-orange-400 shrink-0" size={18} />
              Streak Atual
            </h3>
            {streakFreeze > 0 && (
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 text-[10px] md:text-xs shrink-0">
                <Snowflake size={11} className="mr-1" /> {streakFreeze} proteção{streakFreeze === 1 ? "" : "ões"}
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

          <div className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-500/[0.06] p-3 text-[11px] leading-relaxed text-cyan-100/75">
            <strong className="text-cyan-200">Proteção de sequência:</strong> se você perder um dia, uma proteção preserva seu streak automaticamente. Nada é consumido enquanto você mantém o ritmo.
          </div>

          {isPro && streakFreeze < 3 && (
            <Button onClick={() => onTabChange("rewards")} variant="outline" size="sm" className="mt-3 w-full border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 text-xs md:text-sm">
              <Gift size={14} className="mr-2 shrink-0" />
              Ver proteção nas recompensas
            </Button>
          )}
          </div>
        </Card>

        {/* Streak Calendar */}
        <Card className="bg-secondary border-border p-3 md:p-6 lg:col-span-2">
          <h3 className="font-semibold mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
            <Calendar className="text-amber-400 shrink-0" size={18} />
            <span className="truncate">Calendário de Atividade (últimos 30 dias)</span>
          </h3>

          <div className="grid max-w-sm grid-cols-7 gap-1 md:gap-2">
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
                  "aspect-square rounded-md flex items-center justify-center text-[10px] md:text-xs border",
                  day.active
                    ? "bg-gradient-to-br from-orange-500/30 to-amber-500/15 text-orange-300 border-orange-400/30 font-semibold shadow-[0_0_12px_rgba(251,146,60,0.12)]"
                    : "bg-secondary/50 text-gray-600 border-transparent"
                )}
                title={day.date}
              >
                {day.active ? <Flame size={14} className="fill-orange-400/30" /> : new Date(day.date).getDate()}
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-3 md:gap-4 mt-3 md:mt-4 text-[10px] md:text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Flame size={13} className="text-orange-400 fill-orange-400/30" />
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
        {dailyChallenge.completed && <FxConfetti />}
        <div className="grid gap-4 md:grid-cols-[180px_1fr] min-w-0">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 min-h-36">
            <img src={guide.art} alt={`Arte do desafio: ${guide.title}`} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className={cn("absolute left-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur", dailyChallenge.completed ? "bg-green-500/80" : "bg-amber-500/80")}>
              {dailyChallenge.completed ? <CheckCircle size={22} className="text-white" /> : <ChallengeIcon size={22} className="text-black" />}
            </div>
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

            <h3 className="text-lg md:text-2xl font-bold mb-1">{guide.title}</h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{guide.intro}</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {guide.steps.map((step, index) => (
                <div key={step} className="rounded-xl border border-white/8 bg-black/15 p-3">
                  <span className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300"><Footprints size={11} /> Passo {index + 1}</span>
                  <p className="text-xs leading-relaxed text-white/80">{step}</p>
                </div>
              ))}
            </div>

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

            {!dailyChallenge.completed && (
              <Button onClick={() => onTabChange(guide.destination)} className="mt-4 bg-amber-400 text-black hover:bg-amber-300">
                {guide.cta}<ArrowRight size={16} className="ml-2" />
              </Button>
            )}
          </div>
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
                <Progress value={goalProgress} className="flex-1 h-2 bg-gray-700 max-w-xs" />
                <span className="text-xs md:text-sm text-muted-foreground shrink-0">{weeklyGoal.current}/{weeklyGoal.target}</span>
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
      <Card className="relative bg-secondary border-border p-3 md:p-6 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- arte contextual §12; xp-chuva celebra a meta batida */}
        <img src={goalProgress >= 100 ? "/fx/xp-chuva.webp" : "/fx/meta-semanal.webp"} alt="" aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-28 object-cover opacity-35" style={{ WebkitMaskImage: "linear-gradient(to left, black 40%, transparent)", maskImage: "linear-gradient(to left, black 40%, transparent)" }} />
        <div className="relative flex items-center justify-between mb-3 md:mb-4 min-w-0 gap-2">
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
