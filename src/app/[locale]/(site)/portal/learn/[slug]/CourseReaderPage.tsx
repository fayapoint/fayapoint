"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Copy,
  Check,
  Lightbulb,
  Pencil,
  ListChecks,
  Loader2,
  Lock,
  Menu,
  MousePointerClick,
  Play,
  Settings2,
  Sparkles,
  AlertTriangle,
  Trophy,
  X,
  Award,
  PanelRightOpen,
  ArrowUp,
  ArrowDown,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { CourseQuizModal } from "@/components/portal/CourseQuizModal";
import { CoursePaywall } from "@/components/CoursePaywall";
import {
  formatEditorialDate,
  normalizeEditorialVerification,
  type EditorialVerification,
  type LessonContentCoverage,
} from "@/lib/editorial-verification";

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

type Chapter = {
  id: string;
  title: string;
  content: string;
  index: number;
  readingMinutes: number;
  sourceIds: string[];
  sourceStartIndex: number;
  sourceEndIndex: number;
};

type CourseAccessDto = {
  access: "full" | "limited" | "none";
  freeChapters: number;
  totalChapters: number | null;
  reason: string;
  plan: string | null;
  canUpgrade: boolean;
  coursePrice: number | null;
  courseTitle: string | null;
};

type CourseProgressDto = {
  courseId: string;
  completedLessons: string[];
  completedSections: string[];
  lastAccessedLesson: string | null;
  lastHeadingId: string | null;
  progressPercent: number;
  totalSections: number | null;
  lastScrollY: number | null;
  lastScrollPercent: number | null;
  isCompleted: boolean;
  startedAt: string;
  lastAccessedAt: string;
};

type CourseContentDto = {
  content?: string;
  title?: string;
  modules?: unknown[];
  slug?: string;
  contentChapters?: number;
  contentUpdatedAt?: string | null;
  lessonContentCoverage?: LessonContentCoverage;
  editorialVerification?: EditorialVerification | null;
};

/* ─── Content Forge Media Types ─── */
type MediaAsset = {
  source?: string; // "youtube" | "cloudinary" | "url"
  url?: string;
  publicId?: string;
  videoId?: string;
  caption?: string;
};

type ChapterMediaData = {
  thumbnail?: MediaAsset | null;
  heroImage?: MediaAsset | null;
  video?: MediaAsset | null;
  audio?: MediaAsset | null;
  gallery?: MediaAsset[];
  notebooklm?: MediaAsset | null;
};

type CourseMediaResponse = {
  success: boolean;
  mediaByIndex: Record<string, ChapterMediaData>;
  mediaBySlug: Record<string, ChapterMediaData>;
  totalChaptersWithMedia: number;
};

type ReaderTheme = "dark" | "light" | "sepia" | "high-contrast";

type ReaderSettings = {
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
  theme: ReaderTheme;
};

type ChapterSubheading = {
  id: string;
  title: string;
  level: 2 | 3;
};

/* ═══════════════════════════════════════════════════════════
   Constants & Helpers
   ═══════════════════════════════════════════════════════════ */

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 17,
  lineHeight: 1.8,
  maxWidth: 780,
  theme: "dark",
};

const READER_THEMES: { id: ReaderTheme; label: string; labelPt: string; swatch: string; fg: string }[] = [
  { id: "dark", label: "Dark", labelPt: "Escuro", swatch: "#0b0c13", fg: "#c0c0ce" },
  { id: "light", label: "Light", labelPt: "Claro", swatch: "#fafaf8", fg: "#374151" },
  { id: "sepia", label: "Sepia", labelPt: "Sépia", swatch: "#f4ecd8", fg: "#5a4d3a" },
  { id: "high-contrast", label: "High Contrast", labelPt: "Alto Contraste", swatch: "#ffffff", fg: "#000000" },
];

/* ═══════════════════════════════════════════════════════════
   Code Copy Button
   ═══════════════════════════════════════════════════════════ */

function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);
  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 rounded-lg bg-[rgba(var(--reader-tint),0.06)] hover:bg-[rgba(var(--reader-tint),0.12)] border border-[rgba(var(--reader-tint),0.08)] text-[rgba(var(--reader-tint),0.4)] hover:text-[rgba(var(--reader-tint),0.7)] transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
      aria-label="Copiar código"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   YouTube Embed Component
   ═══════════════════════════════════════════════════════════ */

const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&][\w=&]*)?/;

function extractYouTubeId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

function isYouTubeUrl(text: string): boolean {
  return YOUTUBE_REGEX.test(text.trim());
}

