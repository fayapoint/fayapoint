"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  ChevronRight,
  Check,
  Sparkles,
  Users,
  BarChart3,
  Brain,
  Target,
  Palette,
  MessageCircle,
  Camera,
  Film,
  Loader2,
  ArrowLeft,
  Zap,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

// ── Data ──────────────────────────────────────────────────────────

const INDUSTRIES = [
  { id: "tech", emoji: "\ud83d\udcbb", label: "Tecnologia" },
  { id: "health", emoji: "\ud83c\udfe5", label: "Sa\u00fade" },
  { id: "education", emoji: "\ud83d\udcda", label: "Educa\u00e7\u00e3o" },
  { id: "ecommerce", emoji: "\ud83d\udecd\ufe0f", label: "E-commerce" },
  { id: "finance", emoji: "\ud83d\udcb0", label: "Finan\u00e7as" },
  { id: "marketing", emoji: "\ud83d\udcca", label: "Marketing" },
  { id: "food", emoji: "\ud83c\udf55", label: "Alimenta\u00e7\u00e3o" },
  { id: "fitness", emoji: "\ud83d\udcaa", label: "Fitness" },
  { id: "beauty", emoji: "\ud83d\udc84", label: "Beleza" },
  { id: "travel", emoji: "\u2708\ufe0f", label: "Viagens" },
  { id: "real-estate", emoji: "\ud83c\udfe0", label: "Imobili\u00e1rio" },
  { id: "law", emoji: "\u2696\ufe0f", label: "Direito" },
  { id: "art", emoji: "\ud83c\udfa8", label: "Arte & Design" },
  { id: "entertainment", emoji: "\ud83c\udfac", label: "Entretenimento" },
  { id: "sustainability", emoji: "\ud83c\udf31", label: "Sustentabilidade" },
  { id: "consulting", emoji: "\ud83d\udca1", label: "Consultoria" },
  { id: "retail", emoji: "\ud83c\udfea", label: "Varejo" },
  { id: "other", emoji: "\ud83d\udd2e", label: "Outro" },
];

const TONES = [
  { id: "formal", emoji: "\ud83c\udfaf", label: "Formal" },
  { id: "casual", emoji: "\ud83d\ude0a", label: "Casual" },
  { id: "fun", emoji: "\ud83d\ude04", label: "Divertido" },
  { id: "inspirational", emoji: "\u2728", label: "Inspiracional" },
  { id: "academic", emoji: "\ud83c\udf93", label: "Acad\u00eamico" },
  { id: "energetic", emoji: "\ud83d\udd25", label: "Energ\u00e9tico" },
  { id: "emotional", emoji: "\ud83d\udc9d", label: "Emocional" },
  { id: "analytical", emoji: "\ud83d\udd2c", label: "Anal\u00edtico" },
  { id: "controversial", emoji: "\u26a1", label: "Controverso" },
  { id: "mysterious", emoji: "\ud83c\udf19", label: "Misterioso" },
  { id: "dramatic", emoji: "\ud83c\udfad", label: "Dram\u00e1tico" },
  { id: "neutral", emoji: "\u26aa", label: "Neutro" },
  { id: "visionary", emoji: "\ud83d\ude80", label: "Vision\u00e1rio" },
  { id: "romantic", emoji: "\ud83c\udf39", label: "Rom\u00e2ntico" },
];

const GOALS = [
  { id: "engagement", emoji: "\ud83d\udcc8", label: "Aumentar engajamento" },
  { id: "leads", emoji: "\ud83c\udfaf", label: "Gerar leads" },
  { id: "authority", emoji: "\ud83d\udc51", label: "Construir autoridade" },
  { id: "sales", emoji: "\ud83d\udcb0", label: "Aumentar vendas" },
  { id: "awareness", emoji: "\ud83d\udce2", label: "Visibilidade da marca" },
  { id: "community", emoji: "\ud83e\udd1d", label: "Criar comunidade" },
  { id: "education", emoji: "\ud83d\udcd6", label: "Educar audi\u00eancia" },
  { id: "traffic", emoji: "\ud83d\udd17", label: "Gerar tr\u00e1fego" },
  { id: "retention", emoji: "\ud83d\udc8e", label: "Fidelizar clientes" },
  { id: "networking", emoji: "\ud83c\udf10", label: "Networking" },
  { id: "personal-brand", emoji: "\u2b50", label: "Marca pessoal" },
  { id: "conversion", emoji: "\ud83c\udfaa", label: "Converter seguidores" },
  { id: "content-scale", emoji: "\ud83c\udfed", label: "Escalar conte\u00fado" },
  { id: "automate", emoji: "\ud83e\udd16", label: "Automatizar processos" },
];

