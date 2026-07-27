"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
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
  Loader2,
  ArrowLeft,
  Zap,
  TrendingUp,
  BookOpen,
  ShieldCheck,
  KeyRound,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import SocialComposer from "@/components/portal/SocialComposer";
import PersonaOracle from "@/components/portal/PersonaOracle";
import PersonaDossie, { GaleriaDeFotos } from "@/components/portal/PersonaDossie";
import CursoComSuaCara from "@/components/portal/CursoComSuaCara";
import { temPersona3D } from "@/data/icones3d-tem";
import type { Dossie, FotoPersona, PersonaProfunda } from "@/lib/persona";

// WebGL fora do bundle: o chunk só desce quando alguém passa o cursor.
const IconePersona3D = dynamic(() => import("@/components/portal/IconePersona3D").then((m) => m.IconePersona3D), { ssr: false });

// ── Data ──────────────────────────────────────────────────────────

const INDUSTRIES = [
  { id: "tech", emoji: "💻", label: "Tecnologia" },
  { id: "health", emoji: "🏥", label: "Saúde" },
  { id: "education", emoji: "📚", label: "Educação" },
  { id: "ecommerce", emoji: "🛍️", label: "E-commerce" },
  { id: "finance", emoji: "💰", label: "Finanças" },
  { id: "marketing", emoji: "📊", label: "Marketing" },
  { id: "food", emoji: "🍕", label: "Alimentação" },
  { id: "fitness", emoji: "💪", label: "Fitness" },
  { id: "beauty", emoji: "💄", label: "Beleza" },
  { id: "travel", emoji: "✈️", label: "Viagens" },
  { id: "real-estate", emoji: "🏠", label: "Imobiliário" },
  { id: "law", emoji: "⚖️", label: "Direito" },
  { id: "art", emoji: "🎨", label: "Arte & Design" },
  { id: "entertainment", emoji: "🎬", label: "Entretenimento" },
  { id: "sustainability", emoji: "🌱", label: "Sustentabilidade" },
  { id: "consulting", emoji: "💡", label: "Consultoria" },
  { id: "retail", emoji: "🏪", label: "Varejo" },
  { id: "other", emoji: "🔮", label: "Outro" },
];

const TONES = [
  { id: "formal", emoji: "🎯", label: "Formal" },
  { id: "casual", emoji: "😊", label: "Casual" },
  { id: "fun", emoji: "😄", label: "Divertido" },
  { id: "inspirational", emoji: "✨", label: "Inspiracional" },
  { id: "academic", emoji: "🎓", label: "Acadêmico" },
  { id: "energetic", emoji: "🔥", label: "Energético" },
  { id: "emotional", emoji: "💝", label: "Emocional" },
  { id: "analytical", emoji: "🔬", label: "Analítico" },
  { id: "controversial", emoji: "⚡", label: "Controverso" },
  { id: "mysterious", emoji: "🌙", label: "Misterioso" },
  { id: "dramatic", emoji: "🎭", label: "Dramático" },
  { id: "neutral", emoji: "⚪", label: "Neutro" },
  { id: "visionary", emoji: "🚀", label: "Visionário" },
  { id: "romantic", emoji: "🌹", label: "Romântico" },
];

const GOALS = [
  { id: "engagement", emoji: "📈", label: "Aumentar engajamento" },
  { id: "leads", emoji: "🎯", label: "Gerar leads" },
  { id: "authority", emoji: "👑", label: "Construir autoridade" },
  { id: "sales", emoji: "💰", label: "Aumentar vendas" },
  { id: "awareness", emoji: "📢", label: "Visibilidade da marca" },
  { id: "community", emoji: "🤝", label: "Criar comunidade" },
  { id: "education", emoji: "📖", label: "Educar audiência" },
  { id: "traffic", emoji: "🔗", label: "Gerar tráfego" },
  { id: "retention", emoji: "💎", label: "Fidelizar clientes" },
  { id: "networking", emoji: "🌐", label: "Networking" },
  { id: "personal-brand", emoji: "⭐", label: "Marca pessoal" },
  { id: "conversion", emoji: "🎪", label: "Converter seguidores" },
  { id: "content-scale", emoji: "🏭", label: "Escalar conteúdo" },
  { id: "automate", emoji: "🤖", label: "Automatizar processos" },
];

