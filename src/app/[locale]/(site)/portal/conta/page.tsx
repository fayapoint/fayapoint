"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  CreditCard,
  Shield,
  Award,
  Settings,
  Save,
  Loader2,
  Check,
  X,
  Plus,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  ArrowLeft,
  Crown,
  Zap,
  Star,
  BookOpen,
  Sun,
  Moon,
  Monitor,
  Bell,
  BellOff,
  Mail,
  Megaphone,
  MessageSquare,
  Globe,
  Play,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUser } from "@/contexts/UserContext";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getClientAuthHeaders, getClientBearerToken } from "@/lib/client-auth";

// ============================================================================
// Types
// ============================================================================

interface AccountData {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  subscription: {
    plan: string;
    status: string;
    expiresAt?: string;
  };
  billing: {
    phone?: string;
    cpfCnpj?: string;
    postalCode?: string;
    address?: string;
    city?: string;
    state?: string;
    asaasCustomerId?: string;
  };
  savedCards: {
    _id: string;
    lastFour: string;
    brand: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    isDefault: boolean;
  }[];
  profile: {
    bio?: string;
    linkedin?: string;
    company?: string;
    position?: string;
    interests: string[];
    skills: string[];
    website?: string;
    location?: string;
  };
  progress: {
    totalHours: number;
    coursesCompleted: number;
    level: number;
    points: number;
  };
  preferences: {
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
      courseUpdates: boolean;
      communityActivity: boolean;
    };
    theme: string;
    playbackSpeed: number;
  };
  createdAt: string;
}

interface SubscriptionData {
  currentPlan: string;
  status: string;
  expiresAt?: string;
  subscription: {
    id: string;
    planName: string;
    value: number;
    cycle: string;
    billingType: string;
    nextDueDate: string;
    status: string;
    creditCardLastFour?: string;
    creditCardBrand?: string;
  } | null;
  plans: {
    id: string;
    name: string;
    slug: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
  }[];
}

interface CertificateData {
  _id: string;
  courseTitle: string;
  courseSlug: string;
  courseLevel: string;
  courseCategory: string;
  certificateNumber: string;
  verificationCode: string;
  verificationUrl: string;
  issuedAt: string;
  completedAt: string;
  totalStudyHours: number;
  quizScore: number;
  pdfUrl?: string;
  imageUrl?: string;
}

// ============================================================================
// Helpers
// ============================================================================

function getToken(): string | null {
  return getClientBearerToken();
}

function getAuthHeaders(): Record<string, string> {
  return getClientAuthHeaders();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-600 text-gray-100",
  starter: "bg-blue-600 text-blue-100",
  pro: "bg-amber-600 text-amber-100",
  business: "bg-yellow-600 text-yellow-100",
};

