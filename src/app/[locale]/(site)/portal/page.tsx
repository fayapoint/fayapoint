"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Download,
  PlayCircle,
  Award,
  Users,
  MessageSquare,
  Settings,
  Bell,
  User,
  LogOut,
  ChevronRight,
  ChevronDown,
  Package,
  Flame,
  Star,
  Image as ImageIcon,
  ShoppingBag,
  Edit,
  Save,
  Loader2,
  Check,
  Lock,
  Sparkles,
  Wand2,
  Palette,
  Layout,
  Aperture,
  Zap,
  Monitor,
  Camera,
  Maximize,
  Grid,
  Sun,
  Moon,
  Layers,
  Smartphone,
  Box,
  Crown,
  Gift,
  Rocket,
  ArrowRight,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { useUser } from "@/contexts/UserContext";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { useDashboard } from "@/hooks/useDashboard";
import { getCourseBySlug, CourseData, allCourses, getNormalizedLevel } from "@/data/courses";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { TIER_CONFIGS, SubscriptionPlan, EnrollmentSlots, resolvePlan } from "@/lib/course-tiers";

// Components
import { DashboardSidebar } from "@/components/portal/DashboardSidebar";
import { DashboardHome } from "@/components/portal/DashboardHome";
import { AchievementsPanel } from "@/components/portal/AchievementsPanel";
import { LeaderboardPanel } from "@/components/portal/LeaderboardPanel";
import { ChallengesPanel } from "@/components/portal/ChallengesPanel";
import { AIAssistantPanel } from "@/components/portal/AIAssistantPanel";
import { ProfilePanel } from "@/components/portal/ProfilePanel";
import { StorePanel } from "@/components/portal/StorePanel";
import { CartPanel } from "@/components/portal/CartPanel";
import PODStorePanel from "@/components/portal/PODStorePanel";
import SocialProfilePanel from "@/components/portal/SocialProfilePanel";
import { MobileBottomNav } from "@/components/portal/MobileBottomNav";
import { CertificatesPanel } from "@/components/portal/CertificatesPanel";
import { CoursesPanel } from "@/components/portal/CoursesPanel";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

// Types
interface DashboardCourseProgress {
  _id: string;
  courseId: string;
  progressPercent: number;
  completedLessons: string[];
  nextLesson?: string;
  details?: CourseData;
}

interface Resource {
  name: string;
  available: boolean;
  limit?: string;
}

