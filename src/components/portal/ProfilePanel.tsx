"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Building2,
  Briefcase,
  MapPin,
  Globe,
  Linkedin,
  Trophy,
  Crown,
  Flame,
  Zap,
  Award,
  Star,
  Calendar,
  Edit2,
  Save,
  Loader2,
  Check,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { ProfileAvatarEditor } from "@/components/user/ProfileAvatarEditor";
import { ACHIEVEMENT_NAMES } from "@/components/portal/AchievementsPanel";
import { PersonaSection } from "@/components/portal/PersonaSection";

interface Achievement {
  id: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface ProfilePanelProps {
  user: {
    name: string;
    email: string;
    image?: string;
    profile?: {
      bio?: string;
      company?: string;
      position?: string;
      location?: string;
      website?: string;
      linkedin?: string;
    };
  };
  stats: {
    level: number;
    xp: number;
    xpToNextLevel: number;
    levelProgress: number;
    streak: number;
    longestStreak?: number;
  };
  plan: string;
  achievements?: Achievement[];
  totalAchievements?: number;
  onUserUpdate?: (updatedUser: Partial<ProfilePanelProps['user']>) => void;
}

const TIER_COLORS = {
  bronze: "from-amber-600 to-amber-800 border-amber-500 text-amber-400",
  silver: "from-gray-300 to-gray-500 border-gray-400 text-muted-foreground",
  gold: "from-yellow-400 to-amber-500 border-yellow-400 text-yellow-400",
  platinum: "from-cyan-300 to-blue-400 border-cyan-400 text-cyan-400",
  diamond: "from-amber-400 to-yellow-500 border-amber-400 text-amber-400",
};

export function ProfilePanel({
  user,
  stats,
  plan,
  achievements = [],
  totalAchievements = 0,
  onUserUpdate,
}: ProfilePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    bio: user.profile?.bio || "",
    company: user.profile?.company || "",
    position: user.profile?.position || "",
    location: user.profile?.location || "",
    website: user.profile?.website || "",
    linkedin: user.profile?.linkedin || "",
  });

  const isPro = ["pro", "business", "starter", "explorador", "profissional", "expert"].includes(plan);
  const unlockedAchievements = achievements.filter(a => a.unlocked);

  // Group achievements by tier
  const achievementsByTier = unlockedAchievements.reduce((acc, achievement) => {
    acc[achievement.tier] = (acc[achievement.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('fayai_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          profile: {
            bio: formData.bio,
            company: formData.company,
            position: formData.position,
            location: formData.location,
            website: formData.website,
            linkedin: formData.linkedin,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar');
      }

      toast.success('Perfil atualizado com sucesso!');
      onUserUpdate?.(data.user);
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpdate = (newImageUrl: string | null) => {
    onUserUpdate?.({ ...user, image: newImageUrl ?? undefined });
  };

  return (
    <div className="space-y-4 md:space-y-8 pb-8">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-gray-900 to-card border-border overflow-hidden">
        {/* Banner — arte da casa (fusão §12), não gradiente genérico */}
        <div className="h-32 md:h-40 relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/portal/conta/perfil-hero.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e1d] via-[#0c0e1d]/35 to-transparent" />
          {isPro && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold">
                <Crown size={12} className="mr-1" /> {plan.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-4 md:px-6 pb-4 md:pb-6 -mt-12 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
            {/* Avatar Editor */}
            <ProfileAvatarEditor
              user={user}
              achievements={unlockedAchievements}
              isPro={isPro}
              onAvatarUpdate={handleAvatarUpdate}
            />

            {/* User Info */}
            <div className="flex-1 min-w-0 pt-4">
              <div className="flex items-center gap-2 md:gap-3 mb-2 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold truncate">{user.name}</h2>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-muted-foreground hover:text-white"
                  >
                    <Edit2 size={16} />
                  </Button>
                )}
                <a
                  href="/portal/conta"
                  className="ml-auto shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-white hover:border-amber-400/40 transition-colors"
                >
                  Configurações da conta
                </a>
              </div>
              <p className="text-muted-foreground mb-3 text-sm md:text-base truncate">{user.email}</p>
              
              {user.profile?.bio && !isEditing && (
                <p className="text-muted-foreground text-sm max-w-xl mb-4">
                  {user.profile.bio}
                </p>
              )}

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-2 md:gap-4 text-sm">
                {user.profile?.company && (
                  <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                    <Building2 size={14} className="shrink-0" />
                    <span className="truncate">{user.profile.company}</span>
                  </div>
                )}
                {user.profile?.position && (
                  <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                    <Briefcase size={14} className="shrink-0" />
                    <span className="truncate">{user.profile.position}</span>
                  </div>
                )}
                {user.profile?.location && (
                  <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                    <MapPin size={14} className="shrink-0" />
                    <span className="truncate">{user.profile.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Level Card */}
            <div className="bg-secondary/50 rounded-xl p-3 md:p-4 border border-border w-full md:min-w-[180px] md:w-auto">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-amber-400">{stats.level}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Nível</p>
                  <p className="font-semibold">{stats.xp} XP</p>
                </div>
              </div>
              <Progress value={stats.levelProgress} className="h-2 bg-gray-700" />
              <p className="text-xs text-muted-foreground mt-2 text-right">
                {stats.xpToNextLevel - stats.xp} XP para o próximo nível
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Form */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card border-border p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-4 md:mb-6">Editar Perfil</h3>

            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="bg-secondary border-border min-h-[100px]"
                    placeholder="Conte um pouco sobre você..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="Sua empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="bg-secondary border-border"
                      placeholder="Seu cargo"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-secondary border-border"
                    placeholder="Cidade, País"
                  />
                </div>
                
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="bg-secondary border-border"
                    placeholder="https://seu-site.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="bg-secondary border-border"
                    placeholder="https://linkedin.com/in/seu-perfil"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 md:mt-6">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-amber-600 to-yellow-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="bg-card border-border p-3 md:p-6 overflow-hidden">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Flame size={20} className="text-orange-400 md:hidden" />
              <Flame size={24} className="text-orange-400 hidden md:block" />
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold">{stats.streak}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase">Dias seguidos</p>
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-3 md:p-6 overflow-hidden">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Zap size={20} className="text-yellow-400 md:hidden" />
              <Zap size={24} className="text-yellow-400 hidden md:block" />
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold truncate">{stats.xp.toLocaleString()}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase">XP Total</p>
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-3 md:p-6 overflow-hidden">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Trophy size={20} className="text-amber-400 md:hidden" />
              <Trophy size={24} className="text-amber-400 hidden md:block" />
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold">{totalAchievements}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase">Conquistas</p>
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-3 md:p-6 overflow-hidden">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Star size={20} className="text-blue-400 md:hidden" />
              <Star size={24} className="text-blue-400 hidden md:block" />
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold">{stats.longestStreak || stats.streak}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase">Maior streak</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sua Persona — entrada principal visual (Fase 3.1) */}
      <PersonaSection />

      {/* Achievements Summary */}
      <Card className="bg-card border-border p-4 md:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <Trophy className="text-yellow-400 shrink-0" />
            <span className="truncate">Conquistas por Nível</span>
          </h3>
          <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap shrink-0">
            {totalAchievements}/{achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-4">
          {(['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const).map((tier) => {
            const count = achievementsByTier[tier] || 0;
            const tierConfig = TIER_COLORS[tier];

            return (
              <div
                key={tier}
                className={cn(
                  "rounded-xl p-2 md:p-4 text-center border",
                  count > 0 ? `bg-gradient-to-br ${tierConfig}` : "bg-secondary/50 border-border"
                )}
              >
                <Award
                  className={cn("mx-auto mb-1 md:mb-2 w-5 h-5 md:w-8 md:h-8", count > 0 ? "text-white" : "text-gray-600")}
                />
                <p className={cn("text-lg md:text-2xl font-bold", count > 0 ? "text-white" : "text-gray-600")}>
                  {count}
                </p>
                <p className={cn("text-[9px] md:text-xs uppercase tracking-wider", count > 0 ? "text-white/80" : "text-gray-600")}>
                  {tier}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Achievements */}
      {unlockedAchievements.length > 0 && (
        <Card className="bg-card border-border p-4 md:p-6 overflow-hidden">
          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <Award className="text-amber-400 shrink-0" />
            Conquistas Recentes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            {unlockedAchievements.slice(0, 8).map((achievement) => (
              <div
                key={achievement.id}
                className="rounded-xl border border-border bg-secondary/60 p-3 md:p-4 overflow-hidden"
              >
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 border",
                    TIER_COLORS[achievement.tier]
                  )}>
                    <Trophy size={16} className="text-white md:hidden" />
                    <Trophy size={20} className="text-white hidden md:block" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs md:text-sm truncate">
                      {ACHIEVEMENT_NAMES[achievement.id]?.name || achievement.id.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground capitalize">
                      {achievement.tier} · +{achievement.xpReward} XP
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
