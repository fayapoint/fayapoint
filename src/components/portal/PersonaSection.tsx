"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Brain,
  Loader2,
  Megaphone,
  Palette,
  Save,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

/**
 * Sua Persona — Fase 3.1 da Leitura 2.0 (17/07/2026).
 * Interface VISUAL (thumbnails clicáveis) para as 5 dimensões da persona,
 * texto apenas como fallback. Mostra o que o site já aprendeu (socialPersona)
 * e o completionPercent. Grava via PUT /api/user/social-persona (XP na 1ª vez).
 * Artes: /portal/persona/opts/<dim>-<key>.webp (fallback: gradiente + emoji).
 */

type DimKey = "industry" | "toneOfVoice" | "marketingGoals" | "contentTypes" | "experienceLevel";

type Option = { key: string; label: string; emoji: string; grad: string };

type Dimension = {
  key: DimKey;
  title: string;
  hint: string;
  Icon: typeof Target;
  multi: boolean;
  options: Option[];
};

const DIMENSIONS: Dimension[] = [
  {
    key: "industry",
    title: "Seu setor",
    hint: "Onde você atua (pode marcar mais de um)",
    Icon: Target,
    multi: true,
    options: [
      { key: "tech", label: "Tecnologia", emoji: "💻", grad: "from-sky-500/40 to-blue-600/20" },
      { key: "marketing", label: "Negócios e Vendas", emoji: "📈", grad: "from-emerald-500/40 to-teal-600/20" },
      { key: "education", label: "Educação", emoji: "📚", grad: "from-violet-500/40 to-purple-600/20" },
      { key: "art", label: "Área Criativa", emoji: "🎨", grad: "from-fuchsia-500/40 to-pink-600/20" },
      { key: "consulting", label: "Consultoria", emoji: "🧭", grad: "from-amber-500/40 to-orange-600/20" },
      { key: "finance", label: "Finanças", emoji: "💰", grad: "from-lime-500/40 to-green-600/20" },
      { key: "retail", label: "Varejo", emoji: "🛍️", grad: "from-rose-500/40 to-red-600/20" },
      { key: "entertainment", label: "Entretenimento", emoji: "🎬", grad: "from-indigo-500/40 to-violet-600/20" },
    ],
  },
  {
    key: "toneOfVoice",
    title: "Seu tom de voz",
    hint: "Como você soa quando se comunica",
    Icon: Megaphone,
    multi: true,
    options: [
      { key: "profissional", label: "Profissional", emoji: "👔", grad: "from-slate-500/40 to-zinc-600/20" },
      { key: "descontraido", label: "Descontraído", emoji: "😎", grad: "from-amber-500/40 to-yellow-600/20" },
      { key: "inspirador", label: "Inspirador", emoji: "🌅", grad: "from-orange-500/40 to-rose-600/20" },
      { key: "direto", label: "Direto ao ponto", emoji: "🎯", grad: "from-red-500/40 to-rose-600/20" },
      { key: "educativo", label: "Educativo", emoji: "🧑‍🏫", grad: "from-violet-500/40 to-indigo-600/20" },
      { key: "provocador", label: "Provocador", emoji: "🔥", grad: "from-fuchsia-500/40 to-red-600/20" },
    ],
  },
  {
    key: "marketingGoals",
    title: "Seus objetivos",
    hint: "O que você quer conquistar com IA",
    Icon: Sparkles,
    multi: true,
    options: [
      { key: "automate", label: "Ganhar tempo", emoji: "⏰", grad: "from-cyan-500/40 to-sky-600/20" },
      { key: "sales", label: "Gerar renda", emoji: "💸", grad: "from-emerald-500/40 to-lime-600/20" },
      { key: "education", label: "Dominar assuntos", emoji: "🎓", grad: "from-violet-500/40 to-purple-600/20" },
      { key: "authority", label: "Construir autoridade", emoji: "⭐", grad: "from-amber-500/40 to-orange-600/20" },
      { key: "personal-brand", label: "Marca pessoal", emoji: "💎", grad: "from-fuchsia-500/40 to-violet-600/20" },
      { key: "content-scale", label: "Criar sem parar", emoji: "🚀", grad: "from-rose-500/40 to-fuchsia-600/20" },
      { key: "community", label: "Criar comunidade", emoji: "🤝", grad: "from-teal-500/40 to-emerald-600/20" },
    ],
  },
  {
    key: "contentTypes",
    title: "Tipos de conteúdo",
    hint: "O que você produz (ou quer produzir)",
    Icon: Palette,
    multi: true,
    options: [
      { key: "posts", label: "Posts", emoji: "📝", grad: "from-sky-500/40 to-cyan-600/20" },
      { key: "reels", label: "Vídeos curtos", emoji: "🎞️", grad: "from-rose-500/40 to-pink-600/20" },
      { key: "artigos", label: "Artigos e blog", emoji: "📰", grad: "from-violet-500/40 to-indigo-600/20" },
      { key: "stories", label: "Stories", emoji: "📱", grad: "from-amber-500/40 to-orange-600/20" },
      { key: "newsletter", label: "E-mail e newsletter", emoji: "✉️", grad: "from-emerald-500/40 to-teal-600/20" },
      { key: "anuncios", label: "Anúncios", emoji: "📣", grad: "from-red-500/40 to-rose-600/20" },
    ],
  },
  {
    key: "experienceLevel",
    title: "Seu momento com IA",
    hint: "Sem julgamento — é só para calibrar o conteúdo",
    Icon: Brain,
    multi: false,
    options: [
      { key: "beginner", label: "Começando agora", emoji: "🌱", grad: "from-lime-500/40 to-green-600/20" },
      { key: "intermediate", label: "Já me viro bem", emoji: "🌿", grad: "from-emerald-500/40 to-teal-600/20" },
      { key: "advanced", label: "Uso todo dia", emoji: "🌳", grad: "from-violet-500/40 to-emerald-600/20" },
    ],
  },
];