interface IOrder {
  _id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    type: string;
  }[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface DashboardData {
  user: any;
  courses: DashboardCourseProgress[];
  orders: IOrder[];
  resources: Resource[];
  plan: string;
  enrollmentSlots?: EnrollmentSlots;
  enrolledCourses?: { courseSlug: string; level: string; isActive: boolean }[];
  gamification: {
    dailyChallenge: any;
    weeklyMission: any;
    weeklyGoal: any;
    streakFreeze: number;
    achievements: any[];
    totalAchievements: number;
  };
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
  leaderboard: {
    users: any[];
    userRank: number;
  };
  activity: {
    streakCalendar: { date: string; active: boolean }[];
    recentCourses: any[];
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const AI_MODELS = [
  { id: "nano-banana-1", name: "Nano Banana 1", icon: Zap, description: "Rápido e eficiente" },
  { id: "nano-banana-pro", name: "Nano Banana Pro", icon: Crown, description: "Qualidade máxima", proOnly: true },
  { id: "flux-1-schnell", name: "Flux 1 Schnell", icon: Flame, description: "Ultra-rápido" },
  { id: "flux-1-dev", name: "Flux 1 Dev", icon: Star, description: "Maior detalhamento" },
];

const STYLES = [
  { id: "none", name: "Normal", icon: Monitor },
  { id: "photorealistic", name: "Fotorealista", icon: Camera },
  { id: "anime", name: "Anime", icon: Sparkles },
  { id: "cyberpunk", name: "Cyberpunk", icon: Zap },
  { id: "oil-painting", name: "Pintura a Óleo", icon: Palette },
  { id: "3d-render", name: "3D Render", icon: Box },
  { id: "minimalist", name: "Minimalista", icon: Layout },
];

const RATIOS = [
  { id: "1:1", name: "1:1", icon: Grid },
  { id: "16:9", name: "16:9", icon: Maximize },
  { id: "9:16", name: "9:16", icon: Smartphone },
];

export default function PortalPage() {
  const t = useTranslations("Portal");
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "pt-BR";
  const { user, setUser, logout } = useUser();
  const { items: cartItems, cartTotal } = useServiceCart();
  const { data: cachedDashboardData, isLoading: isDashboardLoading, error: dashboardError, refetch: refetchDashboard } = useDashboard();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [userCourses, setUserCourses] = useState<DashboardCourseProgress[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [plan, setPlan] = useState("free");
  const [enrollmentSlots, setEnrollmentSlots] = useState<EnrollmentSlots | null>(null);
  const [enrolledSlugs, setEnrolledSlugs] = useState<string[]>([]);
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null);

  // AI Gen State
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myCreations, setMyCreations] = useState<any[]>([]);

  // Studio Controls
  const [selectedModel, setSelectedModel] = useState("nano-banana-1");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [style, setStyle] = useState("none");

  const isPro = plan !== "free";
  const tierConfig = TIER_CONFIGS[plan as SubscriptionPlan] || TIER_CONFIGS.free;
  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === "undefined") return {};
    const token = localStorage.getItem("fayai_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const code = currentUrl.searchParams.get("code");
    const oauthError = currentUrl.searchParams.get("error");

    // Rescue flow: if Google lands on /portal with OAuth params, forward the
    // full query to the dedicated callback route so cookies/session are created.
    if (code || oauthError) {
      const callbackUrl = new URL("/api/auth/google-callback", window.location.origin);
      currentUrl.searchParams.forEach((value, key) => {
        callbackUrl.searchParams.set(key, value);
      });
      window.location.replace(callbackUrl.toString());
    }
  }, []);

  // OPTIMIZATION: Debounce tab-specific fetches to prevent rapid API calls
  useEffect(() => {
    if (activeTab === "courses") {
      const timer = setTimeout(() => {
        fetchCourseAccess();
      }, 300); // 300ms debounce
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const fetchCourseAccess = async () => {
    try {
      const res = await fetch("/api/courses/access", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.status === 401) {
        setEnrollmentSlots(null);
        setEnrolledSlugs([]);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setEnrollmentSlots(data.slots);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEnrolledSlugs(data.activeEnrollments?.map((e: any) => e.courseSlug) || []);
      }
    } catch (e) {
      console.error("Error fetching course access:", e);
    }
  };

  const handleEnroll = async (courseSlug: string) => {
    setIsEnrolling(courseSlug);
    try {
      const res = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({ courseSlug }),
      });

      if (res.status === 401) {
        router.push(`/${locale}/login?redirect=${encodeURIComponent(`/${locale}/portal`)}`);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        if (data.upgradeRequired) {
          toast.error(`${data.error}. Faça upgrade para ${data.suggestedPlan || 'Pro'}!`);
        } else {
          toast.error(data.error || "Erro ao matricular");
        }
        return;
      }

      toast.success("Matrícula realizada com sucesso!");
      setEnrolledSlugs((prev) => [...prev, courseSlug]);
      
      // Refresh slots
      fetchCourseAccess();
      
      // Navigate to course
      router.push(`/${locale}/portal/learn/${courseSlug}`);
    } catch (error) {
      console.error("Enrollment error:", error);
      toast.error("Erro ao matricular no curso");
    } finally {
      setIsEnrolling(null);
    }
  };

  // OPTIMIZATION: Debounce studio tab fetch
  useEffect(() => {
    if (activeTab === "studio") {
      const timer = setTimeout(() => {
        fetchCreations();
      }, 300); // 300ms debounce
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const fetchCreations = async () => {
    try {
      const res = await fetch("/api/user/creations", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMyCreations(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (cachedDashboardData) {
      setDashboardData(cachedDashboardData);
      setUser(cachedDashboardData.user);
      setOrders(cachedDashboardData.orders || []);
      setResources(cachedDashboardData.resources || []);
      setPlan(resolvePlan(cachedDashboardData.plan || "free"));

      // Daily checkin toast - only show if not already shown (using a session flag could be better but this works for now)
      if (cachedDashboardData.dailyXpEarned && cachedDashboardData.dailyXpEarned > 0) {
        // We can check if we already toasted for this specific checkin to avoid dupes on re-render
        // but for now, rely on standard behavior.
        // toast.success(`+${cachedDashboardData.dailyXpEarned} XP ganho hoje!`);
      }

      // Build courses list: merge CourseProgress with enrolledCourses (for 0% enrolled)
      const progressCourses: DashboardCourseProgress[] = (cachedDashboardData.courses || []).map(
        (progress: DashboardCourseProgress) => {
          const courseDetails = getCourseBySlug(progress.courseId);
          return { ...progress, details: courseDetails };
        }
      );
      const progressIds = new Set(progressCourses.map(c => c.courseId));

      // Add enrolled courses that have no progress yet (0%)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enrolledOnly: DashboardCourseProgress[] = (cachedDashboardData.enrolledCourses || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((e: any) => e.isActive && !progressIds.has(e.courseSlug))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((e: any) => {
          const courseDetails = getCourseBySlug(e.courseSlug);
          return {
            _id: `enrolled-${e.courseSlug}`,
            courseId: e.courseSlug,
            progressPercent: 0,
            completedLessons: [],
            details: courseDetails,
          };
        });

      const allUserCourses = [...progressCourses, ...enrolledOnly];
      setUserCourses(allUserCourses);

      // Preserve truthful enrollment semantics: preview/progress alone does not mean active enrollment.
      const activeEnrollmentSlugs = (cachedDashboardData.enrolledCourses || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((e: any) => e.isActive)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((e: any) => e.courseSlug);
      setEnrolledSlugs(Array.from(new Set(activeEnrollmentSlugs)));
    } else if (isDashboardLoading === false && !cachedDashboardData) {
      // If loading is done but no data, likely unauthorized or error
       const token = localStorage.getItem("fayai_token");
       if (!token || dashboardError === "Unauthorized" || dashboardError === "No token") {
          // Clear stale token
          if (token) localStorage.removeItem("fayai_token");
          // The render logic will show login UI
       }
    }
  }, [cachedDashboardData, isDashboardLoading, dashboardError, setUser, router]);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedImage(null);

    const fullPrompt = [
      prompt,
      style !== "none" ? `estilo ${STYLES.find((s) => s.id === style)?.name}` : "",
      aspectRatio !== "1:1" ? `formato ${aspectRatio}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          prompt: fullPrompt,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha na geração");

      setGeneratedImage(data.imageUrl);
      toast.success(t("messages.imageGenerated"));
      fetchCreations();
      // OPTIMIZATION: XP is now awarded inline in /api/ai/generate-image
    } catch (error) {
      const message = error instanceof Error ? error.message : t("messages.imageError");
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !dashboardData) {
    const token = typeof window !== "undefined" ? localStorage.getItem("fayai_token") : null;
    const isAuthError =
      dashboardError === "Unauthorized" ||
      dashboardError === "No token" ||
      dashboardError === "No session";

    if (isAuthError) {
      if (token && isAuthError && typeof window !== "undefined") {
        localStorage.removeItem("fayai_token");
      }
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
            <div className="w-16 h-16 rounded-full bg-amber-600/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold">{t("loginRequired") || "Login necessário"}</h1>
            <p className="text-muted-foreground">{t("loginRequiredDesc") || "Faça login para acessar seu portal do aluno."}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push(`/${locale}/login`)}
                className="bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-500 hover:to-yellow-600 text-white px-8"
              >
                {t("loginButton") || "Entrar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="border-white/20 text-white hover:bg-secondary"
              >
                {t("homeButton") || "Página Inicial"}
              </Button>
            </div>
          </div>
        </div>
      );
    }
    // Has valid token but no data yet — show loading
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData.stats || {
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    levelProgress: 0,
    streak: 0,
    longestStreak: 0,
    imagesGenerated: 0,
    aiChats: 0,
  };

  const gamification = dashboardData.gamification;
  const leaderboard = dashboardData.leaderboard;
  const activity = dashboardData.activity;

  return (
    <div data-dashboard-shell className="h-[100dvh] bg-background text-foreground text-[15px] md:text-[16px] overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        stats={stats}
        plan={plan}
        achievements={gamification?.achievements || []}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        plan={plan}
        stats={stats}
      />

      {/* Main Content - responsive margin for desktop sidebar */}
      <main
        className={cn(
          "h-full flex flex-col overflow-hidden transition-[margin] duration-300",
          sidebarCollapsed ? "md:ml-20" : "md:ml-[280px]"
        )}
      >
        {/* Top Bar */}
        <header className="h-14 md:h-16 shrink-0 bg-card/95 backdrop-blur-xl border-b border-border z-30 flex items-center justify-between px-4 md:px-6">
          <div>
            <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-bebas), sans-serif", letterSpacing: "0.08em", fontSize: "1.4rem" }}>
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "pod-store" && "Minha Loja POD"}
              {activeTab === "store" && "Loja Tech"}
              {activeTab === "cart" && "Carrinho"}
              {activeTab === "profile" && "Meu Perfil"}
              {activeTab === "courses" && "Meus Cursos"}
              {activeTab === "certificates" && "Certificados"}
              {activeTab === "social" && "Perfil Social"}
              {activeTab === "studio" && "Studio AI"}
              {activeTab === "assistant" && "Assistente IA"}
              {activeTab === "achievements" && "Conquistas"}
              {activeTab === "leaderboard" && "Ranking"}
              {activeTab === "challenges" && "Desafios"}
              {activeTab === "resources" && "Recursos"}
              {activeTab === "history" && "Histórico"}
              {activeTab === "rewards" && "Recompensas"}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Link href={`/${locale}`} className="hidden sm:inline-flex">
              <Button variant="outline" size="sm" className="gap-2 bg-secondary/60 border-border">
                <Box size={15} />
                Cubo
              </Button>
            </Link>
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Flame className="text-orange-400" size={18} />
                <span className="font-semibold">{stats.streak}</span>
                <span className="text-muted-foreground">dias</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="text-yellow-400" size={18} />
                <span className="font-semibold">{stats.xp}</span>
                <span className="text-muted-foreground">XP</span>
              </div>
            </div>

            <div className="h-6 w-px bg-secondary" />

            {/* Theme */}
            <div className="hidden md:block">
              <ThemeSwitcher />
            </div>

            {/* Actions */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await logout();
                window.location.assign("/descobrir");
              }}
            >
              <LogOut size={20} />
            </Button>
          </div>
        </header>

        {/* Content — scrolls independently from header and bottom nav */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4 md:p-6 pb-32 md:pb-6">
          <AnimatePresence mode="wait">
            {/* Dashboard Tab — New Bento Grid Layout */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DashboardHome
                  user={user}
                  stats={stats}
                  plan={plan}
                  isPro={isPro}
                  gamification={gamification}
                  leaderboard={leaderboard}
                  activity={activity}
                  userCourses={userCourses}
                  onTabChange={setActiveTab}
                  enrolledSlugs={enrolledSlugs}
                />
              </motion.div>
            )}

            {/* POD Store Tab */}
            {activeTab === "pod-store" && (
              <motion.div
                key="pod-store"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <PODStorePanel isCompact={sidebarCollapsed} />
              </motion.div>
            )}

            {/* Store Tab */}
            {activeTab === "store" && (
              <motion.div
                key="store"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <StorePanel isCompact={sidebarCollapsed} />
              </motion.div>
            )}

            {/* Cart Tab */}
            {activeTab === "cart" && (
              <motion.div
                key="cart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <CartPanel />
              </motion.div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ProfilePanel
                  user={{
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    profile: user.profile,
                  }}
                  stats={{
                    ...stats,
                    longestStreak: stats.longestStreak || stats.streak,
                  }}
                  plan={plan}
                  achievements={gamification?.achievements || []}
                  totalAchievements={gamification?.totalAchievements || 0}
                  onUserUpdate={(updatedUser) => {
                    // Update local user state
                    if (updatedUser) {
                      setUser({ ...user, ...updatedUser });
                    }
                  }}
                />
              </motion.div>
            )}

            {/* Courses Tab */}
            {activeTab === "courses" && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 min-w-0 overflow-hidden"
              >
                <CoursesPanel
                  tierConfig={tierConfig}
                  enrollmentSlots={enrollmentSlots}
                  userCourses={userCourses}
                  enrolledSlugs={enrolledSlugs}
                  isEnrolling={isEnrolling}
                  onEnroll={handleEnroll}
                />
              </motion.div>
            )}

            {/* Certificates Tab */}
            {activeTab === "certificates" && (
              <motion.div
                key="certificates"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <CertificatesPanel />
              </motion.div>
            )}

            {/* Social Profile Tab (USS) */}
            {activeTab === "social" && (
              <motion.div
                key="social"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <SocialProfilePanel user={user} />
              </motion.div>
            )}

            {/* Studio AI Tab */}
            {activeTab === "studio" && (
              <motion.div
                key="studio"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="bg-secondary border-border p-4 md:p-6 min-w-0 overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 pb-6 border-b border-border">
                    <div className="min-w-0">
                      <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-500">
                        <Sparkles className="text-amber-400 shrink-0" /> Studio AI Pro
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Crie imagens incríveis com inteligência artificial
                      </p>
                    </div>
                    <div className="w-full md:w-64">
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-white">
                          {AI_MODELS.map((m) => (
                            <SelectItem
                              key={m.id}
                              value={m.id}
                              disabled={m.proOnly && !isPro}
                            >
                              <div className="flex items-center gap-2">
                                <m.icon size={14} />
                                <span>{m.name}</span>
                                {m.proOnly && (
                                  <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-500">
                                    PRO
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Style Selection */}
                  <div className="flex gap-3 overflow-x-auto pb-4 mb-6">
                    {STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all min-w-[90px]",
                          style === s.id
                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                            : "bg-secondary border-border hover:bg-secondary text-muted-foreground"
                        )}
                      >
                        <s.icon size={24} />
                        <span className="text-xs font-medium whitespace-nowrap">{s.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Ratio Selection */}
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                    {RATIOS.map((r) => (
                      <Button
                        key={r.id}
                        variant={aspectRatio === r.id ? "default" : "outline"}
                        className={cn(
                          "h-12 shrink-0",
                          aspectRatio === r.id
                            ? "bg-amber-600 border-amber-600"
                            : "bg-secondary border-border"
                        )}
                        onClick={() => setAspectRatio(r.id)}
                      >
                        <r.icon size={20} className="mr-2" />
                        {r.name}
                      </Button>
                    ))}
                  </div>

                  {/* Prompt Input */}
                  <div className="relative">
                    <Textarea
                      placeholder="Descreva a imagem que você quer criar..."
                      className="bg-secondary border-border min-h-[120px] text-base md:text-lg p-3 md:p-4 resize-none pb-16 md:pb-4 md:pr-32"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4">
                      <Button
                        className="bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 font-bold px-4 md:px-8"
                        onClick={handleGenerateImage}
                        disabled={isGenerating || !prompt.trim()}
                      >
                        {isGenerating ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <>
                            <Flame className="mr-2" size={18} /> Gerar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Preview & Gallery */}
                <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2">
                    <Card className="bg-secondary border-border p-4 md:p-6 min-h-[300px] md:min-h-[500px] flex items-center justify-center">
                      {generatedImage ? (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                          <img
                            src={generatedImage}
                            alt="Generated"
                            className="max-h-[600px] w-auto rounded-lg shadow-2xl object-contain"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-4"
                            onClick={() => window.open(generatedImage, "_blank")}
                          >
                            <Download className="mr-2" size={16} /> Download HD
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                            {isGenerating ? (
                              <Loader2 className="animate-spin opacity-50" size={40} />
                            ) : (
                              <ImageIcon size={40} className="opacity-50" />
                            )}
                          </div>
                          <p className="text-base md:text-xl font-medium mb-2">
                            {isGenerating ? "Criando sua imagem..." : "Prévia da Imagem"}
                          </p>
                          <p className="text-sm opacity-60">
                            Digite um prompt e clique em Gerar
                          </p>
                        </div>
                      )}
                    </Card>
                  </div>

                  <div>
                    {myCreations.length > 0 && (
                      <Card className="bg-secondary border-border p-4 max-h-[600px] overflow-hidden">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                          <ImageIcon size={18} /> Minhas Criações
                        </h3>
                        <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[500px]">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {myCreations.map((creation: any) => (
                            <div
                              key={creation._id}
                              className="aspect-square rounded-lg overflow-hidden bg-card cursor-pointer border border-transparent hover:border-amber-500 transition"
                              onClick={() => setGeneratedImage(creation.imageUrl)}
                            >
                              <img
                                src={creation.imageUrl}
                                alt={creation.prompt}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI Assistant Tab */}
            {activeTab === "assistant" && (
              <motion.div
                key="assistant"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AIAssistantPanel
                  isPro={isPro}
                  userName={user.name || "Aluno"}
                  aiChats={stats.aiChats}
                />
              </motion.div>
            )}

            {/* Achievements Tab */}
            {activeTab === "achievements" && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AchievementsPanel
                  achievements={gamification?.achievements || []}
                  totalUnlocked={gamification?.totalAchievements || 0}
                />
              </motion.div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <LeaderboardPanel
                  users={leaderboard?.users || []}
                  userRank={leaderboard?.userRank || 0}
                />
              </motion.div>
            )}

            {/* Challenges Tab */}
            {activeTab === "challenges" && (
              <motion.div
                key="challenges"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ChallengesPanel
                  dailyChallenge={gamification?.dailyChallenge || {}}
                  weeklyMission={gamification?.weeklyMission}
                  weeklyGoal={gamification?.weeklyGoal || { target: 5, current: 0, type: "lessons" }}
                  streakFreeze={gamification?.streakFreeze || 0}
                  streak={stats.streak}
                  isPro={isPro}
                  streakCalendar={activity?.streakCalendar || []}
                />
              </motion.div>
            )}

            {/* Resources Tab */}
            {activeTab === "resources" && (
              <motion.div
                key="resources"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="bg-secondary border-border p-4 md:p-6 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
                    <h2 className="text-lg md:text-xl font-semibold truncate">Seus Recursos</h2>
                    <Badge className={cn(
                      "px-3 py-1",
                      isPro 
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black" 
                        : "bg-muted"
                    )}>
                      Plano {plan.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {resources.map((resource, idx) => (
                      <Card
                        key={idx}
                        className={cn(
                          "p-3 md:p-4 min-w-0",
                          resource.available
                            ? "bg-green-500/5 border-green-500/20"
                            : "bg-red-500/5 border-red-500/20 opacity-60"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          {resource.available ? (
                            <Check className="text-green-400" size={20} />
                          ) : (
                            <Lock className="text-red-400" size={20} />
                          )}
                          {resource.limit && (
                            <Badge variant="outline">{resource.limit}</Badge>
                          )}
                        </div>
                        <h3 className="font-medium">{resource.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {resource.available ? "Disponível" : "Requer upgrade"}
                        </p>
                      </Card>
                    ))}
                  </div>

                  {!isPro && (
                    <Card className="mt-6 md:mt-8 p-4 md:p-6 bg-gradient-to-r from-amber-900/40 to-yellow-900/40 border-amber-500/30">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-bold text-base md:text-lg mb-1">
                            Desbloqueie Todos os Recursos
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Upgrade para Pro e tenha acesso ilimitado a todos os recursos!
                          </p>
                        </div>
                        <Link href="/precos" className="shrink-0">
                          <Button className="bg-gradient-to-r from-amber-600 to-yellow-700">
                            <Crown size={16} className="mr-2" />
                            Ver Planos
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  )}
                </Card>
              </motion.div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className="bg-secondary border-border p-4 md:p-6 min-w-0 overflow-hidden">
                  <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center gap-2">
                    <ShoppingBag size={20} className="shrink-0" /> Carrinho Atual
                  </h2>
                  <div className="space-y-3 md:space-y-4">
                    {Object.keys(cartItems).length > 0 ? (
                      Object.values(cartItems).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-secondary p-3 md:p-4 rounded-lg gap-3 min-w-0"
                        >
                          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary rounded flex items-center justify-center shrink-0">
                              <Star size={20} className="text-yellow-500" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-medium text-sm md:text-base truncate">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {item.type === "service" ? "Serviço" : "Curso"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-sm md:text-base">
                              R$ {item.price.toLocaleString("pt-BR")}
                            </p>
                            <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic">Carrinho vazio</p>
                    )}
                  </div>
                  {cartTotal > 0 && (
                    <div className="mt-6 flex justify-end border-t border-border pt-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Estimado</p>
                        <p className="text-xl md:text-2xl font-bold text-green-400">
                          R$ {cartTotal.toLocaleString("pt-BR")}
                        </p>
                        <Link href="/carrinho">
                          <Button className="mt-2">Finalizar Compra</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="bg-secondary border-border p-4 md:p-6 min-w-0 overflow-hidden">
                  <h2 className="text-lg md:text-xl font-semibold mb-4">Histórico de Pedidos</h2>
                  <div className="space-y-3">
                    {orders.length > 0 ? (
                      orders.map((order) => {
                        const isExpanded = expandedOrderId === order._id;
                        return (
                          <div
                            key={order._id}
                            className="border border-border rounded-lg overflow-hidden"
                          >
                            {/* Order Header - Clickable */}
                            <div
                              className="flex items-center justify-between p-3 md:p-4 cursor-pointer hover:bg-secondary transition-colors gap-2 min-w-0"
                              onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                            >
                              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                                <div className={cn(
                                  "transition-transform duration-200 shrink-0",
                                  isExpanded && "rotate-90"
                                )}>
                                  <ChevronRight size={18} className="text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm md:text-base truncate">
                                    Pedido #{order._id.substring(order._id.length - 6)}
                                  </p>
                                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                                    {new Date(order.createdAt).toLocaleDateString("pt-BR")} • {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                                <Badge
                                  variant={order.status === "completed" ? "default" : "outline"}
                                  className={cn(
                                    order.status === "pending" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                                    order.status === "processing" && "bg-blue-500/20 text-blue-400 border-blue-500/30",
                                    order.status === "completed" && "bg-green-500/20 text-green-400 border-green-500/30",
                                    order.status === "shipped" && "bg-amber-500/20 text-amber-400 border-amber-500/30",
                                    order.status === "delivered" && "bg-green-500/20 text-green-400 border-green-500/30",
                                  )}
                                >
                                  {order.status === "pending" ? "Pendente" :
                                   order.status === "processing" ? "Processando" :
                                   order.status === "completed" ? "Concluído" :
                                   order.status === "shipped" ? "Enviado" :
                                   order.status === "delivered" ? "Entregue" :
                                   order.status}
                                </Badge>
                                <p className="font-bold text-green-400 text-sm md:text-base whitespace-nowrap">
                                  R$ {order.totalAmount.toLocaleString("pt-BR")}
                                </p>
                              </div>
                            </div>

                            {/* Expanded Order Items */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="border-t border-border bg-secondary p-3 md:p-4">
                                    <p className="text-sm text-muted-foreground mb-3">Itens do pedido:</p>
                                    <div className="space-y-3">
                                      {order.items.map((item, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between bg-secondary rounded-lg p-3 gap-2 min-w-0"
                                        >
                                          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                                            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                                              {item.type === "product" ? (
                                                <Package size={18} className="text-amber-400" />
                                              ) : item.type === "course" ? (
                                                <BookOpen size={18} className="text-blue-400" />
                                              ) : (
                                                <Settings size={18} className="text-green-400" />
                                              )}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="font-medium text-sm truncate">{item.name}</p>
                                              <p className="text-xs text-muted-foreground">
                                                {item.type === "product" ? "Produto" :
                                                 item.type === "course" ? "Curso" : "Serviço"}
                                                {item.quantity > 1 && ` × ${item.quantity}`}
                                              </p>
                                            </div>
                                          </div>
                                          <p className="font-medium text-sm shrink-0 whitespace-nowrap">
                                            R$ {(item.price * item.quantity).toLocaleString("pt-BR")}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                                      <span className="text-sm text-muted-foreground">Total do pedido</span>
                                      <span className="text-lg font-bold text-green-400">
                                        R$ {order.totalAmount.toLocaleString("pt-BR")}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Nenhum pedido encontrado</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Rewards Tab (Pro Only) */}
            {activeTab === "rewards" && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {isPro ? (
                  <div className="space-y-6">
                    <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/30 p-4 md:p-6 min-w-0 overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 md:mb-6">
                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center shrink-0">
                            <Gift size={28} className="text-yellow-400 md:hidden" />
                            <Gift size={32} className="text-yellow-400 hidden md:block" />
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-xl md:text-2xl font-bold">Loja de Recompensas</h2>
                            <p className="text-sm text-muted-foreground">
                              Troque seus pontos por prêmios exclusivos!
                            </p>
                          </div>
                        </div>
                        <div className="sm:ml-auto text-left sm:text-right shrink-0">
                          <p className="text-sm text-muted-foreground">Seu saldo</p>
                          <p className="text-2xl md:text-3xl font-bold text-yellow-400">
                            {stats.xp} <span className="text-base md:text-lg">XP</span>
                          </p>
                        </div>
                      </div>
                    </Card>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {[
                        { name: "1 Mês Extra Pro", xp: 5000, icon: Crown },
                        { name: "Mentoria 1:1 (30min)", xp: 10000, icon: MessageSquare },
                        { name: "Curso Exclusivo", xp: 15000, icon: BookOpen },
                        { name: "Badge VIP", xp: 2000, icon: Star },
                        { name: "Streak Freeze x3", xp: 500, icon: Flame },
                        { name: "Download Pack Templates", xp: 1000, icon: Download },
                      ].map((reward, idx) => (
                        <Card key={idx} className="bg-secondary border-border p-4 md:p-6 min-w-0">
                          <div className="w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4">
                            <reward.icon size={28} className="text-yellow-400" />
                          </div>
                          <h3 className="font-bold text-base md:text-lg mb-2 truncate">{reward.name}</h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Zap size={16} />
                              <span className="font-bold">{reward.xp} XP</span>
                            </div>
                            <Button
                              size="sm"
                              disabled={stats.xp < reward.xp}
                              className={cn(
                                stats.xp >= reward.xp
                                  ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                                  : "bg-muted"
                              )}
                            >
                              {stats.xp >= reward.xp ? "Resgatar" : "Insuficiente"}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-[300px] md:min-h-[600px]">
                    <Card className="bg-card/50 border-border p-6 md:p-8 text-center max-w-md mx-4">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                        <Gift size={32} className="text-yellow-400 md:hidden" />
                        <Gift size={40} className="text-yellow-400 hidden md:block" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold mb-2">Loja de Recompensas</h2>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 mb-4">
                        <Crown size={12} className="mr-1" />
                        Recurso PRO
                      </Badge>
                      <p className="text-muted-foreground mb-6">
                        Upgrade para Pro para acessar a loja de recompensas e trocar seu XP
                        por prêmios exclusivos!
                      </p>
                      <Link href="/precos">
                        <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                          <Crown size={16} className="mr-2" />
                          Fazer Upgrade
                        </Button>
                      </Link>
                    </Card>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
