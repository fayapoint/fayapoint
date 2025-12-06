"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Crown, 
  Trophy, 
  Star, 
  Flame, 
  Zap,
  BookOpen,
  GraduationCap,
  Image as ImageIcon,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  Palette,
  Sun,
  Moon,
  Share2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icon mapping for achievements
const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  BookOpen,
  GraduationCap,
  Trophy,
  Star,
  Flame,
  Zap,
  Image: ImageIcon,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  Palette,
  Sun,
  Moon,
  Share2,
  Crown,
};

// Tier colors
const TIER_COLORS = {
  bronze: "from-amber-600 to-amber-800 border-amber-500",
  silver: "from-gray-300 to-gray-500 border-gray-400",
  gold: "from-yellow-400 to-amber-500 border-yellow-400",
  platinum: "from-cyan-300 to-blue-400 border-cyan-400",
  diamond: "from-purple-400 to-pink-500 border-purple-400",
};

const TIER_GLOW = {
  bronze: "shadow-amber-500/30",
  silver: "shadow-gray-400/30",
  gold: "shadow-yellow-400/50",
  platinum: "shadow-cyan-400/50",
  diamond: "shadow-purple-500/50",
};

interface Achievement {
  id: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
  name?: string;
  description?: string;
}

interface UserAvatarWithBadgesProps {
  user: {
    name: string;
    image?: string;
  };
  achievements?: Achievement[];
  size?: "sm" | "md" | "lg" | "xl";
  showBadges?: boolean;
  maxBadges?: number;
  isPro?: boolean;
  className?: string;
  onClick?: () => void;
  editable?: boolean;
}

const SIZES = {
  sm: { avatar: "w-10 h-10", badge: "w-4 h-4", icon: 8, ring: 2, badgeOffset: 14 },
  md: { avatar: "w-12 h-12", badge: "w-5 h-5", icon: 10, ring: 2, badgeOffset: 18 },
  lg: { avatar: "w-16 h-16", badge: "w-6 h-6", icon: 12, ring: 3, badgeOffset: 24 },
  xl: { avatar: "w-24 h-24", badge: "w-8 h-8", icon: 16, ring: 4, badgeOffset: 36 },
};

export function UserAvatarWithBadges({
  user,
  achievements = [],
  size = "md",
  showBadges = true,
  maxBadges = 4,
  isPro = false,
  className,
  onClick,
  editable = false,
}: UserAvatarWithBadgesProps) {
  const [isHovered, setIsHovered] = useState(false);
  const sizeConfig = SIZES[size];
  
  // Get top achievements by tier (prioritize higher tiers)
  const tierOrder = ['diamond', 'platinum', 'gold', 'silver', 'bronze'];
  const unlockedAchievements = achievements
    .filter(a => a.unlocked)
    .sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier))
    .slice(0, maxBadges);

  // Calculate badge positions around the avatar in a circle
  const getBadgePosition = (index: number, total: number) => {
    const startAngle = -90; // Start from top
    const angleStep = 360 / Math.max(total, 4);
    const angle = startAngle + (index * angleStep);
    const radian = (angle * Math.PI) / 180;
    const radius = sizeConfig.badgeOffset;
    
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  const initials = user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "US";

  return (
    <TooltipProvider>
      <div 
        className={cn("relative inline-flex items-center justify-center", className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main Avatar */}
        <motion.div
          className={cn(
            "relative rounded-full",
            onClick && "cursor-pointer",
            editable && isHovered && "ring-2 ring-purple-500 ring-offset-2 ring-offset-background"
          )}
          onClick={onClick}
          whileHover={onClick ? { scale: 1.05 } : undefined}
          whileTap={onClick ? { scale: 0.95 } : undefined}
        >
          <Avatar className={cn(sizeConfig.avatar, "border-2 border-gray-700")}>
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Pro badge */}
          {isPro && (
            <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5 shadow-lg shadow-yellow-500/50">
              <Crown size={sizeConfig.icon} className="text-black" />
            </div>
          )}

          {/* Edit overlay */}
          {editable && isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"
            >
              <span className="text-white text-xs font-medium">Editar</span>
            </motion.div>
          )}
        </motion.div>

        {/* Achievement badges around avatar */}
        {showBadges && unlockedAchievements.length > 0 && (
          <AnimatePresence>
            {unlockedAchievements.map((achievement, index) => {
              const position = getBadgePosition(index, unlockedAchievements.length);
              const Icon = ACHIEVEMENT_ICONS[achievement.icon] || Star;
              const tierColor = TIER_COLORS[achievement.tier];
              const tierGlow = TIER_GLOW[achievement.tier];

              return (
                <Tooltip key={achievement.id}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1,
                        x: position.x,
                        y: position.y,
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                      }}
                      whileHover={{ scale: 1.2 }}
                      className={cn(
                        "absolute bg-gradient-to-br rounded-full flex items-center justify-center border shadow-lg cursor-pointer",
                        sizeConfig.badge,
                        tierColor,
                        tierGlow
                      )}
                      style={{
                        left: "50%",
                        top: "50%",
                        marginLeft: `-${parseInt(sizeConfig.badge.split(" ")[0].replace("w-", "")) * 2}px`,
                        marginTop: `-${parseInt(sizeConfig.badge.split(" ")[0].replace("w-", "")) * 2}px`,
                      }}
                    >
                      <Icon size={sizeConfig.icon} className="text-white drop-shadow" />
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="bg-gray-900 border-gray-700 px-3 py-2"
                  >
                    <div className="text-center">
                      <p className="font-semibold text-sm capitalize">
                        {achievement.id.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                        {achievement.tier} • +{achievement.xpReward} XP
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </TooltipProvider>
  );
}

// Simpler version for leaderboard/lists
export function UserAvatarSimple({
  user,
  size = "sm",
  isPro = false,
  rank,
  className,
}: {
  user: { name: string; image?: string };
  size?: "sm" | "md";
  isPro?: boolean;
  rank?: number;
  className?: string;
}) {
  const sizeConfig = SIZES[size];
  const initials = user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "US";

  const rankColors: Record<number, string> = {
    1: "bg-yellow-500 text-black",
    2: "bg-gray-300 text-black",
    3: "bg-amber-600 text-white",
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      <Avatar className={cn(sizeConfig.avatar, "border-2 border-gray-700")}>
        {user.image ? (
          <AvatarImage src={user.image} alt={user.name} className="object-cover" />
        ) : null}
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      {isPro && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5">
          <Crown size={8} className="text-black" />
        </div>
      )}

      {rank && rank <= 3 && (
        <div className={cn(
          "absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
          rankColors[rank] || "bg-gray-600 text-white"
        )}>
          {rank}
        </div>
      )}
    </div>
  );
}