const CONTENT_TYPES = [
  { id: "photos", emoji: "📸", label: "Fotos" },
  { id: "videos", emoji: "🎬", label: "Vídeos" },
  { id: "stories", emoji: "📱", label: "Stories" },
  { id: "reels", emoji: "🎞️", label: "Reels" },
  { id: "carousels", emoji: "📊", label: "Carrosséis" },
  { id: "text", emoji: "✍️", label: "Texto" },
  { id: "lives", emoji: "🔴", label: "Lives" },
  { id: "podcasts", emoji: "🎙️", label: "Podcasts" },
  { id: "infographics", emoji: "📉", label: "Infográficos" },
  { id: "memes", emoji: "😂", label: "Memes" },
  { id: "guides", emoji: "📋", label: "Guias" },
  { id: "tutorials", emoji: "🎓", label: "Tutoriais" },
  { id: "reviews", emoji: "⭐", label: "Reviews" },
  { id: "behind-scenes", emoji: "🎪", label: "Bastidores" },
  { id: "testimonials", emoji: "💬", label: "Depoimentos" },
  { id: "newsletters", emoji: "📧", label: "Newsletters" },
  { id: "threads", emoji: "🧵", label: "Threads" },
  { id: "shorts", emoji: "⚡", label: "Shorts" },
];

const LEVELS = [
  { id: "beginner", emoji: "🌱", label: "Iniciante", description: "Estou começando com redes sociais" },
  { id: "intermediate", emoji: "🌿", label: "Intermediário", description: "Já publico regularmente" },
  { id: "advanced", emoji: "🌳", label: "Avançado", description: "Sou profissional de conteúdo" },
];

const PLATFORMS = [
  { id: "facebook", name: "Facebook + Instagram", icon: Facebook, gradient: "from-blue-600 to-blue-700", url: "/api/social/connect/facebook", available: true },
  { id: "google", name: "Google + YouTube", icon: Youtube, gradient: "from-red-500 to-red-700", url: "/api/social/connect/google?redirect=/portal", available: true },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, gradient: "from-sky-400 to-sky-600", url: "/api/social/connect/twitter", available: false },
  { id: "pinterest", name: "Pinterest", icon: Share2, gradient: "from-red-600 to-red-700", url: "/api/social/connect/pinterest", available: false },
  { id: "whatsapp", name: "WhatsApp", icon: MessageCircle, gradient: "from-green-500 to-green-600", url: "", available: false },
  { id: "linkedin", name: "LinkedIn", icon: Users, gradient: "from-blue-700 to-blue-800", url: "", available: false },
];

const STEP_TITLES = [
  "Qual é sua área?",
  "Seu tom de voz",
  "Seus objetivos",
  "Conteúdo que você cria",
  "Nível de experiência",
];

// ── Types ─────────────────────────────────────────────────────────

interface ConnectedAccount {
  _id?: string;
  platform: string;
  username: string;
  followers: number;
  status: string;
  scopes: string[];
  avatar?: string;
}

interface SocialProfilePanelProps {
  user: { name?: string; image?: string } | null;
}

/**
 * O cartão de escolha com emoji que vira volume no cursor.
 *
 * ⚠️ **Mora no escopo do MÓDULO de propósito.** Definido dentro do render do
 * painel, ele seria um tipo de componente novo a cada estado que mudasse — e o
 * estado que muda aqui é justamente o `hover3d`. React desmontaria e remontaria
 * a árvore inteira a cada passada de cursor, criando e destruindo um contexto
 * WebGL por vez. O navegador para de criar contexto por volta de dezesseis: uma
 * varrida pela grade derrubaria a página.
 *
 * `grupo` casa com o catálogo das malhas: "area" para as áreas, "meta" para os
 * objetivos. Quem não tem peça continua só com o emoji, sem buraco.
 */
