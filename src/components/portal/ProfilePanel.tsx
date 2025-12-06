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
  silver: "from-gray-300 to-gray-500 border-gray-400 text-gray-300",
  gold: "from-yellow-400 to-amber-500 border-yellow-400 text-yellow-400",
  platinum: "from-cyan-300 to-blue-400 border-cyan-400 text-cyan-400",
  diamond: "from-purple-400 to-pink-500 border-purple-400 text-purple-400",
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

  const isPro = ["pro", "business", "starter"].includes(plan);
  const unlockedAchievements = achievements.filter(a => a.unlocked);

  // Group achievements by tier
  const achievementsByTier = unlockedAchievements.reduce((acc, achievement) => {
    acc[achievement.tier] = (acc[achievement.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('fayapoint_token');
      if (!token) {
        toast.error('Você precisa estar logado.');
        return;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
    <div className="space-y-8 pb-8">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-blue-600/30 relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          {isPro && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold">
                <Crown size={12} className="mr-1" /> {plan.toUpperCase()}
              </Badge>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Avatar Editor */}
            <ProfileAvatarEditor
              user={user}
              achievements={unlockedAchievements}
              isPro={isPro}
              onAvatarUpdate={handleAvatarUpdate}
            />

            {/* User Info */}
            <div className="flex-1 pt-4">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Edit2 size={16} />
                  </Button>
                )}
              </div>
              <p className="text-gray-400 mb-3">{user.email}</p>
              
              {user.profile?.bio && !isEditing && (
                <p className="text-gray-300 text-sm max-w-xl mb-4">
                  {user.profile.bio}
                </p>
              )}

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 text-sm">
                {user.profile?.company && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Building2 size={14} />
                    <span>{user.profile.company}</span>
                  </div>
                )}
                {user.profile?.position && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Briefcase size={14} />
                    <span>{user.profile.position}</span>
                  </div>
                )}
                {user.profile?.location && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin size={14} />
                    <span>{user.profile.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Level Card */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 min-w-[180px]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-purple-400">{stats.level}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Nível</p>
                  <p className="font-semibold">{stats.xp} XP</p>
                </div>
              </div>
              <Progress value={stats.levelProgress} className="h-2 bg-gray-700" />
              <p className="text-xs text-gray-500 mt-2 text-right">
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
          <Card className="bg-gray-900 border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-6">Editar Perfil</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="bg-gray-800 border-gray-700 min-h-[100px]"
                    placeholder="Conte um pouco sobre você..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="bg-gray-800 border-gray-700"
                      placeholder="Sua empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Cargo</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="bg-gray-800 border-gray-700"
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
                    className="bg-gray-800 border-gray-700"
                    placeholder="Cidade, País"
                  />
                </div>
                
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                    placeholder="https://seu-site.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                    placeholder="https://linkedin.com/in/seu-perfil"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
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
                className="bg-gradient-to-r from-purple-600 to-pink-600"
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
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Flame size={24} className="text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.streak}</p>
              <p className="text-xs text-gray-400 uppercase">Dias seguidos</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Zap size={24} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.xp.toLocaleString()}</p>
              <p className="text-xs text-gray-400 uppercase">XP Total</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Trophy size={24} className="text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalAchievements}</p>
              <p className="text-xs text-gray-400 uppercase">Conquistas</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Star size={24} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.longestStreak || stats.streak}</p>
              <p className="text-xs text-gray-400 uppercase">Maior streak</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Achievements Summary */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="text-yellow-400" />
            Conquistas por Nível
          </h3>
          <span className="text-sm text-gray-400">
            {totalAchievements} de {achievements.length} desbloqueadas
          </span>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {(['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const).map((tier) => {
            const count = achievementsByTier[tier] || 0;
            const tierConfig = TIER_COLORS[tier];

            return (
              <div
                key={tier}
                className={cn(
                  "rounded-xl p-4 text-center border",
                  count > 0 ? `bg-gradient-to-br ${tierConfig}` : "bg-gray-800/50 border-gray-700"
                )}
              >
                <Award
                  size={32}
                  className={cn("mx-auto mb-2", count > 0 ? "text-white" : "text-gray-600")}
                />
                <p className={cn("text-2xl font-bold", count > 0 ? "text-white" : "text-gray-600")}>
                  {count}
                </p>
                <p className={cn("text-xs uppercase tracking-wider", count > 0 ? "text-white/80" : "text-gray-600")}>
                  {tier}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Achievements */}
      {unlockedAchievements.length > 0 && (
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="text-purple-400" />
            Conquistas Recentes
          </h3>

          <div className="grid md:grid-cols-4 gap-4">
            {unlockedAchievements.slice(0, 8).map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  "rounded-xl p-4 bg-gradient-to-br border",
                  TIER_COLORS[achievement.tier]
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Trophy size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm capitalize">
                      {achievement.id.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-white/70">
                      +{achievement.xpReward} XP
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