type SocialPersona = {
  industry: string[];
  toneOfVoice: string[];
  marketingGoals: string[];
  contentTypes: string[];
  experienceLevel: string;
  contentThemes: string[];
  primaryInterests: string[];
  topHashtags: string[];
  writingStyle: string;
  audienceInsights: string;
  completionPercent: number;
  personaVersion: number;
};

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("fayai_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function OptionTile({
  dim,
  option,
  selected,
  onToggle,
}: {
  dim: DimKey;
  option: Option;
  selected: boolean;
  onToggle: () => void;
}) {
  const [imgOk, setImgOk] = useState(true);
  const src = `/portal/persona/opts/${dim}-${option.key}.webp`;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "group relative overflow-hidden rounded-xl border text-left transition-all cursor-pointer",
        "aspect-[4/3] w-full",
        selected
          ? "border-violet-400/80 ring-2 ring-violet-400/50 shadow-lg shadow-violet-900/30"
          : "border-white/10 hover:border-violet-400/40"
      )}
    >
      {imgOk ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={option.label}
          loading="lazy"
          decoding="async"
          onError={() => setImgOk(false)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-transform duration-300",
            "group-hover:scale-105",
            !selected && "opacity-80 group-hover:opacity-100"
          )}
        />
      ) : (
        <div className={cn("absolute inset-0 bg-gradient-to-br", option.grad)}>
          <span className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 text-3xl sm:text-4xl drop-shadow">
            {option.emoji}
          </span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2.5 pb-2 pt-6">
        <p className="text-[11px] sm:text-xs font-bold text-white leading-tight">{option.label}</p>
      </div>
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 shadow-lg">
          <BadgeCheck size={14} className="text-white" />
        </span>
      )}
    </button>
  );
}