const CONTENT_TYPES = [
  { id: "photos", emoji: "\ud83d\udcf8", label: "Fotos" },
  { id: "videos", emoji: "\ud83c\udfac", label: "V\u00eddeos" },
  { id: "stories", emoji: "\ud83d\udcf1", label: "Stories" },
  { id: "reels", emoji: "\ud83c\udf9e\ufe0f", label: "Reels" },
  { id: "carousels", emoji: "\ud83d\udcca", label: "Carross\u00e9is" },
  { id: "text", emoji: "\u270d\ufe0f", label: "Texto" },
  { id: "lives", emoji: "\ud83d\udd34", label: "Lives" },
  { id: "podcasts", emoji: "\ud83c\udf99\ufe0f", label: "Podcasts" },
  { id: "infographics", emoji: "\ud83d\udcc9", label: "Infogr\u00e1ficos" },
  { id: "memes", emoji: "\ud83d\ude02", label: "Memes" },
  { id: "guides", emoji: "\ud83d\udccb", label: "Guias" },
  { id: "tutorials", emoji: "\ud83c\udf93", label: "Tutoriais" },
  { id: "reviews", emoji: "\u2b50", label: "Reviews" },
  { id: "behind-scenes", emoji: "\ud83c\udfaa", label: "Bastidores" },
  { id: "testimonials", emoji: "\ud83d\udcac", label: "Depoimentos" },
  { id: "newsletters", emoji: "\ud83d\udce7", label: "Newsletters" },
  { id: "threads", emoji: "\ud83e\uddf5", label: "Threads" },
  { id: "shorts", emoji: "\u26a1", label: "Shorts" },
];

const LEVELS = [
  { id: "beginner", emoji: "\ud83c\udf31", label: "Iniciante", description: "Estou come\u00e7ando com redes sociais" },
  { id: "intermediate", emoji: "\ud83c\udf3f", label: "Intermedi\u00e1rio", description: "J\u00e1 publico regularmente" },
  { id: "advanced", emoji: "\ud83c\udf33", label: "Avan\u00e7ado", description: "Sou profissional de conte\u00fado" },
];

const PLATFORMS = [
  { id: "facebook", name: "Facebook + Instagram", icon: Facebook, gradient: "from-blue-600 to-blue-700", url: "/api/social/connect/facebook", available: true },
  { id: "google", name: "Google + YouTube", icon: Youtube, gradient: "from-red-500 to-red-700", url: "/api/social/connect/google", available: true },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, gradient: "from-sky-400 to-sky-600", url: "/api/social/connect/twitter", available: false },
  { id: "pinterest", name: "Pinterest", icon: Share2, gradient: "from-red-600 to-red-700", url: "/api/social/connect/pinterest", available: false },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, gradient: "from-green-500 to-green-600", url: "", available: false },
  { id: "linkedin", name: "LinkedIn", icon: Users, gradient: "from-blue-700 to-blue-800", url: "", available: false },
];

const STEP_TITLES = [
  "Qual \u00e9 sua \u00e1rea?",
  "Seu tom de voz",
  "Seus objetivos",
  "Conte\u00fado que voc\u00ea cria",
  "N\u00edvel de experi\u00eancia",
];

// ── Types ─────────────────────────────────────────────────────────

interface ConnectedAccount {
  platform: string;
  username: string;
  followers: number;
}

interface SocialPersona {
  industries?: string[];
  tones?: string[];
  goals?: string[];
  contentTypes?: string[];
  level?: string;
  contentThemes?: string[];
  audienceInsights?: string;
  recommendedCourses?: { id: string; title: string }[];
}

interface SocialProfilePanelProps {
  user: any;
}

// ── Component ─────────────────────────────────────────────────────

