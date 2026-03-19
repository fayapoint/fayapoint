"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
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
      className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-white/40 hover:text-white/70 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
      aria-label="Copiar código"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
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
  const words = text.split(/\s+/).filter(Boolean).length;
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
    return chapters[index]?.id ?? null;
  }

  return null;
}

function normalizeSavedChapterIds(savedIds: string[], chapters: Chapter[]): string[] {
  return Array.from(
    new Set(
      savedIds
        .map((chapterId) => resolveSavedChapterId(chapterId, chapters))
        .filter((chapterId): chapterId is string => Boolean(chapterId))
    )
  );
}

function normalizeSavedHeadingId(savedId: string | null, chapters: Chapter[]): string | null {
  if (!savedId) return null;
  return resolveSavedChapterId(savedId, chapters);
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
  const [contentMeta, setContentMeta] = useState<{
    contentChapters: number;
    contentUpdatedAt: string | null;
    lessonContentCoverage: LessonContentCoverage | null;
    editorialVerification: EditorialVerification | null;
  } | null>(null);

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [showQuizModal, setShowQuizModal] = useState(false);

  /* ─── Access gating state ─── */
  const [courseAccess, setCourseAccess] = useState<CourseAccessDto | null>(null);

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
        return chapterIndex >= courseAccess.freeChapters;
      }
      return true;
    },
    [courseAccess]
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

        // 4. Fetch progress from server when possible, then fall back to local cache
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
              const serverLastHeadingId = p.lastHeadingId || null;

              rawCompletedRef.current = serverCompletedSections;
              resumeHeadingRef.current = serverLastHeadingId;

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
        setLoading(false);
      }
    };
    if (slug) fetchContent();
  }, [slug, router, locale]);

  /* ─── Restore position after chapters computed ─── */
  useEffect(() => {
    if (!chapters.length || initialLoadDone.current) return;
    initialLoadDone.current = true;

    // Normalize saved section IDs so legacy chapter-0 style progress still restores correctly.
    const valid = normalizeSavedChapterIds(rawCompletedRef.current, chapters);
    setCompletedChapterIds(new Set(valid));

    // Restore chapter position
    const savedId = normalizeSavedHeadingId(resumeHeadingRef.current, chapters);
    writeLocalProgress(slug, {
      completedSections: valid,
      lastHeadingId: savedId ?? undefined,
      progressPercent: chapters.length ? Math.round((valid.length / chapters.length) * 100) : 0,
    });
    if (savedId) {
      const idx = chapters.findIndex((ch) => ch.id === savedId);
      if (idx >= 0) setCurrentChapterIndex(idx);
    }
  }, [chapters, slug]);

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

        /* Special h2 treatments */
        if (level === 2) {
          const isExercicio = text.includes("Exercício Prático") || text.includes("Exercicio Pratico");
          const isResumo = text.includes("Resumo do Capítulo") || text.includes("Resumo do Capitulo");

          if (isExercicio) {
            return (
              <h2
                id={id}
                className={cn(
                  "scroll-mt-24 flex items-center gap-3 pb-3 mb-2 border-b-2 border-amber-400/30",
                  cls
                )}
                {...props}
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/20 shrink-0">
                  <Pencil size={18} className="text-amber-400" />
                </span>
                <span>{children}</span>
              </h2>
            );
          }

          if (isResumo) {
            return (
              <h2
                id={id}
                className={cn(
                  "scroll-mt-24 flex items-center gap-3 pb-3 mb-2 border-b-2 border-emerald-400/30",
                  cls
                )}
                {...props}
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/20 shrink-0">
                  <ListChecks size={18} className="text-emerald-400" />
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

      p: ({ className, ...props }: ParagraphProps) => (
        <p className={cn("text-[#c0c0ce] leading-[1.85]", className)} {...props} />
      ),

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
        <li className={cn("text-[#c0c0ce] pl-1", className)} {...props}>
          {children}
        </li>
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

      /* ── Blockquote with Dica Pro / Dica callout detection ── */
      blockquote: ({ className, children, ...props }: BlockquoteProps) => {
        const rawText = extractText(children);
        const isDicaPro = rawText.trimStart().startsWith("Dica Pro:");
        const isDica = !isDicaPro && rawText.trimStart().startsWith("Dica:");

        if (isDicaPro || isDica) {
          return (
            <aside
              className={cn(
                "relative my-8 rounded-2xl overflow-hidden",
                "bg-gradient-to-br from-amber-500/[0.08] via-amber-400/[0.04] to-yellow-500/[0.02]",
                "border border-amber-400/20",
                "shadow-lg shadow-amber-900/10",
                className
              )}
              {...props}
            >
              {/* Top accent bar */}
              <div className="h-[3px] bg-gradient-to-r from-amber-400/60 via-yellow-400/40 to-amber-400/20" />
              <div className="flex gap-4 px-6 py-5">
                <span className="flex items-center justify-center shrink-0 w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/20 mt-0.5">
                  <Lightbulb size={20} className="text-amber-400" />
                </span>
                <div className="flex-1 min-w-0 text-amber-100/90 [&>p]:text-amber-100/90 [&>p]:leading-[1.75] [&>p:first-child>strong:first-child]:text-amber-300 [&>p:first-child>strong:first-child]:font-semibold">
                  {children}
                </div>
              </div>
            </aside>
          );
        }

        return (
          <blockquote
            className={cn(
              "relative my-8 pl-6 pr-5 py-4 rounded-2xl bg-gradient-to-r from-violet-500/[0.06] to-purple-500/[0.02] border-l-[3px] border-violet-400/50",
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
                    style={oneDark as any}
                    language="text"
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: "1.25rem",
                      borderRadius: "1rem",
                      background: "#07070d",
                      border: "1px solid rgba(255,255,255,0.06)",
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
            <span className="absolute top-3 left-4 text-[10px] font-semibold tracking-wider text-white/25 uppercase select-none z-10">
              {langLabel}
            </span>
            <CodeCopyButton code={codeString} />
            <SyntaxHighlighter
              /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
              style={oneDark as any}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: 0,
                paddingTop: "2.25rem",
                paddingBottom: "1.25rem",
                paddingLeft: "1.25rem",
                paddingRight: "1.25rem",
                borderRadius: "1rem",
                background: "#07070d",
                border: "1px solid rgba(255,255,255,0.06)",
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
        return (
          <figure className="my-8 flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={cn(
                "rounded-2xl ring-1 ring-white/[0.06] max-w-full h-auto shadow-2xl shadow-black/40 hover:shadow-black/50 transition-shadow duration-500",
                "w-full sm:w-auto sm:max-h-[540px] object-contain",
                className
              )}
              alt={alt || ""}
              src={src}
              loading="lazy"
              decoding="async"
              {...props}
            />
            {caption && (
              <figcaption className="text-xs text-[#7a7a8e] italic text-center max-w-[90%] leading-relaxed">
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
        <div className="overflow-x-auto my-8 rounded-2xl ring-1 ring-white/[0.06] shadow-lg shadow-black/10">
          <table
            className={cn("min-w-full border-collapse text-left", className)}
            {...props}
          />
        </div>
      ),
      thead: ({ className, ...props }: THeadProps) => (
        <thead
          className={cn(
            "bg-gradient-to-r from-white/[0.04] to-white/[0.02]",
            className
          )}
          {...props}
        />
      ),
      tbody: ({ className, ...props }: TBodyProps) => (
        <tbody
          className={cn(
            "[&>tr:nth-child(even)]:bg-white/[0.02] [&>tr:hover]:bg-white/[0.04] [&>tr]:transition-colors [&>tr]:duration-150",
            className
          )}
          {...props}
        />
      ),
      tr: ({ className, ...props }: TrProps) => (
        <tr className={cn("border-b border-white/[0.04] last:border-b-0", className)} {...props} />
      ),
      th: ({ className, ...props }: ThProps) => (
        <th
          className={cn(
            "border-b border-white/[0.08] px-5 py-3.5 text-[13px] font-semibold text-white/85 tracking-wide whitespace-nowrap",
            className
          )}
          {...props}
        />
      ),
      td: ({ className, ...props }: TdProps) => (
        <td
          className={cn(
            "px-5 py-3 text-[13px] text-[#a8a8bb]",
            className
          )}
          {...props}
        />
      ),

      /* ── Strong / Em ── */
      strong: ({ className, ...props }: ComponentPropsWithoutRef<"strong"> & { node?: unknown }) => (
        <strong className={cn("text-white font-semibold", className)} {...props} />
      ),
      em: ({ className, ...props }: ComponentPropsWithoutRef<"em"> & { node?: unknown }) => (
        <em className={cn("text-[#c0b8d8] italic", className)} {...props} />
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

      <div className="border-b border-white/[0.04] bg-[#0e1018]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <Award size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">
                {isPtBr ? "Conteúdo verificado editorialmente" : "Editorially verified course content"}
              </p>
              <p className="text-xs text-white/45">
                {isPtBr
                  ? `Revisado em ${verifiedAtLabel} com canon ${editorialVerification.canonModels.join(" / ")}.`
                  : `Reviewed on ${verifiedAtLabel} using the ${editorialVerification.canonModels.join(" / ")} canon.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:items-end">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-white/65">
                {contentMeta?.lessonContentCoverage
                  ? isPtBr
                    ? `${contentMeta.lessonContentCoverage.coveragePercent}% das aulas com conteúdo real`
                    : `${contentMeta.lessonContentCoverage.coveragePercent}% of lessons have real content`
                  : isPtBr
                    ? "Cobertura editorial em atualização"
                    : "Editorial coverage updating"}
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-white/65">
                {isPtBr
                  ? `${contentMeta?.contentChapters || chapters.length} capítulos base`
                  : `${contentMeta?.contentChapters || chapters.length} base chapters`}
              </span>
              {contentUpdatedLabel && (
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-white/65">
                  {isPtBr ? `Atualizado ${contentUpdatedLabel}` : `Updated ${contentUpdatedLabel}`}
                </span>
              )}
            </div>

            {sourceLinks.length > 0 && (
              <div className="flex flex-wrap gap-3 text-[11px] text-white/45">
                {sourceLinks.map((link, index) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-white/10 underline-offset-4 transition-colors hover:text-violet-300"
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
                      ? "opacity-60 hover:bg-white/[0.02]"
                      : "hover:bg-white/[0.03]"
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
                        locked
                          ? "text-white/25"
                          : isCurrent
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
                        locked
                          ? "text-white/8"
                          : isCurrent
                          ? "text-violet-400/50"
                          : "text-white/12"
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
          {/* ─── Locked chapter → show paywall ─── */}
          {currentChapter && isChapterLocked(currentChapterIndex) ? (
            <div className="min-h-full flex flex-col">
              {/* Chapter header (dimmed) */}
              <div className="flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/[0.04] via-transparent to-purple-600/[0.02]" />
                <div
                  className="relative mx-auto px-8 sm:px-10 lg:px-14 py-10 sm:py-14"
                  style={{ maxWidth: settings.maxWidth + 120 }}
                >
                  <div className="flex items-baseline gap-5 mb-6">
                    <span className="text-6xl sm:text-7xl font-black bg-gradient-to-b from-white/10 to-white/[0.02] bg-clip-text text-transparent select-none leading-none tabular-nums">
                      {String(currentChapterIndex + 1).padStart(2, "0")}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400/50">
                        Capitulo {currentChapterIndex + 1} de {chapters.length}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-400/60">
                        <Lock size={10} />
                        Conteudo Premium
                      </span>
                    </div>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-bold text-white/40 tracking-tight leading-[1.2]">
                    {currentChapter.title}
                  </h1>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              </div>

              {/* Paywall */}
              <div className="flex-1 flex items-start justify-center p-6 sm:p-10">
                <div className="w-full" style={{ maxWidth: settings.maxWidth + 120 }}>
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
                        Capitulo {currentChapterIndex + 1} de {chapters.length}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-white/18 flex items-center gap-1">
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
                      "prose-img:rounded-2xl prose-img:ring-1 prose-img:ring-white/[0.06] prose-img:shadow-xl prose-img:shadow-black/30 prose-img:mx-auto",
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
                        className={cn(
                          "flex items-center justify-end gap-3 p-4 rounded-2xl transition-all duration-200 group text-right",
                          isChapterLocked(currentChapterIndex + 1)
                            ? "bg-amber-500/[0.04] hover:bg-amber-500/[0.08] border border-amber-500/10 hover:border-amber-500/20"
                            : "bg-violet-500/[0.04] hover:bg-violet-500/[0.08] border border-violet-500/10 hover:border-violet-500/20"
                        )}
                      >
                        <div className="min-w-0">
                          <span className={cn(
                            "text-[10px] uppercase tracking-wider block",
                            isChapterLocked(currentChapterIndex + 1) ? "text-amber-400/35" : "text-violet-400/35"
                          )}>
                            {isChapterLocked(currentChapterIndex + 1) ? "Premium" : "Proximo"}
                          </span>
                          <span className="text-sm text-white/55 group-hover:text-white/85 truncate block mt-0.5 transition-colors">
                            {chapters[currentChapterIndex + 1]?.title}
                          </span>
                        </div>
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 border",
                          isChapterLocked(currentChapterIndex + 1)
                            ? "bg-amber-500/10 group-hover:bg-amber-500/15 border-amber-500/15"
                            : "bg-violet-500/10 group-hover:bg-violet-500/15 border-violet-500/15"
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