function CartaoComVolume({
  grupo,
  item,
  selecionado,
  aceso,
  tamanhoEmoji,
  onClick,
  onEntrar,
  onSair,
}: {
  grupo: string;
  item: { id: string; emoji: string; label: string };
  selecionado: boolean;
  aceso: boolean;
  tamanhoEmoji: string;
  onClick: () => void;
  onEntrar: () => void;
  onSair: () => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-border bg-white/[0.03] p-4 transition-all duration-200",
        selecionado ? "border-amber-500 bg-amber-500/10" : "hover:border-amber-500/50"
      )}
      onClick={onClick}
      onMouseEnter={onEntrar}
      onMouseLeave={onSair}
    >
      <span className="relative block">
        <span className={cn(tamanhoEmoji, "block transition-opacity duration-200", aceso && "opacity-0")}>{item.emoji}</span>
        {aceso && <IconePersona3D grupo={grupo} id={item.id} aceso />}
      </span>
      <span className="text-center text-xs leading-tight">{item.label}</span>
      {selecionado && <Check className="absolute right-1 top-1 h-4 w-4 text-amber-500" />}
    </motion.div>
  );
}

// ── Component ─────────────────────────────────────────────────────

export default function SocialProfilePanel({ user }: SocialProfilePanelProps) {
  const token = typeof window !== "undefined" ? localStorage.getItem("fayai_token") || "" : "";
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [persona, setPersona] = useState<PersonaProfunda | null>(null);
  const [dossie, setDossie] = useState<Dossie | null>(null);
  const [fotos, setFotos] = useState<FotoPersona[]>([]);
  const [loading, setLoading] = useState(true);

  // Persona builder state
  const [step, setStep] = useState(0);
  const [industries, setIndustries] = useState<string[]>([]);
  const [tones, setTones] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [level, setLevel] = useState<string>("");
  const [saving, setSaving] = useState(false);
  /** O usuário pediu para refazer a base mesmo já tendo os cinco passos. */
  const [refazendo, setRefazendo] = useState(false);

  /**
   * Quem está autorizado a desenhar em 3D agora — mesma regra da barra
   * lateral: o cursor está sobre UM cartão, então existe no máximo um contexto
   * WebGL na grade inteira. Dezoito cartões montando o próprio canvas
   * estourariam o limite do navegador na primeira varrida.
   */
  const [hover3d, setHover3d] = useState<string | null>(null);

  // Intelligence
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ summary?: string } | null>(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const carregarFotos = useCallback(async () => {
    try {
      const res = await fetch("/api/user/persona-fotos", { credentials: "include", headers, cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setFotos(Array.isArray(data.fotos) ? data.fotos : []);
      }
    } catch {
      /* silencioso — a galeria mostra as vagas vazias */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    async function load() {
      try {
        const [accRes, personaRes] = await Promise.all([
          fetch("/api/social/accounts", { credentials: "include", headers }),
          fetch("/api/user/social-persona", { credentials: "include", headers }),
        ]);

        if (accRes.ok) {
          // A API devolve { accounts: [...] } — salvar o objeto inteiro
          // quebrava o painel com "accounts.reduce is not a function"
          const accData = await accRes.json();
          const list = Array.isArray(accData) ? accData : accData?.accounts;
          setAccounts(
            (Array.isArray(list) ? list : []).map((a) => ({
              _id: a._id,
              platform: a.platform,
              username: a.username,
              followers: a.metadata?.followerCount || 0,
              status: a.status || "pending",
              scopes: a.scopes || [],
              avatar: a.metadata?.profilePictureUrl,
            }))
          );
        }

        if (personaRes.ok) {
          // Antes isto lia `p.industries` numa resposta que devolve
          // `{ socialPersona: { industry } }` — e por isso a persona salva
          // nunca voltava para a tela.
          const data = await personaRes.json();
          const p: PersonaProfunda = data.socialPersona || {};
          setPersona(p);
          setDossie(data.dossie || null);
          if (p.industry?.length) setIndustries(p.industry);
          if (p.toneOfVoice?.length) setTones(p.toneOfVoice);
          if (p.marketingGoals?.length) setGoals(p.marketingGoals);
          if (p.contentTypes?.length) setContentTypes(p.contentTypes);
          if (p.experienceLevel) setLevel(p.experienceLevel);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    load();
    carregarFotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback((list: string[], id: string, max: number) => {
    if (list.includes(id)) return list.filter((x) => x !== id);
    if (list.length >= max) return list;
    return [...list, id];
  }, []);

  /** Os cinco passos já estão respondidos? Então o construtor sai da frente. */
  const baseFechada =
    industries.length > 0 && tones.length > 0 && goals.length > 0 && contentTypes.length > 0 && level !== "";

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
        method: "PUT",
        credentials: "include",
        headers,
        // Os nomes que o modelo usa. A rota aceita os antigos por
        // compatibilidade, mas mandar o certo é o que evita o próximo bug.
        body: JSON.stringify({
          industry: industries,
          toneOfVoice: tones,
          marketingGoals: goals,
          contentTypes,
          experienceLevel: level,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPersona(data.socialPersona);
        setDossie(data.dossie);
        setRefazendo(false);
        toast.success(data.xpAwarded > 0 ? `Perfil salvo — +${data.xpAwarded} XP ✨` : "Perfil social salvo!");
      } else {
        toast.error(data?.error || "Erro ao salvar perfil");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/social/analyze", { method: "POST", credentials: "include", headers });
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
            <span className="font-medium text-amber-400">{Math.round(((step + 1) / 5) * 100)}%</span>
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
            <h3 className="mb-4 text-xl font-bold text-foreground">{STEP_TITLES[step]}</h3>

            {step === 0 && (
              <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5">
                {INDUSTRIES.map((item) => (
                  <CartaoComVolume
                    key={item.id}
                    grupo="area"
                    item={item}
                    tamanhoEmoji="text-4xl"
                    selecionado={industries.includes(item.id)}
                    aceso={hover3d === `area-${item.id}`}
                    onClick={() => setIndustries(toggle(industries, item.id, 3))}
                    onEntrar={() => temPersona3D("area", item.id) && setHover3d(`area-${item.id}`)}
                    onSair={() => setHover3d((a) => (a === `area-${item.id}` ? null : a))}
                  />
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
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {GOALS.map((item) => (
                  <CartaoComVolume
                    key={item.id}
                    grupo="meta"
                    item={item}
                    tamanhoEmoji="text-3xl"
                    selecionado={goals.includes(item.id)}
                    aceso={hover3d === `meta-${item.id}`}
                    onClick={() => setGoals(toggle(goals, item.id, 3))}
                    onEntrar={() => temPersona3D("meta", item.id) && setHover3d(`meta-${item.id}`)}
                    onSair={() => setHover3d((a) => (a === `meta-${item.id}` ? null : a))}
                  />
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {LEVELS.map((item) => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.97 }}
                    animate={level === item.id ? { scale: 1.03 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-border bg-white/[0.03] p-6 transition-all duration-200",
                      level === item.id ? "border-amber-500 bg-amber-500/10" : "hover:border-amber-500/50"
                    )}
                    onClick={() => setLevel(item.id)}
                  >
                    <span className="text-5xl">{item.emoji}</span>
                    <span className="font-semibold text-foreground">{item.label}</span>
                    <span className="text-center text-xs text-muted-foreground">{item.description}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
          {step < 4 ? (
            <Button
              size="sm"
              disabled={!canProceed()}
              onClick={() => setStep((s) => s + 1)}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 font-semibold text-black hover:from-amber-600 hover:to-yellow-600"
            >
              Próximo <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!canProceed() || saving}
              onClick={savePersona}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 font-semibold text-black hover:from-amber-600 hover:to-yellow-600"
            >
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
              Salvar Perfil
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Selecione até {step === 4 ? "1 opção" : "3 opções"} — passe o cursor para ver em 3D
        </p>
      </div>
    );
  }

  // ── Connect Accounts ──────────────────────────────────────────

  function ConnectAccounts() {
    const porPlataforma = new Map(accounts.map((a) => [a.platform, a]));

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Conecte suas redes sociais para desbloquear insights e automação inteligente.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            const acc = porPlataforma.get(p.id);
            // O Google do login entra como identidade: conectado, mas sem
            // permissão de publicação. Mostrar isso é o que evita um botão
            // "publicar" que morre com 403 na frente do usuário.
            const soIdentidade = !!acc && acc.status !== "active";
            const conectado = !!acc;

            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -2 }}
                className="flex items-center gap-4 rounded-xl border border-border bg-white/[0.03] p-4"
              >
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br", p.gradient)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  {conectado ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {acc.username}
                      {acc.followers > 0 && ` · ${acc.followers.toLocaleString("pt-BR")} seguidores`}
                    </p>
                  ) : !p.available ? (
                    <p className="text-xs text-muted-foreground">Em breve</p>
                  ) : null}
                  {soIdentidade && (
                    <p className="mt-0.5 flex items-start gap-1 text-[11px] leading-snug text-amber-400/80">
                      <Info className="mt-[1px] h-3 w-3 shrink-0" />
                      Reconhecemos você por esta conta. Para publicar, falta só liberar a permissão — sem novo login.
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {conectado && !soIdentidade ? (
                    <Badge className="border-green-500/30 bg-green-500/20 text-xs text-green-400">
                      <ShieldCheck className="mr-1 h-3 w-3" /> Pronta para publicar
                    </Badge>
                  ) : conectado && soIdentidade ? (
                    <>
                      <Badge className="border-emerald-500/30 bg-emerald-500/15 text-xs text-emerald-400">
                        <Check className="mr-1 h-3 w-3" /> Conectada
                      </Badge>
                      <Button
                        size="sm"
                        className="h-8 bg-gradient-to-r from-amber-500 to-yellow-500 text-xs font-semibold text-black"
                        onClick={() => (window.location.href = p.url)}
                      >
                        <KeyRound className="mr-1 h-3 w-3" /> Liberar
                      </Button>
                    </>
                  ) : p.available ? (
                    <>
                      <Badge variant="outline" className="border-amber-500/30 text-xs text-amber-400">
                        <Zap className="mr-0.5 h-3 w-3" /> +100 XP
                      </Badge>
                      <Button
                        size="sm"
                        className="h-8 bg-gradient-to-r from-amber-500 to-yellow-500 text-xs font-semibold text-black"
                        onClick={() => (window.location.href = p.url)}
                      >
                        Conectar
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className="border-border text-xs text-muted-foreground">Em breve</Badge>
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
          className="space-y-4 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 p-8 text-center"
        >
          <Brain className="mx-auto h-12 w-12 text-amber-500" />
          <h3 className="text-lg font-semibold text-foreground">Inteligência Social</h3>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Conecte suas redes para descobrir insights incríveis sobre seu público e receba recomendações personalizadas de conteúdo.
          </p>
        </motion.div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Audiência total", value: totalAudience.toLocaleString("pt-BR"), icon: Users, color: "text-blue-400" },
            { label: "Contas conectadas", value: accounts.length, icon: Share2, color: "text-green-400" },
            { label: "Confiança da persona", value: `${dossie?.confianca ?? 0}%`, icon: Brain, color: "text-amber-400" },
            { label: "Áreas", value: persona?.industry?.length ?? 0, icon: Target, color: "text-purple-400" },
          ].map((stat) => (
            <motion.div key={stat.label} whileHover={{ y: -2 }} className="space-y-1 rounded-xl border border-border bg-white/[0.03] p-4">
              <stat.icon className={cn("h-5 w-5", stat.color)} />
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Content themes */}
        {persona?.contentThemes && persona.contentThemes.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BarChart3 className="h-4 w-4 text-amber-400" /> Temas de Conteúdo
            </h4>
            <div className="flex flex-wrap gap-2">
              {persona.contentThemes.map((theme) => (
                <Badge key={theme} variant="outline" className="border-amber-500/30 text-xs text-amber-400">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Audience insights */}
        {persona?.audienceInsights && (
          <div className="space-y-2 rounded-xl border border-border bg-white/[0.03] p-4">
            <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Brain className="h-4 w-4 text-purple-400" /> O que já aprendemos sobre você
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">{persona.audienceInsights}</p>
          </div>
        )}

        {/* Analyze button */}
        <Button
          onClick={runAnalysis}
          disabled={analyzing}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 font-semibold text-black hover:from-amber-600 hover:to-yellow-600"
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analisando...
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-4 w-4" /> Analisar Perfil
            </>
          )}
        </Button>

        {/* Analysis result */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 p-4"
          >
            <h4 className="flex items-center gap-2 text-sm font-medium text-amber-400">
              <Sparkles className="h-4 w-4" /> Resultado da Análise
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {analysisResult.summary ?? JSON.stringify(analysisResult)}
            </p>
          </motion.div>
        )}
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
          <Share2 className="h-5 w-5 text-black" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">Perfil Social</h2>
          <p className="text-sm text-muted-foreground">
            {user?.name ? `${user.name.split(" ")[0]}, quanto melhor eu te conhecer, mais o conteúdo vira seu` : "Monte sua identidade e conecte suas redes"}
          </p>
        </div>
        {dossie && (
          <Badge variant="outline" className="border-amber-500/40 text-amber-300">
            <Brain className="mr-1.5 h-3.5 w-3.5" /> Te conheço {dossie.confianca}%
          </Badge>
        )}
      </div>

      {/* A coluna do dossiê acompanha as quatro abas: o retrato não é um passo
          do fluxo, é o contexto permanente do que a gente sabe. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          <Tabs defaultValue="persona" className="w-full">
            <TabsList className="w-full border border-border bg-[#2a251d]">
              <TabsTrigger value="persona" className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                <Palette className="mr-1.5 h-4 w-4" /> Persona
              </TabsTrigger>
              <TabsTrigger value="contas" className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                <Share2 className="mr-1.5 h-4 w-4" /> Contas
              </TabsTrigger>
              <TabsTrigger value="inteligencia" className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                <Brain className="mr-1.5 h-4 w-4" /> Inteligência
              </TabsTrigger>
              <TabsTrigger value="publicar" className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
                <Zap className="mr-1.5 h-4 w-4" /> Publicar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="persona" className="mt-4 space-y-4">
              <PersonaOracle />

              {/* Quem já fechou os cinco passos não precisa reencontrá-los
                  abertos toda vez. O trabalho contínuo agora mora no dossiê ao
                  lado; o construtor vira o botão de refazer do zero. */}
              {baseFechada && !refazendo ? (
                <button
                  onClick={() => {
                    setRefazendo(true);
                    setStep(0);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-[#2a251d] px-5 py-3.5 text-left transition-colors hover:border-amber-500/40 cursor-pointer"
                >
                  <span>
                    <span className="block text-sm font-bold text-foreground">Sua base está montada</span>
                    <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                      Área, tom, objetivos, formatos e nível. Refinar o resto é no painel ao lado.
                    </span>
                  </span>
                  <span className="ml-3 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/40 px-3 py-1 text-[11px] font-bold text-amber-300">
                    Refazer <ChevronRight className="h-3 w-3" />
                  </span>
                </button>
              ) : (
                <div className="rounded-xl border border-border bg-[#2a251d] p-5">
                  {PersonaBuilder()}
                </div>
              )}
              <GaleriaDeFotos fotos={fotos} token={token} aoRecarregar={carregarFotos} />
              <CursoComSuaCara token={token} />
            </TabsContent>

            <TabsContent value="contas" className="mt-4">
              <div className="rounded-xl border border-border bg-[#2a251d] p-5">
                {ConnectAccounts()}
              </div>
            </TabsContent>

            <TabsContent value="inteligencia" className="mt-4">
              <div className="rounded-xl border border-border bg-[#2a251d] p-5">
                {IntelligenceDashboard()}
              </div>
            </TabsContent>

            <TabsContent value="publicar" className="mt-4">
              <div className="rounded-xl border border-border bg-[#2a251d] p-5">
                <SocialComposer />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <PersonaDossie dossie={dossie} fotos={fotos} onSalvo={setDossie} aoRecarregarFotos={carregarFotos} />

          {dossie && dossie.confianca < 100 && (
            <p className="mt-3 flex items-start gap-1.5 px-1 text-[11px] leading-snug text-muted-foreground">
              <BookOpen className="mt-[1px] h-3 w-3 shrink-0 text-amber-400" />
              Cada resposta aqui muda o post <em>e</em> o conteúdo do seu curso — os exemplos são reescritos para o seu contexto.
            </p>
          )}
        </aside>
      </div>
    </motion.div>
  );
}
