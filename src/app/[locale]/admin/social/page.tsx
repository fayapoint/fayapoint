"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Eye,
  Plus,
  RefreshCcw,
  Sparkles,
  Calendar,
  BarChart3,
  Send,
  Loader2,
  ChevronDown,
  Trash2,
  Clock,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SocialAccount {
  _id: string;
  platform: string;
  username: string;
  status: string;
  metadata: {
    followerCount: number;
    followingCount: number;
    postCount: number;
    averageEngagement: number;
    profilePictureUrl?: string;
  };
  lastSync?: string;
}

interface SocialPost {
  _id: string;
  platform: string;
  content: string;
  status: string;
  hashtags: string[];
  scheduledFor?: string;
  publishedAt?: string;
  analytics: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    engagementRate: number;
  };
  aiGenerated: boolean;
  createdAt: string;
}

interface AnalyticsTotals {
  accounts: number;
  totalFollowers: number;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  avgEngagement: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Share2,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "from-yellow-500 to-amber-600",
  facebook: "from-blue-600 to-blue-700",
  twitter: "from-sky-400 to-sky-600",
  linkedin: "from-blue-700 to-blue-800",
  youtube: "from-red-500 to-red-700",
  tiktok: "from-gray-900 to-gray-800",
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

// ---------------------------------------------------------------------------
// Tab views
// ---------------------------------------------------------------------------

type Tab = "overview" | "posts" | "generate" | "accounts";

export default function SocialPage() {
  const { token } = useAdmin();
  const [tab, setTab] = useState<Tab>("overview");
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [totals, setTotals] = useState<AnalyticsTotals | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate state
  const [genTopic, setGenTopic] = useState("");
  const [genTone, setGenTone] = useState("professional");
  const [genPlatform, setGenPlatform] = useState("instagram");
  const [genCount, setGenCount] = useState(3);
  const [genLoading, setGenLoading] = useState(false);
  const [genResults, setGenResults] = useState<any[] | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [accRes, postRes, analyticsRes] = await Promise.all([
        fetch("/api/social/accounts", { headers }),
        fetch("/api/social/posts?limit=20", { headers }),
        fetch("/api/social/analytics?days=30", { headers }),
      ]);

      if (accRes.ok) {
        const data = await accRes.json();
        setAccounts(data.accounts || []);
      }
      if (postRes.ok) {
        const data = await postRes.json();
        setPosts(data.posts || []);
      }
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setTotals(data.totals || null);
      }
    } catch (e) {
      console.error("Failed to fetch social data:", e);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleGenerate = async () => {
    if (!genTopic.trim()) return;
    setGenLoading(true);
    setGenResults(null);
    try {
      const res = await fetch("/api/social/generate", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: genTopic,
          platform: genPlatform,
          tone: genTone,
          count: genCount,
          action: "generatePosts",
          language: "pt-BR",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGenResults(data.generated?.posts || []);
      }
    } catch (e) {
      console.error("Generate error:", e);
    }
    setGenLoading(false);
  };

  const handleSaveAsDraft = async (content: string, hashtags: string[]) => {
    if (accounts.length === 0) return;
    const account = accounts.find((a) => a.platform === genPlatform) || accounts[0];
    try {
      await fetch("/api/social/posts", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account._id,
          content,
          hashtags,
          status: "draft",
          aiGenerated: true,
        }),
      });
      fetchAll();
    } catch (e) {
      console.error("Save draft error:", e);
    }
  };

  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "posts", label: "Posts", icon: Send },
    { id: "generate", label: "Gerar Conteúdo", icon: Sparkles },
    { id: "accounts", label: "Contas", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl">
              <Share2 size={22} className="text-white" />
            </div>
            Social Media
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie suas redes sociais com IA
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border text-muted-foreground hover:bg-white/10 transition text-sm"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl border border-border w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.id
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                  : "text-muted-foreground hover:text-white hover:bg-secondary"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-violet-400" />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {tab === "overview" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Seguidores",
                    value: formatNumber(totals?.totalFollowers || 0),
                    icon: Users,
                    color: "text-blue-400",
                  },
                  {
                    label: "Posts (30d)",
                    value: formatNumber(totals?.totalPosts || 0),
                    icon: Send,
                    color: "text-green-400",
                  },
                  {
                    label: "Engajamento",
                    value: `${(totals?.avgEngagement || 0).toFixed(1)}%`,
                    icon: Heart,
                    color: "text-yellow-400",
                  },
                  {
                    label: "Alcance",
                    value: formatNumber(totals?.totalReach || 0),
                    icon: Eye,
                    color: "text-amber-400",
                  },
                ].map((kpi, i) => {
                  const Icon = kpi.icon;
                  return (
                    <motion.div
                      key={kpi.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl bg-white/[0.03] border border-border hover:border-white/20 transition"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={18} className={kpi.color} />
                        <span className="text-xs text-muted-foreground">
                          {kpi.label}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {kpi.value}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Platform breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {accounts.map((acc) => {
                  const Icon = PLATFORM_ICONS[acc.platform] || Share2;
                  const colors =
                    PLATFORM_COLORS[acc.platform] || "from-gray-600 to-gray-700";
                  return (
                    <motion.div
                      key={acc._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-border"
                    >
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${colors}`}
                      >
                        <Icon size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          @{acc.username}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {acc.platform}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">
                          {formatNumber(acc.metadata?.followerCount || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">seguidores</p>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          acc.status === "active"
                            ? "bg-green-400"
                            : acc.status === "error"
                            ? "bg-red-400"
                            : "bg-yellow-400"
                        }`}
                      />
                    </motion.div>
                  );
                })}

                {accounts.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <Share2 size={48} className="mx-auto mb-3 opacity-30" />
                    <p>Nenhuma conta conectada</p>
                    <button
                      onClick={() => setTab("accounts")}
                      className="mt-3 text-violet-400 text-sm hover:underline"
                    >
                      Conectar conta
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Posts */}
              {posts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Posts Recentes
                  </h3>
                  <div className="space-y-3">
                    {posts.slice(0, 5).map((post) => {
                      const Icon =
                        PLATFORM_ICONS[post.platform] || Share2;
                      return (
                        <div
                          key={post._id}
                          className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-border"
                        >
                          <Icon size={16} className="text-muted-foreground mt-1 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 line-clamp-2">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span
                                className={`px-2 py-0.5 rounded-full ${
                                  post.status === "published"
                                    ? "bg-green-500/10 text-green-400"
                                    : post.status === "scheduled"
                                    ? "bg-blue-500/10 text-blue-400"
                                    : post.status === "draft"
                                    ? "bg-gray-500/10 text-muted-foreground"
                                    : "bg-yellow-500/10 text-yellow-400"
                                }`}
                              >
                                {post.status}
                              </span>
                              {post.aiGenerated && (
                                <span className="flex items-center gap-1 text-violet-400">
                                  <Sparkles size={10} /> AI
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Heart size={10} />
                                {post.analytics?.likes || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle size={10} />
                                {post.analytics?.comments || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Posts Tab */}
          {tab === "posts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Todos os Posts ({posts.length})
                </h3>
                <button
                  onClick={() => setTab("generate")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm hover:bg-violet-500 transition"
                >
                  <Sparkles size={16} />
                  Gerar com IA
                </button>
              </div>

              {posts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Send size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Nenhum post ainda</p>
                  <p className="text-sm mt-1">
                    Use a IA para gerar conteúdo ou crie manualmente
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => {
                    const Icon = PLATFORM_ICONS[post.platform] || Share2;
                    return (
                      <motion.div
                        key={post._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 rounded-xl bg-white/[0.03] border border-border hover:border-white/20 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <Icon
                              size={16}
                              className="text-muted-foreground mt-1 shrink-0"
                            />
                            <div className="flex-1">
                              <p className="text-sm text-gray-200">
                                {post.content}
                              </p>
                              {post.hashtags.length > 0 && (
                                <p className="text-xs text-violet-400 mt-1">
                                  {post.hashtags.map((h) => `#${h}`).join(" ")}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span
                                  className={`px-2 py-0.5 rounded-full ${
                                    post.status === "published"
                                      ? "bg-green-500/10 text-green-400"
                                      : post.status === "scheduled"
                                      ? "bg-blue-500/10 text-blue-400"
                                      : "bg-gray-500/10 text-muted-foreground"
                                  }`}
                                >
                                  {post.status}
                                </span>
                                {post.scheduledFor && (
                                  <span className="flex items-center gap-1">
                                    <Clock size={10} />
                                    {new Date(
                                      post.scheduledFor
                                    ).toLocaleDateString("pt-BR")}
                                  </span>
                                )}
                                {post.aiGenerated && (
                                  <span className="flex items-center gap-1 text-violet-400">
                                    <Sparkles size={10} /> Gerado por IA
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {post.status === "published" && (
                            <div className="text-right text-xs text-muted-foreground shrink-0">
                              <div className="flex items-center gap-1">
                                <Heart size={12} />
                                {post.analytics?.likes || 0}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye size={12} />
                                {formatNumber(post.analytics?.reach || 0)}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Generate Tab */}
          {tab === "generate" && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-white/[0.03] border border-border">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles size={20} className="text-violet-400" />
                  Gerar Conteúdo com IA
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Topic */}
                  <div className="md:col-span-2">
                    <label className="block text-sm text-muted-foreground mb-1">
                      Tema / Assunto
                    </label>
                    <input
                      type="text"
                      value={genTopic}
                      onChange={(e) => setGenTopic(e.target.value)}
                      placeholder="Ex: Dicas de marketing digital para pequenas empresas"
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* Platform */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Plataforma
                    </label>
                    <select
                      value={genPlatform}
                      onChange={(e) => setGenPlatform(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="twitter">Twitter/X</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Tom
                    </label>
                    <select
                      value={genTone}
                      onChange={(e) => setGenTone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-white focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="professional">Profissional</option>
                      <option value="casual">Casual</option>
                      <option value="humorous">Humorístico</option>
                      <option value="inspirational">Inspiracional</option>
                      <option value="educational">Educacional</option>
                      <option value="persuasive">Persuasivo</option>
                    </select>
                  </div>

                  {/* Count */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Quantidade
                    </label>
                    <select
                      value={genCount}
                      onChange={(e) => setGenCount(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-white focus:outline-none focus:border-amber-500/50"
                    >
                      {[1, 3, 5, 7, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "post" : "posts"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={genLoading || !genTopic.trim()}
                  className="mt-4 flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-amber-600 text-white font-medium hover:from-amber-500 hover:to-amber-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {genLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Zap size={18} />
                  )}
                  {genLoading ? "Gerando..." : "Gerar Posts"}
                </button>
              </div>

              {/* Generated Results */}
              <AnimatePresence>
                {genResults && genResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-white">
                      Posts Gerados ({genResults.length})
                    </h3>
                    {genResults.map((result: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-xl bg-white/[0.03] border border-border"
                      >
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">
                          {result.content}
                        </p>
                        {result.hashtags?.length > 0 && (
                          <p className="text-xs text-violet-400 mt-2">
                            {result.hashtags.map((h: string) => `#${h}`).join(" ")}
                          </p>
                        )}
                        {result.callToAction && (
                          <p className="text-xs text-amber-400 mt-1">
                            CTA: {result.callToAction}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() =>
                              handleSaveAsDraft(
                                result.content,
                                result.hashtags || []
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-300 text-xs hover:bg-violet-600/30 transition"
                          >
                            Salvar como rascunho
                          </button>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(result.content)
                            }
                            className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs hover:bg-white/10 transition"
                          >
                            Copiar
                          </button>
                          {result.bestTimeToPost && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={10} />
                              Melhor horário: {result.bestTimeToPost}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Accounts Tab */}
          {tab === "accounts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Contas Conectadas ({accounts.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map((acc) => {
                  const Icon = PLATFORM_ICONS[acc.platform] || Share2;
                  const colors =
                    PLATFORM_COLORS[acc.platform] || "from-gray-600 to-gray-700";
                  return (
                    <motion.div
                      key={acc._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-5 rounded-xl bg-white/[0.03] border border-border hover:border-white/20 transition"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div
                          className={`p-3 rounded-xl bg-gradient-to-br ${colors}`}
                        >
                          <Icon size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            @{acc.username}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {acc.platform} &middot;{" "}
                            <span
                              className={
                                acc.status === "active"
                                  ? "text-green-400"
                                  : "text-yellow-400"
                              }
                            >
                              {acc.status}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold text-white">
                            {formatNumber(acc.metadata?.followerCount || 0)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Seguidores
                          </p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">
                            {formatNumber(acc.metadata?.postCount || 0)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Posts</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">
                            {(acc.metadata?.averageEngagement || 0).toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">Eng.</p>
                        </div>
                      </div>
                      {acc.lastSync && (
                        <p className="text-[10px] text-gray-600 mt-3">
                          Último sync:{" "}
                          {new Date(acc.lastSync).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </motion.div>
                  );
                })}

                {/* Add Account Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-xl border-2 border-dashed border-border hover:border-amber-500/30 transition flex flex-col items-center justify-center gap-3 min-h-[200px] cursor-pointer group"
                  onClick={() => {
                    // TODO: OAuth flow
                  }}
                >
                  <div className="p-4 rounded-full bg-secondary group-hover:bg-violet-500/10 transition">
                    <Plus
                      size={24}
                      className="text-muted-foreground group-hover:text-violet-400 transition"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-muted-foreground transition">
                    Conectar nova conta
                  </p>
                  <p className="text-xs text-gray-600">
                    Instagram, Facebook, Twitter, LinkedIn, YouTube, TikTok
                  </p>
                </motion.div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
