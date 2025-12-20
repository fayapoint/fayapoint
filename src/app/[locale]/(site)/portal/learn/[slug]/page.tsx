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
  Circle,
  Bookmark,
  LayoutList,
  Loader2,
  Lock,
  Settings2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type TocItem = {
  id: string;
  text: string;
  level: 1 | 2 | 3;
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
  focusMode: boolean;
};

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 16,
  lineHeight: 1.75,
  maxWidth: 900,
  focusMode: true,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getHeadingText(children: unknown): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(getHeadingText).join("");
  if (children && typeof children === "object" && "props" in (children as any)) {
    return getHeadingText((children as any).props?.children);
  }
  return "";
}

function extractToc(markdown: string): TocItem[] {
  const regex = /^(#{1,3})\s+(.+)$/gm;
  const seen = new Map<string, number>();
  const items: TocItem[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    const level = match[1].length as 1 | 2 | 3;
    const text = match[2].trim();
    const base = slugify(text);
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    const id = count > 1 ? `${base}-${count}` : base;
    items.push({ id, text, level });
  }

  return items;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function CourseReaderPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [progress, setProgress] = useState<CourseProgressDto | null>(null);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);

  const toc = useMemo(() => extractToc(content), [content]);
  const tocIds = useMemo(() => new Set(toc.map((t) => t.id)), [toc]);
  const filteredCompletedSections = useMemo(
    () => completedSections.filter((id) => tocIds.has(id)),
    [completedSections, tocIds]
  );
  const computedSectionPercent = useMemo(() => {
    if (!toc.length) return 0;
    return Math.floor((filteredCompletedSections.length / toc.length) * 100);
  }, [filteredCompletedSections.length, toc.length]);
  const displayProgressPercent = useMemo(() => {
    // If we have headings/sections, section completion is the source of truth.
    // Scroll percent is only used as a fallback for content with no headings.
    if (toc.length > 0) return clamp(computedSectionPercent, 0, 100);

    const candidates = [progress?.progressPercent ?? 0, progress?.lastScrollPercent ?? 0];
    return clamp(Math.max(...candidates), 0, 100);
  }, [computedSectionPercent, progress?.lastScrollPercent, progress?.progressPercent, toc.length]);

  const headingIds = useMemo(() => toc.map((t) => t.id), [toc]);
  const readerStyle = useMemo(
    () => ({
      fontSize: `${settings.fontSize}px`,
      lineHeight: String(settings.lineHeight),
    }),
    [settings.fontSize, settings.lineHeight]
  );

  const syncTimerRef = useRef<number | null>(null);
  const pendingSyncRef = useRef<Record<string, unknown>>({});
  const lastActiveRef = useRef<string | null>(null);
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fayapoint_reader_settings_v1");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ReaderSettings>;
      setSettings({
        fontSize: typeof parsed.fontSize === "number" ? parsed.fontSize : DEFAULT_SETTINGS.fontSize,
        lineHeight: typeof parsed.lineHeight === "number" ? parsed.lineHeight : DEFAULT_SETTINGS.lineHeight,
        maxWidth: typeof parsed.maxWidth === "number" ? parsed.maxWidth : DEFAULT_SETTINGS.maxWidth,
        focusMode: typeof parsed.focusMode === "boolean" ? parsed.focusMode : DEFAULT_SETTINGS.focusMode,
      });
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("fayapoint_reader_settings_v1", JSON.stringify(settings));
  }, [settings]);

  const syncProgress = useCallback(
    async (partial: Record<string, unknown>, immediate?: boolean) => {
      const token = localStorage.getItem("fayapoint_token");
      if (!token) return;

      pendingSyncRef.current = { ...pendingSyncRef.current, ...partial };

      const flush = async () => {
        const payload = pendingSyncRef.current;
        pendingSyncRef.current = {};
        try {
          const res = await fetch(`/api/courses/${slug}/progress`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const data = (await res.json()) as { progress?: CourseProgressDto };
            if (data?.progress) {
              const incoming = data.progress;
              setProgress((prev) => (prev ? { ...prev, ...incoming } : incoming));
            }
          }
        } catch (e) {
          console.error("Progress sync error:", e);
        }
      };

      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }

      if (immediate) {
        await flush();
        return;
      }

      syncTimerRef.current = window.setTimeout(() => {
        void flush();
      }, 900);
    },
    [slug]
  );

  const scrollToHeading = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const markSectionCompleted = useCallback(
    async (id: string) => {
      if (!id || !tocIds.has(id)) return;
      setCompletedSections((prev) => (prev.includes(id) ? prev : [...prev, id]));
      await syncProgress({ completedSections: [id], totalSections: toc.length }, true);
    },
    [syncProgress, toc.length, tocIds]
  );

  const resume = useCallback(() => {
    if (!progress) return;
    if (progress.lastHeadingId) {
      scrollToHeading(progress.lastHeadingId);
      return;
    }
    if (typeof progress.lastScrollY === "number") {
      window.scrollTo({ top: progress.lastScrollY, behavior: "smooth" });
    }
  }, [progress, scrollToHeading]);

  const markdownComponents = useMemo(() => {
    let idx = 0;

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
      return ({ children, className: headingClassName, ...props }: HeadingProps) => {
        const myIdx = idx;
        idx += 1;

        const fallbackText = getHeadingText(children);
        const id = headingIds[myIdx] || slugify(fallbackText) || `section-${myIdx + 1}`;

        const Tag = (`h${level}` as const) as "h1" | "h2" | "h3";
        const headingClasses = cn("scroll-mt-24", headingClassName);

        return (
          <Tag id={id} data-course-heading="true" className={headingClasses} {...props}>
            {children}
          </Tag>
        );
      };
    };

    return {
      h1: createHeading(1),
      h2: createHeading(2),
      h3: createHeading(3),
      p: ({ className, ...props }: ParagraphProps) => <p className={cn(className)} {...props} />,
      ul: ({ className, ...props }: ListProps) => <ul className={cn(className)} {...props} />,
      ol: ({ className, ...props }: OListProps) => <ol className={cn(className)} {...props} />,
      li: ({ className, ...props }: LiProps) => <li className={cn(className)} {...props} />,
      a: ({ className, ...props }: AnchorProps) => (
        <a
          className={cn("hover:underline transition-colors", className)}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        />
      ),
      blockquote: ({ className, ...props }: BlockquoteProps) => (
        <blockquote
          className={cn(
            "border-l-2 border-purple-500/70 pl-4 py-2 my-6 bg-white/5 rounded-r",
            className
          )}
          {...props}
        />
      ),
      pre: ({ className, ...props }: PreProps) => (
        <pre
          className={cn(
            "bg-black/50 p-4 rounded-lg overflow-x-auto mb-6 border border-white/10",
            className
          )}
          {...props}
        />
      ),
      img: ({ className, alt, ...props }: ImgProps) => (
        <img
          className={cn("rounded-lg border border-white/10 my-6 max-w-full h-auto", className)}
          alt={alt || "Course Image"}
          {...props}
        />
      ),
      hr: ({ className, ...props }: HrProps) => <hr className={cn("my-8 border-white/10", className)} {...props} />,
      table: ({ className, ...props }: TableProps) => (
        <div className="overflow-x-auto mb-6">
          <table
            className={cn("min-w-full border-collapse border border-white/10 text-left", className)}
            {...props}
          />
        </div>
      ),
      th: ({ className, ...props }: ThProps) => (
        <th className={cn("bg-white/5 border border-white/10 p-2 font-semibold text-white/90", className)} {...props} />
      ),
      td: ({ className, ...props }: TdProps) => (
        <td className={cn("border border-white/10 p-2 text-white/80", className)} {...props} />
      ),
    };
  }, [headingIds]);

  useEffect(() => {
    const fetchContent = async () => {
      const token = localStorage.getItem('fayapoint_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const [contentRes, progressRes] = await Promise.all([
          fetch(`/api/courses/${slug}/content`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`/api/courses/${slug}/progress`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (contentRes.status === 401 || progressRes.status === 401) {
          router.push('/login');
          return;
        }

        const contentData = await contentRes.json();

        if (!contentRes.ok) {
          if (contentRes.status === 403) {
            setError("access_denied");
          } else {
            throw new Error(contentData.error || 'Erro ao carregar conteúdo');
          }
          return;
        }

        setContent(contentData.content);
        setTitle(contentData.title);

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const p = progressData?.progress as CourseProgressDto | undefined;
          if (p) {
            setProgress(p);
            setCompletedSections(Array.isArray(p.completedSections) ? p.completedSections : []);
            setActiveHeadingId(p.lastHeadingId || null);
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

    if (slug) {
        fetchContent();
    }
  }, [slug, router]);

  // Restore scroll position once after content+progress load
  useEffect(() => {
    if (!content || !progress) return;
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const restore = () => {
      if (progress.lastHeadingId) {
        const el = document.getElementById(progress.lastHeadingId);
        if (el) {
          el.scrollIntoView({ block: "start" });
          return;
        }
      }
      if (typeof progress.lastScrollY === "number") {
        window.scrollTo({ top: progress.lastScrollY });
      }
    };

    const t = window.setTimeout(restore, 200);
    return () => window.clearTimeout(t);
  }, [content, progress]);

  // Track scroll + active heading and persist progress (debounced)
  useEffect(() => {
    if (!content) return;

    let ticking = false;

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

      const headings = Array.from(
        document.querySelectorAll<HTMLElement>("[data-course-heading='true']")
      );

      let currentId: string | null = null;
      for (const h of headings) {
        const rect = h.getBoundingClientRect();
        if (rect.top <= 120) currentId = h.id;
        else break;
      }

      if (currentId && currentId !== lastActiveRef.current) {
        const previousId = lastActiveRef.current;
        lastActiveRef.current = currentId;
        setActiveHeadingId(currentId);

        if (previousId && tocIds.has(previousId)) {
          setCompletedSections((prev) => (prev.includes(previousId) ? prev : [...prev, previousId]));
          void syncProgress({ completedSections: [previousId], totalSections: toc.length }, false);
        }
      }

      const nextPayload: Record<string, unknown> = {
        lastScrollY: scrollTop,
        lastScrollPercent: scrollPercent,
        totalSections: toc.length,
      };

      if (currentId) nextPayload.lastHeadingId = currentId;
      void syncProgress(nextPayload, false);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [content, syncProgress, toc.length, tocIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  if (error === "access_denied") {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl max-w-md text-center">
                <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="text-red-500" size={32} />
                </div>
                <h1 className="text-2xl font-bold mb-4">Acesso Bloqueado</h1>
                <p className="text-gray-400 mb-6">
                    Você precisa adquirir este curso ou fazer upgrade do seu plano para acessar este conteúdo.
                </p>
                <div className="flex flex-col gap-3">
                    <Link href={`/curso/${slug}`}>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">Ver Detalhes do Curso</Button>
                    </Link>
                    <Link href="/portal">
                        <Button variant="outline" className="w-full">Voltar ao Portal</Button>
                    </Link>
                </div>
            </div>
        </div>
      );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
            <p className="text-red-400 mb-4">Ocorreu um erro ao carregar o curso.</p>
            <Link href="/portal">
                <Button variant="outline">Voltar</Button>
            </Link>
        </div>
    );
  }

  // Sidebar TOC component for reuse
  const TocList = ({ maxHeight = "max-h-[60vh]" }: { maxHeight?: string }) => (
    <div className={cn("overflow-auto", maxHeight)}>
      {toc.length ? (
        <div className="space-y-0.5">
          {toc.map((item, index) => {
            const isActive = activeHeadingId === item.id;
            const isDone = filteredCompletedSections.includes(item.id);
            const isNext = !isDone && filteredCompletedSections.length === index;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-purple-500/20 to-violet-500/10 border border-purple-500/30"
                    : "hover:bg-white/5 border border-transparent",
                  isNext && !isActive && "bg-purple-500/5"
                )}
              >
                <span
                  className={cn(
                    "flex-shrink-0 transition-all duration-200",
                    isDone ? "text-emerald-400" : isActive ? "text-purple-400" : "text-white/25 group-hover:text-white/40"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    void markSectionCompleted(item.id);
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="drop-shadow-sm" />
                  ) : isActive ? (
                    <div className="w-[18px] h-[18px] rounded-full border-2 border-purple-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                    </div>
                  ) : (
                    <Circle size={18} />
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm leading-snug font-medium transition-colors",
                    item.level === 2 && "pl-2 text-[13px]",
                    item.level === 3 && "pl-4 text-xs font-normal",
                    isActive ? "text-white" : isDone ? "text-white/60" : "text-white/70 group-hover:text-white/90"
                  )}
                >
                  {item.text}
                </span>
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-purple-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-8 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-white/20" />
          <p className="text-sm text-white/40">Nenhum capítulo detectado</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f] text-white">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-600/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="h-16 flex items-center gap-4">
            {/* Back button */}
            <Link
              href="/portal"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft size={18} className="text-white/70" />
            </Link>

            {/* Title & Progress */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={14} className="text-purple-400 flex-shrink-0" />
                <h1 className="truncate text-sm font-semibold text-white/90">{title}</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${displayProgressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-white/50 tabular-nums w-10 text-right">
                  {displayProgressPercent}%
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <button className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all">
                    <LayoutList size={16} className="text-white/70" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-[#0d0d14] border-white/[0.06] p-0">
                  <div className="p-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-3">
                      <Bookmark size={16} className="text-purple-400" />
                      <span className="font-semibold text-white">Conteúdo</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-white/50">{filteredCompletedSections.length} de {toc.length} seções</span>
                      <span className="font-semibold text-purple-400">{displayProgressPercent}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full"
                        style={{ width: `${displayProgressPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3">
                    <TocList maxHeight="max-h-[calc(100vh-12rem)]" />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Settings */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all">
                    <Settings2 size={16} className="text-white/70" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-[#13131a] border-white/[0.08] shadow-2xl shadow-black/50 p-0">
                  <div className="p-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-purple-400" />
                      <span className="font-semibold text-white">Preferências</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/70">Tamanho da fonte</span>
                        <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">{settings.fontSize}px</span>
                      </div>
                      <Slider
                        min={14}
                        max={22}
                        step={1}
                        value={[settings.fontSize]}
                        onValueChange={(v) => setSettings((s) => ({ ...s, fontSize: v[0] }))}
                        className="[&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-400"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/70">Espaçamento</span>
                        <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">{settings.lineHeight.toFixed(1)}</span>
                      </div>
                      <Slider
                        min={1.4}
                        max={2.1}
                        step={0.1}
                        value={[settings.lineHeight]}
                        onValueChange={(v) => setSettings((s) => ({ ...s, lineHeight: v[0] }))}
                        className="[&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-400"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-white/70">Largura do texto</span>
                        <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">{settings.maxWidth}px</span>
                      </div>
                      <Slider
                        min={640}
                        max={1100}
                        step={20}
                        value={[settings.maxWidth]}
                        onValueChange={(v) => setSettings((s) => ({ ...s, maxWidth: v[0] }))}
                        className="[&_[role=slider]]:bg-purple-500 [&_[role=slider]]:border-purple-400"
                      />
                    </div>

                    <Separator className="bg-white/[0.06]" />

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">Modo Foco</div>
                        <div className="text-xs text-white/40 mt-0.5">Oculta o menu lateral</div>
                      </div>
                      <Switch
                        checked={settings.focusMode}
                        onCheckedChange={(checked) => setSettings((s) => ({ ...s, focusMode: checked }))}
                      />
                    </div>
                  </div>
                  <div className="p-4 border-t border-white/[0.06] flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent border-white/[0.08] hover:bg-white/[0.04] text-white/70"
                      onClick={() => setSettings(DEFAULT_SETTINGS)}
                    >
                      Resetar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 border-0"
                      onClick={resume}
                      disabled={!progress}
                    >
                      Continuar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Continue button (desktop) */}
              <Button
                size="sm"
                className="hidden sm:inline-flex bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 border-0 shadow-lg shadow-purple-500/20"
                onClick={resume}
                disabled={!progress}
              >
                <Bookmark size={14} className="mr-1.5" />
                Continuar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className={cn("lg:flex gap-8", settings.focusMode && "lg:block")}>
          {/* Sidebar */}
          {!settings.focusMode && (
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24">
                {/* Progress card */}
                <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-white/60">Seu Progresso</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                      {displayProgressPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${displayProgressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>{filteredCompletedSections.length} concluídas</span>
                    <span>{toc.length - filteredCompletedSections.length} restantes</span>
                  </div>
                </div>

                {/* TOC */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                  <div className="p-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Bookmark size={16} className="text-purple-400" />
                      <span className="text-sm font-semibold text-white">Capítulos</span>
                    </div>
                  </div>
                  <div className="p-2">
                    <TocList maxHeight="max-h-[calc(100vh-20rem)]" />
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Content */}
          <main className="min-w-0 flex-1">
            <article className="mx-auto" style={{ maxWidth: settings.maxWidth }}>
              {/* Content header */}
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-xs font-medium text-white/60">
                      {filteredCompletedSections.length}/{toc.length} seções
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-white/[0.08] hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                  onClick={() => {
                    if (activeHeadingId) void markSectionCompleted(activeHeadingId);
                  }}
                  disabled={!activeHeadingId}
                >
                  <CheckCircle2 size={14} className="mr-1.5" />
                  Marcar como lida
                </Button>
              </div>

              {/* Content body */}
              <div className="relative rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] overflow-hidden">
                {/* Decorative top gradient */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                
                <div className="p-6 sm:p-10 lg:p-12">
                  <div
                    style={readerStyle}
                    className={cn(
                      "max-w-none",
                      "prose prose-invert prose-lg",
                      // Headings
                      "prose-headings:font-bold prose-headings:tracking-tight",
                      "prose-h1:text-3xl prose-h1:text-white prose-h1:mb-6 prose-h1:mt-0",
                      "prose-h2:text-2xl prose-h2:text-white prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-white/[0.06]",
                      "prose-h3:text-xl prose-h3:text-white/90 prose-h3:mt-8 prose-h3:mb-3",
                      // Text
                      "prose-p:text-white/75 prose-p:leading-relaxed",
                      "prose-strong:text-white prose-strong:font-semibold",
                      // Links
                      "prose-a:text-purple-400 prose-a:no-underline prose-a:font-medium hover:prose-a:text-purple-300 hover:prose-a:underline",
                      // Lists
                      "prose-li:text-white/75 prose-li:marker:text-purple-500",
                      "prose-ul:my-4 prose-ol:my-4",
                      // Code
                      "prose-code:text-purple-300 prose-code:bg-purple-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-code:before:content-[''] prose-code:after:content-['']",
                      "prose-pre:bg-[#0a0a0f] prose-pre:border prose-pre:border-white/[0.06] prose-pre:rounded-xl prose-pre:shadow-xl",
                      // Blockquote
                      "prose-blockquote:border-l-2 prose-blockquote:border-purple-500 prose-blockquote:bg-purple-500/5 prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:text-white/70",
                      // HR
                      "prose-hr:border-white/[0.06] prose-hr:my-10",
                      // Images
                      "prose-img:rounded-2xl prose-img:border prose-img:border-white/[0.06] prose-img:shadow-2xl",
                      // Tables
                      "prose-table:border prose-table:border-white/[0.06] prose-table:rounded-xl prose-table:overflow-hidden",
                      "prose-th:bg-white/[0.04] prose-th:text-white prose-th:font-semibold prose-th:px-4 prose-th:py-3",
                      "prose-td:px-4 prose-td:py-3 prose-td:border-t prose-td:border-white/[0.06]"
                    )}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {content}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Bottom navigation */}
                <div className="p-6 sm:p-10 lg:p-12 pt-0">
                  <div className="flex items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
                    <div className="text-sm text-white/40">
                      {filteredCompletedSections.length === toc.length && toc.length > 0 ? (
                        <span className="flex items-center gap-2 text-emerald-400">
                          <Sparkles size={16} />
                          Parabéns! Você completou este conteúdo.
                        </span>
                      ) : (
                        `${toc.length - filteredCompletedSections.length} seções restantes`
                      )}
                    </div>
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 border-0 shadow-lg shadow-purple-500/20"
                      onClick={() => {
                        if (activeHeadingId) void markSectionCompleted(activeHeadingId);
                      }}
                      disabled={!activeHeadingId || filteredCompletedSections.includes(activeHeadingId ?? "")}
                    >
                      Próxima seção
                      <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}
