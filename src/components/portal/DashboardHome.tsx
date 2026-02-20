"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  Trophy,
  Target,
  Flame,
  Crown,
  Zap,
  PlayCircle,
  Award,
  Bot,
  Gift,
  Store,
  Palette,
  Star,
  Rocket,
  Lock,
  Wand2,
  Download,
  Users,
  ShoppingBag,
  TrendingUp,
  ChevronRight,
  Clock,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { allCourses, getNormalizedLevel } from "@/data/courses";
import { TIER_CONFIGS, SubscriptionPlan } from "@/lib/course-tiers";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface GalleryImage {
  _id: string;
  userName: string;
  imageUrl: string;
  prompt: string;
  createdAt: string;
}

interface StoreProductItem {
  _id: string;
  slug: string;
  name: string;
  shortDescription: string;
  thumbnail: string;
  price: number;
  originalPrice: number;
  discount: number;
  category: string;
  brand: string;
  rating: number;
  reviewCount: number;
  soldCount: number;
  isNewArrival: boolean;
  isFeatured: boolean;
  externalUrl?: string;
}

interface DashboardHomeProps {
  user: { name: string; image?: string };
  stats: {
    level: number;
    xp: number;
    xpToNextLevel: number;
    levelProgress: number;
    streak: number;
    longestStreak: number;
    imagesGenerated: number;
    aiChats: number;
  };
  plan: string;
  isPro: boolean;
  gamification: {
    dailyChallenge: any;
    weeklyMission: any;
    weeklyGoal: any;
    streakFreeze: number;
    achievements: any[];
    totalAchievements: number;
  } | null;
  leaderboard: {
    users: any[];
    userRank: number;
  } | null;
  activity: {
    streakCalendar: { date: string; active: boolean }[];
    recentCourses: any[];
  } | null;
  userCourses: {
    _id: string;
    courseId: string;
    progressPercent: number;
    details?: { title: string; slug?: string; tool?: string; duration?: string; shortDescription?: string };
  }[];
  onTabChange: (tab: string) => void;
  enrolledSlugs?: string[];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 260, damping: 24 },
  },
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export function DashboardHome({
  user,
  stats,
  plan,
  isPro,
  gamification,
  leaderboard,
  activity,
  userCourses,
  onTabChange,
  enrolledSlugs = [],
}: DashboardHomeProps) {
  const greeting = getGreeting();
  const firstName = user.name?.split(" ")[0] || "Aluno";

  const hasCreatedImages = stats.imagesGenerated > 0;
  const hasStartedCourses = userCourses.length > 0;
  const hasUsedAssistant = stats.aiChats > 0;
  const dailyChallenge = gamification?.dailyChallenge;
  const streakCalendar = activity?.streakCalendar?.slice(-7) || [];
  const unlockedAchievements =
    gamification?.achievements?.filter((a: any) => a.unlocked) || [];

  // Tier-based course suggestions
  const tierConfig = TIER_CONFIGS[plan as SubscriptionPlan] || TIER_CONFIGS.free;
  const suggestedCourses = useMemo(() => {
    const enrolledSet = new Set(enrolledSlugs);
    const userCourseIds = new Set(userCourses.map(c => c.courseId));
    return allCourses
      .filter(c => !enrolledSet.has(c.slug) && !userCourseIds.has(c.slug))
      .map(c => ({ ...c, normalizedLevel: getNormalizedLevel(c) }))
      .filter(c => tierConfig.canAccessLevel(c.normalizedLevel))
      .slice(0, 4);
  }, [enrolledSlugs, userCourses, plan, tierConfig]);

  // Locked courses (need upgrade)
  const lockedCourses = useMemo(() => {
    const enrolledSet = new Set(enrolledSlugs);
    const userCourseIds = new Set(userCourses.map(c => c.courseId));
    return allCourses
      .filter(c => !enrolledSet.has(c.slug) && !userCourseIds.has(c.slug))
      .map(c => ({ ...c, normalizedLevel: getNormalizedLevel(c) }))
      .filter(c => !tierConfig.canAccessLevel(c.normalizedLevel))
      .slice(0, 2);
  }, [enrolledSlugs, userCourses, plan, tierConfig]);

  // Gallery image for Studio showcase
  const [galleryImage, setGalleryImage] = useState<GalleryImage | null>(null);
  const [storeProducts, setStoreProducts] = useState<StoreProductItem[]>([]);

  const fetchGalleryImage = useCallback(async () => {
    try {
      const res = await fetch("/api/public/gallery?page=1&limit=20");
      if (res.ok) {
        const data = await res.json();
        const creations = data.creations || [];
        if (creations.length > 0) {
          const randomIdx = Math.floor(Math.random() * Math.min(creations.length, 12));
          setGalleryImage(creations[randomIdx]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch gallery:", e);
    }
  }, []);

  const fetchStoreProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/store/featured");
      if (res.ok) {
        const data = await res.json();
        const all = [...(data.featured || []), ...(data.bestSellers || []), ...(data.newArrivals || [])];
        const seen = new Set<string>();
        const unique: StoreProductItem[] = [];
        for (const p of all) {
          if (!seen.has(p._id)) {
            seen.add(p._id);
            unique.push(p);
          }
          if (unique.length >= 8) break;
        }
        setStoreProducts(unique);
      }
    } catch (e) {
      console.error("Failed to fetch store:", e);
    }
  }, []);

  useEffect(() => {
    fetchGalleryImage();
    fetchStoreProducts();
  }, [fetchGalleryImage, fetchStoreProducts]);

  const levelLabels: Record<string, string> = {
    free: 'Gratuito', beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado'
  };
  const levelColors: Record<string, string> = {
    free: 'bg-green-500/20 text-green-400',
    beginner: 'bg-blue-500/20 text-blue-400',
    intermediate: 'bg-yellow-500/20 text-yellow-400',
    advanced: 'bg-purple-500/20 text-purple-400'
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3 max-w-[1400px] mx-auto"
    >
      {/* ── HERO STRIP — tight, informative ── */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 via-purple-950/30 to-gray-900 border border-white/[0.06] px-4 py-3 md:px-5 md:py-3.5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/[0.06] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-3">
            {/* Left: greeting + streak */}
            <div className="min-w-0 flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg md:text-xl font-extrabold tracking-tight">
                    {greeting}, {firstName} 👋
                  </h1>
                  {stats.streak > 0 && (
                    <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-full px-2 py-0.5">
                      <Flame size={12} className="text-orange-400" fill="currentColor" />
                      <span className="text-xs font-semibold text-orange-300">{stats.streak}d</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {hasStartedCourses
                    ? `${userCourses.length} curso${userCourses.length > 1 ? 's' : ''} em andamento · Nível ${stats.level}`
                    : `Comece sua jornada em IA · Nível ${stats.level}`}
                </p>
              </div>
            </div>

            {/* Right: level ring + upgrade */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(147,51,234,0.15)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="url(#lvlGrad)" strokeWidth="3" strokeDasharray={`${stats.levelProgress} ${100 - stats.levelProgress}`} strokeLinecap="round" />
                    <defs><linearGradient id="lvlGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#ec4899" /></linearGradient></defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-purple-400 to-pink-400">{stats.level}</span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-bold"><span className="text-purple-400">{stats.xp}</span><span className="text-gray-600">/{stats.xpToNextLevel} XP</span></p>
                </div>
              </div>
              {!isPro && (
                <Link href="/precos">
                  <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold gap-1 text-xs h-8 px-3 shadow-lg shadow-orange-500/20">
                    <Crown size={12} /> Upgrade
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── QUICK ACTIONS — compact pill row ── */}
      <motion.div variants={itemVariants}>
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { icon: Wand2, label: "Studio AI", tab: "studio", gradient: "from-purple-600 to-pink-500" },
            { icon: BookOpen, label: "Cursos", tab: "courses", gradient: "from-emerald-600 to-teal-500", count: hasStartedCourses ? userCourses.length : undefined },
            { icon: Palette, label: "Loja POD", tab: "pod-store", gradient: "from-indigo-600 to-violet-500" },
            { icon: Target, label: "Desafios", tab: "challenges", gradient: "from-orange-600 to-amber-500", done: dailyChallenge?.completed },
            { icon: Bot, label: "Assistente", tab: "assistant", gradient: "from-cyan-600 to-blue-500", proOnly: true },
            { icon: Store, label: "Loja", tab: "store", gradient: "from-blue-600 to-indigo-500" },
          ].map((a) => (
            <button
              key={a.tab}
              onClick={() => { if (a.proOnly && !isPro) return; onTabChange(a.tab); }}
              className={cn(
                "shrink-0 flex items-center gap-2 rounded-full border border-white/[0.06] bg-gray-950 px-3 py-1.5 transition-all hover:border-white/[0.15] hover:bg-gray-900",
                a.proOnly && !isPro && "opacity-40 cursor-not-allowed"
              )}
            >
              <div className={cn("w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center", a.gradient)}>
                <a.icon size={12} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-300 whitespace-nowrap">{a.label}</span>
              {a.count && <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[9px] h-4 px-1.5">{a.count}</Badge>}
              {a.done && <Badge className="bg-green-500/20 text-green-400 border-0 text-[9px] h-4 px-1">✓</Badge>}
              {a.proOnly && !isPro && <Lock size={10} className="text-yellow-400 ml-0.5" />}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════ */}
      {/*  MAIN GRID — globo.com dense 3-column layout       */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-3 gap-3">
        {/* ── COL 1: Studio AI (compact) + Store ── */}
        <div className="space-y-3">
          {/* Studio AI — compact horizontal card */}
          <motion.div variants={itemVariants}>
            <Card
              className="relative overflow-hidden border-purple-500/20 bg-gray-950 p-0 cursor-pointer group hover:border-purple-500/40 transition-all"
              onClick={() => onTabChange("studio")}
            >
              <div className="flex">
                {/* Small thumbnail */}
                <div className="relative w-28 md:w-32 shrink-0 bg-gradient-to-br from-purple-950 to-gray-900 overflow-hidden">
                  {galleryImage ? (
                    <>
                      <img src={galleryImage.imageUrl} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-950/60" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center min-h-[100px]">
                      <Sparkles size={24} className="text-purple-500/40" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                      <Sparkles size={13} className="text-white" />
                    </div>
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 p-3 flex flex-col justify-between min-h-[100px]">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Studio AI</h3>
                      {!hasCreatedImages && (
                        <Badge className="bg-green-500/90 text-white border-0 text-[8px] font-bold px-1.5 animate-pulse">NOVO</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {hasCreatedImages
                        ? `${stats.imagesGenerated} imagens criadas. Gemini, Flux e mais modelos.`
                        : "Transforme ideias em imagens com IA. Fotorealista, Anime, 3D e mais."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 gap-1 font-bold h-7 text-xs px-3">
                      <Wand2 size={12} />
                      {hasCreatedImages ? "Criar" : "Começar"}
                    </Button>
                    <ChevronRight size={14} className="text-gray-700 group-hover:text-purple-400 transition" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Daily Challenge — compact */}
          <motion.div variants={itemVariants}>
            <Card
              className={cn(
                "relative overflow-hidden p-3.5 cursor-pointer group hover:scale-[1.01] transition-all",
                dailyChallenge?.completed
                  ? "border-green-500/20 bg-gray-950"
                  : "border-orange-500/15 bg-gray-950"
              )}
              onClick={() => onTabChange("challenges")}
            >
              <div className="flex items-center gap-2.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", dailyChallenge?.completed ? "bg-green-500/15" : "bg-orange-500/15")}>
                  <Target size={15} className={dailyChallenge?.completed ? "text-green-400" : "text-orange-400"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold">Desafio Diário</h4>
                    <span className="text-[9px] font-bold text-yellow-400 flex items-center gap-0.5"><Zap size={9} />+{dailyChallenge?.reward || 50} XP</span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">{dailyChallenge?.description || "Complete uma lição hoje"}</p>
                </div>
                {dailyChallenge?.completed ? (
                  <Badge className="bg-green-500/15 text-green-400 border-green-500/30 text-[9px] shrink-0">✓</Badge>
                ) : (
                  <ChevronRight size={14} className="text-gray-700 shrink-0" />
                )}
              </div>
            </Card>
          </motion.div>

          {/* Streak + Level — compact */}
          <motion.div variants={itemVariants}>
            <Card className="border-white/[0.04] bg-gray-950 p-3.5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                  <Flame size={15} className="text-orange-400" fill="currentColor" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold">Streak · {stats.streak} dias</h4>
                  <p className="text-[10px] text-gray-600">{stats.streak >= 7 ? `Recorde: ${stats.longestStreak}` : "Continue aprendendo!"}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-2.5">
                {Array.from({ length: 7 }).map((_, i) => {
                  const cal = streakCalendar[i];
                  return (
                    <div key={i} className={cn("w-4 h-4 rounded flex items-center justify-center", cal?.active ? "bg-orange-500 shadow-sm shadow-orange-500/40" : "bg-gray-800/80")}>
                      {cal?.active && <Flame size={8} className="text-white" />}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-purple-400">Nv {stats.level}</span>
                <div className="flex-1"><Progress value={stats.levelProgress} className="h-1 bg-gray-800" /></div>
                <span className="text-[10px] text-gray-600 tabular-nums">{stats.xp} XP</span>
              </div>
            </Card>
          </motion.div>

          {/* Quick links row */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Palette, label: "Loja POD", tab: "pod-store", color: "text-indigo-400", bg: "bg-indigo-500/10", badge: "NOVO" },
                { icon: Award, label: "Certificados", tab: "certificates", color: "text-teal-400", bg: "bg-teal-500/10" },
                { icon: Star, label: "Conquistas", tab: "achievements", color: "text-pink-400", bg: "bg-pink-500/10", count: `${gamification?.totalAchievements || 0}/${gamification?.achievements?.length || 0}` },
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => onTabChange(item.tab)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-gray-950 border border-white/[0.04] hover:border-white/[0.1] transition-all group"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.bg)}>
                    <item.icon size={14} className={item.color} />
                  </div>
                  <span className="text-[10px] text-gray-500 group-hover:text-white transition-colors font-medium">{item.label}</span>
                  {item.badge && <Badge className="bg-indigo-500/10 text-indigo-400 border-0 text-[8px] h-3.5 px-1">{item.badge}</Badge>}
                  {item.count && <span className="text-[9px] text-gray-600">{item.count}</span>}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── COL 2: Sua Jornada — ALL courses + suggestions ── */}
        <div className="space-y-3">
          <motion.div variants={itemVariants}>
            <Card className="border-emerald-500/15 bg-gray-950 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <BookOpen size={15} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Sua Jornada</h3>
                    <p className="text-[10px] text-gray-500">{hasStartedCourses ? `${userCourses.length} curso${userCourses.length > 1 ? 's' : ''} matriculado${userCourses.length > 1 ? 's' : ''}` : "Comece a aprender"}</p>
                  </div>
                </div>
                <button onClick={() => onTabChange("courses")} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5">
                  Ver todos <ChevronRight size={12} />
                </button>
              </div>

              {/* ALL enrolled courses */}
              {hasStartedCourses ? (
                <div className="space-y-2">
                  {userCourses.map((course) => (
                    <Link key={course._id} href={`/portal/learn/${course.courseId}`}>
                      <div className="bg-black/40 rounded-lg p-3 border border-white/[0.04] hover:border-emerald-500/30 transition-all cursor-pointer group/course">
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-semibold text-gray-200 truncate flex-1 group-hover/course:text-emerald-400 transition-colors">
                            {course.details?.title || course.courseId}
                          </h4>
                          <span className={cn(
                            "text-xs font-extrabold ml-2 tabular-nums",
                            course.progressPercent === 100 ? "text-green-400" : "text-emerald-400"
                          )}>
                            {course.progressPercent}%
                          </span>
                        </div>
                        <Progress value={course.progressPercent} className="h-1 bg-gray-800" />
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[10px] text-gray-600 flex items-center gap-1">
                            {course.details?.tool && <span className="text-gray-500">{course.details.tool}</span>}
                          </p>
                          <p className="text-[10px] text-emerald-400/70 flex items-center gap-0.5">
                            <PlayCircle size={9} /> {course.progressPercent > 0 ? "Continuar" : "Começar"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <BookOpen size={24} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 mb-2">Nenhum curso iniciado</p>
                  <Button size="sm" onClick={() => onTabChange("courses")} className="bg-emerald-600 hover:bg-emerald-500 gap-1 text-xs h-7">
                    <Rocket size={12} /> Explorar Cursos
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>

          {/* ── COURSE SUGGESTIONS (tier-based) ── */}
          {suggestedCourses.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="border-purple-500/10 bg-gray-950 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles size={15} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">Recomendados para Você</h3>
                      <p className="text-[10px] text-gray-500">Disponíveis no plano {tierConfig.displayName}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {suggestedCourses.map((course) => (
                    <button
                      key={course.slug}
                      onClick={() => onTabChange("courses")}
                      className="w-full text-left bg-black/30 rounded-lg p-2.5 border border-white/[0.04] hover:border-purple-500/30 transition-all group/sug"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shrink-0 border border-white/[0.05]">
                          <BookOpen size={14} className="text-gray-500 group-hover/sug:text-purple-400 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-[11px] font-semibold text-gray-300 truncate group-hover/sug:text-white transition-colors">{course.title}</h4>
                            <Badge className={cn("text-[8px] h-3.5 px-1 border-0 shrink-0", levelColors[course.normalizedLevel])}>
                              {levelLabels[course.normalizedLevel]}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-gray-600 truncate mt-0.5">{course.shortDescription}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-gray-600 flex items-center gap-0.5"><Clock size={8} />{course.duration}</span>
                            <span className="text-[9px] text-gray-600 flex items-center gap-0.5"><BarChart2 size={8} />{course.totalLessons} aulas</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Locked courses — upsell */}
          {lockedCourses.length > 0 && !isPro && (
            <motion.div variants={itemVariants}>
              <Card className="border-yellow-500/10 bg-gray-950 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={13} className="text-yellow-400" />
                  <h4 className="text-xs font-bold text-gray-400">Desbloqueie com Upgrade</h4>
                </div>
                <div className="space-y-1.5">
                  {lockedCourses.map((course) => (
                    <div key={course.slug} className="flex items-center gap-2 p-2 rounded-lg bg-black/30 opacity-60">
                      <Lock size={10} className="text-gray-600 shrink-0" />
                      <span className="text-[10px] text-gray-500 truncate flex-1">{course.title}</span>
                      <Badge className={cn("text-[8px] h-3.5 px-1 border-0 shrink-0", levelColors[course.normalizedLevel])}>
                        {levelLabels[course.normalizedLevel]}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Link href="/precos">
                  <Button size="sm" className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold gap-1 text-[10px] h-7">
                    <Crown size={11} /> Ver Planos
                  </Button>
                </Link>
              </Card>
            </motion.div>
          )}
        </div>

        {/* ── COL 3: Ranking + Assistant + Rewards + Store ── */}
        <div className="space-y-3">
          {/* Ranking — compact */}
          <motion.div variants={itemVariants}>
            <Card
              className="border-yellow-500/10 bg-gray-950 p-3.5 cursor-pointer group hover:border-yellow-500/25 transition-all"
              onClick={() => onTabChange("leaderboard")}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                    <Trophy size={15} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Ranking</h4>
                    <p className="text-[10px] text-gray-500">#{leaderboard?.userRank || "-"} posição</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-700 group-hover:text-yellow-400 transition" />
              </div>
              <div className="space-y-1">
                {leaderboard?.users?.slice(0, 3).map((u, idx) => (
                  <div key={u.id || idx} className="flex items-center gap-1.5">
                    <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0",
                      idx === 0 ? "bg-yellow-500 text-black" : idx === 1 ? "bg-gray-400 text-black" : "bg-amber-700 text-white"
                    )}>{idx + 1}</span>
                    <span className="text-[10px] text-gray-400 truncate flex-1">
                      {u.name}{u.isCurrentUser && <span className="text-purple-400 ml-1">(você)</span>}
                    </span>
                    <span className="text-[9px] text-gray-600 tabular-nums">{u.weeklyXp} XP</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* AI Assistant — compact */}
          <motion.div variants={itemVariants}>
            <Card
              className={cn("border-cyan-500/15 bg-gray-950 p-3.5 cursor-pointer group hover:border-cyan-500/30 transition-all", !isPro && "opacity-60")}
              onClick={() => isPro && onTabChange("assistant")}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                  <Bot size={15} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold">Assistente IA</h4>
                    {!isPro && <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[8px] gap-0.5"><Crown size={8} /> PRO</Badge>}
                  </div>
                  <p className="text-[10px] text-gray-500 truncate">
                    {isPro ? (hasUsedAssistant ? `${stats.aiChats} conversas` : "Tire dúvidas com seu tutor IA") : "Desbloqueie com plano Pro"}
                  </p>
                </div>
                <ChevronRight size={14} className="text-gray-700 group-hover:text-cyan-400 transition shrink-0" />
              </div>
            </Card>
          </motion.div>

          {/* Rewards — compact */}
          <motion.div variants={itemVariants}>
            <Card
              className={cn("border-amber-500/10 bg-gray-950 p-3.5 cursor-pointer group hover:border-amber-500/25 transition-all", !isPro && "opacity-60")}
              onClick={() => onTabChange("rewards")}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shrink-0">
                  <Gift size={15} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold">Recompensas</h4>
                  <div className="flex items-center gap-1">
                    <Zap size={10} className="text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">{stats.xp} XP</span>
                    <span className="text-[9px] text-gray-600">disponíveis</span>
                  </div>
                </div>
                {!isPro ? (
                  <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[8px] gap-0.5 shrink-0"><Crown size={8} /> PRO</Badge>
                ) : (
                  <ChevronRight size={14} className="text-gray-700 group-hover:text-amber-400 transition shrink-0" />
                )}
              </div>
            </Card>
          </motion.div>

          {/* Store — compact product row */}
          <motion.div variants={itemVariants}>
            <Card className="border-blue-500/10 bg-gray-950 p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <ShoppingBag size={15} className="text-white" />
                  </div>
                  <h4 className="text-xs font-bold">Loja</h4>
                </div>
                <button onClick={() => onTabChange("store")} className="text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5">
                  Ver tudo <ChevronRight size={12} />
                </button>
              </div>
              {storeProducts.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {storeProducts.slice(0, 4).map((product) => (
                    <div
                      key={product._id}
                      onClick={() => onTabChange("store")}
                      className="shrink-0 w-[110px] rounded-lg bg-gray-900/80 border border-white/[0.05] overflow-hidden cursor-pointer group/prod hover:border-blue-500/30 transition-all"
                    >
                      <div className="relative w-full aspect-square bg-gray-800/50 overflow-hidden">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover group-hover/prod:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={20} className="text-gray-700" /></div>
                        )}
                        {product.discount > 0 && (
                          <Badge className="absolute top-1 left-1 bg-red-500 text-white border-0 text-[8px] font-bold px-1 py-0 h-4">-{product.discount}%</Badge>
                        )}
                      </div>
                      <div className="p-2">
                        <h5 className="text-[10px] font-medium text-gray-300 line-clamp-1">{product.name}</h5>
                        <span className="text-[11px] font-bold text-blue-400">{formatPrice(product.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-600 text-center py-3">Produtos em breve!</p>
              )}
            </Card>
          </motion.div>

          {/* Explore links */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Download, label: "Recursos", tab: "resources", color: "text-green-400", bg: "bg-green-500/10" },
                { icon: Users, label: "Meu Perfil", tab: "profile", color: "text-pink-400", bg: "bg-pink-500/10" },
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => onTabChange(item.tab)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-gray-950 border border-white/[0.04] hover:border-white/[0.1] transition-all group"
                >
                  <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", item.bg)}>
                    <item.icon size={11} className={item.color} />
                  </div>
                  <span className="text-[10px] text-gray-500 group-hover:text-white transition-colors font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── UPGRADE CTA — compact, only for free users ── */}
      {!isPro && (
        <motion.div variants={itemVariants}>
          <Card className="relative overflow-hidden border-purple-500/20 bg-gradient-to-r from-purple-950/60 via-gray-900 to-pink-950/60 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.1),transparent_70%)] pointer-events-none" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/25 shrink-0">
                  <Crown size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Desbloqueie Todo o Potencial</h3>
                  <p className="text-[11px] text-gray-400">AI Assistant, modelos premium, cursos avançados e mais.</p>
                </div>
              </div>
              <Link href="/precos">
                <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold px-4 shadow-xl shadow-orange-500/20 gap-1 text-xs h-8 shrink-0">
                  <TrendingUp size={13} />
                  Ver Planos
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
