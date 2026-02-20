"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Loader2,
  Lock,
  Menu,
  Settings2,
  Sparkles,
  Trophy,
  X,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { CourseQuizModal } from "@/components/portal/CourseQuizModal";

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */

type Chapter = {
  id: string;
  title: string;
  content: string;
  index: number;
  readingMinutes: number;
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

type ReaderSettings = {
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
};

/* ═══════════════════════════════════════════════════════════
   Constants & Helpers
   ═══════════════════════════════════════════════════════════ */

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 17,
  lineHeight: 1.8,
  maxWidth: 780,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function estimateReadingMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
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
      });
    } else if (part.length > 100) {
      const h1Match = part.match(/^# ([^\n]+)/m);
      chapters.push({
        id: "introducao",
        title: h1Match ? h1Match[1].trim() : "Apresentação",
        content: part,
        index: chapters.length,
        readingMinutes: estimateReadingMinutes(part),
      });
    }
  }

  chapters.forEach((ch, i) => {
    ch.index = i;
  });
  return chapters;
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

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [showQuizModal, setShowQuizModal] = useState(false);

  /* ─── Refs ─── */
  const initialLoadDone = useRef(false);
  const rawCompletedRef = useRef<string[]>([]);
  const resumeHeadingRef = useRef<string | null>(null);

  /* ─── Derived ─── */
  const chapters = useMemo(() => splitIntoChapters(rawContent), [rawContent]);
  const currentChapter = chapters[currentChapterIndex] || null;
  const totalReadingMinutes = useMemo(
    () => chapters.reduce((sum, ch) => sum + ch.readingMinutes, 0),
    [chapters]
  );
  const progressPercent = useMemo(() => {
    if (!chapters.length) return 0;
    return Math.round((completedChapterIds.size / chapters.length) * 100);
  }, [completedChapterIds.size, chapters.length]);

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
      const token = localStorage.getItem("fayai_token");
      if (!token) return;
      try {
        await fetch(`/api/courses/${slug}/progress`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
      } catch (e) {
        console.error("Progress sync error:", e);
      }
    },
    [slug]
  );

  /* ─── Navigation ─── */
  const goToChapter = useCallback(
    (index: number, markPreviousComplete = false) => {
      if (index < 0 || index >= chapters.length) return;

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
    [chapters, currentChapter, completedChapterIds, syncProgress]
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
      const token = localStorage.getItem("fayai_token");
      if (!token) {
        router.push(`/${locale}/login`);
        return;
      }
      try {
        const [contentRes, progressRes] = await Promise.all([
          fetch(`/api/courses/${slug}/content`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/courses/${slug}/progress`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (contentRes.status === 401 || progressRes.status === 401) {
          router.push(`/${locale}/login`);
          return;
        }

        const contentData = await contentRes.json();
        if (!contentRes.ok) {
          setError(contentRes.status === 403 ? "access_denied" : "error");
          return;
        }

        setRawContent(contentData.content || "");
        setTitle(contentData.title || "");

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const p = progressData?.progress as CourseProgressDto | undefined;
          if (p) {
            rawCompletedRef.current = Array.isArray(p.completedSections)
              ? p.completedSections
              : [];
            resumeHeadingRef.current = p.lastHeadingId || null;
          }
        }
      } catch (err) {
        console.error(err);
        setError("error");
        toast.error("Erro ao carregar conteúdo do curso");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchContent();
  }, [slug, router, locale]);

  /* ─── Restore position after chapters computed ─── */
  useEffect(() => {
    if (!chapters.length || initialLoadDone.current) return;
    initialLoadDone.current = true;

    // Filter saved sections to valid chapter IDs
    const chapterIdSet = new Set(chapters.map((ch) => ch.id));
    const valid = rawCompletedRef.current.filter((id) => chapterIdSet.has(id));
    setCompletedChapterIds(new Set(valid));

    // Restore chapter position
    const savedId = resumeHeadingRef.current;
    if (savedId) {
      const idx = chapters.findIndex((ch) => ch.id === savedId);
      if (idx >= 0) setCurrentChapterIndex(idx);
    }
  }, [chapters]);

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
    type OListProps = ComponentPropsWithoutRef<"ol"> & { node?: unknown; children?: ReactNode };
    type LiProps = ComponentPropsWithoutRef<"li"> & { node?: unknown; children?: ReactNode };
    type AnchorProps = ComponentPropsWithoutRef<"a"> & { node?: unknown; children?: ReactNode };
    type BlockquoteProps = ComponentPropsWithoutRef<"blockquote"> & { node?: unknown; children?: ReactNode };
    type PreProps = ComponentPropsWithoutRef<"pre"> & { node?: unknown; children?: ReactNode };
    type ImgProps = ComponentPropsWithoutRef<"img"> & { node?: unknown };
    type HrProps = ComponentPropsWithoutRef<"hr"> & { node?: unknown };
    type TableProps = ComponentPropsWithoutRef<"table"> & { node?: unknown; children?: ReactNode };
    type ThProps = ComponentPropsWithoutRef<"th"> & { node?: unknown; children?: ReactNode };
    type TdProps = ComponentPropsWithoutRef<"td"> & { node?: unknown; children?: ReactNode };

    const createHeading = (level: 1 | 2 | 3) => {
      return ({ children, className: cls, ...props }: HeadingProps) => {
        const text = getHeadingText(children);
        const id = slugify(text);
        const Tag = `h${level}` as "h1" | "h2" | "h3";
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
      p: ({ className, ...props }: ParagraphProps) => (
        <p className={cn("text-[#c0c0ce] leading-[1.85]", className)} {...props} />
      ),
      ul: ({ className, ...props }: ListProps) => (
        <ul className={cn("space-y-2.5 my-5", className)} {...props} />
      ),
      ol: ({ className, ...props }: OListProps) => (
        <ol className={cn("space-y-2.5 my-5", className)} {...props} />
      ),
      li: ({ className, ...props }: LiProps) => (
        <li className={cn("text-[#c0c0ce] pl-1", className)} {...props} />
      ),
      a: ({ className, ...props }: AnchorProps) => (
        <a
          className={cn(
            "text-violet-400 hover:text-violet-300 underline underline-offset-[3px] decoration-violet-400/30 hover:decoration-violet-300/60 transition-all duration-200",
            className
          )}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      ),
      blockquote: ({ className, ...props }: BlockquoteProps) => (
        <blockquote
          className={cn(
            "relative my-8 pl-6 pr-5 py-4 rounded-2xl bg-gradient-to-r from-violet-500/[0.06] to-purple-500/[0.02] border-l-[3px] border-violet-400/50",
            className
          )}
          {...props}
        />
      ),
      pre: ({ className, ...props }: PreProps) => (
        <pre
          className={cn(
            "my-7 p-5 rounded-2xl overflow-x-auto bg-[#07070d] ring-1 ring-white/[0.06] shadow-xl shadow-black/30",
            className
          )}
          {...props}
        />
      ),
      img: ({ className, alt, ...props }: ImgProps) => (
        <img
          className={cn(
            "rounded-2xl ring-1 ring-white/[0.06] my-8 max-w-full h-auto shadow-2xl shadow-black/40 hover:shadow-black/50 transition-shadow duration-500",
            className
          )}
          alt={alt || ""}
          {...props}
        />
      ),
      hr: ({ className, ...props }: HrProps) => (
        <hr
          className={cn(
            "my-14 border-0 h-px bg-gradient-to-r from-transparent via-violet-400/15 to-transparent",
            className
          )}
          {...props}
        />
      ),
      table: ({ className, ...props }: TableProps) => (
        <div className="overflow-x-auto my-8 rounded-2xl ring-1 ring-white/[0.06] shadow-lg shadow-black/10">
          <table
            className={cn("min-w-full border-collapse text-left", className)}
            {...props}
          />
        </div>
      ),
      th: ({ className, ...props }: ThProps) => (
        <th
          className={cn(
            "bg-white/[0.03] border-b border-white/[0.06] px-5 py-3.5 text-[13px] font-semibold text-white/85 tracking-wide",
            className
          )}
          {...props}
        />
      ),
      td: ({ className, ...props }: TdProps) => (
        <td
          className={cn(
            "border-b border-white/[0.04] px-5 py-3 text-[13px] text-[#a8a8bb]",
            className
          )}
          {...props}
        />
      ),
    };
  }, []);

  /* ═══════════════════════════════════════════════════════════
     Render: Loading / Error / Access Denied
     ═══════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c13] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/10 border border-violet-500/20 flex items-center justify-center">
              <BookOpen className="text-violet-400" size={28} />
            </div>
            <div className="absolute -inset-4 rounded-3xl bg-violet-500/10 blur-2xl animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-2.5">
            <p className="text-sm font-medium text-white/50">Preparando sua leitura</p>
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
      <div className="min-h-screen bg-[#0b0c13] text-white flex flex-col items-center justify-center p-6">
        <div className="relative max-w-sm w-full">
          <div className="absolute -inset-px bg-gradient-to-b from-red-500/20 via-transparent to-transparent rounded-[1.6rem] blur-sm" />
          <div className="relative bg-[#12131c] border border-white/[0.06] p-10 rounded-3xl text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/15">
              <Lock className="text-red-400/80" size={34} />
            </div>
            <h1 className="text-2xl font-bold mb-3 tracking-tight">Acesso Restrito</h1>
            <p className="text-white/35 mb-8 text-sm leading-relaxed">
              Você precisa adquirir este curso ou fazer upgrade do seu plano para
              acessar este conteúdo.
            </p>
            <div className="flex flex-col gap-3">
              <Link href={`/${locale}/curso/${slug}`}>
                <Button className="w-full h-11 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-medium shadow-lg shadow-violet-600/20">
                  Ver Detalhes do Curso
                </Button>
              </Link>
              <Link href={`/${locale}/portal`}>
                <Button variant="outline" className="w-full h-11 rounded-xl border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-white/50">
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
      <div className="min-h-screen bg-[#0b0c13] text-white flex flex-col items-center justify-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/15">
          <X className="text-red-400/70" size={24} />
        </div>
        <p className="text-white/40 text-sm">Ocorreu um erro ao carregar o curso.</p>
        <Link href={`/${locale}/portal`}>
          <Button variant="outline" className="rounded-xl border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-white/50">
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
    <div className="min-h-screen bg-[#0b0c13] text-white flex flex-col">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 flex-shrink-0">
        {/* Accent gradient line */}
        <div className="h-[2px] bg-gradient-to-r from-violet-600/80 via-purple-500/60 to-violet-600/80" />

        <div className="h-14 border-b border-white/[0.04] bg-[#0b0c13]/80 backdrop-blur-2xl backdrop-saturate-150 flex items-center px-4 gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] transition-all duration-200"
          >
            {sidebarOpen ? (
              <X size={15} className="text-white/50" />
            ) : (
              <Menu size={15} className="text-white/50" />
            )}
          </button>

          <Link
            href={`/${locale}/portal`}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] transition-all duration-200"
          >
            <ArrowLeft size={15} className="text-white/50" />
          </Link>

          <div className="min-w-0 flex-1">
            <span className="truncate text-[13px] font-medium text-white/70 block">{title}</span>
            <div className="flex items-center gap-2.5 mt-1">
              <div className="flex-1 h-[3px] bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 via-purple-400 to-violet-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-violet-400/70 tabular-nums">
                {progressPercent}%
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <span className="text-[10px] font-medium text-white/25">Cap.</span>
            <span className="text-[10px] font-bold text-violet-400 tabular-nums">
              {currentChapterIndex + 1}/{chapters.length}
            </span>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] transition-all duration-200">
                <Settings2 size={14} className="text-white/50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 bg-[#12131c] border-white/[0.06] shadow-2xl shadow-black/50 p-0 rounded-2xl">
              <div className="p-4 border-b border-white/[0.05]">
                <span className="text-sm font-semibold text-white/90">
                  Preferências de Leitura
                </span>
              </div>
              <div className="p-4 space-y-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Tamanho da fonte</span>
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
                    <span className="text-xs text-white/40">Espaçamento entre linhas</span>
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
                    <span className="text-xs text-white/40">Largura do texto</span>
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
                <Separator className="bg-white/[0.05]" />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent border-white/[0.06] hover:bg-white/[0.03] text-white/40 text-xs rounded-xl"
                  onClick={() => setSettings(DEFAULT_SETTINGS)}
                >
                  Resetar Padrões
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

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
            "fixed lg:relative top-[calc(2px+3.5rem)] lg:top-0 left-0 z-30 lg:z-auto h-[calc(100vh-3.5rem-2px)] w-[280px] flex-shrink-0 flex flex-col transition-transform duration-300 ease-out",
            "bg-[#0d0e16]/95 lg:bg-[#0d0e16] backdrop-blur-xl lg:backdrop-blur-none border-r border-white/[0.04]",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Sidebar header */}
          <div className="p-5 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30">Conteúdo</h2>
              <span className="text-xs font-bold text-violet-400 tabular-nums">{progressPercent}%</span>
            </div>
            <div className="relative h-[5px] bg-white/[0.04] rounded-full overflow-hidden mb-2.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-white/20">
              {completedChapterIds.size} de {chapters.length} concluídos · ~{totalReadingMinutes} min
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mx-3" />

          {/* Chapter list */}
          <div className="flex-1 overflow-y-auto py-3 px-3">
            {chapters.map((chapter, i) => {
              const isCurrent = i === currentChapterIndex;
              const isDone = completedChapterIds.has(chapter.id);
              return (
                <button
                  key={chapter.id}
                  onClick={() => goToChapter(i)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 group relative mb-0.5",
                    isCurrent
                      ? "bg-violet-500/[0.08]"
                      : "hover:bg-white/[0.03]"
                  )}
                >
                  {/* Active accent bar */}
                  {isCurrent && (
                    <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-violet-400" />
                  )}

                  {/* Number badge / Status */}
                  <span
                    className="flex-shrink-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleChapterComplete(chapter.id);
                    }}
                  >
                    {isDone ? (
                      <div className="w-8 h-8 rounded-[10px] bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-8 h-8 rounded-[10px] bg-violet-500/20 border border-violet-400/40 flex items-center justify-center">
                        <span className="text-xs font-bold text-violet-400 tabular-nums">{i + 1}</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-[10px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-center group-hover:bg-white/[0.04] group-hover:border-white/[0.1] transition-all duration-200">
                        <span className="text-xs font-medium text-white/20 group-hover:text-white/35 tabular-nums transition-colors">{i + 1}</span>
                      </div>
                    )}
                  </span>

                  {/* Title + meta */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[13px] leading-snug line-clamp-2 transition-colors duration-200",
                        isCurrent
                          ? "text-white font-semibold"
                          : isDone
                          ? "text-white/30"
                          : "text-white/50 group-hover:text-white/70"
                      )}
                    >
                      {chapter.title}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] mt-1 block transition-colors",
                        isCurrent ? "text-violet-400/50" : "text-white/12"
                      )}
                    >
                      {chapter.readingMinutes} min
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Keyboard hints */}
          <div className="hidden lg:flex items-center justify-center p-3.5 border-t border-white/[0.04] flex-shrink-0">
            <p className="text-[10px] text-white/15">Ctrl + ← → navegar</p>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <main
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300",
            sidebarOpen ? "lg:ml-0" : ""
          )}
        >
          {currentChapter ? (
            <div className="min-h-full flex flex-col">
              {/* Chapter header */}
              <div className="flex-shrink-0 relative overflow-hidden">
                {/* Gradient mesh background */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/[0.04] via-transparent to-purple-600/[0.02]" />
                <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/[0.03] rounded-full blur-[80px]" />

                <div
                  className="relative mx-auto px-8 sm:px-10 lg:px-14 py-10 sm:py-14"
                  style={{ maxWidth: settings.maxWidth + 120 }}
                >
                  {/* Decorative chapter number */}
                  <div className="flex items-baseline gap-5 mb-6">
                    <span className="text-6xl sm:text-7xl font-black bg-gradient-to-b from-violet-400/20 to-violet-400/[0.03] bg-clip-text text-transparent select-none leading-none tabular-nums">
                      {String(currentChapterIndex + 1).padStart(2, "0")}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400/40">
                        Capítulo {currentChapterIndex + 1} de {chapters.length}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-white/18 flex items-center gap-1">
                          <Clock size={10} />
                          {currentChapter.readingMinutes} min
                        </span>
                        {isCurrentCompleted && (
                          <span className="text-[11px] font-medium text-emerald-400/70 flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            Concluído
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-bold text-white/95 tracking-tight leading-[1.2]">
                    {currentChapter.title}
                  </h1>
                </div>

                {/* Separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              </div>

              {/* Chapter content */}
              <div className="flex-1">
                <div
                  className="mx-auto px-8 sm:px-10 lg:px-14 py-10 sm:py-14"
                  style={{ maxWidth: settings.maxWidth + 120 }}
                >
                  <div
                    style={{
                      fontSize: `${settings.fontSize}px`,
                      lineHeight: String(settings.lineHeight),
                    }}
                    className={cn(
                      "max-w-none",
                      "prose prose-invert",
                      "prose-headings:font-bold prose-headings:tracking-tight",
                      "prose-h1:text-[1.65em] prose-h1:text-white/95 prose-h1:mb-6 prose-h1:mt-0 prose-h1:leading-tight",
                      "prose-h2:text-[1.35em] prose-h2:text-white/90 prose-h2:mt-14 prose-h2:mb-5 prose-h2:leading-snug",
                      "prose-h3:text-[1.15em] prose-h3:text-white/85 prose-h3:mt-10 prose-h3:mb-4",
                      "prose-p:text-[#b8b8c8] prose-p:leading-[1.85] prose-p:mb-5",
                      "prose-strong:text-white/95 prose-strong:font-semibold",
                      "prose-em:text-[#c0b8d8]",
                      "prose-a:text-violet-400 prose-a:underline prose-a:underline-offset-[3px] prose-a:decoration-violet-400/30 hover:prose-a:text-violet-300 hover:prose-a:decoration-violet-300/60",
                      "prose-li:text-[#b8b8c8] prose-li:marker:text-violet-400/40",
                      "prose-ul:my-5 prose-ol:my-5",
                      "prose-code:text-violet-300 prose-code:bg-violet-500/[0.08] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-normal prose-code:text-[0.88em] prose-code:before:content-[''] prose-code:after:content-['']",
                      "prose-pre:bg-[#07070d] prose-pre:ring-1 prose-pre:ring-white/[0.05] prose-pre:rounded-2xl prose-pre:shadow-lg prose-pre:shadow-black/20",
                      "prose-blockquote:border-l-[3px] prose-blockquote:border-violet-400/40 prose-blockquote:bg-gradient-to-r prose-blockquote:from-violet-500/[0.05] prose-blockquote:to-transparent prose-blockquote:rounded-r-2xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:text-[#a8a8bc]",
                      "prose-hr:border-0",
                      "prose-img:rounded-2xl prose-img:ring-1 prose-img:ring-white/[0.06] prose-img:shadow-xl prose-img:shadow-black/30",
                      "prose-table:rounded-2xl prose-table:overflow-hidden prose-table:ring-1 prose-table:ring-white/[0.06]",
                      "prose-th:bg-white/[0.03] prose-th:text-white/80 prose-th:font-semibold prose-th:px-5 prose-th:py-3.5 prose-th:text-sm",
                      "prose-td:px-5 prose-td:py-3 prose-td:text-sm prose-td:border-t prose-td:border-white/[0.04]"
                    )}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {currentChapter.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              {/* ─── Bottom Navigation ─── */}
              <div className="flex-shrink-0">
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                <div
                  className="mx-auto px-8 sm:px-10 lg:px-14 py-8"
                  style={{ maxWidth: settings.maxWidth + 120 }}
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
                    <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-500/[0.06] via-amber-500/[0.04] to-violet-500/[0.06] border border-emerald-500/15 overflow-hidden">
                      <div className="py-5 px-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <Trophy size={22} className="text-yellow-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">
                            Parabéns! Curso concluído!
                          </p>
                          <p className="text-xs text-white/35 mt-0.5">
                            Você completou todos os {chapters.length} capítulos.
                          </p>
                        </div>
                      </div>
                      <div className="px-6 pb-5">
                        <button
                          onClick={() => setShowQuizModal(true)}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-amber-600/20"
                        >
                          <Award size={18} />
                          Fazer Avaliação e Receber Certificado
                        </button>
                        <p className="text-[11px] text-white/20 text-center mt-2">
                          Responda perguntas sobre o conteúdo para receber seu certificado oficial
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    {currentChapterIndex > 0 ? (
                      <button
                        onClick={goToPrevChapter}
                        className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200 group text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] group-hover:bg-white/[0.06] flex items-center justify-center flex-shrink-0 transition-colors duration-200 border border-white/[0.04]">
                          <ChevronLeft size={18} className="text-white/25 group-hover:text-white/50" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase tracking-wider text-white/18 block">
                            Anterior
                          </span>
                          <span className="text-sm text-white/45 group-hover:text-white/65 truncate block mt-0.5 transition-colors">
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
                        className="flex items-center justify-end gap-3 p-4 rounded-2xl bg-violet-500/[0.04] hover:bg-violet-500/[0.08] border border-violet-500/10 hover:border-violet-500/20 transition-all duration-200 group text-right"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase tracking-wider text-violet-400/35 block">
                            Próximo
                          </span>
                          <span className="text-sm text-white/55 group-hover:text-white/85 truncate block mt-0.5 transition-colors">
                            {chapters[currentChapterIndex + 1]?.title}
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 group-hover:bg-violet-500/15 flex items-center justify-center flex-shrink-0 transition-colors duration-200 border border-violet-500/15">
                          <ChevronRight size={18} className="text-violet-400/50 group-hover:text-violet-400" />
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
                <BookOpen size={48} className="mx-auto mb-4 text-white/15" />
                <p className="text-white/30 text-sm">
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