export default function SocialProfilePanel({ user }: SocialProfilePanelProps) {
  const token = typeof window !== "undefined" ? localStorage.getItem("fayai_token") || "" : "";
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [persona, setPersona] = useState<SocialPersona | null>(null);
  const [loading, setLoading] = useState(true);

  // Persona builder state
  const [step, setStep] = useState(0);
  const [industries, setIndustries] = useState<string[]>([]);
  const [tones, setTones] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [level, setLevel] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Intelligence
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    async function load() {
      try {
        const [accRes, personaRes] = await Promise.all([
          fetch("/api/social/accounts", { headers }),
          fetch("/api/user/social-persona", { headers }),
        ]);
        if (accRes.ok) setAccounts(await accRes.json());
        if (personaRes.ok) {
          const p = await personaRes.json();
          if (p && Object.keys(p).length) {
            setPersona(p);
            if (p.industries) setIndustries(p.industries);
            if (p.tones) setTones(p.tones);
            if (p.goals) setGoals(p.goals);
            if (p.contentTypes) setContentTypes(p.contentTypes);
            if (p.level) setLevel(p.level);
          }
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback((list: string[], id: string, max: number) => {
    if (list.includes(id)) return list.filter((x) => x !== id);
    if (list.length >= max) return list;
    return [...list, id];
  }, []);

  const canProceed = () => {
    if (step === 0) return industries.length >= 1;
    if (step === 1) return tones.length >= 1;
    if (step === 2) return goals.length >= 1;
    if (step === 3) return contentTypes.length >= 1;
    if (step === 4) return level !== "";
    return false;
  };

  const savePersona = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/social-persona", {
        method: "POST",
        headers,
        body: JSON.stringify({ industries, tones, goals, contentTypes, level }),
      });
      if (res.ok) {
        const data = await res.json();
        setPersona(data);
        toast.success("Perfil social salvo!");
      } else {
        toast.error("Erro ao salvar perfil");
      }
    } catch {
      toast.error("Erro de conex\u00e3o");
    } finally {
      setSaving(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/social/analyze", { method: "POST", headers });
      if (res.ok) setAnalysisResult(await res.json());
    } catch {
      toast.error("Erro ao analisar");
    } finally {
      setAnalyzing(false);
    }
  };

  const totalAudience = accounts.reduce((s, a) => s + (a.followers || 0), 0);
  const hasData = accounts.length > 0 || persona !== null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  // ── Shared card style ─────────────────────────────────────────

  const selectCard = (selected: boolean) =>
    cn(
      "rounded-xl bg-white/[0.03] border border-border cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 p-4",
      selected ? "border-amber-500 bg-amber-500/10" : "hover:border-amber-500/50"
    );

  const selectPill = (selected: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm cursor-pointer transition-all duration-200",
      selected ? "border-amber-500 bg-amber-500/10 text-amber-400" : "bg-white/[0.03] hover:border-amber-500/50 text-muted-foreground"
    );

  // ── Persona Builder ───────────────────────────────────────────

  function PersonaBuilder() {
    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Passo {step + 1} de 5</span>
            <span className="text-amber-400 font-medium">{Math.round(((step + 1) / 5) * 100)}%</span>
          </div>
          <Progress value={((step + 1) / 5) * 100} className="h-2 bg-white/[0.05] [&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-amber-500 [&>[data-slot=progress-indicator]]:to-yellow-400" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="text-xl font-bold text-foreground mb-4">{STEP_TITLES[step]}</h3>

            {step === 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {INDUSTRIES.map((item) => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.95 }}
                    className={selectCard(industries.includes(item.id))}
                    onClick={() => setIndustries(toggle(industries, item.id, 3))}
                  >
                    <span className="text-4xl">{item.emoji}</span>
                    <span className="text-xs text-center leading-tight">{item.label}</span>
                    {industries.includes(item.id) && <Check className="h-4 w-4 text-amber-500 absolute top-1 right-1" />}
                  </motion.div>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-wrap gap-2">
                {TONES.map((item) => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.95 }}
                    layout
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={selectPill(tones.includes(item.id))}
                    onClick={() => setTones(toggle(tones, item.id, 3))}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {GOALS.map((item) => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.95 }}
                    className={selectCard(goals.includes(item.id))}
                    onClick={() => setGoals(toggle(goals, item.id, 3))}
                  >
                    <span className="text-3xl">{item.emoji}</span>
                    <span className="text-xs text-center leading-tight">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((item) => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.95 }}
                    layout
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={selectPill(contentTypes.includes(item.id))}
                    onClick={() => setContentTypes(toggle(contentTypes, item.id, 3))}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {LEVELS.map((item) => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.97 }}
                    animate={level === item.id ? { scale: 1.03 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn(
                      "rounded-xl bg-white/[0.03] border border-border cursor-pointer transition-all duration-200 flex flex-col items-center gap-3 p-6",
                      level === item.id ? "border-amber-500 bg-amber-500/10" : "hover:border-amber-500/50"
                    )}
                    onClick={() => setLevel(item.id)}
                  >
                    <span className="text-5xl">{item.emoji}</span>
                    <span className="font-semibold text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground text-center">{item.description}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          {step < 4 ? (
            <Button
              size="sm"
              disabled={!canProceed()}
              onClick={() => setStep((s) => s + 1)}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold hover:from-amber-600 hover:to-yellow-600"
            >
              Pr\u00f3ximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!canProceed() || saving}
              onClick={savePersona}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold hover:from-amber-600 hover:to-yellow-600"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Salvar Perfil
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Selecione at\u00e9 {step === 4 ? "1 op\u00e7\u00e3o" : "3 op\u00e7\u00f5es"}
        </p>
      </div>
    );
  }

  // ── Connect Accounts ──────────────────────────────────────────

  function ConnectAccounts() {
    const connected = new Set(accounts.map((a) => a.platform));

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Conecte suas redes sociais para desbloquear insights e automa\u00e7\u00e3o inteligente.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            const isConnected = connected.has(p.id);
            const acc = accounts.find((a) => a.platform === p.id);

            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -2 }}
                className="rounded-xl bg-white/[0.03] border border-border p-4 flex items-center gap-4"
              >
                <div className={cn("h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", p.gradient)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{p.name}</p>
                  {isConnected && acc ? (
                    <p className="text-xs text-muted-foreground truncate">
                      @{acc.username} &middot; {acc.followers.toLocaleString()} seguidores
                    </p>
                  ) : !p.available ? (
                    <p className="text-xs text-muted-foreground">Em breve</p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isConnected ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      <Check className="h-3 w-3 mr-1" /> Conectado
                    </Badge>
                  ) : p.available ? (
                    <>
                      <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-xs">
                        <Zap className="h-3 w-3 mr-0.5" /> +100 XP
                      </Badge>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold text-xs h-8"
                        onClick={() => (window.location.href = p.url)}
                      >
                        Conectar
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground border-border text-xs">Em breve</Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Intelligence Dashboard ────────────────────────────────────

  function IntelligenceDashboard() {
    if (!hasData) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 p-8 text-center space-y-4"
        >
          <Brain className="h-12 w-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-semibold text-foreground">Intelig\u00eancia Social</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Conecte suas redes para descobrir insights incr\u00edveis sobre seu p\u00fablico e receba recomenda\u00e7\u00f5es personalizadas de conte\u00fado.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            <Sparkles className="h-4 w-4 mr-1" /> Come\u00e7ar agora
          </Button>
        </motion.div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Audi\u00eancia total", value: totalAudience.toLocaleString(), icon: Users, color: "text-blue-400" },
            { label: "Contas conectadas", value: accounts.length, icon: Share2, color: "text-green-400" },
            { label: "\u00c1reas", value: persona?.industries?.length ?? 0, icon: Target, color: "text-amber-400" },
            { label: "Tom de voz", value: persona?.tones?.length ?? 0, icon: Palette, color: "text-purple-400" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              className="rounded-xl bg-white/[0.03] border border-border p-4 space-y-1"
            >
              <stat.icon className={cn("h-5 w-5", stat.color)} />
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Content themes */}
        {persona?.contentThemes && persona.contentThemes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-400" /> Temas de Conte\u00fado
            </h4>
            <div className="flex flex-wrap gap-2">
              {persona.contentThemes.map((theme) => (
                <Badge key={theme} variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Audience insights */}
        {persona?.audienceInsights && (
          <div className="rounded-xl bg-white/[0.03] border border-border p-4 space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" /> Sua Persona AI
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{persona.audienceInsights}</p>
          </div>
        )}

        {/* Recommended courses */}
        {persona?.recommendedCourses && persona.recommendedCourses.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-green-400" /> Cursos Recomendados
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {persona.recommendedCourses.map((course) => (
                <div key={course.id} className="rounded-lg bg-white/[0.03] border border-border px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-foreground">{course.title}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analyze button */}
        <Button
          onClick={runAnalysis}
          disabled={analyzing}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-semibold hover:from-amber-600 hover:to-yellow-600"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Analisando...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" /> Analisar Perfil
            </>
          )}
        </Button>

        {/* Analysis result */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 p-4 space-y-2"
          >
            <h4 className="text-sm font-medium text-amber-400 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Resultado da An\u00e1lise
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {analysisResult.summary ?? JSON.stringify(analysisResult)}
            </p>
          </motion.div>
        )}
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
          <Share2 className="h-5 w-5 text-black" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Perfil Social</h2>
          <p className="text-sm text-muted-foreground">Monte sua identidade e conecte suas redes</p>
        </div>
      </div>

      <Tabs defaultValue="persona" className="w-full">
        <TabsList className="w-full bg-[#2a251d] border border-border">
          <TabsTrigger value="persona" className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Palette className="h-4 w-4 mr-1.5" /> Persona
          </TabsTrigger>
          <TabsTrigger value="contas" className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Share2 className="h-4 w-4 mr-1.5" /> Contas
          </TabsTrigger>
          <TabsTrigger value="inteligencia" className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            <Brain className="h-4 w-4 mr-1.5" /> Intelig\u00eancia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="mt-4">
          <div className="rounded-xl bg-[#2a251d] border border-border p-5">
            <PersonaBuilder />
          </div>
        </TabsContent>

        <TabsContent value="contas" className="mt-4">
          <div className="rounded-xl bg-[#2a251d] border border-border p-5">
            <ConnectAccounts />
          </div>
        </TabsContent>

        <TabsContent value="inteligencia" className="mt-4">
          <div className="rounded-xl bg-[#2a251d] border border-border p-5">
            <IntelligenceDashboard />
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