function YouTubeEmbed({ videoId, title }: { videoId: string; title?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  if (!isPlaying) {
    return (
      <div className="my-8 relative group">
        <div className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-[rgba(var(--reader-tint),0.08)] shadow-2xl shadow-black/40 cursor-pointer"
          onClick={() => setIsPlaying(true)}
        >
          {/* Thumbnail */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt={title || "Video"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-violet-600/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-violet-900/50 group-hover:bg-violet-500 group-hover:scale-110 transition-all duration-300">
              <Play size={32} className="text-[var(--reader-fg)] ml-1" fill="currentColor" />
            </div>
          </div>
          {/* Video badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-border">
            <Volume2 size={12} className="text-violet-300" />
            <span className="text-[11px] font-medium text-[rgba(var(--reader-tint),0.8)]">Video</span>
          </div>
          {title && (
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-sm font-medium text-[rgba(var(--reader-tint),0.9)] line-clamp-2">{title}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-[rgba(var(--reader-tint),0.08)] shadow-2xl shadow-black/40">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Cloudinary Image Optimizer
   ═══════════════════════════════════════════════════════════ */

function optimizeCloudinaryUrl(src: string, width?: number): string {
  if (!src) return src;

  // Detect Cloudinary URLs and add responsive transforms
  const cloudinaryMatch = src.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)/);
  if (cloudinaryMatch) {
    const base = cloudinaryMatch[1];
    const rest = cloudinaryMatch[2];
    // Remove any existing transform chain and add optimized one
    const pathParts = rest.split("/");
    // Find the part that starts with 'v' followed by digits (version)
    const versionIdx = pathParts.findIndex(p => /^v\d+$/.test(p));
    const assetPath = versionIdx >= 0 ? pathParts.slice(versionIdx).join("/") : rest;
    const w = width || 1200;
    return `${base}f_auto,q_auto,w_${w},c_limit/${assetPath}`;
  }

  return src;
}

/* ═══════════════════════════════════════════════════════════
   Chapter Media Header
   Renders hero image, video, audio from Content Forge metadata
   ═══════════════════════════════════════════════════════════ */

function ChapterMediaHeader({ media, chapterTitle }: { media: ChapterMediaData; chapterTitle: string }) {
  const videoAsset = media.video;
  const heroAsset = media.heroImage;
  const audioAsset = media.audio;
  const galleryAssets = media.gallery?.filter(g => g.url) || [];

  const hasVideo = videoAsset?.url;
  const hasHero = heroAsset?.url;
  const hasAudio = audioAsset?.url;
  const hasGallery = galleryAssets.length > 0;

  if (!hasVideo && !hasHero && !hasAudio && !hasGallery) return null;

  // Extract YouTube video ID from the video asset
  const youtubeVideoId = hasVideo
    ? (videoAsset.videoId || extractYouTubeId(videoAsset.url || ""))
    : null;

  return (
    <div className="space-y-6 mb-10">
      {/* Video player */}
      {youtubeVideoId && (
        <YouTubeEmbed videoId={youtubeVideoId} title={chapterTitle} />
      )}

      {/* Non-YouTube video (direct URL or Cloudinary) */}
      {hasVideo && !youtubeVideoId && (
        <div className="my-6">
          <div className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-[rgba(var(--reader-tint),0.08)] shadow-2xl shadow-black/40">
            <video
              src={videoAsset.url}
              controls
              className="absolute inset-0 w-full h-full"
              poster={media.thumbnail?.url || undefined}
            >
              Seu navegador não suporta vídeo.
            </video>
          </div>
        </div>
      )}

      {/* Hero image (only if no video already shown) */}
      {hasHero && !hasVideo && (
        <div className="my-6 relative group">
          <div className="rounded-2xl overflow-hidden ring-1 ring-[rgba(var(--reader-tint),0.08)] shadow-xl shadow-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroAsset.source === "cloudinary"
                ? optimizeCloudinaryUrl(heroAsset.url || "", 1200)
                : heroAsset.url || ""}
              alt={heroAsset.caption || chapterTitle}
              className="w-full h-auto object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
          {heroAsset.caption && (
            <p className="mt-3 text-center text-xs text-[rgba(var(--reader-tint),0.3)] italic">{heroAsset.caption}</p>
          )}
        </div>
      )}

      {/* Audio player */}
      {hasAudio && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[rgba(var(--reader-tint),0.03)] ring-1 ring-[rgba(var(--reader-tint),0.06)] backdrop-blur-sm">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center">
            <Volume2 size={18} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[rgba(var(--reader-tint),0.6)] mb-1.5">Audio do capítulo</p>
            <audio
              src={audioAsset.url}
              controls
              className="w-full h-8 [&::-webkit-media-controls-panel]:bg-[rgba(var(--reader-tint),0.04)]"
              preload="none"
            />
          </div>
        </div>
      )}

      {/* Gallery */}
      {hasGallery && (
        <div className={cn(
          "grid gap-4",
          galleryAssets.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
        )}>
          {galleryAssets.map((img, idx) => (
            <div key={idx} className="rounded-2xl overflow-hidden ring-1 ring-[rgba(var(--reader-tint),0.06)] shadow-lg shadow-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.source === "cloudinary"
                  ? optimizeCloudinaryUrl(img.url || "", 800)
                  : img.url || ""}
                alt={img.caption || `Imagem ${idx + 1}`}
                className="w-full h-auto object-cover"
                loading="lazy"
                decoding="async"
              />
              {img.caption && (
                <p className="px-4 py-2 text-xs text-[rgba(var(--reader-tint),0.3)] italic bg-black/20">{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Inline Media (Leitura 2.0 — Fase 2)
   Markers no markdown como comentários HTML: media:img id/src/caption
   e media:video id/src/poster/caption. Comentários HTML são invisíveis
   no ReactMarkdown, então conteúdo marcado renderiza normal em readers
   antigos. (Sequências de comentário HTML montadas via RegExp/string —
   literais no fonte quebram o lexer do Turbopack, que deixa de
   registrar a rota e serve 404.)
   ═══════════════════════════════════════════════════════════ */

type InlineMediaMarker = {
  type: "img" | "video";
  id: string;
  src: string;
  poster?: string;
  caption?: string;
};

type ChapterSegment =
  | { kind: "markdown"; content: string; key: string }
  | { kind: "media"; media: InlineMediaMarker; key: string };

const INLINE_MEDIA_REGEX = new RegExp("<" + "!--\\s*media:(img|video)\\s+([^>]*?)--" + ">", "g");

function parseMediaAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of raw.matchAll(/([\w-]+)="([^"]*)"/g)) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function splitContentWithMedia(content: string): ChapterSegment[] {
  if (!content) return [];
  const segments: ChapterSegment[] = [];
  let lastIndex = 0;
  let mediaCount = 0;

  for (const match of content.matchAll(INLINE_MEDIA_REGEX)) {
    const before = content.slice(lastIndex, match.index).trim();
    if (before) {
      segments.push({ kind: "markdown", content: before, key: `md-${lastIndex}` });
    }
    lastIndex = (match.index ?? 0) + match[0].length;

    const attrs = parseMediaAttrs(match[2]);
    // Marker sem src = mídia ainda não gerada → fica invisível (mesmo comportamento do comentário)
    if (attrs.src) {
      mediaCount += 1;
      segments.push({
        kind: "media",
        key: `media-${attrs.id || mediaCount}`,
        media: {
          type: match[1] as "img" | "video",
          id: attrs.id || `inline-${mediaCount}`,
          src: attrs.src,
          poster: attrs.poster,
          caption: attrs.caption,
        },
      });
    }
  }

  const tail = content.slice(lastIndex).trim();
  if (tail) {
    segments.push({ kind: "markdown", content: tail, key: `md-${lastIndex}` });
  }

  // Guarda: react-markdown v10 renderiza comentários HTML como TEXTO —
  // remove qualquer comentário restante (ex.: slots <exemplo> da Camada 2)
  // dos segmentos de markdown para nunca vazar marcador cru na tela.
  const GENERIC_COMMENT = new RegExp("<" + "!--[\\s\\S]*?--" + ">", "g");
  const cleaned = segments
    .map((segment) =>
      segment.kind === "markdown"
        ? { ...segment, content: segment.content.replace(GENERIC_COMMENT, "").trim() }
        : segment
    )
    .filter((segment) => segment.kind !== "markdown" || segment.content);

  return cleaned.length ? cleaned : [{ kind: "markdown", content, key: "md-0" }];
}

/* Revela com transição CSS suave; se a aba está oculta no mount ou não há
   IntersectionObserver, renderiza visível direto (hardening anti-congelamento). */
function useRevealOnVisible<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (
      !el ||
      typeof IntersectionObserver === "undefined" ||
      document.visibilityState === "hidden"
    ) {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, revealed };
}

function InlineMediaFigure({ media }: { media: InlineMediaMarker }) {
  const { ref, revealed } = useRevealOnVisible<HTMLElement>();
  return (
    <figure
      ref={ref}
      className={cn(
        "my-10 transition-all duration-700 ease-out motion-reduce:transition-none",
        revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}
    >
      <div className="rounded-2xl overflow-hidden ring-1 ring-[rgba(var(--reader-tint),0.08)] shadow-xl shadow-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.src}
          alt={media.caption || ""}
          className="w-full h-auto object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      {media.caption && (
        <figcaption className="mt-3 text-center text-xs text-[rgba(var(--reader-tint),0.35)] italic">
          {media.caption}
        </figcaption>
      )}
    </figure>
  );
}

function InlineMediaVideo({ media }: { media: InlineMediaMarker }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { ref, revealed } = useRevealOnVisible<HTMLElement>();

  /* Toca só quando visível na dobra (≤1 vídeo rodando por vez na prática),
     pausa ao sair — mudo, loop, sem controles: é ilustração, não player. */
  useEffect(() => {
    const el = videoRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure
      ref={ref}
      className={cn(
        "my-10 transition-all duration-700 ease-out motion-reduce:transition-none",
        revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}
    >
      <div className="relative rounded-2xl overflow-hidden ring-1 ring-[rgba(var(--reader-tint),0.08)] shadow-2xl shadow-black/40">
        <video
          ref={videoRef}
          src={media.src}
          poster={media.poster}
          muted
          loop
          playsInline
          preload="none"
          className="w-full h-auto"
          aria-label={media.caption || "Animação ilustrativa"}
        />
      </div>
      {media.caption && (
        <figcaption className="mt-3 text-center text-xs text-[rgba(var(--reader-tint),0.35)] italic">
          {media.caption}
        </figcaption>
      )}
    </figure>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function estimateReadingMinutes(text: string): number {
  const readable = text.replace(new RegExp("<" + "!--[\\s\\S]*?--" + ">", "g"), "");
  const words = readable.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function getStoredBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fayai_token");
}

function buildClientAuthHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function readLocalProgress(slug: string): {
  completedSections: string[];
  lastHeadingId: string | null;
  progressPercent: number;
} | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(`fayapoint_progress_${slug}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return {
      completedSections: Array.isArray(parsed.completedSections)
        ? parsed.completedSections.filter((value: unknown): value is string => typeof value === "string")
        : [],
      lastHeadingId: typeof parsed.lastHeadingId === "string" ? parsed.lastHeadingId : null,
      progressPercent:
        typeof parsed.progressPercent === "number" ? parsed.progressPercent : 0,
    };
  } catch {
    return null;
  }
}

function writeLocalProgress(
  slug: string,
  data: {
    completedSections?: string[];
    lastHeadingId?: string;
    progressPercent?: number;
  }
) {
  if (typeof window === "undefined") return;

  try {
    const existing = readLocalProgress(slug);
    const updated = {
      completedSections: data.completedSections ?? existing?.completedSections ?? [],
      lastHeadingId: data.lastHeadingId ?? existing?.lastHeadingId ?? null,
      progressPercent: data.progressPercent ?? existing?.progressPercent ?? 0,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`fayapoint_progress_${slug}`, JSON.stringify(updated));
  } catch {
    // ignore local cache write errors
  }
}

function resolveSavedChapterId(chapterId: string, chapters: Chapter[]): string | null {
  if (chapters.some((chapter) => chapter.id === chapterId)) {
    return chapterId;
  }

  const legacyMatch = chapterId.match(/^chapter-(\d+)$/i);
  if (legacyMatch) {
    const index = Number(legacyMatch[1]);
    return (
      chapters[index]?.id ??
      chapters.find(
        (chapter) => index >= chapter.sourceStartIndex && index <= chapter.sourceEndIndex
      )?.id ??
      null
    );
  }

  return null;
}

function normalizeSavedChapterIds(savedIds: string[], chapters: Chapter[]): string[] {
  return Array.from(
    new Set(
      savedIds
        .map((chapterId) => {
          const direct = resolveSavedChapterId(chapterId, chapters);
          if (direct) return direct;
          return chapters.find((chapter) => chapter.sourceIds.includes(chapterId))?.id ?? null;
        })
        .filter((chapterId): chapterId is string => Boolean(chapterId))
    )
  );
}

function normalizeSavedHeadingId(savedId: string | null, chapters: Chapter[]): string | null {
  if (!savedId) return null;
  return (
    resolveSavedChapterId(savedId, chapters) ||
    chapters.find((chapter) => chapter.sourceIds.includes(savedId))?.id ||
    null
  );
}

function splitIntoChapters(markdown: string): Chapter[] {
  if (!markdown?.trim()) return [];

  const lines = markdown.split("\n");
  let h1Count = 0;
  let h2Count = 0;
  for (const line of lines) {
    if (/^# [^#]/.test(line)) h1Count++;
    if (/^## [^#]/.test(line)) h2Count++;
  }

  // Decide split level: if 3+ h1 → split by h1, else split by h2
  let splitRegex: RegExp;
  let headingExtract: RegExp;
  if (h1Count >= 3) {
    splitRegex = /^(?=# [^#])/gm;
    headingExtract = /^# ([^\n]+)/m;
  } else if (h2Count >= 2) {
    splitRegex = /^(?=## [^#])/gm;
    headingExtract = /^## ([^\n]+)/m;
  } else {
      return [
        {
          id: "content",
          title: "Conteúdo",
          content: markdown,
          index: 0,
          readingMinutes: estimateReadingMinutes(markdown),
          sourceIds: ["content"],
          sourceStartIndex: 0,
          sourceEndIndex: 0,
        },
      ];
  }

  const parts = markdown.split(splitRegex);
  const chapters: Chapter[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    const match = part.match(headingExtract);
    if (match) {
      chapters.push({
        id: slugify(match[1].trim()),
        title: match[1].trim(),
        content: part,
        index: chapters.length,
        readingMinutes: estimateReadingMinutes(part),
        sourceIds: [slugify(match[1].trim())],
        sourceStartIndex: chapters.length,
        sourceEndIndex: chapters.length,
      });
    } else if (part.length > 100) {
      const h1Match = part.match(/^# ([^\n]+)/m);
      chapters.push({
        id: "introducao",
        title: h1Match ? h1Match[1].trim() : "Apresentação",
        content: part,
        index: chapters.length,
        readingMinutes: estimateReadingMinutes(part),
        sourceIds: ["introducao"],
        sourceStartIndex: chapters.length,
        sourceEndIndex: chapters.length,
      });
    }
  }

  chapters.forEach((ch, i) => {
    ch.index = i;
  });
  return chapters;
}

/* Leitura 2.0 (item 2.3): seções de ~5-7 min. Capítulo curto fica inteiro;
   capítulo longo é dividido nos limites de "##" em blocos de leitura.
   (Substitui o agrupamento antigo em "Partes" de 12+ min.) */
const TARGET_SECTION_MINUTES = 7;
const MAX_SECTION_MINUTES = 9;

function splitChapterByReadingTime(chapter: Chapter): Chapter[] {
  if (chapter.readingMinutes <= MAX_SECTION_MINUTES) return [chapter];

  const blocks = chapter.content.split(/^(?=## )/m).filter((b) => b.trim());
  if (blocks.length < 3) return [chapter];

  const groups: string[][] = [];
  let current: string[] = [];
  let currentMinutes = 0;

  for (const block of blocks) {
    const minutes = estimateReadingMinutes(block);
    if (current.length && currentMinutes + minutes > TARGET_SECTION_MINUTES) {
      groups.push(current);
      current = [block];
      currentMinutes = minutes;
    } else {
      current.push(block);
      currentMinutes += minutes;
    }
  }
  if (current.length) groups.push(current);

  // Última parte minúscula (<2 min) funde com a anterior
  if (groups.length >= 2) {
    const last = groups[groups.length - 1];
    const lastMinutes = estimateReadingMinutes(last.join("\n"));
    if (lastMinutes < 2) {
      groups[groups.length - 2].push(...groups.pop()!);
    }
  }
  if (groups.length < 2) return [chapter];

  return groups.map((group, i) => {
    const content = group.join("\n").trim();
    return {
      id: i === 0 ? chapter.id : `${chapter.id}--${i + 1}`,
      title: i === 0 ? chapter.title : `${chapter.title} (${i + 1}/${groups.length})`,
      content,
      index: chapter.index,
      readingMinutes: estimateReadingMinutes(content),
      sourceIds: chapter.sourceIds,
      sourceStartIndex: chapter.sourceStartIndex,
      sourceEndIndex: chapter.sourceEndIndex,
    };
  });
}

function buildReaderSections(rawChapters: Chapter[]): Chapter[] {
  return rawChapters
    .flatMap(splitChapterByReadingTime)
    .map((chapter, index) => ({ ...chapter, index }));
}

function sanitizeChapterTitle(title: string): string {
  return title
    .replace(/^Cap[ií]tulo\s+\d+\s*:\s*/i, "")
    .replace(/\s+-\s+Aula\s+\d+\s*:\s*/i, ": ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeCourseMarkdown(markdown: string): string {
  if (!markdown?.trim()) return "";

  const lines = markdown.split("\n");
  const cleanedLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      cleanedLines.push(rawLine);
      continue;
    }

    const lower = line.toLowerCase();

    if (
      lower.includes("canon editorial de fronteira: gpt-5.5 e claude opus 4.7") ||
      lower.includes("quando a aula precisa de uma referência de fronteira para comparar padrão de qualidade") ||
      lower.includes("a base editorial desta atualização foi verificada em fontes oficiais") ||
      lower.includes("isso nos ajuda a evitar conteúdo congelado no tempo") ||
      lower.includes("criada para alinhar a estrutura real de aprendizagem com o catálogo do curso") ||
      lower.includes("manter a divisão por módulos coerente")
    ) {
      continue;
    }

    const duplicateChapterHeader = line.match(/^#\s+cap[ií]tulo\s+\d+:\s+(.+)$/i);
    if (duplicateChapterHeader) {
      cleanedLines.push(`# ${sanitizeChapterTitle(duplicateChapterHeader[1])}`);
      continue;
    }

    const duplicateLessonLine = line.match(/^cap[ií]tulo\s+\d+:\s+(.+)$/i);
    if (duplicateLessonLine) {
      const normalized = sanitizeChapterTitle(duplicateLessonLine[1]);
      const previous = cleanedLines[cleanedLines.length - 1]?.trim().replace(/^#\s+/, "");
      if (previous?.toLowerCase() === normalized.toLowerCase()) {
        continue;
      }
      cleanedLines.push(`## ${normalized}`);
      continue;
    }

    cleanedLines.push(rawLine);
  }

  return cleanedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractChapterSubheadings(markdown: string): ChapterSubheading[] {
  if (!markdown?.trim()) return [];

  const matches = [...markdown.matchAll(/^(##|###)\s+(.+)$/gm)];
  return matches
    .map((match) => {
      const level = match[1] === "##" ? 2 : 3;
      const title = match[2].trim();
      return {
        id: slugify(title),
        title,
        level,
      } as ChapterSubheading;
    })
    .filter((heading, index, list) => {
      return list.findIndex((item) => item.id === heading.id) === index;
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHeadingText(children: unknown): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(getHeadingText).join("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (children && typeof children === "object" && "props" in (children as any)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return getHeadingText((children as any).props?.children);
  }
  return "";
}

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */

export default function CourseReaderPage() {
  const params = useParams();
  const slug = params.slug as string;
  const locale = (params.locale as string) || "pt-BR";
  const router = useRouter();

  /* ─── State ─── */
  const [rawContent, setRawContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentMeta, setContentMeta] = useState<{
    contentChapters: number;
    contentUpdatedAt: string | null;
    lessonContentCoverage: LessonContentCoverage | null;
    editorialVerification: EditorialVerification | null;
  } | null>(null);

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<string>>(new Set());
  const [legacyProgressPercent, setLegacyProgressPercent] = useState<number | null>(null);
  const [progressHydrated, setProgressHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [chapterMediaMap, setChapterMediaMap] = useState<Record<string, ChapterMediaData>>({});

  /* ─── Access gating state ─── */
  const [courseAccess, setCourseAccess] = useState<CourseAccessDto | null>(null);

  /* ─── Refs ─── */
  const initialLoadDone = useRef(false);
  const rawCompletedRef = useRef<string[]>([]);
  const rawCompletedLessonsRef = useRef<string[]>([]);
  const resumeHeadingRef = useRef<string | null>(null);
  const codeThemeRef = useRef(oneDark);

  /* Keep code theme ref in sync with reader theme */
  codeThemeRef.current = settings.theme === "dark" ? oneDark : oneLight;

  /* ─── Derived ─── */
  const sanitizedContent = useMemo(() => sanitizeCourseMarkdown(rawContent), [rawContent]);
  const chapters = useMemo(
    () => buildReaderSections(splitIntoChapters(sanitizedContent)),
    [sanitizedContent]
  );
  const currentChapter = chapters[currentChapterIndex] || null;
  const currentChapterSubheadings = useMemo(
    () => extractChapterSubheadings(currentChapter?.content || ""),
    [currentChapter?.content]
  );
  const chapterSegments = useMemo(
    () => splitContentWithMedia(currentChapter?.content || ""),
    [currentChapter?.content]
  );
  const totalReadingMinutes = useMemo(
    () => chapters.reduce((sum, ch) => sum + ch.readingMinutes, 0),
    [chapters]
  );
  const actualProgressPercent = useMemo(() => {
    if (!chapters.length) return 0;
    return Math.round((completedChapterIds.size / chapters.length) * 100);
  }, [completedChapterIds.size, chapters.length]);
  const usingLegacyProgressFallback = completedChapterIds.size === 0 && (legacyProgressPercent ?? 0) > 0;
  const progressPercent = usingLegacyProgressFallback
    ? legacyProgressPercent ?? 0
    : actualProgressPercent;
  const isPtBr = locale.toLowerCase().startsWith("pt");
  const editorialVerification = useMemo(
    () =>
      normalizeEditorialVerification(contentMeta?.editorialVerification ?? undefined),
    [contentMeta?.editorialVerification]
  );
  const verifiedAtLabel = useMemo(
    () => formatEditorialDate(editorialVerification.verifiedAt, isPtBr ? "pt-BR" : "en-US"),
    [editorialVerification.verifiedAt, isPtBr]
  );
  const contentUpdatedLabel = useMemo(() => {
    if (!contentMeta?.contentUpdatedAt) return null;
    return formatEditorialDate(contentMeta.contentUpdatedAt, isPtBr ? "pt-BR" : "en-US");
  }, [contentMeta?.contentUpdatedAt, isPtBr]);
  const sourceLinks = editorialVerification.sourceLinks?.slice(0, 2) || [];
  const isWideReadingMode = !sidebarOpen;
  const readerContentMaxWidth = isWideReadingMode
    ? Math.min(settings.maxWidth + 320, 1240)
    : settings.maxWidth + 120;
  const compactFloatingNavigation = isWideReadingMode;
  const currentChapterMedia = chapterMediaMap[String(currentChapterIndex)] || null;

  /* ─── Settings persistence ─── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("fayapoint_reader_settings_v2");
      if (raw) {
        const p = JSON.parse(raw) as Partial<ReaderSettings>;
        setSettings((s) => ({
          fontSize: typeof p.fontSize === "number" ? p.fontSize : s.fontSize,
          lineHeight: typeof p.lineHeight === "number" ? p.lineHeight : s.lineHeight,
          maxWidth: typeof p.maxWidth === "number" ? p.maxWidth : s.maxWidth,
          theme: (["dark", "light", "sepia", "high-contrast"] as const).includes(p.theme as ReaderTheme) ? p.theme as ReaderTheme : s.theme,
        }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("fayapoint_reader_settings_v2", JSON.stringify(settings));
  }, [settings]);

  /* ─── Open sidebar on desktop by default ─── */
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  /* ─── Progress Sync ─── */
  const syncProgress = useCallback(
    async (data: {
      completedSections?: string[];
      replaceAllSections?: boolean;
      lastHeadingId?: string;
      totalSections?: number;
      progressPercent?: number;
      isCompleted?: boolean;
    }) => {
      const token = getStoredBearerToken();
      writeLocalProgress(slug, {
        completedSections: data.completedSections,
        lastHeadingId: data.lastHeadingId,
        progressPercent: data.progressPercent,
      });

      try {
        const response = await fetch(`/api/courses/${slug}/progress`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...buildClientAuthHeaders(token),
          },
          credentials: "include",
          body: JSON.stringify(data),
        });

        if (!response.ok && response.status !== 401 && response.status !== 403) {
          console.error("Progress sync failed:", response.status);
        }
      } catch (e) {
        console.error("Progress sync error:", e);
      }
    },
    [slug]
  );

  /* ─── Derived: is current chapter locked? ─── */
  const isChapterLocked = useCallback(
    (chapterIndex: number): boolean => {
      if (!courseAccess) return false;
      if (courseAccess.access === "full") return false;
      if (courseAccess.access === "limited") {
        const chapter = chapters[chapterIndex];
        if (!chapter) return true;
        return chapter.sourceStartIndex >= courseAccess.freeChapters;
      }
      return true;
    },
    [chapters, courseAccess]
  );

  /* ─── Navigation ─── */
  const goToChapter = useCallback(
    (index: number, markPreviousComplete = false) => {
      if (index < 0 || index >= chapters.length) return;

      // Prevent navigation to locked chapters
      if (isChapterLocked(index)) {
        // Scroll to locked chapter to show paywall
        setCurrentChapterIndex(index);
        setSidebarOpen((prev) => (window.innerWidth >= 1024 ? prev : false));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const newCompleted = new Set(completedChapterIds);
      if (markPreviousComplete && currentChapter) {
        newCompleted.add(currentChapter.id);
      }
      setCompletedChapterIds(newCompleted);
      setCurrentChapterIndex(index);
      setSidebarOpen((prev) => (window.innerWidth >= 1024 ? prev : false));
      window.scrollTo({ top: 0, behavior: "smooth" });

      const targetChapter = chapters[index];
      if (targetChapter) {
        const allIds = [...newCompleted];
        syncProgress({
          lastHeadingId: targetChapter.id,
          totalSections: chapters.length,
          completedSections: allIds,
          replaceAllSections: true,
          progressPercent: Math.round((newCompleted.size / chapters.length) * 100),
          isCompleted: newCompleted.size >= chapters.length,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chapters, currentChapter, completedChapterIds, syncProgress, courseAccess]
  );

  const goToNextChapter = useCallback(() => {
    if (currentChapterIndex < chapters.length - 1) {
      goToChapter(currentChapterIndex + 1, true);
    }
  }, [currentChapterIndex, chapters.length, goToChapter]);

  const goToPrevChapter = useCallback(() => {
    if (currentChapterIndex > 0) {
      goToChapter(currentChapterIndex - 1, false);
    }
  }, [currentChapterIndex, goToChapter]);

  const markCurrentComplete = useCallback(() => {
    if (!currentChapter) return;
    const newCompleted = new Set(completedChapterIds);
    newCompleted.add(currentChapter.id);
    setCompletedChapterIds(newCompleted);
    const allIds = [...newCompleted];
    syncProgress({
      completedSections: allIds,
      replaceAllSections: true,
      totalSections: chapters.length,
      progressPercent: Math.round((newCompleted.size / chapters.length) * 100),
      isCompleted: newCompleted.size >= chapters.length,
    });
    toast.success("Capítulo concluído!");
  }, [currentChapter, chapters.length, completedChapterIds, syncProgress]);

  const jumpToHeading = useCallback((headingId: string) => {
    const target = document.getElementById(headingId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollViewportBy = useCallback((direction: "up" | "down") => {
    window.scrollBy({
      top: direction === "down" ? window.innerHeight * 0.72 : window.innerHeight * -0.72,
      behavior: "smooth",
    });
  }, []);

  const toggleChapterComplete = useCallback(
    (chapterId: string) => {
      const newCompleted = new Set(completedChapterIds);
      if (newCompleted.has(chapterId)) {
        newCompleted.delete(chapterId);
      } else {
        newCompleted.add(chapterId);
      }
      setCompletedChapterIds(newCompleted);
      syncProgress({
        completedSections: [...newCompleted],
        replaceAllSections: true,
        totalSections: chapters.length,
        progressPercent: Math.round((newCompleted.size / chapters.length) * 100),
        isCompleted: newCompleted.size >= chapters.length,
      });
    },
    [completedChapterIds, chapters.length, syncProgress]
  );

  /* ─── Fetch Data ─── */
  useEffect(() => {
    const fetchContent = async () => {
      initialLoadDone.current = false;
      rawCompletedRef.current = [];
      rawCompletedLessonsRef.current = [];
      resumeHeadingRef.current = null;
      setProgressHydrated(false);

      const token = getStoredBearerToken();
      const authHeaders: Record<string, string> = token
        ? buildClientAuthHeaders(token)
        : {};

      try {
        // 1. Always check access level first
        const accessRes = await fetch(
          `/api/courses/access?slug=${encodeURIComponent(slug)}`,
          { headers: authHeaders, credentials: "include" }
        );
        const accessData = (await accessRes.json()) as CourseAccessDto;
        setCourseAccess(accessData);

        // 2. If access is "none", redirect to login
        if (accessData.access === "none") {
          const redirect = encodeURIComponent(
            `/${locale}/portal/learn/${slug}`
          );
          router.push(`/${locale}/login?redirect=${redirect}`);
          return;
        }

        // 3. Fetch content — for limited users without token, use the content
        //    API without auth (it will return 401/403). In that case we fetch
        //    content from the public product endpoint or handle gracefully.
        let contentData: CourseContentDto | null = null;

        if (token) {
          const contentRes = await fetch(`/api/courses/${slug}/content`, {
            headers: authHeaders,
            credentials: "include",
          });

          if (contentRes.status === 401) {
            // Token expired — for limited access, continue without content auth
            if (accessData.access === "limited") {
              // Try without auth for free preview
              const publicRes = await fetch(`/api/courses/${slug}/content`);
              if (publicRes.ok) {
                contentData = await publicRes.json();
              }
            } else {
              router.push(`/${locale}/login`);
              return;
            }
          } else if (contentRes.ok) {
            contentData = await contentRes.json();
          } else if (contentRes.status === 403) {
            // Access denied by content API but access API says limited
            // This can happen for free users. For limited, show what we can.
            if (accessData.access === "limited") {
              // Try fetching without strict auth check
              const publicRes = await fetch(`/api/courses/${slug}/content`);
              if (publicRes.ok) {
                contentData = await publicRes.json();
              }
            } else {
              setError("access_denied");
              return;
            }
          } else {
            setError("error");
            return;
          }
        } else {
          // No token — try to fetch content anyway (some APIs may allow it for preview)
          const contentRes = await fetch(`/api/courses/${slug}/content`);
          if (contentRes.ok) {
            contentData = await contentRes.json();
          }
          // If content fetch fails for unauthenticated user, we still show paywall
        }

        if (contentData) {
          setRawContent(contentData.content || "");
          setTitle(contentData.title || "");
          setContentMeta({
            contentChapters: contentData.contentChapters ?? 0,
            contentUpdatedAt: contentData.contentUpdatedAt ?? null,
            lessonContentCoverage: contentData.lessonContentCoverage ?? null,
            editorialVerification: contentData.editorialVerification ?? null,
          });
        }

        // 4. Fetch chapter media from Content Forge (non-blocking)
        fetch(`/api/courses/${slug}/media`)
          .then(res => res.ok ? res.json() : null)
          .then((data: CourseMediaResponse | null) => {
            if (data?.success && data.mediaByIndex) {
              setChapterMediaMap(data.mediaByIndex);
            }
          })
          .catch(() => { /* Media fetch is non-critical */ });

        // 5. Fetch progress from server when possible, then fall back to local cache
        try {
          const progressRes = await fetch(`/api/courses/${slug}/progress`, {
            headers: authHeaders,
            credentials: "include",
          });

          if (progressRes.ok) {
            const progressData = await progressRes.json();
            const p = progressData?.progress as CourseProgressDto | undefined;
            if (p) {
              const serverCompletedSections = Array.isArray(p.completedSections)
                ? p.completedSections
                : [];
              const serverCompletedLessons = Array.isArray(p.completedLessons)
                ? p.completedLessons
                : [];
              const serverLastHeadingId = p.lastHeadingId || null;

              rawCompletedRef.current = serverCompletedSections;
              rawCompletedLessonsRef.current = serverCompletedLessons;
              resumeHeadingRef.current = serverLastHeadingId;
              setLegacyProgressPercent(
                typeof p.progressPercent === "number" && p.progressPercent > 0
                  ? p.progressPercent
                  : null
              );

              writeLocalProgress(slug, {
                completedSections: serverCompletedSections,
                lastHeadingId: serverLastHeadingId ?? undefined,
                progressPercent: typeof p.progressPercent === "number" ? p.progressPercent : 0,
              });
            }
          }
        } catch {
          // Progress fetch failure is non-critical; local fallback below handles it
        }

        const localProgress = readLocalProgress(slug);
        if (localProgress) {
          if (rawCompletedRef.current.length === 0 && localProgress.completedSections.length > 0) {
            rawCompletedRef.current = localProgress.completedSections;
          }
          if (!resumeHeadingRef.current && localProgress.lastHeadingId) {
            resumeHeadingRef.current = localProgress.lastHeadingId;
          }
        }
      } catch (err) {
        console.error(err);
        setError("error");
        toast.error("Erro ao carregar conteudo do curso");
      } finally {
        setProgressHydrated(true);
        setLoading(false);
      }
    };
    if (slug) fetchContent();
  }, [slug, router, locale]);

  /* ─── Restore position after chapters computed ─── */
  useEffect(() => {
    if (!chapters.length || !progressHydrated || initialLoadDone.current) return;
    initialLoadDone.current = true;

    // Normalize saved section IDs so legacy chapter-0 style progress still restores correctly.
    const validSections = normalizeSavedChapterIds(rawCompletedRef.current, chapters);
    const validLegacyLessons =
      validSections.length === 0
        ? normalizeSavedChapterIds(rawCompletedLessonsRef.current, chapters)
        : [];
    const valid = validSections.length > 0 ? validSections : validLegacyLessons;
    setCompletedChapterIds(new Set(valid));
    if (valid.length > 0) {
      setLegacyProgressPercent(null);
    }

    // Restore chapter position
    const savedId = normalizeSavedHeadingId(resumeHeadingRef.current, chapters);
    writeLocalProgress(slug, {
      completedSections: valid,
      lastHeadingId: savedId ?? undefined,
      progressPercent:
        valid.length > 0
          ? chapters.length
            ? Math.round((valid.length / chapters.length) * 100)
            : 0
          : legacyProgressPercent ?? 0,
    });
    if (savedId) {
      const idx = chapters.findIndex((ch) => ch.id === savedId);
      if (idx >= 0) setCurrentChapterIndex(idx);
    }
  }, [chapters, legacyProgressPercent, progressHydrated, slug]);

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if ((e.ctrlKey || e.metaKey) && (e.key === "ArrowRight" || e.key === "ArrowDown")) {
        e.preventDefault();
        goToNextChapter();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "ArrowLeft" || e.key === "ArrowUp")) {
        e.preventDefault();
        goToPrevChapter();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToNextChapter, goToPrevChapter]);

  /* ─── Markdown Components ─── */
  const markdownComponents = useMemo(() => {
    type HeadingProps = ComponentPropsWithoutRef<"h1"> & { node?: unknown; children?: ReactNode };
    type ParagraphProps = ComponentPropsWithoutRef<"p"> & { node?: unknown; children?: ReactNode };
    type ListProps = ComponentPropsWithoutRef<"ul"> & { node?: unknown; children?: ReactNode };
    type OListProps = ComponentPropsWithoutRef<"ol"> & { node?: unknown; children?: ReactNode; start?: number };
    type LiProps = ComponentPropsWithoutRef<"li"> & { node?: unknown; children?: ReactNode; index?: number };
    type AnchorProps = ComponentPropsWithoutRef<"a"> & { node?: unknown; children?: ReactNode };
    type BlockquoteProps = ComponentPropsWithoutRef<"blockquote"> & { node?: unknown; children?: ReactNode };
    type PreProps = ComponentPropsWithoutRef<"pre"> & { node?: unknown; children?: ReactNode };
    type CodeProps = ComponentPropsWithoutRef<"code"> & { node?: unknown; children?: ReactNode; className?: string; inline?: boolean };
    type ImgProps = ComponentPropsWithoutRef<"img"> & { node?: unknown };
    type HrProps = ComponentPropsWithoutRef<"hr"> & { node?: unknown };
    type TableProps = ComponentPropsWithoutRef<"table"> & { node?: unknown; children?: ReactNode };
    type THeadProps = ComponentPropsWithoutRef<"thead"> & { node?: unknown; children?: ReactNode };
    type TBodyProps = ComponentPropsWithoutRef<"tbody"> & { node?: unknown; children?: ReactNode };
    type TrProps = ComponentPropsWithoutRef<"tr"> & { node?: unknown; children?: ReactNode };
    type ThProps = ComponentPropsWithoutRef<"th"> & { node?: unknown; children?: ReactNode };
    type TdProps = ComponentPropsWithoutRef<"td"> & { node?: unknown; children?: ReactNode };

    /* Helper: extract raw text from children for pattern matching */
    const extractText = (children: ReactNode): string => {
      if (typeof children === "string") return children;
      if (Array.isArray(children)) return children.map(extractText).join("");
      if (children && typeof children === "object" && "props" in children) {
        return extractText((children as { props: { children?: ReactNode } }).props.children ?? "");
      }
      return "";
    };

    const createHeading = (level: 1 | 2 | 3) => {
      return ({ children, className: cls, ...props }: HeadingProps) => {
        const text = getHeadingText(children);
        const id = slugify(text);
        const Tag = `h${level}` as "h1" | "h2" | "h3";

        /* Special h2 treatments — sistema de seções da Leitura 2.0 (item 2.4):
           cada seção recorrente ganha ícone + acento de cor consistente */
        if (level === 2) {
          const H2_SECTIONS: {
            test: (t: string) => boolean;
            Icon: typeof Pencil;
            border: string;
            chip: string;
            icon: string;
          }[] = [
            { test: (t) => t.includes("Exercício Prático") || t.includes("Exercicio Pratico"),
              Icon: Pencil, border: "border-amber-400/30", chip: "bg-amber-500/15 border-amber-400/20", icon: "text-amber-400" },
            { test: (t) => t.includes("Resumo do Capítulo") || t.includes("Resumo do Capitulo"),
              Icon: ListChecks, border: "border-emerald-400/30", chip: "bg-emerald-500/15 border-emerald-400/20", icon: "text-emerald-400" },
            { test: (t) => t.includes("Erros Comuns") || t.includes("Erros comuns"),
              Icon: AlertTriangle, border: "border-rose-400/30", chip: "bg-rose-500/15 border-rose-400/20", icon: "text-rose-400" },
            { test: (t) => t.includes("Visão Geral") || t.includes("Visao Geral"),
              Icon: BookOpen, border: "border-violet-400/30", chip: "bg-violet-500/15 border-violet-400/20", icon: "text-violet-400" },
            { test: (t) => t.includes("Conceitos-Chave") || t.includes("Conceitos Chave"),
              Icon: Sparkles, border: "border-fuchsia-400/30", chip: "bg-fuchsia-500/15 border-fuchsia-400/20", icon: "text-fuchsia-400" },
            { test: (t) => t.includes("Fluxo de Execução") || t.includes("Fluxo de Execucao"),
              Icon: Play, border: "border-cyan-400/30", chip: "bg-cyan-500/15 border-cyan-400/20", icon: "text-cyan-400" },
            { test: (t) => t.includes("Cenários Aplicados") || t.includes("Cenarios Aplicados"),
              Icon: MousePointerClick, border: "border-emerald-400/30", chip: "bg-emerald-500/15 border-emerald-400/20", icon: "text-emerald-400" },
            { test: (t) => t.includes("Checklist de Implementação") || t.includes("Checklist de Implementacao"),
              Icon: CheckCircle2, border: "border-emerald-400/30", chip: "bg-emerald-500/15 border-emerald-400/20", icon: "text-emerald-400" },
          ];

          const section = H2_SECTIONS.find((s) => s.test(text));
          if (section) {
            const { Icon } = section;
            return (
              <h2
                id={id}
                className={cn(
                  "scroll-mt-24 flex items-center gap-3 pb-3 mb-2 border-b-2",
                  section.border,
                  cls
                )}
                {...props}
              >
                <span className={cn("flex items-center justify-center w-9 h-9 rounded-xl border shrink-0", section.chip)}>
                  <Icon size={18} className={section.icon} />
                </span>
                <span>{children}</span>
              </h2>
            );
          }
        }

        return (
          <Tag id={id} className={cn("scroll-mt-24", cls)} {...props}>
            {children}
          </Tag>
        );
      };
    };

    return {
      h1: createHeading(1),
      h2: createHeading(2),
      h3: createHeading(3),

      p: ({ className, children, ...props }: ParagraphProps) => {
        // Detect standalone YouTube URLs in paragraphs
        if (children && typeof children === "string") {
          const trimmed = children.trim();
          const ytId = extractYouTubeId(trimmed);
          if (ytId && isYouTubeUrl(trimmed)) {
            return <YouTubeEmbed videoId={ytId} />;
          }
        }
        // Also check for single child that is a link to YouTube
        if (children && typeof children === "object" && !Array.isArray(children)) {
          const child = children as { props?: { href?: string; children?: unknown } };
          if (child?.props?.href) {
            const ytId = extractYouTubeId(child.props.href);
            if (ytId) {
              const linkText = typeof child.props.children === "string" ? child.props.children : undefined;
              return <YouTubeEmbed videoId={ytId} title={linkText !== child.props.href ? linkText : undefined} />;
            }
          }
        }
        return <p className={cn("text-[var(--reader-prose)] leading-[1.85]", className)} {...props}>{children}</p>;
      },

      /* ── Lists ── */
      ul: ({ className, ...props }: ListProps) => (
        <ul className={cn("space-y-2.5 my-5", className)} {...props} />
      ),
      ol: ({ className, children, ...props }: OListProps) => (
        <ol
          className={cn(
            "my-6 pl-0 list-none space-y-3",
            "[counter-reset:step-counter]",
            "[&>li]:flex [&>li]:gap-4 [&>li]:pl-0",
            "[&>li]:before:flex [&>li]:before:items-center [&>li]:before:justify-center",
            "[&>li]:before:shrink-0 [&>li]:before:w-7 [&>li]:before:h-7 [&>li]:before:mt-0.5",
            "[&>li]:before:rounded-lg [&>li]:before:bg-violet-500/15",
            "[&>li]:before:border [&>li]:before:border-violet-400/20",
            "[&>li]:before:text-violet-300 [&>li]:before:text-xs [&>li]:before:font-bold",
            "[&>li]:before:tabular-nums",
            "[&>li]:[counter-increment:step-counter]",
            "[&>li]:before:content-[counter(step-counter)]",
            className
          )}
          {...props}
        >
          {children}
        </ol>
      ),
      li: ({ className, children, ...props }: LiProps) => (
        <li className={cn("text-[var(--reader-prose)] pl-1", className)} {...props}>
          {children}
        </li>
      ),

      a: ({ className, href, children, ...props }: AnchorProps) => {
        // Detect YouTube links and render as embedded video
        if (href) {
          const ytId = extractYouTubeId(href);
          if (ytId) {
            const linkText = typeof children === "string" ? children : undefined;
            return <YouTubeEmbed videoId={ytId} title={linkText !== href ? linkText : undefined} />;
          }
        }
        return (
          <a
            className={cn(
              "text-violet-400 hover:text-violet-300 underline underline-offset-[3px] decoration-violet-400/30 hover:decoration-violet-300/60 transition-all duration-200",
              className
            )}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        );
      },

      /* ── Blockquote callouts (item 2.4): Dica/Dica Pro, Erro comum/Atenção, Exemplo ── */
      blockquote: ({ className, children, ...props }: BlockquoteProps) => {
        const rawText = extractText(children).trimStart();

        const CALLOUTS: {
          test: (t: string) => boolean;
          Icon: typeof Lightbulb;
          wrap: string;
          bar: string;
          chip: string;
          icon: string;
          body: string;
        }[] = [
          { test: (t) => t.startsWith("Dica Pro:") || t.startsWith("Dica:"),
            Icon: Lightbulb,
            wrap: "bg-gradient-to-br from-amber-500/[0.08] via-amber-400/[0.04] to-yellow-500/[0.02] border-amber-400/20 shadow-amber-900/10",
            bar: "bg-gradient-to-r from-amber-400/60 via-yellow-400/40 to-amber-400/20",
            chip: "bg-amber-400/15 border-amber-400/20",
            icon: "text-amber-400",
            body: "text-amber-100/90 [&>p]:text-amber-100/90 [&>p]:leading-[1.75] [&>p:first-child>strong:first-child]:text-amber-300 [&>p:first-child>strong:first-child]:font-semibold" },
          { test: (t) => t.startsWith("Erro comum:") || t.startsWith("Erro Comum:") || t.startsWith("Atenção:") || t.startsWith("Cuidado:"),
            Icon: AlertTriangle,
            wrap: "bg-gradient-to-br from-rose-500/[0.08] via-rose-400/[0.04] to-red-500/[0.02] border-rose-400/20 shadow-rose-900/10",
            bar: "bg-gradient-to-r from-rose-400/60 via-red-400/40 to-rose-400/20",
            chip: "bg-rose-400/15 border-rose-400/20",
            icon: "text-rose-400",
            body: "text-rose-100/90 [&>p]:text-rose-100/90 [&>p]:leading-[1.75] [&>p:first-child>strong:first-child]:text-rose-300 [&>p:first-child>strong:first-child]:font-semibold" },
          { test: (t) => t.startsWith("Exemplo:") || t.startsWith("Na prática:") || t.startsWith("Na pratica:"),
            Icon: MousePointerClick,
            wrap: "bg-gradient-to-br from-cyan-500/[0.08] via-cyan-400/[0.04] to-sky-500/[0.02] border-cyan-400/20 shadow-cyan-900/10",
            bar: "bg-gradient-to-r from-cyan-400/60 via-sky-400/40 to-cyan-400/20",
            chip: "bg-cyan-400/15 border-cyan-400/20",
            icon: "text-cyan-400",
            body: "text-cyan-100/90 [&>p]:text-cyan-100/90 [&>p]:leading-[1.75] [&>p:first-child>strong:first-child]:text-cyan-300 [&>p:first-child>strong:first-child]:font-semibold" },
        ];

        const callout = CALLOUTS.find((c) => c.test(rawText));
        if (callout) {
          const { Icon } = callout;
          return (
            <aside
              className={cn("relative my-8 rounded-2xl overflow-hidden border shadow-lg", callout.wrap, className)}
              {...props}
            >
              <div className={cn("h-[3px]", callout.bar)} />
              <div className="flex gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5">
                <span className={cn("flex items-center justify-center shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl border mt-0.5", callout.chip)}>
                  <Icon size={18} className={cn("sm:w-5 sm:h-5", callout.icon)} />
                </span>
                <div className={cn("flex-1 min-w-0", callout.body)}>
                  {children}
                </div>
              </div>
            </aside>
          );
        }

        return (
          <blockquote
            className={cn(
              "relative my-8 pl-6 pr-5 py-4 rounded-2xl bg-gradient-to-r from-amber-500/[0.06] to-amber-500/[0.02] border-l-[3px] border-violet-400/50",
              className
            )}
            {...props}
          />
        );
      },

      /* ── Code blocks with syntax highlighting + copy button ── */
      pre: ({ children, className: cls }: PreProps) => {
        return (
          <div className={cn("relative group my-7", cls)}>
            {children}
          </div>
        );
      },
      code: ({ className, children, inline, node, ...props }: CodeProps) => {
        const match = /language-(\w+)/.exec(className || "");
        const codeString = String(children).replace(/\n$/, "");

        /* Inline code */
        if (inline || !match) {
          if (!match) {
            /* Check if it looks like a block (has newlines) */
            const hasNewlines = typeof children === "string" && children.includes("\n");
            if (hasNewlines) {
              return (
                <div className="relative group">
                  <CodeCopyButton code={codeString} />
                  <SyntaxHighlighter
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    style={codeThemeRef.current as any}
                    language="text"
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: "1.25rem",
                      borderRadius: "1rem",
                      background: "var(--reader-code)",
                      border: "1px solid rgba(var(--reader-tint),0.06)",
                      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)",
                      fontSize: "0.875rem",
                      lineHeight: "1.7",
                    }}
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              );
            }
            return (
              <code
                className="text-violet-300 bg-violet-500/[0.08] px-1.5 py-0.5 rounded-md font-normal text-[0.88em]"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className="text-violet-300 bg-violet-500/[0.08] px-1.5 py-0.5 rounded-md font-normal text-[0.88em]"
              {...props}
            >
              {children}
            </code>
          );
        }

        /* Block code with syntax highlighting */
        const langLabel = match[1].toUpperCase();
        return (
          <div className="relative group">
            {/* Language badge */}
            <span className="absolute top-3 left-4 text-[10px] font-semibold tracking-wider text-[rgba(var(--reader-tint),0.25)] uppercase select-none z-10">
              {langLabel}
            </span>
            <CodeCopyButton code={codeString} />
            <SyntaxHighlighter
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              style={codeThemeRef.current as any}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: 0,
                paddingTop: "2.25rem",
                paddingBottom: "1.25rem",
                paddingLeft: "1.25rem",
                paddingRight: "1.25rem",
                borderRadius: "1rem",
                background: "var(--reader-code)",
                border: "1px solid rgba(var(--reader-tint),0.06)",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.3)",
                fontSize: "0.875rem",
                lineHeight: "1.7",
              }}
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      },

      img: ({ className, alt, src, ...props }: ImgProps) => {
        const caption = alt && alt !== "image" && alt !== "img" ? alt : null;
        const srcStr = typeof src === "string" ? src : "";
        const optimizedSrc = optimizeCloudinaryUrl(srcStr, 1200);
        const isCloudinary = srcStr.includes("res.cloudinary.com");
        return (
          <figure className="my-8 flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={cn(
                "rounded-2xl ring-1 ring-[rgba(var(--reader-tint),0.06)] max-w-full h-auto shadow-2xl shadow-black/40 hover:shadow-black/50 transition-shadow duration-500",
                "w-full sm:w-auto sm:max-h-[540px] object-contain",
                className
              )}
              alt={alt || ""}
              src={optimizedSrc}
              loading="lazy"
              decoding="async"
              srcSet={isCloudinary ? `${optimizeCloudinaryUrl(srcStr, 640)} 640w, ${optimizeCloudinaryUrl(srcStr, 960)} 960w, ${optimizeCloudinaryUrl(srcStr, 1200)} 1200w` : undefined}
              sizes={isCloudinary ? "(max-width: 640px) 640px, (max-width: 960px) 960px, 1200px" : undefined}
              {...props}
            />
            {caption && (
              <figcaption className="text-xs text-[var(--reader-caption)] italic text-center max-w-[90%] leading-relaxed">
                {caption}
              </figcaption>
            )}
          </figure>
        );
      },

      hr: ({ className, ...props }: HrProps) => (
        <hr
          className={cn(
            "my-14 border-0 h-px bg-gradient-to-r from-transparent via-violet-400/15 to-transparent",
            className
          )}
          {...props}
        />
      ),

      /* ── Table with alternating rows ── */
      table: ({ className, ...props }: TableProps) => (
        <div className="overflow-x-auto my-8 rounded-2xl ring-1 ring-[rgba(var(--reader-tint),0.06)] shadow-lg shadow-black/10">
          <table
            className={cn("min-w-full border-collapse text-left", className)}
            {...props}
          />
        </div>
      ),
      thead: ({ className, ...props }: THeadProps) => (
        <thead
          className={cn(
            "bg-gradient-to-r from-[rgba(var(--reader-tint),0.04)] to-[rgba(var(--reader-tint),0.02)]",
            className
          )}
          {...props}
        />
      ),
      tbody: ({ className, ...props }: TBodyProps) => (
        <tbody
          className={cn(
            "[&>tr:nth-child(even)]:bg-[rgba(var(--reader-tint),0.02)] [&>tr:hover]:bg-[rgba(var(--reader-tint),0.04)] [&>tr]:transition-colors [&>tr]:duration-150",
            className
          )}
          {...props}
        />
      ),
      tr: ({ className, ...props }: TrProps) => (
        <tr className={cn("border-b border-[rgba(var(--reader-tint),0.04)] last:border-b-0", className)} {...props} />
      ),
      th: ({ className, ...props }: ThProps) => (
        <th
          className={cn(
            "border-b border-[rgba(var(--reader-tint),0.08)] px-5 py-3.5 text-[13px] font-semibold text-[var(--reader-fg)]/85 tracking-wide whitespace-nowrap",
            className
          )}
          {...props}
        />
      ),
      td: ({ className, ...props }: TdProps) => (
        <td
          className={cn(
            "px-5 py-3 text-[13px] text-[var(--reader-muted)]",
            className
          )}
          {...props}
        />
      ),

      /* ── Strong / Em ── */
      strong: ({ className, ...props }: ComponentPropsWithoutRef<"strong"> & { node?: unknown }) => (
        <strong className={cn("text-[var(--reader-fg)] font-semibold", className)} {...props} />
      ),
      em: ({ className, ...props }: ComponentPropsWithoutRef<"em"> & { node?: unknown }) => (
        <em className={cn("text-[var(--reader-em)] italic", className)} {...props} />
      ),
    };
  }, []);

  /* ═══════════════════════════════════════════════════════════
     Render: Loading / Error / Access Denied
     ═══════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div data-reader-theme={settings.theme} className="min-h-screen bg-[var(--reader-bg)] text-[var(--reader-fg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
              <BookOpen className="text-violet-400" size={28} />
            </div>
            <div className="absolute -inset-4 rounded-3xl bg-violet-500/10 blur-2xl animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-2.5">
            <p className="text-sm font-medium text-[rgba(var(--reader-tint),0.5)]">Preparando sua leitura</p>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60 animate-bounce [animation-delay:0ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400/40 animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400/60 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error === "access_denied") {
    return (
      <div data-reader-theme={settings.theme} className="min-h-screen bg-[var(--reader-bg)] text-[var(--reader-fg)] flex flex-col items-center justify-center p-6">
        <div className="relative max-w-sm w-full">
          <div className="absolute -inset-px bg-gradient-to-b from-red-500/20 via-transparent to-transparent rounded-[1.6rem] blur-sm" />
          <div className="relative bg-[var(--reader-popover)] border border-[rgba(var(--reader-tint),0.06)] p-10 rounded-3xl text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/15">
              <Lock className="text-red-400/80" size={34} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-3 tracking-tight">Acesso Restrito</h1>
            <p className="text-[var(--reader-fg)]/35 mb-8 text-sm leading-relaxed">
              Você precisa adquirir este curso ou fazer upgrade do seu plano para
              acessar este conteúdo.
            </p>
            <div className="flex flex-col gap-3">
              <Link href={`/${locale}/curso/${slug}`}>
                <Button className="w-full h-11 bg-gradient-to-r from-violet-600 to-amber-600 hover:from-amber-500 hover:to-amber-500 rounded-xl font-medium shadow-lg shadow-violet-600/20">
                  Ver Detalhes do Curso
                </Button>
              </Link>
              <Link href={`/${locale}/portal`}>
                <Button variant="outline" className="w-full h-11 rounded-xl border-[rgba(var(--reader-tint),0.08)] bg-[rgba(var(--reader-tint),0.02)] hover:bg-[rgba(var(--reader-tint),0.05)] text-[rgba(var(--reader-tint),0.5)]">
                  Voltar ao Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-reader-theme={settings.theme} className="min-h-screen bg-[var(--reader-bg)] text-[var(--reader-fg)] flex flex-col items-center justify-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/15">
          <X className="text-red-400/70" size={24} />
        </div>
        <p className="text-[rgba(var(--reader-tint),0.4)] text-sm">Ocorreu um erro ao carregar o curso.</p>
        <Link href={`/${locale}/portal`}>
          <Button variant="outline" className="rounded-xl border-[rgba(var(--reader-tint),0.08)] bg-[rgba(var(--reader-tint),0.02)] hover:bg-[rgba(var(--reader-tint),0.05)] text-[rgba(var(--reader-tint),0.5)]">
            Voltar ao Portal
          </Button>
        </Link>
      </div>
    );
  }

  const isCurrentCompleted = currentChapter
    ? completedChapterIds.has(currentChapter.id)
    : false;
  const allDone = chapters.length > 0 && completedChapterIds.size >= chapters.length;

  /* ═══════════════════════════════════════════════════════════
     Render: Main Layout
     ═══════════════════════════════════════════════════════════ */

  return (
    <div data-reader-theme={settings.theme} className="min-h-screen bg-[var(--reader-bg)] text-[var(--reader-fg)] flex flex-col">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 flex-shrink-0">
        {/* Accent gradient line */}
        <div className="h-[2px] bg-gradient-to-r from-violet-600/80 via-amber-500/60 to-yellow-600/80" />

        <div className="h-14 border-b border-[rgba(var(--reader-tint),0.04)] bg-[var(--reader-bg)]/80 backdrop-blur-2xl backdrop-saturate-150 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(var(--reader-tint),0.03)] hover:bg-[rgba(var(--reader-tint),0.07)] border border-[rgba(var(--reader-tint),0.05)] transition-all duration-200"
          >
            {sidebarOpen ? (
              <X size={15} className="text-[rgba(var(--reader-tint),0.5)]" />
            ) : (
              <Menu size={15} className="text-[rgba(var(--reader-tint),0.5)]" />
            )}
          </button>

          <Link
            href={`/${locale}/portal`}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(var(--reader-tint),0.03)] hover:bg-[rgba(var(--reader-tint),0.07)] border border-[rgba(var(--reader-tint),0.05)] transition-all duration-200"
          >
            <ArrowLeft size={15} className="text-[rgba(var(--reader-tint),0.5)]" />
          </Link>

          <div className="min-w-0 flex-1">
            <span className="truncate text-[13px] font-medium text-[rgba(var(--reader-tint),0.7)] block">{title}</span>
            <div className="flex items-center gap-2.5 mt-1">
              <div className="flex-1 h-[3px] bg-[rgba(var(--reader-tint),0.04)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-violet-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-violet-400/70 tabular-nums">
                {progressPercent}%
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(var(--reader-tint),0.03)] border border-[rgba(var(--reader-tint),0.05)]">
            <span className="text-[10px] font-medium text-[rgba(var(--reader-tint),0.25)]">Cap.</span>
            <span className="text-[10px] font-bold text-violet-400 tabular-nums">
              {currentChapterIndex + 1}/{chapters.length}
            </span>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center justify-center w-9 h-9 rounded-xl bg-[rgba(var(--reader-tint),0.03)] hover:bg-[rgba(var(--reader-tint),0.07)] border border-[rgba(var(--reader-tint),0.05)] transition-all duration-200">
                <Settings2 size={14} className="text-[rgba(var(--reader-tint),0.5)]" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-[var(--reader-popover)] border-[rgba(var(--reader-tint),0.06)] shadow-2xl shadow-black/50 p-0 rounded-2xl">
              <div className="p-4 border-b border-[rgba(var(--reader-tint),0.05)]">
                <span className="text-sm font-semibold text-[rgba(var(--reader-tint),0.9)]">
                  Preferências de Leitura
                </span>
              </div>
              <div className="p-4 space-y-5">
                {/* Theme picker */}
                <div className="space-y-2.5">
                  <span className="text-xs text-[rgba(var(--reader-tint),0.4)]">
                    {isPtBr ? "Tema de leitura" : "Reading theme"}
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {READER_THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSettings((s) => ({ ...s, theme: t.id }))}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-200",
                          settings.theme === t.id
                            ? "border-violet-500/50 bg-violet-500/10 ring-1 ring-violet-500/20"
                            : "border-[rgba(var(--reader-tint),0.06)] hover:border-[rgba(var(--reader-tint),0.12)]"
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded-lg border border-black/10 shadow-sm flex items-center justify-center"
                          style={{ background: t.swatch }}
                        >
                          <span className="text-[9px] font-bold" style={{ color: t.fg }}>Aa</span>
                        </div>
                        <span className="text-[9px] font-medium text-[rgba(var(--reader-tint),0.5)]">
                          {isPtBr ? t.labelPt : t.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <Separator className="bg-[rgba(var(--reader-tint),0.05)]" />
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[rgba(var(--reader-tint),0.4)]">Tamanho da fonte</span>
                    <span className="text-[11px] font-mono text-violet-400/80 bg-violet-500/10 px-2 py-0.5 rounded-md">
                      {settings.fontSize}px
                    </span>
                  </div>
                  <Slider
                    min={14}
                    max={22}
                    step={1}
                    value={[settings.fontSize]}
                    onValueChange={(v) =>
                      setSettings((s) => ({ ...s, fontSize: v[0] }))
                    }
                  />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[rgba(var(--reader-tint),0.4)]">Espaçamento entre linhas</span>
                    <span className="text-[11px] font-mono text-violet-400/80 bg-violet-500/10 px-2 py-0.5 rounded-md">
                      {settings.lineHeight.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    min={1.4}
                    max={2.2}
                    step={0.1}
                    value={[settings.lineHeight]}
                    onValueChange={(v) =>
                      setSettings((s) => ({ ...s, lineHeight: v[0] }))
                    }
                  />
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[rgba(var(--reader-tint),0.4)]">Largura do texto</span>
                    <span className="text-[11px] font-mono text-violet-400/80 bg-violet-500/10 px-2 py-0.5 rounded-md">
                      {settings.maxWidth}px
                    </span>
                  </div>
                  <Slider
                    min={600}
                    max={1000}
                    step={20}
                    value={[settings.maxWidth]}
                    onValueChange={(v) =>
                      setSettings((s) => ({ ...s, maxWidth: v[0] }))
                    }
                  />
                </div>
                <Separator className="bg-[rgba(var(--reader-tint),0.05)]" />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent border-[rgba(var(--reader-tint),0.06)] hover:bg-[rgba(var(--reader-tint),0.03)] text-[rgba(var(--reader-tint),0.4)] text-xs rounded-xl"
                  onClick={() => setSettings(DEFAULT_SETTINGS)}
                >
                  Resetar Padrões
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <div className="border-b border-[rgba(var(--reader-tint),0.04)] bg-[var(--reader-surface-alt)]/90 backdrop-blur-xl min-w-0 overflow-hidden">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 shrink-0">
              <Award size={16} className="text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-semibold text-[rgba(var(--reader-tint),0.9)]">
                {isPtBr ? "Conteúdo verificado editorialmente" : "Editorially verified course content"}
              </p>
              <p className="text-xs text-[rgba(var(--reader-tint),0.45)]">
                {isPtBr
                  ? `Revisado em ${verifiedAtLabel} com canon ${editorialVerification.canonModels.join(" / ")}.`
                  : `Reviewed on ${verifiedAtLabel} using the ${editorialVerification.canonModels.join(" / ")} canon.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:items-end">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[rgba(var(--reader-tint),0.08)] bg-[rgba(var(--reader-tint),0.03)] px-3 py-1 text-[11px] text-[rgba(var(--reader-tint),0.65)]">
                {contentMeta?.lessonContentCoverage
                  ? isPtBr
                    ? `${contentMeta.lessonContentCoverage.coveragePercent}% das aulas com conteúdo real`
                    : `${contentMeta.lessonContentCoverage.coveragePercent}% of lessons have real content`
                  : isPtBr
                    ? "Cobertura editorial em atualização"
                    : "Editorial coverage updating"}
              </span>
              <span className="rounded-full border border-[rgba(var(--reader-tint),0.08)] bg-[rgba(var(--reader-tint),0.03)] px-3 py-1 text-[11px] text-[rgba(var(--reader-tint),0.65)]">
                {isPtBr
                  ? `${chapters.length} partes de leitura`
                  : `${chapters.length} reading sections`}
              </span>
              {contentUpdatedLabel && (
                <span className="rounded-full border border-[rgba(var(--reader-tint),0.08)] bg-[rgba(var(--reader-tint),0.03)] px-3 py-1 text-[11px] text-[rgba(var(--reader-tint),0.65)]">
                  {isPtBr ? `Atualizado ${contentUpdatedLabel}` : `Updated ${contentUpdatedLabel}`}
                </span>
              )}
            </div>

            {sourceLinks.length > 0 && (
              <div className="flex flex-wrap gap-3 text-[11px] text-[rgba(var(--reader-tint),0.45)]">
                {sourceLinks.map((link, index) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-[rgba(var(--reader-tint),0.1)] underline-offset-4 transition-colors hover:text-violet-300"
                  >
                    {isPtBr ? `Fonte oficial ${index + 1}` : `Official source ${index + 1}`}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BODY ═══ */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ─── SIDEBAR ─── */}
        <aside
          className={cn(
            "fixed lg:relative top-[calc(2px+3.5rem)] lg:top-0 left-0 z-30 lg:z-auto h-[calc(100vh-3.5rem-2px)] w-[280px] flex flex-col overflow-hidden transition-[transform,width,opacity] duration-300 ease-out",
            "bg-[var(--reader-surface)]/95 lg:bg-[var(--reader-surface)] backdrop-blur-xl lg:backdrop-blur-none",
            sidebarOpen
              ? "translate-x-0 border-r border-[rgba(var(--reader-tint),0.04)] lg:w-[280px] lg:opacity-100"
              : "-translate-x-full border-r border-[rgba(var(--reader-tint),0.04)] lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none lg:border-r-0"
          )}
        >
          {/* Sidebar header */}
          <div className="p-5 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[rgba(var(--reader-tint),0.3)]">Conteúdo</h2>
              <span className="text-xs font-bold text-violet-400 tabular-nums">{progressPercent}%</span>
            </div>
            <div className="relative h-[5px] bg-[rgba(var(--reader-tint),0.04)] rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-[var(--reader-fg)]/20">
              {usingLegacyProgressFallback
                ? `Progresso legado salvo: ${progressPercent}% · ~${totalReadingMinutes} min`
                : `${completedChapterIds.size} de ${chapters.length} concluídos · ~${totalReadingMinutes} min`}
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[rgba(var(--reader-tint),0.06)] to-transparent mx-3" />

          {/* Chapter list */}
          <div className="flex-1 overflow-y-auto py-3 px-3">
            {chapters.map((chapter, i) => {
              const isCurrent = i === currentChapterIndex;
              const isDone = completedChapterIds.has(chapter.id);
              const locked = isChapterLocked(i);
              return (
                <button
                  key={chapter.id}
                  onClick={() => goToChapter(i)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 group relative mb-0.5",
                    isCurrent
                      ? "bg-violet-500/[0.08]"
                      : locked
                      ? "opacity-60 hover:bg-[rgba(var(--reader-tint),0.02)]"
                      : "hover:bg-[rgba(var(--reader-tint),0.03)]"
                  )}
                >
                  {/* Active accent bar */}
                  {isCurrent && !locked && (
                    <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-violet-400" />
                  )}

                  {/* Number badge / Status */}
                  <span
                    className="flex-shrink-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!locked) toggleChapterComplete(chapter.id);
                    }}
                  >
                    {locked ? (
                      <div className="w-8 h-8 rounded-[10px] bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                        <Lock size={13} className="text-amber-400/60" />
                      </div>
                    ) : isDone ? (
                      <div className="w-8 h-8 rounded-[10px] bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-8 h-8 rounded-[10px] bg-violet-500/20 border border-violet-400/40 flex items-center justify-center">
                        <span className="text-xs font-bold text-violet-400 tabular-nums">{i + 1}</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-[10px] bg-[rgba(var(--reader-tint),0.02)] border border-[rgba(var(--reader-tint),0.06)] flex items-center justify-center group-hover:bg-[rgba(var(--reader-tint),0.04)] group-hover:border-[rgba(var(--reader-tint),0.1)] transition-all duration-200">
                        <span className="text-xs font-medium text-[var(--reader-fg)]/20 group-hover:text-[var(--reader-fg)]/35 tabular-nums transition-colors">{i + 1}</span>
                      </div>
                    )}
                  </span>

                  {/* Title + meta */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[13px] leading-snug line-clamp-2 transition-colors duration-200",
                        locked
                          ? "text-[rgba(var(--reader-tint),0.25)]"
                          : isCurrent
                          ? "text-[var(--reader-fg)] font-semibold"
                          : isDone
                          ? "text-[rgba(var(--reader-tint),0.3)]"
                          : "text-[rgba(var(--reader-tint),0.5)] group-hover:text-[rgba(var(--reader-tint),0.7)]"
                      )}
                    >
                      {chapter.title}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] mt-1 block transition-colors",
                        locked
                          ? "text-[var(--reader-fg)]/8"
                          : isCurrent
                          ? "text-violet-400/50"
                          : "text-[var(--reader-fg)]/12"
                      )}
                    >
                      {locked ? "Premium" : `${chapter.readingMinutes} min`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Keyboard hints */}
          <div className="hidden lg:flex items-center justify-center p-3.5 border-t border-[rgba(var(--reader-tint),0.04)] flex-shrink-0">
            <p className="text-[10px] text-[var(--reader-fg)]/15">Ctrl + ← → navegar</p>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main
          className={cn(
            "flex-1 min-w-0 overflow-y-auto transition-all duration-300"
          )}
        >
          {/* ─── Locked chapter → show paywall ─── */}
          {currentChapter && isChapterLocked(currentChapterIndex) ? (
            <div className="min-h-full flex flex-col">
              {/* Chapter header (dimmed) */}
              <div className="flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/[0.04] via-transparent to-amber-600/[0.02]" />
                <div
                  className="relative mx-auto px-4 sm:px-10 lg:px-14 py-8 sm:py-14"
                  style={{ maxWidth: readerContentMaxWidth }}
                >
                  <div className="flex items-baseline gap-3 sm:gap-5 mb-6">
                    <span className="text-4xl sm:text-6xl md:text-7xl font-black bg-gradient-to-b from-[rgba(var(--reader-tint),0.1)] to-[rgba(var(--reader-tint),0.02)] bg-clip-text text-transparent select-none leading-none tabular-nums shrink-0">
                      {String(currentChapterIndex + 1).padStart(2, "0")}
                    </span>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400/50">
                        Capitulo {currentChapterIndex + 1} de {chapters.length}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-400/60">
                        <Lock size={10} className="shrink-0" />
                        Conteudo Premium
                      </span>
                    </div>
                  </div>
                  <h1 className="text-xl sm:text-3xl lg:text-[2.25rem] font-bold text-[rgba(var(--reader-tint),0.4)] tracking-tight leading-[1.2]">
                    {currentChapter.title}
                  </h1>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-[rgba(var(--reader-tint),0.06)] to-transparent" />
              </div>

              {/* Paywall */}
              <div className="flex-1 flex items-start justify-center p-4 sm:p-10">
                <div className="w-full" style={{ maxWidth: readerContentMaxWidth }}>
                  <CoursePaywall
                    courseName={courseAccess?.courseTitle || title}
                    coursePrice={courseAccess?.coursePrice ?? null}
                    courseSlug={slug}
                    plan={courseAccess?.plan ?? null}
                    locale={locale}
                    previewText={currentChapter.content.slice(0, 200)}
                  />
                </div>
              </div>
            </div>
          ) : currentChapter ? (
            <div className="min-h-full flex flex-col">
              {/* Chapter header */}
              <div className="flex-shrink-0 relative overflow-hidden">
                {/* Gradient mesh background */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/[0.04] via-transparent to-amber-600/[0.02]" />
                <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/[0.03] rounded-full blur-[80px]" />

                <div
                  className="relative mx-auto px-4 sm:px-10 lg:px-14 py-8 sm:py-14"
                  style={{ maxWidth: readerContentMaxWidth }}
                >
                  {/* Decorative chapter number */}
                  <div className="flex items-baseline gap-3 sm:gap-5 mb-6">
                    <span className="text-4xl sm:text-6xl md:text-7xl font-black bg-gradient-to-b from-violet-400/20 to-violet-400/[0.03] bg-clip-text text-transparent select-none leading-none tabular-nums shrink-0">
                      {String(currentChapterIndex + 1).padStart(2, "0")}
                    </span>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400/40">
                        Capitulo {currentChapterIndex + 1} de {chapters.length}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[var(--reader-fg)]/18 flex items-center gap-1">
                          <Clock size={10} />
                          {currentChapter.readingMinutes} min
                        </span>
                        {isCurrentCompleted && (
                          <span className="text-[11px] font-medium text-emerald-400/70 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            Concluido
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <h1 className="text-xl sm:text-3xl lg:text-[2.25rem] font-bold text-[var(--reader-fg)]/95 tracking-tight leading-[1.2]">
                    {currentChapter.title}
                  </h1>
                </div>

                {/* Separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-[rgba(var(--reader-tint),0.06)] to-transparent" />
              </div>

              {/* Chapter content */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <div
                  className="mx-auto px-4 sm:px-10 lg:px-14 py-8 sm:py-14"
                  style={{ maxWidth: readerContentMaxWidth }}
                >
                  {/* Content Forge media (video, hero image, audio, gallery) */}
                  {currentChapterMedia && (
                    <ChapterMediaHeader
                      media={currentChapterMedia}
                      chapterTitle={currentChapter.title}
                    />
                  )}

                  <div
                    style={{
                      fontSize: `${settings.fontSize}px`,
                      lineHeight: String(settings.lineHeight),
                    }}
                    className={cn(
                      "max-w-none",
                      "prose prose-invert",
                      "prose-headings:font-bold prose-headings:tracking-tight",
                      "prose-h1:text-[1.65em] prose-h1:text-[var(--reader-fg)]/95 prose-h1:mb-6 prose-h1:mt-0 prose-h1:leading-tight",
                      "prose-h2:text-[1.35em] prose-h2:text-[rgba(var(--reader-tint),0.9)] prose-h2:mt-14 prose-h2:mb-5 prose-h2:leading-snug",
                      "prose-h3:text-[1.15em] prose-h3:text-[var(--reader-fg)]/85 prose-h3:mt-10 prose-h3:mb-4",
                      "prose-p:text-[var(--reader-prose)] prose-p:leading-[1.85] prose-p:mb-5",
                      "prose-strong:text-[var(--reader-fg)]/95 prose-strong:font-semibold",
                      "prose-em:text-[var(--reader-em)]",
                      "prose-a:text-violet-400 prose-a:underline prose-a:underline-offset-[3px] prose-a:decoration-violet-400/30 hover:prose-a:text-violet-300 hover:prose-a:decoration-violet-300/60",
                      "prose-li:text-[var(--reader-prose)] prose-li:marker:text-violet-400/40",
                      "prose-ul:my-5 prose-ol:my-5",
                      "prose-code:text-violet-300 prose-code:bg-violet-500/[0.08] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-normal prose-code:text-[0.88em] prose-code:before:content-[''] prose-code:after:content-['']",
                      "prose-pre:bg-[var(--reader-code)] prose-pre:ring-1 prose-pre:ring-[rgba(var(--reader-tint),0.05)] prose-pre:rounded-2xl prose-pre:shadow-lg prose-pre:shadow-black/20",
                      "prose-blockquote:border-l-[3px] prose-blockquote:border-violet-400/40 prose-blockquote:bg-gradient-to-r prose-blockquote:from-amber-500/[0.05] prose-blockquote:to-transparent prose-blockquote:rounded-r-2xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:text-[var(--reader-muted)]",
                      "prose-hr:border-0",
                      "prose-img:rounded-2xl prose-img:ring-1 prose-img:ring-[rgba(var(--reader-tint),0.06)] prose-img:shadow-xl prose-img:shadow-black/30 prose-img:mx-auto",
                      "prose-table:rounded-2xl prose-table:overflow-hidden prose-table:ring-1 prose-table:ring-[rgba(var(--reader-tint),0.06)]",
                      "prose-th:bg-[rgba(var(--reader-tint),0.03)] prose-th:text-[rgba(var(--reader-tint),0.8)] prose-th:font-semibold prose-th:px-5 prose-th:py-3.5 prose-th:text-sm",
                      "prose-td:px-5 prose-td:py-3 prose-td:text-sm prose-td:border-t prose-td:border-[rgba(var(--reader-tint),0.04)]"
                    )}
                  >
                    {chapterSegments.map((segment) =>
                      segment.kind === "media" ? (
                        segment.media.type === "video" ? (
                          <InlineMediaVideo key={segment.key} media={segment.media} />
                        ) : (
                          <InlineMediaFigure key={segment.key} media={segment.media} />
                        )
                      ) : (
                        <ReactMarkdown
                          key={segment.key}
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {segment.content}
                        </ReactMarkdown>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Floating navigation widget — higher on mobile to clear inline nav */}
              <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3 lg:bottom-6 lg:right-6">
                {compactFloatingNavigation ? (
                  <div className="hidden lg:block w-[220px] rounded-[24px] border border-[rgba(var(--reader-tint),0.08)] bg-[var(--reader-float)]/84 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.42)] overflow-hidden">
                    <div className="px-3.5 py-3 border-b border-[rgba(var(--reader-tint),0.06)] bg-gradient-to-r from-amber-500/[0.14] via-fuchsia-500/[0.06] to-cyan-500/[0.08]">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl border border-[rgba(var(--reader-tint),0.08)] bg-[rgba(var(--reader-tint),0.04)] flex items-center justify-center flex-shrink-0">
                          <PanelRightOpen size={16} className="text-violet-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-[rgba(var(--reader-tint),0.45)]">
                            Modo leitura
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[rgba(var(--reader-tint),0.9)] line-clamp-2">
                            {currentChapter.title}
                          </p>
                        </div>
                        <button
                          onClick={() => setSidebarOpen(true)}
                          className="w-9 h-9 rounded-2xl border border-[rgba(var(--reader-tint),0.08)] bg-[rgba(var(--reader-tint),0.04)] flex items-center justify-center text-[rgba(var(--reader-tint),0.65)] hover:text-[var(--reader-fg)] hover:bg-[rgba(var(--reader-tint),0.07)] transition-all"
                          aria-label="Mostrar sumário"
                        >
                          <Menu size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                          className="flex h-11 items-center justify-center rounded-2xl border border-[rgba(var(--reader-tint),0.07)] bg-[rgba(var(--reader-tint),0.03)] text-[var(--reader-fg)]/75 hover:bg-[rgba(var(--reader-tint),0.06)] hover:text-[var(--reader-fg)] transition-all"
                          aria-label="Ir para o topo"
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          onClick={() => scrollViewportBy("up")}
                          className="flex h-11 items-center justify-center rounded-2xl border border-[rgba(var(--reader-tint),0.07)] bg-[rgba(var(--reader-tint),0.03)] text-[var(--reader-fg)]/75 hover:bg-[rgba(var(--reader-tint),0.06)] hover:text-[var(--reader-fg)] transition-all"
                          aria-label="Subir página"
                        >
                          <ArrowDown size={15} className="rotate-180" />
                        </button>
                        <button
                          onClick={() => scrollViewportBy("down")}
                          className="flex h-11 items-center justify-center rounded-2xl border border-[rgba(var(--reader-tint),0.07)] bg-[rgba(var(--reader-tint),0.03)] text-[var(--reader-fg)]/75 hover:bg-[rgba(var(--reader-tint),0.06)] hover:text-[var(--reader-fg)] transition-all"
                          aria-label="Descer página"
                        >
                          <ArrowDown size={15} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={goToPrevChapter}
                          disabled={currentChapterIndex === 0}
                          className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-[rgba(var(--reader-tint),0.07)] bg-[rgba(var(--reader-tint),0.03)] text-xs font-medium text-[var(--reader-fg)]/75 hover:bg-[rgba(var(--reader-tint),0.06)] hover:text-[var(--reader-fg)] transition-all disabled:opacity-35"
                        >
                          <ChevronLeft size={14} />
                          Anterior
                        </button>
                        <button
                          onClick={goToNextChapter}
                          disabled={currentChapterIndex >= chapters.length - 1}
                          className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-violet-400/18 bg-violet-500/[0.08] text-xs font-medium text-violet-100 hover:bg-violet-500/[0.14] transition-all disabled:opacity-35"
                        >
                          Próximo
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex w-full items-center justify-between rounded-2xl border border-[rgba(var(--reader-tint),0.07)] bg-[rgba(var(--reader-tint),0.03)] px-3 py-2.5 text-left transition-all hover:bg-[rgba(var(--reader-tint),0.06)]">
                            <div className="flex items-center gap-2">
                              <MousePointerClick size={14} className="text-cyan-300" />
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--reader-fg)]/35">
                                  Seções
                                </p>
                                <p className="mt-1 text-xs text-[var(--reader-fg)]/72">
                                  {currentChapterSubheadings.length > 0
                                    ? `${currentChapterSubheadings.length} pontos neste capítulo`
                                    : "Capítulo linear"}
                                </p>
                              </div>
                            </div>
                            <ChevronDown size={14} className="text-[rgba(var(--reader-tint),0.4)]" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          sideOffset={10}
                          className="w-[280px] rounded-2xl border border-[rgba(var(--reader-tint),0.08)] bg-[var(--reader-float)]/96 p-2 text-[var(--reader-fg)] shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
                        >
                          <div className="max-h-[280px] overflow-y-auto pr-1">
                            {currentChapterSubheadings.length > 0 ? (
                              <div className="space-y-1">
                                {currentChapterSubheadings.map((heading) => (
                                  <button
                                    key={heading.id}
                                    onClick={() => jumpToHeading(heading.id)}
                                    className={cn(
                                      "w-full rounded-xl px-3 py-2 text-left transition-all hover:bg-violet-500/[0.10]",
                                      heading.level === 3 ? "ml-3 w-[calc(100%-0.75rem)]" : ""
                                    )}
                                  >
                                    <span className="block text-xs font-medium text-[var(--reader-fg)]/72 line-clamp-2">
                                      {heading.title}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="px-3 py-2 text-xs text-[var(--reader-fg)]/35">
                                Este capítulo está mais linear. Use os atalhos acima para continuar a leitura.
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ) : (
                  <div className="hidden lg:block w-[280px] rounded-[26px] border border-[rgba(var(--reader-tint),0.08)] bg-[var(--reader-float)]/86 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[rgba(var(--reader-tint),0.06)] bg-gradient-to-r from-amber-500/[0.16] via-fuchsia-500/[0.07] to-cyan-500/[0.08]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.22em] text-[rgba(var(--reader-tint),0.45)]">Navegação rápida</p>
                          <p className="text-sm font-semibold text-[rgba(var(--reader-tint),0.9)] truncate">
                            {currentChapter.title}
                          </p>
                        </div>
                        <button
                          onClick={() => setSidebarOpen(false)}
                          className="w-10 h-10 rounded-2xl border border-[rgba(var(--reader-tint),0.08)] bg-[rgba(var(--reader-tint),0.04)] flex items-center justify-center text-violet-300 hover:bg-[rgba(var(--reader-tint),0.08)] hover:text-[var(--reader-fg)] transition-all"
                          aria-label="Recolher sumário"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-[rgba(var(--reader-tint),0.07)] bg-[rgba(var(--reader-tint),0.03)] px-3 py-2.5 text-xs font-medium text-[var(--reader-fg)]/75 hover:bg-[rgba(var(--reader-tint),0.06)] hover:text-[var(--reader-fg)] transition-all"
                        >
                          <ArrowUp size={14} />
                          Topo
                        </button>
                        <button
                          onClick={() => scrollViewportBy("down")}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-[rgba(var(--reader-tint),0.07)] bg-[rgba(var(--reader-tint),0.03)] px-3 py-2.5 text-xs font-medium text-[var(--reader-fg)]/75 hover:bg-[rgba(var(--reader-tint),0.06)] hover:text-[var(--reader-fg)] transition-all"
                        >
                          <ChevronDown size={14} />
                          Próxima dobra
                        </button>
                        <button
                          onClick={() => scrollViewportBy("up")}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-[rgba(var(--reader-tint),0.07)] bg-[rgba(var(--reader-tint),0.03)] px-3 py-2.5 text-xs font-medium text-[var(--reader-fg)]/75 hover:bg-[rgba(var(--reader-tint),0.06)] hover:text-[var(--reader-fg)] transition-all"
                        >
                          <ArrowDown size={14} className="rotate-180" />
                          Página acima
                        </button>
                        <button
                          onClick={() => scrollViewportBy("down")}
                          className="flex items-center justify-center gap-2 rounded-2xl border border-[rgba(var(--reader-tint),0.07)] bg-[rgba(var(--reader-tint),0.03)] px-3 py-2.5 text-xs font-medium text-[var(--reader-fg)]/75 hover:bg-[rgba(var(--reader-tint),0.06)] hover:text-[var(--reader-fg)] transition-all"
                        >
                          <ArrowDown size={14} />
                          Página abaixo
                        </button>
                      </div>

                      <div className="mt-3 rounded-2xl border border-[rgba(var(--reader-tint),0.06)] bg-[rgba(var(--reader-tint),0.025)] p-2">
                        <div className="flex items-center gap-2 px-2 pb-2">
                          <MousePointerClick size={14} className="text-cyan-300" />
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--reader-fg)]/35">
                            Subtítulos
                          </p>
                        </div>
                        <div className="max-h-[240px] overflow-y-auto pr-1">
                          {currentChapterSubheadings.length > 0 ? (
                            <div className="space-y-1">
                              {currentChapterSubheadings.map((heading) => (
                                <button
                                  key={heading.id}
                                  onClick={() => jumpToHeading(heading.id)}
                                  className={cn(
                                    "w-full rounded-xl px-3 py-2 text-left transition-all",
                                    heading.level === 3 ? "ml-3 w-[calc(100%-0.75rem)]" : "",
                                    "hover:bg-violet-500/[0.10]"
                                  )}
                                >
                                  <span className="block text-xs font-medium text-[var(--reader-fg)]/72 line-clamp-2">
                                    {heading.title}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="px-3 py-2 text-xs text-[var(--reader-fg)]/35">
                              Este capítulo está mais linear. Use os botões para continuar a leitura.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile: compact horizontal bar with all controls */}
                <div className="flex lg:hidden items-center gap-1.5 p-1.5 rounded-2xl border border-[rgba(var(--reader-tint),0.08)] bg-[var(--reader-float)]/90 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="w-10 h-10 rounded-xl bg-[rgba(var(--reader-tint),0.05)] flex items-center justify-center text-[rgba(var(--reader-tint),0.6)] hover:text-[var(--reader-fg)] hover:bg-[rgba(var(--reader-tint),0.1)] transition-all"
                    aria-label="Voltar ao topo"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => scrollViewportBy("down")}
                    className="w-10 h-10 rounded-xl bg-[rgba(var(--reader-tint),0.05)] flex items-center justify-center text-[rgba(var(--reader-tint),0.6)] hover:text-[var(--reader-fg)] hover:bg-[rgba(var(--reader-tint),0.1)] transition-all"
                    aria-label="Descer página"
                  >
                    <ArrowDown size={16} />
                  </button>
                  <div className="w-px h-6 bg-[rgba(var(--reader-tint),0.1)]" />
                  <button
                    onClick={goToPrevChapter}
                    disabled={currentChapterIndex === 0}
                    className="w-10 h-10 rounded-xl bg-[rgba(var(--reader-tint),0.05)] flex items-center justify-center text-[rgba(var(--reader-tint),0.6)] hover:text-[var(--reader-fg)] hover:bg-[rgba(var(--reader-tint),0.1)] transition-all disabled:opacity-30"
                    aria-label="Capítulo anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={goToNextChapter}
                    disabled={currentChapterIndex >= chapters.length - 1}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-violet-500/15 border border-violet-400/15 flex items-center justify-center text-[var(--reader-fg)] hover:from-amber-500/30 hover:to-violet-500/25 transition-all disabled:opacity-30"
                    aria-label="Próximo capítulo"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Desktop: individual floating buttons */}
                <div className="hidden lg:flex items-center justify-end gap-2">
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="w-12 h-12 rounded-2xl border border-[rgba(var(--reader-tint),0.08)] bg-[var(--reader-float)]/88 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex items-center justify-center text-[rgba(var(--reader-tint),0.8)] hover:text-[var(--reader-fg)] hover:bg-[rgba(var(--reader-tint),0.08)] transition-all"
                    aria-label="Voltar ao topo"
                  >
                    <ArrowUp size={18} />
                  </button>
                  <button
                    onClick={() => scrollViewportBy("down")}
                    className="w-12 h-12 rounded-2xl border border-[rgba(var(--reader-tint),0.08)] bg-[var(--reader-float)]/88 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex items-center justify-center text-[rgba(var(--reader-tint),0.8)] hover:text-[var(--reader-fg)] hover:bg-[rgba(var(--reader-tint),0.08)] transition-all"
                    aria-label="Descer página"
                  >
                    <ArrowDown size={18} />
                  </button>
                  <button
                    onClick={goToPrevChapter}
                    disabled={currentChapterIndex === 0}
                    className="w-12 h-12 rounded-2xl border border-[rgba(var(--reader-tint),0.08)] bg-[var(--reader-float)]/88 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex items-center justify-center text-[rgba(var(--reader-tint),0.8)] hover:text-[var(--reader-fg)] hover:bg-[rgba(var(--reader-tint),0.08)] transition-all disabled:opacity-35 disabled:hover:bg-[var(--reader-float)]/88"
                    aria-label="Capítulo anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={goToNextChapter}
                    disabled={currentChapterIndex >= chapters.length - 1}
                    className="w-12 h-12 rounded-2xl border border-violet-400/20 bg-gradient-to-br from-amber-500/[0.22] to-fuchsia-500/[0.16] backdrop-blur-2xl shadow-[0_12px_40px_rgba(92,55,222,0.28)] flex items-center justify-center text-[var(--reader-fg)] hover:from-amber-500/[0.28] hover:to-fuchsia-500/[0.22] transition-all disabled:opacity-35 disabled:shadow-none"
                    aria-label="Próximo capítulo"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* ─── Bottom Navigation ─── */}
              <div className="flex-shrink-0">
                <div className="h-px bg-gradient-to-r from-transparent via-[rgba(var(--reader-tint),0.06)] to-transparent" />

                <div
                  className="mx-auto px-4 sm:px-10 lg:px-14 py-8 pb-24 lg:pb-8"
                  style={{ maxWidth: readerContentMaxWidth }}
                >
                  {/* Mark as complete button */}
                  {!isCurrentCompleted && (
                    <button
                      onClick={markCurrentComplete}
                      className="w-full mb-6 py-3.5 rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06] hover:border-emerald-500/30 text-emerald-400/60 hover:text-emerald-400 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2.5"
                    >
                      <CheckCircle2 size={17} />
                      Marcar capítulo como concluído
                    </button>
                  )}

                  {/* Congratulations + Certificate CTA */}
                  {allDone && (
                    <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-500/[0.06] via-amber-500/[0.04] to-violet-500/[0.06] border border-emerald-500/15 overflow-hidden min-w-0">
                      <div className="py-4 px-4 sm:py-5 sm:px-6 flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <Trophy size={20} className="text-yellow-400 sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--reader-fg)]">
                            Parabéns! Curso concluído!
                          </p>
                          <p className="text-xs text-[var(--reader-fg)]/35 mt-0.5">
                            Você completou todos os {chapters.length} capítulos.
                          </p>
                        </div>
                      </div>
                      <div className="px-4 pb-4 sm:px-6 sm:pb-5">
                        <button
                          onClick={() => setShowQuizModal(true)}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-[var(--reader-fg)] text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-amber-600/20"
                        >
                          <Award size={18} />
                          Fazer Avaliação e Receber Certificado
                        </button>
                        <p className="text-[11px] text-[var(--reader-fg)]/20 text-center mt-2">
                          Responda perguntas sobre o conteúdo para receber seu certificado oficial
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation buttons */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {currentChapterIndex > 0 ? (
                      <button
                        onClick={goToPrevChapter}
                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-[rgba(var(--reader-tint),0.02)] hover:bg-[rgba(var(--reader-tint),0.04)] border border-[rgba(var(--reader-tint),0.04)] hover:border-[rgba(var(--reader-tint),0.08)] transition-all duration-200 group text-left min-w-0 overflow-hidden"
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[rgba(var(--reader-tint),0.03)] group-hover:bg-[rgba(var(--reader-tint),0.06)] flex items-center justify-center flex-shrink-0 transition-colors duration-200 border border-[rgba(var(--reader-tint),0.04)]">
                          <ChevronLeft size={16} className="text-[rgba(var(--reader-tint),0.25)] group-hover:text-[rgba(var(--reader-tint),0.5)] sm:w-[18px] sm:h-[18px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase tracking-wider text-[var(--reader-fg)]/18 block">
                            Anterior
                          </span>
                          <span className="text-xs sm:text-sm text-[rgba(var(--reader-tint),0.45)] group-hover:text-[rgba(var(--reader-tint),0.65)] truncate block mt-0.5 transition-colors">
                            {chapters[currentChapterIndex - 1]?.title}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <div />
                    )}

                    {currentChapterIndex < chapters.length - 1 ? (
                      <button
                        onClick={goToNextChapter}
                        className={cn(
                          "flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl transition-all duration-200 group text-right min-w-0 overflow-hidden",
                          isChapterLocked(currentChapterIndex + 1)
                            ? "bg-amber-500/[0.04] hover:bg-amber-500/[0.08] border border-amber-500/10 hover:border-amber-500/20"
                            : "bg-violet-500/[0.04] hover:bg-violet-500/[0.08] border border-amber-500/10 hover:border-amber-500/20"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <span className={cn(
                            "text-[10px] uppercase tracking-wider block",
                            isChapterLocked(currentChapterIndex + 1) ? "text-amber-400/35" : "text-violet-400/35"
                          )}>
                            {isChapterLocked(currentChapterIndex + 1) ? "Premium" : "Proximo"}
                          </span>
                          <span className="text-xs sm:text-sm text-[var(--reader-fg)]/55 group-hover:text-[var(--reader-fg)]/85 truncate block mt-0.5 transition-colors">
                            {chapters[currentChapterIndex + 1]?.title}
                          </span>
                        </div>
                        <div className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 border",
                          isChapterLocked(currentChapterIndex + 1)
                            ? "bg-amber-500/10 group-hover:bg-amber-500/15 border-amber-500/15"
                            : "bg-violet-500/10 group-hover:bg-violet-500/15 border-amber-500/15"
                        )}>
                          {isChapterLocked(currentChapterIndex + 1) ? (
                            <Lock size={16} className="text-amber-400/50 group-hover:text-amber-400" />
                          ) : (
                            <ChevronRight size={18} className="text-violet-400/50 group-hover:text-violet-400" />
                          )}
                        </div>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-2.5 p-4 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10">
                        <Sparkles size={15} className="text-emerald-400/50" />
                        <span className="text-sm text-emerald-400/60 font-medium">
                          Último capítulo
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BookOpen size={48} className="mx-auto mb-4 text-[var(--reader-fg)]/15" />
                <p className="text-[rgba(var(--reader-tint),0.3)] text-sm">
                  Nenhum conteúdo disponível
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Quiz Modal for Certificate */}
      <CourseQuizModal
        courseSlug={slug}
        courseTitle={title}
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
      />
    </div>
  );
}
