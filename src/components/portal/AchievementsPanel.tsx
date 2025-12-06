"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Flame,
  GraduationCap,
  Trophy,
  Clock,
  Calendar,
  Sun,
  Moon,
  Image as ImageIcon,
  Palette,
  MessageSquare,
  Users,
  Share2,
  Star,
  Crown,
  Zap,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  BookOpen,
  Flame,
  GraduationCap,
  Trophy,
  Clock,
  Calendar,
  Sun,
  Moon,
  Image: ImageIcon,
  Palette,
  MessageSquare,
  Users,
  Share2,
  Star,
  Crown,
  Zap,
};

const TIER_COLORS = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-gray-300 to-gray-500",
  gold: "from-yellow-400 to-yellow-600",
  platinum: "from-cyan-300 to-cyan-500",
  diamond: "from-purple-400 to-pink-400",
};

const TIER_BORDER = {
  bronze: "border-amber-700/50",
  silver: "border-gray-400/50",
  gold: "border-yellow-500/50",
  platinum: "border-cyan-400/50",
  diamond: "border-purple-400/50",
};

interface Achievement {
  id: string;
  category: string;
  tier: keyof typeof TIER_COLORS;
  icon: string;
  xpReward: number;
  requirement: { type: string; value: number };
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  isSecret?: boolean;
}

interface AchievementsPanelProps {
  achievements: Achievement[];
  totalUnlocked: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  learning: "Aprendizado",
  engagement: "Engajamento",
  social: "Social",
  ai: "Inteligência Artificial",
  milestone: "Marcos",
};

const ACHIEVEMENT_NAMES: Record<string, { name: string; description: string }> = {
  first_lesson: { name: "Primeiro Passo", description: "Complete sua primeira lição" },
  lesson_streak_7: { name: "Semana Perfeita", description: "Mantenha um streak de 7 dias" },
  lesson_streak_30: { name: "Mês Dedicado", description: "Mantenha um streak de 30 dias" },
  lesson_streak_100: { name: "Centurião", description: "Mantenha um streak de 100 dias" },
  first_course: { name: "Formado", description: "Complete seu primeiro curso" },
  course_master: { name: "Mestre dos Cursos", description: "Complete 5 cursos" },
  study_10h: { name: "Estudante Dedicado", description: "Estude por 10 horas" },
  study_50h: { name: "Maratonista", description: "Estude por 50 horas" },
  study_100h: { name: "Expert", description: "Estude por 100 horas" },
  daily_login_7: { name: "Frequente", description: "Faça login por 7 dias" },
  daily_login_30: { name: "Fiel", description: "Faça login por 30 dias" },
  early_bird: { name: "Madrugador", description: "Faça login antes das 7h" },
  night_owl: { name: "Coruja", description: "Faça login depois das 23h" },
  first_image: { name: "Primeiro Clique", description: "Gere sua primeira imagem IA" },
  image_creator: { name: "Criador de Imagens", description: "Gere 25 imagens com IA" },
  ai_artist: { name: "Artista Digital", description: "Gere 100 imagens com IA" },
  first_chat: { name: "Conversa Inicial", description: "Faça sua primeira pergunta à IA" },
  ai_conversationalist: { name: "Conversador IA", description: "Faça 50 perguntas à IA" },
  first_referral: { name: "Embaixador", description: "Convide seu primeiro amigo" },
  influencer: { name: "Influenciador", description: "Convide 10 amigos" },
  level_5: { name: "Nível 5", description: "Alcance o nível 5" },
  level_10: { name: "Nível 10", description: "Alcance o nível 10" },
  level_25: { name: "Nível 25", description: "Alcance o nível 25" },
  xp_1000: { name: "Mil XP", description: "Acumule 1.000 XP" },
  xp_10000: { name: "Dez Mil XP", description: "Acumule 10.000 XP" },
};

export function AchievementsPanel({ achievements, totalUnlocked }: AchievementsPanelProps) {
  const categories = [...new Set(achievements.map(a => a.category))];
  const totalAchievements = achievements.length;
  const completionPercent = Math.round((totalUnlocked / totalAchievements) * 100);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <Trophy size={28} className="text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold">{totalUnlocked}</p>
              <p className="text-sm text-gray-400">Conquistas Desbloqueadas</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Star size={28} className="text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold">{totalAchievements}</p>
              <p className="text-sm text-gray-400">Total de Conquistas</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Progresso Geral</p>
              <span className="text-lg font-bold">{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="h-3 bg-gray-800" />
          </div>
        </Card>
      </div>

      {/* Achievements by Category */}
      {categories.map(category => {
        const categoryAchievements = achievements.filter(a => a.category === category);
        const unlockedInCategory = categoryAchievements.filter(a => a.unlocked).length;

        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {CATEGORY_LABELS[category] || category}
                <Badge variant="outline" className="text-xs">
                  {unlockedInCategory}/{categoryAchievements.length}
                </Badge>
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categoryAchievements.map((achievement, idx) => {
                const Icon = ICON_MAP[achievement.icon] || Star;
                const info = ACHIEVEMENT_NAMES[achievement.id] || { name: achievement.id, description: "" };
                const isSecret = achievement.isSecret && !achievement.unlocked;

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={cn(
                      "p-4 transition-all group relative overflow-hidden",
                      achievement.unlocked 
                        ? `bg-gradient-to-br ${TIER_COLORS[achievement.tier]}/10 ${TIER_BORDER[achievement.tier]} hover:scale-105`
                        : "bg-gray-900/50 border-gray-800 opacity-60"
                    )}>
                      {/* Tier Badge */}
                      <Badge 
                        className={cn(
                          "absolute top-2 right-2 text-[10px] capitalize",
                          `bg-gradient-to-r ${TIER_COLORS[achievement.tier]} text-white border-0`
                        )}
                      >
                        {achievement.tier}
                      </Badge>

                      <div className="flex flex-col items-center text-center">
                        <div className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center mb-3",
                          achievement.unlocked 
                            ? `bg-gradient-to-br ${TIER_COLORS[achievement.tier]}`
                            : "bg-gray-800"
                        )}>
                          {isSecret ? (
                            <Lock size={24} className="text-gray-500" />
                          ) : (
                            <Icon size={24} className={achievement.unlocked ? "text-white" : "text-gray-500"} />
                          )}
                        </div>

                        <h4 className="font-semibold text-sm mb-1">
                          {isSecret ? "???" : info.name}
                        </h4>
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                          {isSecret ? "Continue explorando para descobrir!" : info.description}
                        </p>

                        <div className="flex items-center gap-1 text-xs">
                          <Zap size={12} className="text-yellow-400" />
                          <span className="text-yellow-400 font-semibold">+{achievement.xpReward} XP</span>
                        </div>

                        {/* Progress for locked achievements */}
                        {!achievement.unlocked && achievement.progress > 0 && (
                          <div className="w-full mt-3">
                            <Progress 
                              value={(achievement.progress / achievement.requirement.value) * 100} 
                              className="h-1.5 bg-gray-700" 
                            />
                            <p className="text-[10px] text-gray-500 mt-1">
                              {achievement.progress}/{achievement.requirement.value}
                            </p>
                          </div>
                        )}

                        {/* Unlock date */}
                        {achievement.unlocked && achievement.unlockedAt && (
                          <p className="text-[10px] text-gray-500 mt-2">
                            Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>

                      {/* Glow effect for unlocked */}
                      {achievement.unlocked && (
                        <div className={cn(
                          "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity",
                          `bg-gradient-to-br ${TIER_COLORS[achievement.tier]}`
                        )} />
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
