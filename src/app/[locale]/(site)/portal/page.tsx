"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { getCourseBySlug, CourseData, allCourses, getNormalizedLevel } from "@/data/courses";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { TIER_CONFIGS, SubscriptionPlan, EnrollmentSlots } from "@/lib/course-tiers";

// Components
import { DashboardSidebar } from "@/components/portal/DashboardSidebar";
import { AchievementsPanel } from "@/components/portal/AchievementsPanel";
import { LeaderboardPanel } from "@/components/portal/LeaderboardPanel";
import { ChallengesPanel } from "@/components/portal/ChallengesPanel";
import { AIAssistantPanel } from "@/components/portal/AIAssistantPanel";
import { ProfilePanel } from "@/components/portal/ProfilePanel";
import { StorePanel } from "@/components/portal/StorePanel";
import { CartPanel } from "@/components/portal/CartPanel";
import { PODStorePanel } from "@/components/portal/PODStorePanel";

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
  const { user, setUser, logout } = useUser();
  const { items: cartItems, cartTotal } = useServiceCart();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
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

  const isPro = ["pro", "business", "starter"].includes(plan);
  const tierConfig = TIER_CONFIGS[plan as SubscriptionPlan] || TIER_CONFIGS.free;

  // Fetch course access data when courses tab is active
  useEffect(() => {
    if (activeTab === "courses") {
      fetchCourseAccess();
    }
  }, [activeTab]);

  const fetchCourseAccess = async () => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    try {
      const res = await fetch("/api/courses/access", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    const token = localStorage.getItem("fayapoint_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setIsEnrolling(courseSlug);
    try {
      const res = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseSlug }),
      });

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
      router.push(`/portal/learn/${courseSlug}`);
    } catch (error) {
      console.error("Enrollment error:", error);
      toast.error("Erro ao matricular no curso");
    } finally {
      setIsEnrolling(null);
    }
  };

  useEffect(() => {
    if (activeTab === "studio") {
      fetchCreations();
    }
  }, [activeTab]);

  const fetchCreations = async () => {
    const token = localStorage.getItem("fayapoint_token");
    if (!token) return;
    try {
      const res = await fetch("/api/user/creations", {
        headers: { Authorization: `Bearer ${token}` },
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
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("fayapoint_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/user/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          logout();
          router.push("/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Falha ao carregar dados");
        }

        const data = await res.json();
        setDashboardData(data);
        setUser(data.user);
        setOrders(data.orders || []);
        setResources(data.resources || []);
        setPlan(data.plan || "free");

        // Map progress to course details
        if (data.courses) {
          const mappedCourses: DashboardCourseProgress[] = data.courses.map(
            (progress: DashboardCourseProgress) => {
              const courseDetails = getCourseBySlug(progress.courseId);
              return {
                ...progress,
                details: courseDetails,
              };
            }
          );
          setUserCourses(mappedCourses);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        toast.error(t("messages.loadError"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    const token = localStorage.getItem("fayapoint_token");

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
          Authorization: `Bearer ${token}`,
        },
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
    } catch (error) {
      const message = error instanceof Error ? error.message : t("messages.imageError");
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Carregando seu dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !dashboardData) return null;

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
    <div className="min-h-screen bg-black text-white">
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

      {/* Main Content */}
      <motion.main 
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 80 : 280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="min-h-screen"
      >
        {/* Top Bar */}
        <header className="h-16 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-30 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "pod-store" && "Minha Loja POD"}
              {activeTab === "store" && "Loja Tech"}
              {activeTab === "cart" && "Carrinho"}
              {activeTab === "profile" && "Meu Perfil"}
              {activeTab === "courses" && "Meus Cursos"}
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

          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Flame className="text-orange-400" size={18} />
                <span className="font-semibold">{stats.streak}</span>
                <span className="text-gray-500">dias</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap className="text-yellow-400" size={18} />
                <span className="font-semibold">{stats.xp}</span>
                <span className="text-gray-500">XP</span>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-800" />

            {/* Actions */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              <LogOut size={20} />
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Welcome Banner */}
                <Card className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-500/30 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        Bem-vindo de volta, {user.name?.split(" ")[0]}! 👋
                      </h2>
                      <p className="text-gray-400">
                        {stats.streak > 0
                          ? `Você está em uma sequência de ${stats.streak} dias! Continue assim! 🔥`
                          : "Complete uma lição hoje para iniciar seu streak!"}
                      </p>
                    </div>
                    {!isPro && (
                      <Link href="/precos">
                        <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                          <Crown size={16} className="mr-2" />
                          Upgrade Pro
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition group">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400 group-hover:scale-110 transition">
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{user.progress?.coursesInProgress || 0}</p>
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                          Em Progresso
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition group">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400 group-hover:scale-110 transition">
                        <Trophy size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{user.progress?.coursesCompleted || 0}</p>
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                          Concluídos
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition group">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 group-hover:scale-110 transition">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{user.progress?.totalHours || 0}h</p>
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                          De Estudo
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition group">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-500/20 rounded-xl text-green-400 group-hover:scale-110 transition">
                        <Award size={24} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{gamification?.totalAchievements || 0}</p>
                        <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">
                          Conquistas
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Continue Learning */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                          <PlayCircle className="text-purple-400" /> Continuar Aprendendo
                        </h2>
                        <Link href="/cursos">
                          <Button variant="ghost" size="sm">
                            Ver Todos <ChevronRight size={16} />
                          </Button>
                        </Link>
                      </div>
                      <div className="space-y-4">
                        {userCourses.length > 0 ? (
                          userCourses.slice(0, 3).map((progress) => (
                            <Link
                              key={progress._id}
                              href={`/portal/learn/${progress.courseId}`}
                            >
                              <div className="flex gap-4 items-center group bg-white/5 p-4 rounded-xl hover:bg-white/10 transition cursor-pointer">
                                <div className="w-20 h-14 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center overflow-hidden relative shrink-0">
                                  <PlayCircle
                                    size={24}
                                    className="text-white/70 group-hover:text-purple-400 transition"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold truncate group-hover:text-purple-400 transition">
                                    {progress.details?.title || progress.courseId}
                                  </h3>
                                  <div className="flex items-center gap-4 mt-2">
                                    <Progress
                                      value={progress.progressPercent}
                                      className="flex-1 h-2 bg-gray-700"
                                    />
                                    <span className="text-sm font-medium text-purple-400">
                                      {progress.progressPercent}%
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight
                                  size={20}
                                  className="text-gray-500 group-hover:text-purple-400 transition"
                                />
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-800 rounded-xl">
                            <Rocket size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-medium mb-2">Nenhum curso iniciado</p>
                            <p className="text-sm mb-4">
                              Explore nossos cursos e comece sua jornada!
                            </p>
                            <Link href="/cursos">
                              <Button>
                                <Sparkles size={16} className="mr-2" />
                                Explorar Cursos
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Daily Challenge Card */}
                    {gamification?.dailyChallenge && (
                      <Card
                        className={cn(
                          "p-6 cursor-pointer transition-all hover:scale-[1.02]",
                          gamification.dailyChallenge.completed
                            ? "bg-green-900/20 border-green-500/30"
                            : "bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30"
                        )}
                        onClick={() => setActiveTab("challenges")}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center",
                              gamification.dailyChallenge.completed
                                ? "bg-green-500/20"
                                : "bg-purple-500/20"
                            )}
                          >
                            {gamification.dailyChallenge.completed ? (
                              <Check size={28} className="text-green-400" />
                            ) : (
                              <Target size={28} className="text-purple-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                                Desafio Diário
                              </Badge>
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Zap size={14} />
                                <span className="text-sm font-semibold">
                                  +{gamification.dailyChallenge.reward} XP
                                </span>
                              </div>
                            </div>
                            <p className="font-semibold">
                              {gamification.dailyChallenge.description}
                            </p>
                          </div>
                          <ArrowRight className="text-gray-500" />
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Leaderboard Preview */}
                    <Card className="bg-white/5 border-white/10 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Trophy className="text-yellow-400" size={18} />
                          Ranking Semanal
                        </h3>
                        <Badge
                          variant="outline"
                          className="border-purple-500/50 text-purple-400"
                        >
                          #{leaderboard?.userRank || "-"}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {leaderboard?.users?.slice(0, 5).map((u, idx) => (
                          <div
                            key={u.id}
                            className={cn(
                              "flex items-center gap-3 p-2 rounded-lg",
                              u.isCurrentUser && "bg-purple-500/10"
                            )}
                          >
                            <span
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                idx === 0
                                  ? "bg-yellow-500 text-black"
                                  : idx === 1
                                  ? "bg-gray-400 text-black"
                                  : idx === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-gray-800 text-gray-400"
                              )}
                            >
                              {idx + 1}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/50 to-pink-500/50 flex items-center justify-center text-xs font-semibold">
                              {u.name?.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="flex-1 truncate text-sm">
                              {u.name}
                              {u.isCurrentUser && (
                                <span className="text-purple-400 ml-1">(você)</span>
                              )}
                            </span>
                            <span className="text-xs text-gray-400">{u.weeklyXp} XP</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full mt-4"
                        onClick={() => setActiveTab("leaderboard")}
                      >
                        Ver Ranking Completo
                      </Button>
                    </Card>

                    {/* Achievements Preview */}
                    <Card className="bg-white/5 border-white/10 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Star className="text-yellow-400" size={18} />
                          Conquistas Recentes
                        </h3>
                        <span className="text-sm text-gray-400">
                          {gamification?.totalAchievements || 0}/
                          {gamification?.achievements?.length || 0}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {gamification?.achievements
                          ?.filter((a) => a.unlocked)
                          .slice(0, 8)
                          .map((achievement) => (
                            <div
                              key={achievement.id}
                              className="aspect-square rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center"
                              title={achievement.id}
                            >
                              <Trophy size={20} className="text-yellow-400" />
                            </div>
                          ))}
                        {(!gamification?.achievements?.filter((a) => a.unlocked).length ||
                          gamification.achievements.filter((a) => a.unlocked).length <
                            8) &&
                          Array.from({
                            length: 8 - (gamification?.totalAchievements || 0),
                          }).map((_, i) => (
                            <div
                              key={i}
                              className="aspect-square rounded-lg bg-gray-800/50 flex items-center justify-center"
                            >
                              <Lock size={16} className="text-gray-600" />
                            </div>
                          ))}
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full mt-4"
                        onClick={() => setActiveTab("achievements")}
                      >
                        Ver Todas Conquistas
                      </Button>
                    </Card>
                  </div>
                </div>
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
                className="space-y-6"
              >
                {/* Enrollment Slots Overview */}
                <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <BookOpen className="text-purple-400" />
                        Seus Cursos - Plano {tierConfig.displayName}
                      </h2>
                      <p className="text-gray-400 text-sm mt-1">
                        {tierConfig.limits.unlimited 
                          ? "Acesso ilimitado a todos os cursos!"
                          : "Gerencie suas matrículas de acordo com seu plano"
                        }
                      </p>
                    </div>
                    {!tierConfig.limits.unlimited && (
                      <Link href="/precos">
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                          <Crown size={16} className="mr-2" />
                          Upgrade para mais cursos
                        </Button>
                      </Link>
                    )}
                  </div>

                  {/* Slot indicators */}
                  {!tierConfig.limits.unlimited && enrollmentSlots && (
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="bg-black/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {enrollmentSlots.free.used}/{enrollmentSlots.free.limit === Infinity ? '∞' : enrollmentSlots.free.limit}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Iniciante</p>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (enrollmentSlots.free.used / enrollmentSlots.free.limit) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {enrollmentSlots.intermediate.used}/{enrollmentSlots.intermediate.limit === Infinity ? '∞' : enrollmentSlots.intermediate.limit}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Intermediário</p>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                          <div 
                            className="bg-yellow-500 h-1.5 rounded-full" 
                            style={{ width: enrollmentSlots.intermediate.limit > 0 ? `${Math.min(100, (enrollmentSlots.intermediate.used / enrollmentSlots.intermediate.limit) * 100)}%` : '0%' }}
                          />
                        </div>
                      </div>
                      <div className="bg-black/30 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {enrollmentSlots.advanced.used}/{enrollmentSlots.advanced.limit === Infinity ? '∞' : enrollmentSlots.advanced.limit}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Avançado</p>
                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                          <div 
                            className="bg-purple-500 h-1.5 rounded-full" 
                            style={{ width: enrollmentSlots.advanced.limit > 0 ? `${Math.min(100, (enrollmentSlots.advanced.used / enrollmentSlots.advanced.limit) * 100)}%` : '0%' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* My Enrolled Courses */}
                {userCourses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <PlayCircle className="text-green-400" size={20} />
                      Cursos em Andamento
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userCourses.map((progress) => (
                        <Link key={progress._id} href={`/portal/learn/${progress.courseId}`}>
                          <Card className="bg-white/5 border-white/10 overflow-hidden hover:border-green-500/50 transition group cursor-pointer">
                            <div className="h-32 bg-gradient-to-br from-green-900/30 to-emerald-900/30 relative">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <PlayCircle size={40} className="text-green-400/50 group-hover:text-green-400 transition" />
                              </div>
                              <div className="absolute top-3 left-3">
                                <Badge className="bg-green-500/80 text-white text-xs">
                                  Matriculado
                                </Badge>
                              </div>
                              <div className="absolute bottom-3 right-3">
                                <Badge className="bg-black/80 text-white">
                                  {progress.progressPercent}%
                                </Badge>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold group-hover:text-green-400 transition mb-2 line-clamp-1">
                                {progress.details?.title || progress.courseId}
                              </h3>
                              <Progress value={progress.progressPercent} className="h-1.5 bg-gray-700" />
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Courses to Enroll */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="text-purple-400" size={20} />
                    Cursos Disponíveis para Matrícula
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allCourses.map((course) => {
                      const normalizedLevel = getNormalizedLevel(course);
                      const isEnrolled = enrolledSlugs.includes(course.slug);
                      const canAccessLevel = tierConfig.canAccessLevel(normalizedLevel);
                      const slotCategory = normalizedLevel === 'free' || normalizedLevel === 'beginner' ? 'free' : normalizedLevel;
                      const hasAvailableSlot = enrollmentSlots 
                        ? enrollmentSlots[slotCategory as keyof EnrollmentSlots]?.available > 0 
                        : true;
                      const canEnroll = canAccessLevel && (hasAvailableSlot || tierConfig.limits.unlimited);
                      
                      const levelColors: Record<string, string> = {
                        free: 'bg-green-500/20 text-green-400 border-green-500/50',
                        beginner: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
                        intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
                        advanced: 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                      };

                      return (
                        <Card 
                          key={course.slug}
                          className={cn(
                            "overflow-hidden transition-all",
                            isEnrolled 
                              ? "bg-green-500/5 border-green-500/30 opacity-60"
                              : canEnroll
                                ? "bg-white/5 border-white/10 hover:border-purple-500/50"
                                : "bg-gray-900/50 border-gray-800 opacity-50"
                          )}
                        >
                          <div className={cn(
                            "h-28 relative",
                            isEnrolled 
                              ? "bg-gradient-to-br from-green-900/30 to-emerald-900/30"
                              : canEnroll
                                ? "bg-gradient-to-br from-gray-800 to-gray-900"
                                : "bg-gray-900"
                          )}>
                            <div className="absolute inset-0 flex items-center justify-center">
                              {isEnrolled ? (
                                <Check size={32} className="text-green-400" />
                              ) : canEnroll ? (
                                <BookOpen size={32} className="text-gray-600" />
                              ) : (
                                <Lock size={32} className="text-gray-600" />
                              )}
                            </div>
                            <div className="absolute top-2 left-2">
                              <Badge className={cn("text-xs", levelColors[normalizedLevel])}>
                                {normalizedLevel === 'free' ? 'Gratuito' : 
                                 normalizedLevel === 'beginner' ? 'Iniciante' :
                                 normalizedLevel === 'intermediate' ? 'Intermediário' : 'Avançado'}
                              </Badge>
                            </div>
                            {!canAccessLevel && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-xs">
                                  <Lock size={10} className="mr-1" />
                                  Upgrade
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold line-clamp-1 mb-1">{course.title}</h4>
                            <p className="text-xs text-gray-400 mb-3 line-clamp-2">{course.shortDescription}</p>
                            
                            {isEnrolled ? (
                              <Link href={`/portal/learn/${course.slug}`}>
                                <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                                  <PlayCircle size={14} className="mr-1" />
                                  Continuar
                                </Button>
                              </Link>
                            ) : canEnroll ? (
                              <Button 
                                size="sm" 
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                onClick={() => handleEnroll(course.slug)}
                                disabled={isEnrolling === course.slug}
                              >
                                {isEnrolling === course.slug ? (
                                  <Loader2 size={14} className="animate-spin mr-1" />
                                ) : (
                                  <Sparkles size={14} className="mr-1" />
                                )}
                                Matricular
                              </Button>
                            ) : (
                              <Link href="/precos">
                                <Button size="sm" variant="outline" className="w-full border-gray-700">
                                  <Crown size={14} className="mr-1" />
                                  Fazer Upgrade
                                </Button>
                              </Link>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
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
                <Card className="bg-white/5 border-white/10 p-6">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6 pb-6 border-b border-white/10">
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        <Sparkles className="text-purple-400" /> Studio AI Pro
                      </h2>
                      <p className="text-sm text-gray-400 mt-1">
                        Crie imagens incríveis com inteligência artificial
                      </p>
                    </div>
                    <div className="w-full md:w-64">
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="bg-black/50 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-800 text-white">
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
                            ? "bg-purple-500/20 border-purple-500 text-purple-300"
                            : "bg-black/30 border-gray-800 hover:bg-white/5 text-gray-400"
                        )}
                      >
                        <s.icon size={24} />
                        <span className="text-xs font-medium whitespace-nowrap">{s.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Ratio Selection */}
                  <div className="flex gap-2 mb-6">
                    {RATIOS.map((r) => (
                      <Button
                        key={r.id}
                        variant={aspectRatio === r.id ? "default" : "outline"}
                        className={cn(
                          "h-12",
                          aspectRatio === r.id
                            ? "bg-purple-600 border-purple-600"
                            : "bg-black/30 border-gray-800"
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
                      className="bg-black/50 border-gray-700 min-h-[120px] text-lg p-4 resize-none pr-32"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <div className="absolute bottom-4 right-4">
                      <Button
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold px-8"
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
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card className="bg-white/5 border-white/10 p-6 min-h-[500px] flex items-center justify-center">
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
                        <div className="text-center text-gray-500">
                          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            {isGenerating ? (
                              <Loader2 className="animate-spin opacity-50" size={40} />
                            ) : (
                              <ImageIcon size={40} className="opacity-50" />
                            )}
                          </div>
                          <p className="text-xl font-medium mb-2">
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
                      <Card className="bg-white/5 border-white/10 p-4 max-h-[600px] overflow-hidden">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                          <ImageIcon size={18} /> Minhas Criações
                        </h3>
                        <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[500px]">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {myCreations.map((creation: any) => (
                            <div
                              key={creation._id}
                              className="aspect-square rounded-lg overflow-hidden bg-gray-900 cursor-pointer border border-transparent hover:border-purple-500 transition"
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
                <Card className="bg-white/5 border-white/10 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Seus Recursos</h2>
                    <Badge className={cn(
                      "px-3 py-1",
                      isPro 
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-black" 
                        : "bg-gray-700"
                    )}>
                      Plano {plan.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.map((resource, idx) => (
                      <Card
                        key={idx}
                        className={cn(
                          "p-4",
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
                        <p className="text-xs text-gray-400 mt-1">
                          {resource.available ? "Disponível" : "Requer upgrade"}
                        </p>
                      </Card>
                    ))}
                  </div>

                  {!isPro && (
                    <Card className="mt-8 p-6 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg mb-1">
                            Desbloqueie Todos os Recursos
                          </h3>
                          <p className="text-sm text-gray-400">
                            Upgrade para Pro e tenha acesso ilimitado a todos os recursos!
                          </p>
                        </div>
                        <Link href="/precos">
                          <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
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
                <Card className="bg-white/5 border-white/10 p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ShoppingBag size={20} /> Carrinho Atual
                  </h2>
                  <div className="space-y-4">
                    {Object.keys(cartItems).length > 0 ? (
                      Object.values(cartItems).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-white/5 p-4 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
                              <Star size={20} className="text-yellow-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-gray-400">
                                {item.type === "service" ? "Serviço" : "Curso"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              R$ {item.price.toLocaleString("pt-BR")}
                            </p>
                            <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 italic">Carrinho vazio</p>
                    )}
                  </div>
                  {cartTotal > 0 && (
                    <div className="mt-6 flex justify-end border-t border-gray-800 pt-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Total Estimado</p>
                        <p className="text-2xl font-bold text-green-400">
                          R$ {cartTotal.toLocaleString("pt-BR")}
                        </p>
                        <Link href="/carrinho">
                          <Button className="mt-2">Finalizar Compra</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="bg-white/5 border-white/10 p-6">
                  <h2 className="text-xl font-semibold mb-4">Histórico de Pedidos</h2>
                  <div className="space-y-3">
                    {orders.length > 0 ? (
                      orders.map((order) => {
                        const isExpanded = expandedOrderId === order._id;
                        return (
                          <div
                            key={order._id}
                            className="border border-gray-800 rounded-lg overflow-hidden"
                          >
                            {/* Order Header - Clickable */}
                            <div
                              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                              onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "transition-transform duration-200",
                                  isExpanded && "rotate-90"
                                )}>
                                  <ChevronRight size={18} className="text-gray-400" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    Pedido #{order._id.substring(order._id.length - 6)}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {new Date(order.createdAt).toLocaleDateString("pt-BR")} • {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge
                                  variant={order.status === "completed" ? "default" : "outline"}
                                  className={cn(
                                    order.status === "pending" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                                    order.status === "processing" && "bg-blue-500/20 text-blue-400 border-blue-500/30",
                                    order.status === "completed" && "bg-green-500/20 text-green-400 border-green-500/30",
                                    order.status === "shipped" && "bg-purple-500/20 text-purple-400 border-purple-500/30",
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
                                <p className="font-bold text-green-400">
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
                                  <div className="border-t border-gray-800 bg-black/30 p-4">
                                    <p className="text-sm text-gray-400 mb-3">Itens do pedido:</p>
                                    <div className="space-y-3">
                                      {order.items.map((item, idx) => (
                                        <div 
                                          key={idx} 
                                          className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                              {item.type === "product" ? (
                                                <Package size={18} className="text-purple-400" />
                                              ) : item.type === "course" ? (
                                                <BookOpen size={18} className="text-blue-400" />
                                              ) : (
                                                <Settings size={18} className="text-green-400" />
                                              )}
                                            </div>
                                            <div>
                                              <p className="font-medium text-sm">{item.name}</p>
                                              <p className="text-xs text-gray-400">
                                                {item.type === "product" ? "Produto" : 
                                                 item.type === "course" ? "Curso" : "Serviço"} 
                                                {item.quantity > 1 && ` × ${item.quantity}`}
                                              </p>
                                            </div>
                                          </div>
                                          <p className="font-medium">
                                            R$ {(item.price * item.quantity).toLocaleString("pt-BR")}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center">
                                      <span className="text-sm text-gray-400">Total do pedido</span>
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
                      <p className="text-gray-400 text-center py-4">Nenhum pedido encontrado</p>
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
                    <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/30 p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
                          <Gift size={32} className="text-yellow-400" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">Loja de Recompensas</h2>
                          <p className="text-gray-400">
                            Troque seus pontos por prêmios exclusivos!
                          </p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-sm text-gray-400">Seu saldo</p>
                          <p className="text-3xl font-bold text-yellow-400">
                            {stats.xp} <span className="text-lg">XP</span>
                          </p>
                        </div>
                      </div>
                    </Card>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { name: "1 Mês Extra Pro", xp: 5000, icon: Crown },
                        { name: "Mentoria 1:1 (30min)", xp: 10000, icon: MessageSquare },
                        { name: "Curso Exclusivo", xp: 15000, icon: BookOpen },
                        { name: "Badge VIP", xp: 2000, icon: Star },
                        { name: "Streak Freeze x3", xp: 500, icon: Flame },
                        { name: "Download Pack Templates", xp: 1000, icon: Download },
                      ].map((reward, idx) => (
                        <Card key={idx} className="bg-white/5 border-white/10 p-6">
                          <div className="w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4">
                            <reward.icon size={28} className="text-yellow-400" />
                          </div>
                          <h3 className="font-bold text-lg mb-2">{reward.name}</h3>
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
                                  : "bg-gray-700"
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
                  <div className="flex items-center justify-center min-h-[600px]">
                    <Card className="bg-gray-900/50 border-gray-800 p-8 text-center max-w-md">
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Gift size={40} className="text-yellow-400" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Loja de Recompensas</h2>
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 mb-4">
                        <Crown size={12} className="mr-1" />
                        Recurso PRO
                      </Badge>
                      <p className="text-gray-400 mb-6">
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
      </motion.main>
    </div>
  );
}

