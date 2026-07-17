"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Send,
  CalendarClock,
  Sparkles,
  Loader2,
  Instagram,
  Facebook,
  Youtube,
  Share2,
  ImageIcon,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

/**
 * Composer USS — escrever, gerar com IA, publicar agora ou agendar.
 * O elo que faltava entre as contas conectadas e a publicação real (14/07/2026).
 */

interface Account {
  _id: string;
  platform: string;
  username: string;
  isActive: boolean;
  metadata?: { pageName?: string; profilePictureUrl?: string };
}

interface Post {
  _id: string;
  platform: string;
  content: string;
  mediaUrls: string[];
  hashtags: string[];
  status: "draft" | "scheduled" | "published" | "failed" | "suggested";
  scheduledFor?: string;
  publishedAt?: string;
}

const PLATFORM_ICON: Record<string, typeof Share2> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  google: Youtube,
};

const PUBLISHABLE = new Set(["facebook", "instagram"]);

const STATUS_STYLE: Record<Post["status"], { label: string; cls: string; icon: typeof Clock }> = {
  draft: { label: "Rascunho", cls: "bg-secondary text-gray-300 border-border", icon: FileText },
  scheduled: { label: "Agendado", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30", icon: Clock },
  published: { label: "Publicado", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", icon: CheckCircle2 },
  failed: { label: "Falhou", cls: "bg-red-500/15 text-red-300 border-red-500/30", icon: XCircle },
  suggested: { label: "Sugestão", cls: "bg-violet-500/15 text-violet-300 border-violet-500/30", icon: Sparkles },
};

export default function SocialComposer() {
  const token = typeof window !== "undefined" ? localStorage.getItem("fayai_token") || "" : "";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountId, setAccountId] = useState<string>("");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaPrompt, setMediaPrompt] = useState("");
  const [creatingImage, setCreatingImage] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState<null | "now" | "schedule">(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const selected = accounts.find((a) => a._id === accountId);

  const load = useCallback(async () => {
    try {
      const [accRes, postsRes] = await Promise.all([
        fetch("/api/social/accounts", { headers, cache: "no-store" }),
        fetch("/api/social/posts?limit=15", { headers, cache: "no-store" }),
      ]);
      if (accRes.ok) {
        const data = await accRes.json();
        const list: Account[] = (data.accounts || []).filter(
          (a: Account) => a.isActive && PUBLISHABLE.has(a.platform)
        );
        setAccounts(list);
        if (list.length > 0) setAccountId((prev) => prev || list[0]._id);
      }
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts || []);
      }
    } catch {
      /* rede — mantém estado atual */
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const parseHashtags = () =>
    hashtags
      .split(/[\s,]+/)
      .map((h) => h.replace(/^#/, "").trim())
      .filter(Boolean);

  const generateWithAI = async () => {
    if (!topic.trim()) {
      toast.error("Diga o tema do post para a IA");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/social/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ accountId, topic, count: 1, language: "pt-BR" }),
      });
      const data = await res.json();
      const first = data?.posts?.[0] || data?.generated?.[0];
      if (res.ok && first?.content) {
        setContent(first.content);
        if (Array.isArray(first.hashtags)) setHashtags(first.hashtags.join(" "));
        if (typeof first.mediaPrompt === "string") setMediaPrompt(first.mediaPrompt);
        toast.success("Post gerado — revise antes de publicar ✨");
      } else {
        toast.error(data?.error || "A IA não conseguiu gerar agora");
      }
    } catch {
      toast.error("Erro de rede ao gerar");
    } finally {
      setGenerating(false);
    }
  };

  /* Fase 4.5: mediaPrompt do gerador → imagem pronta no Studio → mediaUrl */
  const createImageFromPrompt = async () => {
    if (!mediaPrompt.trim()) return;
    setCreatingImage(true);
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: mediaPrompt, model: "nano-banana-1" }),
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setMediaUrl(data.imageUrl);
        toast.success("Imagem criada e anexada ao post 🎨");
      } else {
        toast.error(data?.error || "Não deu para criar a imagem agora");
      }
    } catch {
      toast.error("Erro de rede ao criar imagem");
    } finally {
      setCreatingImage(false);
    }
  };

  const createPost = async (mode: "now" | "schedule") => {
    if (!selected) {
      toast.error("Conecte uma conta na aba Contas primeiro");
      return;
    }
    if (!content.trim()) {
      toast.error("Escreva (ou gere) o conteúdo do post");
      return;
    }
    if (selected.platform === "instagram" && !mediaUrl.trim()) {
      toast.error("O Instagram exige uma imagem — cole a URL da mídia");
      return;
    }
    if (mode === "schedule" && !scheduledFor) {
      toast.error("Escolha data e hora do agendamento");
      return;
    }

    setSending(mode);
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          accountId,
          content: content.trim(),
          hashtags: parseHashtags(),
          mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : [],
          mediaType: mediaUrl.trim() ? "image" : "text",
          status: mode === "schedule" ? "scheduled" : "draft",
          scheduledFor: mode === "schedule" ? new Date(scheduledFor).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Erro ao salvar o post");
        return;
      }

      const postId = data?.post?._id || data?._id;
      if (mode === "now" && postId) {
        const pub = await fetch(`/api/social/posts/${postId}/publish`, { method: "POST", headers });
        const pubData = await pub.json();
        if (pub.ok && pubData.published) {
          toast.success(`Publicado no ${selected.platform === "instagram" ? "Instagram" : "Facebook"} 🎉`);
        } else {
          toast.error(pubData?.error || "Salvo como rascunho, mas a publicação falhou");
        }
      } else {
        toast.success("Post agendado ⏰");
      }

      setContent("");
      setHashtags("");
      setMediaUrl("");
      setScheduledFor("");
      await load();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setSending(null);
    }
  };

  const publishExisting = async (id: string) => {
    setPublishingId(id);
    try {
      const res = await fetch(`/api/social/posts/${id}/publish`, { method: "POST", headers });
      const data = await res.json();
      if (res.ok && data.published) toast.success("Publicado 🎉");
      else toast.error(data?.error || "Falha ao publicar");
      await load();
    } catch {
      toast.error("Erro de rede");
    } finally {
      setPublishingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando publicador…
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-10">
        <Share2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-semibold text-foreground">Nenhuma conta pronta para publicar</p>
        <p className="text-sm text-muted-foreground mt-1">
          Conecte Facebook + Instagram na aba <span className="text-amber-400 font-semibold">Contas</span> e
          volte aqui — publicar leva 10 segundos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Escolha da conta */}
      <div className="flex flex-wrap gap-2">
        {accounts.map((a) => {
          const Icon = PLATFORM_ICON[a.platform] || Share2;
          const active = a._id === accountId;
          return (
            <button
              key={a._id}
              onClick={() => setAccountId(a._id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer",
                active
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                  : "border-border bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {a.metadata?.pageName || a.username}
            </button>
          );
        })}
      </div>

      {/* Gerar com IA */}
      <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-300 mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Gerar com IA (usa sua persona)
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Tema — ex.: dica de ChatGPT para pequenos negócios"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-400/60"
          />
          <Button
            onClick={generateWithAI}
            disabled={generating}
            variant="outline"
            className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
            Gerar
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={5000}
          placeholder="Escreva seu post aqui…"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-400/60 resize-y"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#hashtags separadas por espaço"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-400/60"
          />
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder={selected?.platform === "instagram" ? "URL da imagem (obrigatória no IG)" : "URL da imagem (opcional)"}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-400/60"
            />
          </div>
        </div>
        {mediaPrompt && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2">
            <p className="flex-1 min-w-[180px] text-[11px] text-muted-foreground line-clamp-2">
              <strong className="text-amber-300">Imagem sugerida pela IA:</strong> {mediaPrompt}
            </p>
            <button
              onClick={createImageFromPrompt}
              disabled={creatingImage}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 px-3.5 py-1.5 text-[11px] font-extrabold text-black hover:from-amber-400 hover:to-yellow-400 transition-colors cursor-pointer disabled:opacity-60"
            >
              {creatingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
              {mediaUrl ? "Recriar imagem" : "Criar imagem"}
            </button>
          </div>
        )}
        {mediaUrl && (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl} alt="Mídia do post" className="h-14 w-14 rounded-lg object-cover ring-1 ring-amber-400/40" />
            <span className="text-[11px] text-muted-foreground">Imagem anexada ao post</span>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground text-right">{content.length}/5000</p>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => createPost("now")}
          disabled={sending !== null}
          className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:from-amber-400 hover:to-yellow-400"
        >
          {sending === "now" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
          Publicar agora
        </Button>
        <div className="flex flex-1 gap-2">
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-sky-400/60"
          />
          <Button
            onClick={() => createPost("schedule")}
            disabled={sending !== null}
            variant="outline"
            className="border-sky-500/40 text-sky-300 hover:bg-sky-500/10"
          >
            {sending === "schedule" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CalendarClock className="h-4 w-4 mr-1.5" />}
            Agendar
          </Button>
        </div>
      </div>

      {/* Histórico */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-foreground">Seus posts</p>
          <button
            onClick={load}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" /> Atualizar
          </button>
        </div>
        {posts.length === 0 ? (
          <div className="py-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- primeiro post §12 */}
            <img src="/fx/primeiro-post.webp" alt="" aria-hidden className="mx-auto mb-2 h-20 w-32 rounded-xl object-cover opacity-90" />
            <p className="text-sm text-muted-foreground">
              Nenhum post ainda — o primeiro está a um clique de distância.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((p) => {
              const st = STATUS_STYLE[p.status] || STATUS_STYLE.draft;
              const Icon = PLATFORM_ICON[p.platform] || Share2;
              const StIcon = st.icon;
              return (
                <div key={p._id} className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3">
                  <Icon className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground line-clamp-2">{p.content}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge className={cn("text-[10px] border", st.cls)}>
                        <StIcon className="h-3 w-3 mr-1" /> {st.label}
                      </Badge>
                      {p.status === "scheduled" && p.scheduledFor && (
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(p.scheduledFor).toLocaleString("pt-BR")}
                        </span>
                      )}
                      {p.status === "published" && p.publishedAt && (
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(p.publishedAt).toLocaleString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                  {(p.status === "draft" || p.status === "failed") && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={publishingId === p._id}
                      onClick={() => publishExisting(p._id)}
                      className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 shrink-0"
                    >
                      {publishingId === p._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
