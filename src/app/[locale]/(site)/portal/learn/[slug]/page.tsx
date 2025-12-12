"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  LayoutList,
  Loader2,
  Lock,
  Settings2,
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <div className="h-16 flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/portal">
                <ArrowLeft size={20} />
              </Link>
            </Button>

            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{title}</div>
              <div className="mt-1 flex items-center gap-3">
                <Progress value={displayProgressPercent} className="h-2 bg-white/10" />
                <div className="text-xs text-white/60 tabular-nums w-12 text-right">
                  {displayProgressPercent}%
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon-sm" className="lg:hidden">
                    <LayoutList size={16} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-black border-white/10">
                  <SheetHeader>
                    <SheetTitle className="text-white">Conteúdo</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-4 space-y-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
                      <div className="px-4 py-3">
                        <div className="text-xs text-white/60">Progresso</div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-sm font-semibold text-white">{displayProgressPercent}%</div>
                          <div className="text-xs text-white/60">
                            {filteredCompletedSections.length}/{toc.length || 0} seções
                          </div>
                        </div>
                        <div className="mt-2">
                          <Progress value={displayProgressPercent} className="h-2 bg-white/10" />
                        </div>
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="p-2 max-h-[calc(100vh-18rem)] overflow-auto">
                        {toc.length ? (
                          <div className="space-y-1">
                            {toc.map((item) => {
                              const isActive = activeHeadingId === item.id;
                              const isDone = filteredCompletedSections.includes(item.id);
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => scrollToHeading(item.id)}
                                  className={cn(
                                    "w-full flex items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                                    isActive ? "bg-white/10" : "hover:bg-white/5"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "mt-0.5",
                                      isDone ? "text-emerald-400" : "text-white/35"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void markSectionCompleted(item.id);
                                    }}
                                  >
                                    {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                  </span>
                                  <span
                                    className={cn(
                                      "text-sm leading-snug",
                                      item.level === 2 && "pl-3",
                                      item.level === 3 && "pl-6",
                                      isActive ? "text-white" : "text-white/75"
                                    )}
                                  >
                                    {item.text}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="px-3 py-4 text-sm text-white/60">Sem estrutura detectada.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon-sm">
                    <Settings2 size={16} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-black border-white/10">
                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-white">Preferências de Leitura</div>
                    <Separator className="bg-white/10" />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span>Tamanho da fonte</span>
                        <span>{settings.fontSize}px</span>
                      </div>
                      <Slider
                        min={14}
                        max={22}
                        step={1}
                        value={[settings.fontSize]}
                        onValueChange={(v) => setSettings((s) => ({ ...s, fontSize: v[0] }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span>Altura da linha</span>
                        <span>{settings.lineHeight.toFixed(2)}</span>
                      </div>
                      <Slider
                        min={1.4}
                        max={2.1}
                        step={0.05}
                        value={[settings.lineHeight]}
                        onValueChange={(v) => setSettings((s) => ({ ...s, lineHeight: v[0] }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-white/70">
                        <span>Largura do texto</span>
                        <span>{settings.maxWidth}px</span>
                      </div>
                      <Slider
                        min={680}
                        max={1120}
                        step={20}
                        value={[settings.maxWidth]}
                        onValueChange={(v) => setSettings((s) => ({ ...s, maxWidth: v[0] }))}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium text-white">Modo Foco</div>
                        <div className="text-xs text-white/60">Oculta o menu lateral</div>
                      </div>
                      <Switch
                        checked={settings.focusMode}
                        onCheckedChange={(checked) => setSettings((s) => ({ ...s, focusMode: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSettings(DEFAULT_SETTINGS)}>
                        Resetar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={resume}
                        disabled={!progress}
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 hidden sm:inline-flex"
                onClick={resume}
                disabled={!progress}
              >
                Continuar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className={cn("lg:flex gap-8", settings.focusMode && "lg:block")}>
          {!settings.focusMode && (
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-auto rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="px-4 py-3">
                  <div className="text-xs text-white/60">Progresso</div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">{displayProgressPercent}%</div>
                    <div className="text-xs text-white/60">
                      {filteredCompletedSections.length}/{toc.length || 0} seções
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress value={displayProgressPercent} className="h-2 bg-white/10" />
                  </div>
                </div>
                <Separator className="bg-white/10" />
                <div className="p-2">
                  {toc.length ? (
                    <div className="space-y-1">
                      {toc.map((item) => {
                        const isActive = activeHeadingId === item.id;
                        const isDone = filteredCompletedSections.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => scrollToHeading(item.id)}
                            className={cn(
                              "w-full flex items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                              isActive ? "bg-white/10" : "hover:bg-white/5"
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5",
                                isDone ? "text-emerald-400" : "text-white/35"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                void markSectionCompleted(item.id);
                              }}
                            >
                              {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                            </span>
                            <span
                              className={cn(
                                "text-sm leading-snug",
                                item.level === 2 && "pl-3",
                                item.level === 3 && "pl-6",
                                isActive ? "text-white" : "text-white/75"
                              )}
                            >
                              {item.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-sm text-white/60">Sem estrutura detectada.</div>
                  )}
                </div>
              </div>
            </aside>
          )}

          <main className="min-w-0 flex-1">
            <div className="mx-auto" style={{ maxWidth: settings.maxWidth }}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="text-xs text-white/60">
                    {filteredCompletedSections.length}/{toc.length || 0} seções concluídas
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activeHeadingId) void markSectionCompleted(activeHeadingId);
                    }}
                    disabled={!activeHeadingId}
                  >
                    Marcar seção
                  </Button>
                </div>

                <div
                  style={readerStyle}
                  className={cn(
                    "max-w-none",
                    "prose prose-invert prose-lg",
                    "prose-headings:text-white prose-strong:text-white",
                    "prose-p:text-white/80",
                    "prose-a:text-purple-300 prose-a:no-underline hover:prose-a:underline",
                    "prose-li:text-white/80",
                    "prose-code:text-purple-200 prose-pre:bg-black/50",
                    "prose-hr:border-white/10",
                    "prose-blockquote:text-white/75 prose-blockquote:border-purple-500/70"
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