const PLAN_ICONS: Record<string, typeof Star> = {
  free: Star,
  starter: Zap,
  pro: Crown,
  business: Crown,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ============================================================================
// Main Component
// ============================================================================

export default function AccountPage() {
  const router = useRouter();
  const params = useParams();
  const locale = typeof params?.locale === "string" ? params.locale : "pt-BR";
  const { user: ctxUser, setUser: setCtxUser, logout } = useUser();

  const [account, setAccount] = useState<AccountData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("perfil");

  // Deep-link: /portal/conta?tab=preferencias (usado pelo redirect de /configuracoes)
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && ["perfil", "assinatura", "seguranca", "certificados", "preferencias"].includes(t)) {
      setActiveTab(t);
    }
  }, []);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    linkedin: "",
    company: "",
    position: "",
    website: "",
    location: "",
  });
  const [skillsInput, setSkillsInput] = useState("");
  const [interestsInput, setInterestsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [savingPassword, setSavingPassword] = useState(false);

  // Preferences form
  const [prefsForm, setPrefsForm] = useState({
    theme: "system" as string,
    language: "pt-BR",
    playbackSpeed: 1,
    notifications: {
      email: true,
      push: true,
      marketing: false,
      courseUpdates: true,
      communityActivity: true,
    },
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Delete account dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchAccount = useCallback(async () => {
    try {
      const res = await fetch("/api/account", {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (res.status === 401) {
        await logout();
        window.location.assign(`/${locale}/login`);
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch account");

      const data = await res.json();
      const u = data.user as AccountData;
      setAccount(u);

      // Populate forms
      setProfileForm({
        name: u.name || "",
        bio: u.profile?.bio || "",
        linkedin: u.profile?.linkedin || "",
        company: u.profile?.company || "",
        position: u.profile?.position || "",
        website: u.profile?.website || "",
        location: u.profile?.location || "",
      });
      setSkills(u.profile?.skills || []);
      setInterests(u.profile?.interests || []);
      setPrefsForm({
        theme: u.preferences?.theme || "system",
        language: u.preferences?.language || "pt-BR",
        playbackSpeed: u.preferences?.playbackSpeed || 1,
        notifications: {
          email: u.preferences?.notifications?.email ?? true,
          push: u.preferences?.notifications?.push ?? true,
          marketing: u.preferences?.notifications?.marketing ?? false,
          courseUpdates: u.preferences?.notifications?.courseUpdates ?? true,
          communityActivity: u.preferences?.notifications?.communityActivity ?? true,
        },
      });
    } catch (error) {
      console.error("Error fetching account:", error);
      toast.error("Erro ao carregar dados da conta");
    }
  }, [locale, logout]);

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/account/subscription", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  }, []);

  const fetchCertificates = useCallback(async () => {
    try {
      const res = await fetch("/api/account/certificates", {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAccount(), fetchSubscription(), fetchCertificates()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAccount, fetchSubscription, fetchCertificates]);

  // ============================================================================
  // Actions
  // ============================================================================

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          name: profileForm.name,
          profile: {
            bio: profileForm.bio,
            linkedin: profileForm.linkedin,
            company: profileForm.company,
            position: profileForm.position,
            website: profileForm.website,
            location: profileForm.location,
            skills,
            interests,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar");
      }

      const data = await res.json();
      setAccount((prev) => (prev ? { ...prev, ...data.user } : prev));

      // Update context user
      if (ctxUser) {
        setCtxUser({
          ...ctxUser,
          name: profileForm.name,
          profile: {
            bio: profileForm.bio,
            linkedin: profileForm.linkedin,
            company: profileForm.company,
            position: profileForm.position,
            website: profileForm.website,
            location: profileForm.location,
          },
        });
      }

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar perfil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (passwordForm.new.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar senha");

      toast.success(data.message || "Senha alterada com sucesso!");
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao alterar senha");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({
          preferences: prefsForm,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar preferências");

      toast.success("Preferências salvas com sucesso!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar preferências");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleAddTag = (type: "skills" | "interests") => {
    const input = type === "skills" ? skillsInput : interestsInput;
    const setTags = type === "skills" ? setSkills : setInterests;
    const setInput = type === "skills" ? setSkillsInput : setInterestsInput;
    const tags = type === "skills" ? skills : interests;

    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setInput("");
  };

  const handleRemoveTag = (type: "skills" | "interests", tag: string) => {
    if (type === "skills") {
      setSkills(skills.filter((s) => s !== tag));
    } else {
      setInterests(interests.filter((i) => i !== tag));
    }
  };

  const handleUpgrade = (planId: string) => {
    router.push(`/checkout/${planId}`);
  };

  // ============================================================================
  // Loading Skeleton
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-lg bg-secondary" />
            <Skeleton className="h-8 w-48 bg-secondary" />
          </div>
          <Skeleton className="h-12 w-full mb-6 bg-secondary" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full bg-secondary" />
            <Skeleton className="h-48 w-full bg-secondary" />
            <Skeleton className="h-24 w-full bg-secondary" />
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Erro ao carregar conta</p>
          <Button onClick={() => router.push("/portal")} variant="outline">
            Voltar ao Portal
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  const currentPlan = account.subscription?.plan || "free";
  const PlanIcon = PLAN_ICONS[currentPlan] || Star;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Header — identidade com arte §12 (14/07) */}
        <div className="relative overflow-hidden rounded-2xl border border-border mb-6 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/portal/conta/perfil-hero.webp" alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
          <div className="relative flex items-center gap-4">
          <Link href="/portal">
            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-muted-foreground" />
            </button>
          </Link>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {account.image ? (
              <img
                src={account.image}
                alt={account.name}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-border shrink-0"
              />
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-amber-600 to-yellow-700 flex items-center justify-center text-base md:text-lg font-bold shrink-0">
                {getInitials(account.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-bold truncate">{account.name}</h1>
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="text-xs md:text-sm text-muted-foreground truncate">{account.email}</span>
                <Badge className={cn("text-xs shrink-0", PLAN_COLORS[currentPlan])}>
                  <PlanIcon size={12} className="mr-1" />
                  {currentPlan.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          <a
            href="/portal?tab=profile"
            className="relative shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-white hover:border-amber-400/40 transition-colors"
          >
            Meu Perfil
          </a>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-card border border-border h-auto flex-wrap gap-1 p-1 min-w-0 overflow-hidden">
            <TabsTrigger
              value="perfil"
              className="flex-1 min-w-0 sm:min-w-[80px] data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 text-muted-foreground"
            >
              <User size={16} className="mr-1.5 shrink-0" />
              <span className="hidden sm:inline truncate">Perfil</span>
            </TabsTrigger>
            <TabsTrigger
              value="assinatura"
              className="flex-1 min-w-0 sm:min-w-[80px] data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 text-muted-foreground"
            >
              <CreditCard size={16} className="mr-1.5 shrink-0" />
              <span className="hidden sm:inline truncate">Assinatura</span>
            </TabsTrigger>
            <TabsTrigger
              value="seguranca"
              className="flex-1 min-w-0 sm:min-w-[80px] data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 text-muted-foreground"
            >
              <Shield size={16} className="mr-1.5 shrink-0" />
              <span className="hidden sm:inline truncate">Seguran&ccedil;a</span>
            </TabsTrigger>
            <TabsTrigger
              value="certificados"
              className="flex-1 min-w-0 sm:min-w-[80px] data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 text-muted-foreground"
            >
              <Award size={16} className="mr-1.5 shrink-0" />
              <span className="hidden sm:inline truncate">Certificados</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferencias"
              className="flex-1 min-w-0 sm:min-w-[80px] data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400 text-muted-foreground"
            >
              <Settings size={16} className="mr-1.5 shrink-0" />
              <span className="hidden sm:inline truncate">Prefer&ecirc;ncias</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* ============================================================ */}
            {/* TAB 1: Perfil */}
            {/* ============================================================ */}
            <TabsContent value="perfil">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 mt-6"
              >
                {/* Avatar Section */}
                <Card className="p-4 md:p-6 bg-card border-border min-w-0 overflow-hidden">
                  <div className="flex items-center gap-3 md:gap-4">
                    {account.image ? (
                      <img
                        src={account.image}
                        alt={account.name}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-border shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-600 to-yellow-700 flex items-center justify-center text-xl md:text-2xl font-bold shrink-0">
                        {getInitials(account.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base md:text-lg truncate">{account.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{account.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Membro desde {formatDate(account.createdAt)}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Profile Form */}
                <Card className="p-4 md:p-6 bg-card border-border space-y-4 md:space-y-5 min-w-0 overflow-hidden">
                  <h3 className="text-base md:text-lg font-semibold mb-2">Informações Pessoais</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Nome</Label>
                      <Input
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                        className="bg-secondary border-border text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Email</Label>
                      <Input
                        value={account.email}
                        disabled
                        className="bg-secondary/50 border-border text-muted-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Bio</Label>
                    <Textarea
                      value={profileForm.bio}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                      placeholder="Conte um pouco sobre você..."
                      className="bg-secondary border-border text-white min-h-[100px] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">LinkedIn</Label>
                      <Input
                        value={profileForm.linkedin}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, linkedin: e.target.value })
                        }
                        placeholder="https://linkedin.com/in/..."
                        className="bg-secondary border-border text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Website</Label>
                      <Input
                        value={profileForm.website}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, website: e.target.value })
                        }
                        placeholder="https://..."
                        className="bg-secondary border-border text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Empresa</Label>
                      <Input
                        value={profileForm.company}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, company: e.target.value })
                        }
                        placeholder="Nome da empresa"
                        className="bg-secondary border-border text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Cargo</Label>
                      <Input
                        value={profileForm.position}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, position: e.target.value })
                        }
                        placeholder="Seu cargo atual"
                        className="bg-secondary border-border text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Localização</Label>
                    <Input
                      value={profileForm.location}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, location: e.target.value })
                      }
                      placeholder="Cidade, Estado"
                      className="bg-secondary border-border text-white"
                    />
                  </div>
                </Card>

                {/* Skills & Interests */}
                <Card className="p-4 md:p-6 bg-card border-border space-y-4 md:space-y-5 min-w-0 overflow-hidden">
                  <div className="space-y-3">
                    <Label className="text-muted-foreground">Habilidades</Label>
                    <div className="flex gap-2">
                      <Input
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag("skills"))}
                        placeholder="Adicionar habilidade..."
                        className="bg-secondary border-border text-white flex-1"
                      />
                      <Button
                        onClick={() => handleAddTag("skills")}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-3 py-1 cursor-pointer hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-colors"
                          onClick={() => handleRemoveTag("skills", skill)}
                        >
                          {skill}
                          <X size={12} className="ml-1.5" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-muted-foreground">Interesses</Label>
                    <div className="flex gap-2">
                      <Input
                        value={interestsInput}
                        onChange={(e) => setInterestsInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag("interests"))}
                        placeholder="Adicionar interesse..."
                        className="bg-secondary border-border text-white flex-1"
                      />
                      <Button
                        onClick={() => handleAddTag("interests")}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {interests.map((interest) => (
                        <Badge
                          key={interest}
                          className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1 cursor-pointer hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-colors"
                          onClick={() => handleRemoveTag("interests", interest)}
                        >
                          {interest}
                          <X size={12} className="ml-1.5" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Save Button */}
                <Button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="w-full bg-amber-600 hover:bg-amber-700 h-12 text-base font-semibold"
                >
                  {savingProfile ? (
                    <Loader2 size={20} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={20} className="mr-2" />
                  )}
                  {savingProfile ? "Salvando..." : "Salvar Perfil"}
                </Button>
              </motion.div>
            </TabsContent>

            {/* ============================================================ */}
            {/* TAB 2: Assinatura */}
            {/* ============================================================ */}
            <TabsContent value="assinatura">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 mt-6"
              >
                {/* Current Plan */}
                <Card className="p-4 md:p-6 bg-card border-border min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <h3 className="text-base md:text-lg font-semibold">Plano Atual</h3>
                    <Badge className={cn("text-sm px-3 py-1", PLAN_COLORS[currentPlan])}>
                      <PlanIcon size={14} className="mr-1.5" />
                      {currentPlan.toUpperCase()}
                    </Badge>
                  </div>

                  {subscriptionData?.subscription ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm gap-2">
                        <span className="text-muted-foreground shrink-0">Valor</span>
                        <span className="font-medium text-right truncate">
                          {formatCurrency(subscriptionData.subscription.value)}/{subscriptionData.subscription.cycle === "monthly" ? "mês" : subscriptionData.subscription.cycle === "yearly" ? "ano" : subscriptionData.subscription.cycle}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm gap-2">
                        <span className="text-muted-foreground shrink-0">Status</span>
                        <Badge
                          className={cn(
                            "text-xs",
                            subscriptionData.subscription.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {subscriptionData.subscription.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      {subscriptionData.subscription.nextDueDate && (
                        <div className="flex justify-between text-sm gap-2">
                          <span className="text-muted-foreground shrink-0">Próxima cobrança</span>
                          <span className="text-right truncate">{formatDate(subscriptionData.subscription.nextDueDate)}</span>
                        </div>
                      )}
                      {subscriptionData.subscription.billingType && (
                        <div className="flex justify-between text-sm gap-2">
                          <span className="text-muted-foreground shrink-0">Forma de pagamento</span>
                          <span className="flex items-center gap-1.5 min-w-0 justify-end">
                            <CreditCard size={14} className="text-muted-foreground shrink-0" />
                            {subscriptionData.subscription.billingType === "credit_card" && subscriptionData.subscription.creditCardLastFour
                              ? `${subscriptionData.subscription.creditCardBrand || "Cartão"} **** ${subscriptionData.subscription.creditCardLastFour}`
                              : subscriptionData.subscription.billingType === "pix"
                                ? "PIX"
                                : subscriptionData.subscription.billingType === "boleto"
                                  ? "Boleto"
                                  : subscriptionData.subscription.billingType}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {currentPlan === "free"
                        ? "Você está no plano gratuito. Faça upgrade para desbloquear mais recursos!"
                        : "Nenhuma assinatura ativa encontrada."}
                    </p>
                  )}

                  {account.subscription?.status === "cancelled" && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm font-medium">Assinatura cancelada</p>
                      <p className="text-yellow-400/70 text-xs mt-1">
                        Seu acesso continua ativo até o fim do período atual.
                      </p>
                      <Button
                        className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
                        size="sm"
                      >
                        Reativar Assinatura
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Plan Comparison */}
                {subscriptionData?.plans && (
                  <Card className="p-4 md:p-6 bg-card border-border min-w-0 overflow-hidden">
                    <h3 className="text-base md:text-lg font-semibold mb-4">Comparar Planos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                      {subscriptionData.plans.map((plan) => {
                        const isCurrentPlan = plan.id === currentPlan;
                        const PIcon = PLAN_ICONS[plan.id] || Star;
                        return (
                          <div
                            key={plan.id}
                            className={cn(
                              "p-4 rounded-xl border transition-all",
                              isCurrentPlan
                                ? "border-amber-500 bg-amber-500/10"
                                : "border-border bg-secondary/50 hover:border-gray-600"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <PIcon size={18} className={isCurrentPlan ? "text-amber-400" : "text-muted-foreground"} />
                              <span className="font-semibold">{plan.name}</span>
                            </div>
                            <div className="mb-3">
                              <span className="text-xl md:text-2xl font-bold">
                                {plan.monthlyPrice === 0 ? "Grátis" : formatCurrency(plan.monthlyPrice)}
                              </span>
                              {plan.monthlyPrice > 0 && (
                                <span className="text-sm text-muted-foreground">/mês</span>
                              )}
                            </div>
                            <ul className="space-y-2 mb-4">
                              {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <Check size={14} className="text-green-400 mt-0.5 shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            {isCurrentPlan ? (
                              <div className="text-center py-2 bg-amber-500/20 rounded-lg text-amber-400 text-sm font-medium">
                                Seu plano atual
                              </div>
                            ) : plan.id !== "free" ? (
                              <Button
                                onClick={() => handleUpgrade(plan.id)}
                                className="w-full bg-amber-600 hover:bg-amber-700"
                                size="sm"
                              >
                                {currentPlan === "free" ||
                                  (subscriptionData.plans.findIndex(p => p.id === plan.id) >
                                    subscriptionData.plans.findIndex(p => p.id === currentPlan))
                                  ? "Fazer Upgrade"
                                  : "Alterar Plano"}
                              </Button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            {/* ============================================================ */}
            {/* TAB 3: Segurança */}
            {/* ============================================================ */}
            <TabsContent value="seguranca">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 mt-6"
              >
                {/* Change Password */}
                <Card className="relative p-4 md:p-6 bg-card border-border min-w-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element -- arte contextual §12 */}
                  <img src="/portal/conta/seguranca.webp" alt="" aria-hidden className="pointer-events-none absolute right-0 top-0 h-24 w-40 object-cover opacity-35" style={{ WebkitMaskImage: "linear-gradient(to left, black 35%, transparent)", maskImage: "linear-gradient(to left, black 35%, transparent)" }} />
                  <h3 className="relative text-base md:text-lg font-semibold mb-4">Alterar Senha</h3>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Senha atual</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordForm.current}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, current: e.target.value })
                          }
                          placeholder="Digite sua senha atual"
                          className="bg-secondary border-border text-white pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                        >
                          {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Nova senha</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordForm.new}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, new: e.target.value })
                          }
                          placeholder="Mínimo 6 caracteres"
                          className="bg-secondary border-border text-white pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                        >
                          {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Confirmar nova senha</Label>
                      <div className="relative">
                        <Input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordForm.confirm}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirm: e.target.value })
                          }
                          placeholder="Repita a nova senha"
                          className="bg-secondary border-border text-white pr-10"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                        >
                          {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {passwordForm.confirm && passwordForm.new !== passwordForm.confirm && (
                        <p className="text-red-400 text-xs">As senhas não coincidem</p>
                      )}
                    </div>

                    <Button
                      onClick={handleChangePassword}
                      disabled={savingPassword || !passwordForm.new || !passwordForm.confirm}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {savingPassword ? (
                        <Loader2 size={16} className="mr-2 animate-spin" />
                      ) : (
                        <Shield size={16} className="mr-2" />
                      )}
                      {savingPassword ? "Alterando..." : "Alterar Senha"}
                    </Button>
                  </div>
                </Card>

                {/* Connected Accounts */}
                <Card className="p-4 md:p-6 bg-card border-border min-w-0 overflow-hidden">
                  <h3 className="text-base md:text-lg font-semibold mb-4">Contas Conectadas</h3>
                  <div className="flex items-center justify-between p-3 md:p-4 bg-secondary/50 rounded-lg border border-border gap-2 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" className="w-5 h-5">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Google</p>
                        <p className="text-sm text-muted-foreground">Login com Google</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-green-500/50 text-green-400">
                      Conectado
                    </Badge>
                  </div>
                </Card>

                {/* Active Sessions */}
                <Card className="p-4 md:p-6 bg-card border-border min-w-0 overflow-hidden">
                  <h3 className="text-base md:text-lg font-semibold mb-2">Sessões Ativas</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gerencie os dispositivos onde sua conta está conectada.
                  </p>
                  <div className="p-4 bg-secondary/30 rounded-lg border border-border/50 text-center">
                    <Monitor size={32} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">Recurso em breve</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      O gerenciamento de sessões estará disponível em uma atualização futura.
                    </p>
                  </div>
                </Card>

                {/* Delete Account */}
                <Card className="relative p-4 md:p-6 bg-card border-red-900/50 min-w-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element -- privacidade/controle dos dados §12 */}
                  <img src="/portal/conta/privacidade.webp" alt="" aria-hidden className="pointer-events-none absolute right-0 top-0 h-24 w-40 object-cover opacity-30" style={{ WebkitMaskImage: "linear-gradient(to left, black 35%, transparent)", maskImage: "linear-gradient(to left, black 35%, transparent)" }} />
                  <h3 className="relative text-base md:text-lg font-semibold text-red-400 mb-2">Zona de Perigo</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ao excluir sua conta, todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(true)}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Excluir minha conta
                  </Button>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ============================================================ */}
            {/* TAB 4: Certificados */}
            {/* ============================================================ */}
            <TabsContent value="certificados">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6"
              >
                {certificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificates.map((cert) => (
                      <Card
                        key={cert._id}
                        className="p-4 md:p-5 bg-card border-border hover:border-amber-500/30 transition-colors min-w-0 overflow-hidden"
                      >
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                              <Award size={20} className="text-amber-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-sm line-clamp-1 truncate">
                                {cert.courseTitle}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {cert.courseCategory} - {cert.courseLevel}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">Emitido em</span>
                            <span className="text-right truncate">{formatDate(cert.issuedAt)}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground shrink-0">Certificado</span>
                            <span className="font-mono text-xs text-amber-400 truncate min-w-0">
                              {cert.certificateNumber}
                            </span>
                          </div>
                          {cert.quizScore > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Nota</span>
                              <span className="text-green-400">{cert.quizScore}%</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4">
                          {cert.pdfUrl && (
                            <a
                              href={cert.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1"
                            >
                              <Button
                                size="sm"
                                className="w-full bg-amber-600 hover:bg-amber-700 text-xs"
                              >
                                <Download size={14} className="mr-1.5" />
                                Download PDF
                              </Button>
                            </a>
                          )}
                          <a
                            href={cert.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full border-border text-muted-foreground hover:bg-secondary text-xs"
                            >
                              <ExternalLink size={14} className="mr-1.5" />
                              Verificar
                            </Button>
                          </a>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-6 md:p-8 bg-card border-border text-center min-w-0 overflow-hidden">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award size={32} className="text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Nenhum certificado ainda</h3>
                    <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
                      Complete um curso e passe no quiz final para ganhar seu certificado digital verificável!
                    </p>
                    <Link href="/portal">
                      <Button className="bg-amber-600 hover:bg-amber-700">
                        <BookOpen size={16} className="mr-2" />
                        Explorar Cursos
                      </Button>
                    </Link>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            {/* ============================================================ */}
            {/* TAB 5: Preferências */}
            {/* ============================================================ */}
            <TabsContent value="preferencias">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 mt-6"
              >
                {/* Theme */}
                <Card className="p-4 md:p-6 bg-card border-border min-w-0 overflow-hidden">
                  <h3 className="text-base md:text-lg font-semibold mb-4">Aparência</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "light", label: "Claro", icon: Sun },
                      { id: "dark", label: "Escuro", icon: Moon },
                      { id: "system", label: "Sistema", icon: Monitor },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setPrefsForm({ ...prefsForm, theme: id })}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                          prefsForm.theme === id
                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                            : "border-border bg-secondary/50 text-muted-foreground hover:border-gray-600"
                        )}
                      >
                        <Icon size={24} />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Language */}
                <Card className="p-4 md:p-6 bg-card border-border min-w-0 overflow-hidden">
                  <h3 className="text-base md:text-lg font-semibold mb-4">Idioma</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "pt-BR", label: "Português", flag: "🇧🇷" },
                      { id: "en", label: "English", flag: "🇺🇸" },
                      { id: "es", label: "Español", flag: "🇪🇸" },
                    ].map(({ id, label, flag }) => (
                      <button
                        key={id}
                        onClick={() => setPrefsForm({ ...prefsForm, language: id })}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl border transition-all",
                          prefsForm.language === id
                            ? "border-amber-500 bg-amber-500/10 text-amber-400"
                            : "border-border bg-secondary/50 text-muted-foreground hover:border-gray-600"
                        )}
                      >
                        <span className="text-lg">{flag}</span>
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Notifications */}
                <Card className="relative p-4 md:p-6 bg-card border-border min-w-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element -- arte contextual §12 */}
                  <img src="/portal/conta/notificacoes.webp" alt="" aria-hidden className="pointer-events-none absolute right-0 top-0 h-24 w-40 object-cover opacity-35" style={{ WebkitMaskImage: "linear-gradient(to left, black 35%, transparent)", maskImage: "linear-gradient(to left, black 35%, transparent)" }} />
                  <h3 className="relative text-base md:text-lg font-semibold mb-4">Notificações</h3>
                  <div className="space-y-4">
                    {[
                      {
                        key: "email" as const,
                        label: "Email",
                        description: "Receber notificações por email",
                        icon: Mail,
                      },
                      {
                        key: "push" as const,
                        label: "Push",
                        description: "Notificações no navegador",
                        icon: Bell,
                      },
                      {
                        key: "marketing" as const,
                        label: "Marketing",
                        description: "Ofertas e promoções",
                        icon: Megaphone,
                      },
                      {
                        key: "courseUpdates" as const,
                        label: "Atualizações de cursos",
                        description: "Novos conteúdos e aulas",
                        icon: BookOpen,
                      },
                      {
                        key: "communityActivity" as const,
                        label: "Comunidade",
                        description: "Atividades da comunidade",
                        icon: MessageSquare,
                      },
                    ].map(({ key, label, description, icon: Icon }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg gap-3 min-w-0"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Icon size={18} className="text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{label}</p>
                            <p className="text-xs text-muted-foreground truncate">{description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={prefsForm.notifications[key]}
                          onCheckedChange={(checked) =>
                            setPrefsForm({
                              ...prefsForm,
                              notifications: { ...prefsForm.notifications, [key]: checked },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Playback Speed */}
                <Card className="p-4 md:p-6 bg-card border-border min-w-0 overflow-hidden">
                  <h3 className="text-base md:text-lg font-semibold mb-4">Reprodução</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Play size={18} className="text-muted-foreground" />
                        <span className="text-sm">Velocidade padrão</span>
                      </div>
                      <Badge variant="outline" className="border-amber-500/50 text-amber-400 font-mono">
                        {prefsForm.playbackSpeed}x
                      </Badge>
                    </div>
                    <Slider
                      value={[prefsForm.playbackSpeed]}
                      onValueChange={([val]) => setPrefsForm({ ...prefsForm, playbackSpeed: val })}
                      min={0.5}
                      max={2}
                      step={0.25}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0.5x</span>
                      <span>1x</span>
                      <span>1.5x</span>
                      <span>2x</span>
                    </div>
                  </div>
                </Card>

                {/* Save Preferences */}
                <Button
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                  className="w-full bg-amber-600 hover:bg-amber-700 h-12 text-base font-semibold"
                >
                  {savingPrefs ? (
                    <Loader2 size={20} className="mr-2 animate-spin" />
                  ) : (
                    <Save size={20} className="mr-2" />
                  )}
                  {savingPrefs ? "Salvando..." : "Salvar Preferências"}
                </Button>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card border-border text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} />
              Excluir Conta
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Esta ação é irreversível. Todos os seus dados, cursos, certificados e progresso serão permanentemente excluídos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Digite <strong className="text-red-400">EXCLUIR</strong> para confirmar:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="EXCLUIR"
              className="bg-secondary border-border text-white"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText("");
              }}
              className="border-border"
            >
              Cancelar
            </Button>
            <Button
              disabled={deleteConfirmText !== "EXCLUIR"}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
              onClick={() => {
                toast.error("Funcionalidade em desenvolvimento");
                setShowDeleteDialog(false);
                setDeleteConfirmText("");
              }}
            >
              <Trash2 size={16} className="mr-2" />
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