export function PersonaSection() {
  const [persona, setPersona] = useState<SocialPersona | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [customInputs, setCustomInputs] = useState<Partial<Record<DimKey, string>>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/user/social-persona", {
          headers: authHeaders(),
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setPersona(data.socialPersona);
      } catch {
        /* rede */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback((dim: Dimension, key: string) => {
    setPersona((prev) => {
      if (!prev) return prev;
      if (!dim.multi) {
        return { ...prev, [dim.key]: prev.experienceLevel === key ? "" : key };
      }
      const current = (prev[dim.key] as string[]) || [];
      const next = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      return { ...prev, [dim.key]: next };
    });
    setDirty(true);
  }, []);

  const addCustom = useCallback((dim: Dimension) => {
    const value = (customInputs[dim.key] || "").trim();
    if (!value) return;
    setPersona((prev) => {
      if (!prev) return prev;
      if (!dim.multi) return { ...prev, [dim.key]: value };
      const current = (prev[dim.key] as string[]) || [];
      if (current.includes(value)) return prev;
      return { ...prev, [dim.key]: [...current, value] };
    });
    setCustomInputs((c) => ({ ...c, [dim.key]: "" }));
    setDirty(true);
  }, [customInputs]);

  const save = useCallback(async () => {
    if (!persona) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/social-persona", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          industry: persona.industry,
          toneOfVoice: persona.toneOfVoice,
          marketingGoals: persona.marketingGoals,
          contentTypes: persona.contentTypes,
          experienceLevel: persona.experienceLevel,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPersona(data.socialPersona);
        setDirty(false);
        toast.success("Persona salva — o site agora te conhece melhor ✨");
      } else {
        toast.error(data.error || "Erro ao salvar persona");
      }
    } catch {
      toast.error("Sem conexão — tente de novo");
    } finally {
      setSaving(false);
    }
  }, [persona]);

  const learned = useMemo(() => {
    if (!persona) return [];
    return [
      ...(persona.contentThemes || []),
      ...(persona.primaryInterests || []),
      ...(persona.topHashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`)),
    ].slice(0, 12);
  }, [persona]);

  if (loading) {
    return (
      <Card className="bg-card border-border p-6 flex items-center gap-3 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" /> Carregando sua persona…
      </Card>
    );
  }
  if (!persona) return null;

  const completion = persona.completionPercent || 0;

  return (
    <Card className="bg-card border-border p-4 md:p-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <Users className="text-violet-400 shrink-0" />
          Sua Persona
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-xs font-bold text-violet-300">{completion}%</span>
          </div>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold transition-all cursor-pointer",
              dirty
                ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white hover:opacity-90"
                : "border border-white/15 text-white/40 cursor-default"
            )}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {dirty ? "Salvar persona" : "Salvo"}
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Escolha o que combina com você — cursos, exemplos e o gerador de conteúdo usam isso para falar a sua língua.
      </p>

      <div className="space-y-6">
        {DIMENSIONS.map((dim) => {
          const { Icon } = dim;
          const value = persona[dim.key];
          const selectedKeys = dim.multi ? (value as string[]) || [] : value ? [value as string] : [];
          const extraSelections = selectedKeys.filter(
            (k) => !dim.options.some((o) => o.key === k)
          );
          return (
            <div key={dim.key}>
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <p className="text-sm font-bold flex items-center gap-1.5">
                  <Icon size={14} className="text-violet-400" />
                  {dim.title}
                </p>
                <p className="text-[11px] text-muted-foreground">{dim.hint}</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {dim.options.map((option) => (
                  <OptionTile
                    key={option.key}
                    dim={dim.key}
                    option={option}
                    selected={selectedKeys.includes(option.key)}
                    onToggle={() => toggle(dim, option.key)}
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {extraSelections.map((k) => (
                  <button
                    key={k}
                    onClick={() => toggle(dim, k)}
                    className="rounded-full border border-violet-400/50 bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-bold text-violet-200 cursor-pointer"
                    title="Clique para remover"
                  >
                    {k} ×
                  </button>
                ))}
                <Input
                  value={customInputs[dim.key] || ""}
                  onChange={(e) => setCustomInputs((c) => ({ ...c, [dim.key]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom(dim);
                    }
                  }}
                  placeholder="Outro? Digite e Enter…"
                  className="h-7 w-44 rounded-full border-white/10 bg-white/5 px-3 text-[11px]"
                />
              </div>
            </div>
          );
        })}
      </div>

      {(learned.length > 0 || persona.writingStyle || persona.audienceInsights) && (
        <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-4">
          <p className="text-xs font-extrabold uppercase tracking-widest text-violet-300 flex items-center gap-1.5">
            <Sparkles size={12} /> O que o site já aprendeu sobre você
          </p>
          {learned.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {learned.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-white/70"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
          {persona.writingStyle && (
            <p className="mt-2 text-xs text-muted-foreground">
              <strong className="text-white/70">Estilo de escrita:</strong> {persona.writingStyle}
            </p>
          )}
          {persona.audienceInsights && (
            <p className="mt-1 text-xs text-muted-foreground">
              <strong className="text-white/70">Seu público:</strong> {persona.audienceInsights}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
