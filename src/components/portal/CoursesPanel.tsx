"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  Code2,
  Crown,
  Filter,
  Gift,
  Layers,
  Loader2,
  Lock,
  Palette,
  PlayCircle,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
  Wand2,
  Workflow,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { allCourses, getNormalizedLevel } from "@/data/courses";
import type { EnrollmentSlots, TierConfig } from "@/lib/course-tiers";
import { canPlanAccessMonthlyOffer, getCourseMonthlyOfferMeta } from "@/lib/monthly-course-offers";

interface CourseProgressCard {
  _id: string;
  courseId: string;
  progressPercent: number;
  completedLessons: string[];
  details?: {
    title: string;
    slug?: string;
    tool?: string;
    duration?: string;
    shortDescription?: string;
  };
}

interface CoursesPanelProps {
  tierConfig: TierConfig;
  enrollmentSlots: EnrollmentSlots | null;
  userCourses: CourseProgressCard[];
  enrolledSlugs: string[];
  isEnrolling: string | null;
  onEnroll: (courseSlug: string) => void;
}

const courseLevelLabels: Record<string, string> = {
  free: "Gratuito",
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const courseLevelBadgeStyles: Record<string, string> = {
  free: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  beginner: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
  intermediate: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  advanced: "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300",
};

const CLOUDINARY_BASE = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dfd7iigzq"}/image/upload`;

const COURSE_THUMBNAILS: Record<string, {
  logo?: string;
  thumbnailPath?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  gradient: string;
}> = {
  "chatgpt-masterclass": { thumbnailPath: "fayai/courses/chatgpt-masterclass/pw1gxfwkn4ideutfbalt.png", gradient: "from-emerald-600 to-teal-800" },
  "chatgpt-allowlisting": { thumbnailPath: "fayai/courses/chatgpt-allowlisting/bimrdbspupb5ph1qzch5.png", gradient: "from-emerald-700 to-cyan-900" },
  "claude-ia-segura": { thumbnailPath: "fayai/courses/claude-ia-segura/dodtsfgf3ucgi8nne9y4.png", gradient: "from-amber-700 to-orange-900" },
  "claude-cowork-colaboracao": { thumbnailPath: "fayai/courses/claude-cowork-colaboracao/yfw6jjm90lzss2qrwjkc.png", gradient: "from-orange-600 to-amber-800" },
  "ia-sem-filtro-por-claude": { thumbnailPath: "fayai/courses/ia-sem-filtro-por-claude/yk7p49jwv1zbrrkxiqyf.png", gradient: "from-violet-700 to-purple-900" },
  "gemini-ia-google": { thumbnailPath: "fayai/courses/gemini-ia-google/gxbns4pibwmjai9wy4yk.png", gradient: "from-blue-600 to-indigo-800" },
  "midjourney-arte-profissional": { thumbnailPath: "fayai/courses/midjourney-arte-profissional/esvtyrxyt2b7gk6qk1tr.png", gradient: "from-slate-700 to-zinc-900" },
  "leonardo-ai-criacao-visual": { thumbnailPath: "fayai/courses/leonardo-ai-criacao-visual/uz5xwksrh2c9e1i4tnae.png", gradient: "from-purple-600 to-fuchsia-800" },
  "n8n-automacao-avancada": { thumbnailPath: "fayai/courses/n8n-automacao-avancada/tse6ycz18sqcb7bdsg7z.png", gradient: "from-red-600 to-rose-800" },
  "make-integracao-total": { thumbnailPath: "fayai/courses/make-integracao-total/gkhavewcp1idon2a9nvq.png", gradient: "from-violet-600 to-indigo-800" },
  "perplexity-pesquisa-inteligente": { thumbnailPath: "fayai/courses/perplexity-pesquisa-inteligente/q52ftbf6hvhaspnxwo6i.png", gradient: "from-cyan-600 to-blue-800" },
  "banana-dev-deploy-ia": { thumbnailPath: "fayai/courses/banana-dev-deploy-ia/dsmelccwvukkfjkeskcy.png", gradient: "from-yellow-600 to-amber-800" },
  "prompt-engineering": { thumbnailPath: "fayai/courses/prompt-engineering/o8magdivbliteczkkxo9.png", gradient: "from-pink-600 to-rose-800" },
  "crie-agentes-de-ia-autonomos": { thumbnailPath: "fayai/courses/crie-agentes-de-ia-autonomos/ipjpkznojjcbl1sc0se5.png", gradient: "from-sky-600 to-blue-800" },
  "openclaw-ia-open-source": { thumbnailPath: "fayai/courses/openclaw-ia-open-source/t896tqfqy72zjt2jdhu8.png", gradient: "from-green-600 to-emerald-800" },
  "autoresearch-singularity": { thumbnailPath: "fayai/courses/autoresearch-singularity/bs1ybi8ww339u1j6gavy.png", gradient: "from-fuchsia-600 to-purple-900" },
  "primeiras-automacoes": { thumbnailPath: "fayai/courses/primeiras-automacoes/jkqklclcchprjq8d7qo8.png", gradient: "from-amber-600 to-yellow-800" },
};

function getCourseThumbnailUrl(slug: string): string | undefined {
  const entry = COURSE_THUMBNAILS[slug];
  return entry?.thumbnailPath ? `${CLOUDINARY_BASE}/${entry.thumbnailPath}` : undefined;
}

function CourseToolIcon({ logo, name, className }: { logo?: string; name: string; className?: string }) {
  const [error, setError] = useState(false);

  if (!logo || error) {
    return (
      <div className={cn("flex items-center justify-center rounded-xl bg-white/10", className)}>
        <span className="text-lg font-bold text-white/80">{name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={`${name} logo`}
      className={cn("object-contain", className)}
      onError={() => setError(true)}
    />
  );
}

type LibraryFilter = "all" | "beginner" | "intermediate" | "advanced";

export function CoursesPanel({
  tierConfig,
  enrollmentSlots,
  userCourses,
  enrolledSlugs,
  isEnrolling,
  onEnroll,
}: CoursesPanelProps) {
  const startedCourses = useMemo(
    () =>
      [...userCourses].sort((a, b) => {
        if (b.progressPercent !== a.progressPercent) return b.progressPercent - a.progressPercent;
        return a.courseId.localeCompare(b.courseId);
      }),
    [userCourses]
  );
  const activeCourses = startedCourses.filter((course) => course.progressPercent > 0 && course.progressPercent < 100);
  const readyToStartCourses = startedCourses.filter((course) => course.progressPercent === 0);
  const completedCourses = startedCourses.filter((course) => course.progressPercent >= 100);
  const journeyCourses = [...activeCourses, ...readyToStartCourses];


  const [apiFreeCourseSlug, setApiFreeCourseSlug] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/courses/monthly-offers", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.freeCourse?.slug) setApiFreeCourseSlug(data.freeCourse.slug);
      })
      .catch(() => {});
  }, []);

  const courseCatalog = useMemo(() => {
    return allCourses.map((course) => {
      const normalizedLevel = getNormalizedLevel(course);
      const isEnrolled = enrolledSlugs.includes(course.slug);
      const canAccessLevel = tierConfig.canAccessLevel(normalizedLevel);
      const monthlyOffer = getCourseMonthlyOfferMeta(course.slug);
      const slotCategory = normalizedLevel === "free" || normalizedLevel === "beginner" ? "beginner" : normalizedLevel;
      const slotsForLevel = enrollmentSlots?.[slotCategory as keyof EnrollmentSlots] ?? null;
      const hasAvailableSlot = tierConfig.limits.unlimited || !slotsForLevel || slotsForLevel.available > 0;
      const canAccessThisMonth = canPlanAccessMonthlyOffer(tierConfig.slug, course.slug);
      const isFreeMonthlyCourse = apiFreeCourseSlug
        ? course.slug === apiFreeCourseSlug
        : Boolean(monthlyOffer?.isFreeCourseOfMonth);

      return {
        ...course,
        normalizedLevel,
        monthlyOffer,
        isEnrolled,
        canAccessLevel,
        hasAvailableSlot,
        canAccessThisMonth,
        isFreeMonthlyCourse,
        canEnroll: !isEnrolled && (isFreeMonthlyCourse || (canAccessLevel && hasAvailableSlot && canAccessThisMonth)),
      };
    });
  }, [enrolledSlugs, enrollmentSlots, tierConfig, apiFreeCourseSlug]);

  const freeMonthlyCourse = courseCatalog.find((course) => course.isFreeMonthlyCourse) ?? null;
  const freeMonthlyCourseCanClaim = Boolean(freeMonthlyCourse && freeMonthlyCourse.canEnroll);
  const freeMonthlyCourseIsEnrolled = Boolean(freeMonthlyCourse && freeMonthlyCourse.isEnrolled);
  const planMonthlyCourses = courseCatalog
    .filter(
      (course) =>
        !course.isEnrolled &&
        !course.isFreeMonthlyCourse &&
        Boolean(course.monthlyOffer?.includedInPool) &&
        course.canAccessLevel &&
        course.canAccessThisMonth &&
        course.hasAvailableSlot
    )
    .slice(0, 6);
  const lockedByPlanCourses = courseCatalog
    .filter(
      (course) =>
        !course.isEnrolled &&
        !course.isFreeMonthlyCourse &&
        Boolean(course.monthlyOffer?.includedInPool) &&
        (!course.canAccessLevel || !course.canAccessThisMonth)
    )
    .slice(0, 4);
  const currentMonthlyPool = courseCatalog
    .filter((course) => Boolean(course.monthlyOffer?.includedInPool))
    .sort((left, right) => {
      if (left.isFreeMonthlyCourse !== right.isFreeMonthlyCourse) {
        return left.isFreeMonthlyCourse ? -1 : 1;
      }
      if (left.normalizedLevel !== right.normalizedLevel) {
        return left.normalizedLevel.localeCompare(right.normalizedLevel);
      }
      return left.title.localeCompare(right.title);
    });
  const totalSlotsAvailable = enrollmentSlots
    ? enrollmentSlots.beginner.available + enrollmentSlots.intermediate.available + enrollmentSlots.advanced.available
    : 0;
  const coursesAvailableNow = readyToStartCourses.length + planMonthlyCourses.length + (freeMonthlyCourseCanClaim ? 1 : 0);
  const certificateDiscountPercent = Math.round((tierConfig.quizDiscount || 0) * 100);

  // Library filter state
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilter>("all");
  const filteredLibraryCourses = useMemo(() => {
    if (libraryFilter === "all") return currentMonthlyPool;
    return currentMonthlyPool.filter(c => c.monthlyOffer?.poolLevel === libraryFilter);
  }, [currentMonthlyPool, libraryFilter]);

  const filterCounts = useMemo(() => ({
    all: currentMonthlyPool.length,
    beginner: currentMonthlyPool.filter(c => c.monthlyOffer?.poolLevel === "beginner").length,
    intermediate: currentMonthlyPool.filter(c => c.monthlyOffer?.poolLevel === "intermediate").length,
    advanced: currentMonthlyPool.filter(c => c.monthlyOffer?.poolLevel === "advanced").length,
  }), [currentMonthlyPool]);

  return (
    <div className="space-y-4 min-w-0 overflow-hidden">
      {/* ── COMPACT HERO STRIP ── */}
      <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card via-emerald-950/20 to-card p-4 md:p-5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/[0.06] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="border-amber-400/30 bg-amber-500/10 text-amber-200 text-[10px]">
              Plano {tierConfig.displayName}
            </Badge>
            <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-200 text-[10px]">
              {userCourses.length} curso{userCourses.length === 1 ? "" : "s"}
            </Badge>
            {!tierConfig.limits.unlimited && enrollmentSlots && (
              <Badge className="border-border bg-secondary text-white/80 text-[10px]">
                {totalSlotsAvailable} vaga{totalSlotsAvailable === 1 ? "" : "s"} livre{totalSlotsAvailable === 1 ? "" : "s"}
              </Badge>
            )}
          </div>

          <h2 className="text-lg md:text-2xl font-extrabold tracking-tight text-white">
            Sua biblioteca de cursos
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
            Retome de onde parou, explore o catálogo do seu plano e descubra novos cursos.
          </p>

          {/* Quick stats row */}
          <div className="flex gap-2 mt-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[
              { label: "Em andamento", value: activeCourses.length, color: "text-white" },
              { label: "Disponíveis", value: coursesAvailableNow, color: "text-emerald-300" },
              { label: "Concluídos", value: completedCourses.length, color: "text-fuchsia-300" },
            ].map((stat) => (
              <div key={stat.label} className="shrink-0 rounded-xl border border-border bg-black/25 px-3 py-2 min-w-[90px]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className={cn("text-xl font-black mt-0.5", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── ENROLLED COURSES — thumbnail gallery ── */}
      {startedCourses.length > 0 && (
        <Card className="border-border bg-card p-4 md:p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                <BookOpen size={15} className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold truncate">Seus Cursos</h3>
                <p className="text-xs text-muted-foreground">{startedCourses.length} no acervo</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
            {startedCourses.map((course) => {
              const thumb = COURSE_THUMBNAILS[course.courseId];
              const FallbackIcon = thumb?.icon || Sparkles;
              const gradient = thumb?.gradient || "from-slate-600 to-slate-800";
              const isCompleted = course.progressPercent >= 100;

              return (
                <Link key={course._id} href={`/portal/learn/${course.courseId}`}>
                  <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-amber-500/40">
                    <div className={cn(
                      "relative aspect-square flex items-center justify-center bg-gradient-to-br overflow-hidden",
                      !getCourseThumbnailUrl(course.courseId) && "p-3",
                      gradient
                    )}>
                      {getCourseThumbnailUrl(course.courseId) ? (
                        <img src={getCourseThumbnailUrl(course.courseId)} alt={course.courseId} className="w-full h-full object-cover" loading="lazy" />
                      ) : thumb?.logo ? (
                        <CourseToolIcon
                          logo={thumb.logo}
                          name={course.details?.tool || course.courseId}
                          className="w-10 h-10 rounded-lg"
                        />
                      ) : (
                        <FallbackIcon size={28} className="text-white/90" />
                      )}

                      <div className="absolute bottom-1.5 right-1.5">
                        <div className="relative w-7 h-7">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                            <circle
                              cx="18" cy="18" r="14"
                              fill="none"
                              stroke={isCompleted ? "#10b981" : "#f59e0b"}
                              strokeWidth="3"
                              strokeDasharray={`${course.progressPercent * 0.88} ${88 - course.progressPercent * 0.88}`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[7px] font-bold text-white">{course.progressPercent}%</span>
                          </div>
                        </div>
                      </div>

                      {isCompleted && (
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <CheckCircle2 size={12} className="text-white" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <PlayCircle size={22} className="text-white/0 group-hover:text-white/90 transition-all scale-75 group-hover:scale-100" />
                      </div>
                    </div>

                    <div className="p-2 flex-1 min-w-0">
                      <h4 className="text-[10px] md:text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                        {course.details?.title || course.courseId}
                      </h4>
                      <p className="text-[9px] text-muted-foreground mt-1 truncate">
                        {course.details?.tool || "IA"}
                      </p>
                    </div>

                    <div className="h-1 w-full bg-white/5">
                      <div
                        className={cn("h-full transition-all", isCompleted ? "bg-emerald-500" : "bg-amber-500")}
                        style={{ width: `${course.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── MONTHLY OFFER — compact card ── */}
      {freeMonthlyCourse && (
        <Card className="border-emerald-500/20 bg-card overflow-hidden">
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0">
                <Gift size={15} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold truncate">Oferta do Mês</h3>
                  <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-[9px] shrink-0">
                    GRÁTIS
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Curso completo + certificado</p>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-3 border border-border">
              <div className="flex gap-3 min-w-0">
                {/* Course thumbnail */}
                {(() => {
                  const thumb = COURSE_THUMBNAILS[freeMonthlyCourse.slug];
                  const FallbackIcon = thumb?.icon || Sparkles;
                  const gradient = thumb?.gradient || "from-emerald-600 to-teal-800";
                  return (
                    <div className={cn("w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 overflow-hidden", gradient)}>
                      {getCourseThumbnailUrl(freeMonthlyCourse.slug) ? (
                        <img src={getCourseThumbnailUrl(freeMonthlyCourse.slug)} alt={freeMonthlyCourse.slug} className="w-full h-full object-cover" loading="lazy" />
                      ) : thumb?.logo ? (
                        <CourseToolIcon logo={thumb.logo} name={freeMonthlyCourse.tool} className="w-8 h-8 rounded-lg" />
                      ) : (
                        <FallbackIcon size={22} className="text-white/90" />
                      )}
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{freeMonthlyCourse.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{freeMonthlyCourse.shortDescription}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock size={9} />{freeMonthlyCourse.duration}</span>
                    <span className="text-[10px] text-muted-foreground">{freeMonthlyCourse.totalLessons} aulas</span>
                    <Badge className={cn("text-[8px] h-3.5 px-1 border-0 shrink-0", courseLevelBadgeStyles[freeMonthlyCourse.normalizedLevel])}>
                      {courseLevelLabels[freeMonthlyCourse.normalizedLevel]}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <Link href={`/curso/${freeMonthlyCourse.slug}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full border-border bg-card text-white hover:bg-white/10 text-xs h-8">
                    Ver detalhes
                  </Button>
                </Link>
                {freeMonthlyCourseIsEnrolled ? (
                  <Link href={`/portal/learn/${freeMonthlyCourse.slug}`} className="flex-1">
                    <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-xs h-8 gap-1">
                      <CheckCircle2 size={12} /> Já liberado
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/curso/${freeMonthlyCourse.slug}`} className="flex-1">
                    <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black text-xs h-8 gap-1">
                      <Gift size={12} /> Adquirir US$1
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── COURSE LIBRARY — the main catalog view ── */}
      <Card className="border-border bg-card p-4 md:p-5 overflow-hidden">
        <div className="flex items-center justify-between mb-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <Sparkles size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">Biblioteca</h3>
              <p className="text-xs text-muted-foreground">{currentMonthlyPool.length} cursos na rotação deste mês</p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {([
            { key: "all" as const, label: "Todos" },
            { key: "beginner" as const, label: "Iniciantes" },
            { key: "intermediate" as const, label: "Intermediários" },
            { key: "advanced" as const, label: "Avançados" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setLibraryFilter(key)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                libraryFilter === key
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-secondary text-muted-foreground border border-border hover:text-white"
              )}
            >
              {label}
              {filterCounts[key] > 0 && (
                <span className="ml-1.5 text-[9px] opacity-70">{filterCounts[key]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Library cards */}
        <div className="space-y-2">
          {filteredLibraryCourses.length > 0 ? (
            filteredLibraryCourses.map((course) => {
              const thumb = COURSE_THUMBNAILS[course.slug];
              const FallbackIcon = thumb?.icon || Sparkles;
              const gradient = thumb?.gradient || "from-slate-600 to-slate-800";

              const statusLabel = course.isFreeMonthlyCourse
                ? "Grátis no mês"
                : course.isEnrolled
                  ? "No acervo"
                  : course.canAccessLevel && course.canAccessThisMonth && course.hasAvailableSlot
                    ? "Disponível"
                    : course.canAccessLevel && course.canAccessThisMonth && !course.hasAvailableSlot
                      ? "Sem vaga"
                      : "Upgrade";
              const statusClass = course.isFreeMonthlyCourse
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                : course.isEnrolled
                  ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                  : course.canAccessLevel && course.canAccessThisMonth && course.hasAvailableSlot
                    ? "bg-white/5 text-white/70 border-border"
                    : course.canAccessLevel && course.canAccessThisMonth && !course.hasAvailableSlot
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                      : "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20";
              const isLocked = !course.isEnrolled && !course.canEnroll && !course.isFreeMonthlyCourse;

              return (
                <div
                  key={course.slug}
                  className={cn(
                    "bg-secondary rounded-lg p-3 border border-border transition-all overflow-hidden",
                    course.isEnrolled && "hover:border-emerald-500/30 cursor-pointer",
                    course.canEnroll && "hover:border-amber-500/30 cursor-pointer",
                    isLocked && "opacity-60"
                  )}
                  onClick={() => {
                    if (course.isEnrolled) {
                      window.location.href = `/portal/learn/${course.slug}`;
                    }
                  }}
                >
                  <div className="flex gap-3 min-w-0">
                    {/* Thumbnail */}
                    <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 overflow-hidden", gradient)}>
                      {getCourseThumbnailUrl((course as any).slug || (course as any).courseId) ? (
                        <img src={getCourseThumbnailUrl((course as any).slug || (course as any).courseId)} alt={course.slug} className="w-full h-full object-cover" loading="lazy" />
                      ) : thumb?.logo ? (
                        <CourseToolIcon logo={thumb.logo} name={course.tool} className="w-7 h-7 rounded-lg" />
                      ) : (
                        <FallbackIcon size={18} className="text-white/90" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate flex-1 min-w-0">{course.title}</h4>
                        <Badge className={cn("text-[9px] h-4 px-1.5 border shrink-0", statusClass)}>
                          {statusLabel}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock size={9} />{course.duration}</span>
                        <span className="text-[10px] text-muted-foreground">{course.tool}</span>
                        <Badge className={cn("text-[8px] h-3.5 px-1 border-0 shrink-0", courseLevelBadgeStyles[course.normalizedLevel])}>
                          {courseLevelLabels[course.normalizedLevel]}
                        </Badge>
                      </div>

                      {/* Action row */}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-muted-foreground/70 truncate flex-1 min-w-0 mr-2">
                          {course.totalLessons} aulas
                        </p>
                        {course.isEnrolled ? (
                          <Link href={`/portal/learn/${course.slug}`} className="shrink-0">
                            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                              <PlayCircle size={10} /> Continuar
                            </span>
                          </Link>
                        ) : course.canEnroll ? (
                          <Button
                            size="sm"
                            className="h-6 text-[10px] px-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold gap-1"
                            onClick={(e) => { e.stopPropagation(); onEnroll(course.slug); }}
                            disabled={isEnrolling === course.slug}
                          >
                            {isEnrolling === course.slug ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : course.isFreeMonthlyCourse ? (
                              <><Gift size={10} /> US$1</>
                            ) : (
                              <><Sparkles size={10} /> Liberar</>
                            )}
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50 shrink-0 flex items-center gap-0.5">
                            {isLocked && <Lock size={9} />}
                            {course.hasAvailableSlot ? "Upgrade" : "Próximo ciclo"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6">
              <Filter size={20} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Nenhum curso nessa faixa neste mês</p>
            </div>
          )}
        </div>
      </Card>

      {/* ── PLAN CATALOG — available courses to enroll ── */}
      {planMonthlyCourses.length > 0 && (
        <Card className="border-border bg-card p-4 md:p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shrink-0">
                <Rocket size={15} className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold truncate">Catálogo do plano</h3>
                <p className="text-xs text-muted-foreground">Incluído no plano {tierConfig.displayName} este mês</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {planMonthlyCourses.map((course) => {
              const thumb = COURSE_THUMBNAILS[course.slug];
              const FallbackIcon = thumb?.icon || Sparkles;
              const gradient = thumb?.gradient || "from-slate-600 to-slate-800";

              return (
                <div key={course.slug} className="bg-secondary rounded-lg p-3 border border-border hover:border-emerald-500/30 transition-all overflow-hidden">
                  <div className="flex gap-3 min-w-0">
                    <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 overflow-hidden", gradient)}>
                      {getCourseThumbnailUrl((course as any).slug || (course as any).courseId) ? (
                        <img src={getCourseThumbnailUrl((course as any).slug || (course as any).courseId)} alt={course.slug} className="w-full h-full object-cover" loading="lazy" />
                      ) : thumb?.logo ? (
                        <CourseToolIcon logo={thumb.logo} name={course.tool} className="w-7 h-7 rounded-lg" />
                      ) : (
                        <FallbackIcon size={18} className="text-white/90" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{course.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.shortDescription}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock size={9} />{course.duration}</span>
                        <span className="text-[10px] text-muted-foreground">{course.totalLessons} aulas</span>
                        <Badge className={cn("text-[8px] h-3.5 px-1 border-0 shrink-0", courseLevelBadgeStyles[course.normalizedLevel])}>
                          {courseLevelLabels[course.normalizedLevel]}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs px-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold gap-1"
                          onClick={() => onEnroll(course.slug)}
                          disabled={isEnrolling === course.slug}
                        >
                          {isEnrolling === course.slug ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <><Sparkles size={12} /> Liberar no plano</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── FEATURED COURSE — compact ── */}
      {journeyCourses.length > 0 && journeyCourses[0] && (() => {
        const featured = journeyCourses[0];
        const isActive = featured.progressPercent > 0 && featured.progressPercent < 100;

        return (
          <Link href={`/portal/learn/${featured.courseId}`}>
            <Card className="group relative overflow-hidden border-emerald-500/20 bg-card p-4 md:p-5 transition hover:border-emerald-400/40">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shrink-0">
                  <TrendingUp size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200 text-[9px]">
                      {isActive ? "Continue agora" : "Pronto para começar"}
                    </Badge>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white truncate group-hover:text-emerald-200 transition-colors">
                    {featured.details?.title || featured.courseId}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {featured.details?.shortDescription || "Retome de onde parou com progresso salvo."}
                  </p>
                  <div className="mt-3">
                    <Progress value={featured.progressPercent} className="h-1.5 bg-white/10" />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-muted-foreground">{featured.progressPercent}% concluído</span>
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                        Abrir <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        );
      })()}

      {/* ── OTHER JOURNEY COURSES ── */}
      {journeyCourses.length > 1 && (
        <div className="space-y-2">
          {journeyCourses.slice(1, 5).map((course) => {
            const isActive = course.progressPercent > 0 && course.progressPercent < 100;

            return (
              <Link key={course._id} href={`/portal/learn/${course.courseId}`}>
                <div className="bg-secondary rounded-lg p-3 border border-border hover:border-emerald-500/30 transition-all cursor-pointer group overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5 gap-2 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate min-w-0 flex-1 group-hover:text-emerald-400 transition-colors">
                      {course.details?.title || course.courseId}
                    </h4>
                    <span className={cn(
                      "text-sm font-extrabold ml-2 tabular-nums shrink-0",
                      course.progressPercent === 100 ? "text-green-400" : "text-emerald-400"
                    )}>
                      {course.progressPercent}%
                    </span>
                  </div>
                  <Progress value={course.progressPercent} className="h-1 bg-secondary" />
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-xs text-muted-foreground/70 flex items-center gap-1">
                      {course.details?.tool && <span>{course.details.tool}</span>}
                      {course.details?.duration && <span>· {course.details.duration}</span>}
                    </p>
                    <p className="text-xs text-emerald-400/70 flex items-center gap-0.5">
                      <PlayCircle size={10} /> {isActive ? "Continuar" : "Começar"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── COMPLETED COURSES ── */}
      {completedCourses.length > 0 && (
        <Card className="border-border bg-card p-4 md:p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0">
                <Award size={15} className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold truncate">Concluídos</h3>
                <p className="text-xs text-muted-foreground">{completedCourses.length} curso{completedCourses.length === 1 ? "" : "s"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {completedCourses.slice(0, 6).map((course) => (
              <Link key={course._id} href={`/portal/learn/${course.courseId}`}>
                <div className="bg-secondary rounded-lg p-3 border border-border hover:border-emerald-500/30 transition-all cursor-pointer group overflow-hidden">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      <h4 className="text-sm font-semibold text-foreground truncate min-w-0 group-hover:text-emerald-400 transition-colors">
                        {course.details?.title || course.courseId}
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5 shrink-0">
                      Revisar <ChevronRight size={10} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* ── LOCKED COURSES — upgrade upsell ── */}
      {lockedByPlanCourses.length > 0 && (
        <Card className="border-yellow-500/10 bg-card p-4 md:p-5 overflow-hidden">
          <div className="flex items-center gap-2 mb-3 min-w-0">
            <Lock size={14} className="text-yellow-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-base font-bold truncate">Exigem upgrade</h3>
              <p className="text-xs text-muted-foreground">Cursos fora da faixa do plano {tierConfig.displayName}</p>
            </div>
          </div>

          <div className="space-y-2">
            {lockedByPlanCourses.map((course) => {
              const thumb = COURSE_THUMBNAILS[course.slug];
              const FallbackIcon = thumb?.icon || Sparkles;
              const gradient = thumb?.gradient || "from-slate-600 to-slate-800";

              return (
                <div key={course.slug} className="bg-secondary rounded-lg p-3 border border-border opacity-60 overflow-hidden">
                  <div className="flex gap-3 min-w-0">
                    <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0 overflow-hidden", gradient)}>
                      {getCourseThumbnailUrl((course as any).slug || (course as any).courseId) ? (
                        <img src={getCourseThumbnailUrl((course as any).slug || (course as any).courseId)} alt={course.slug} className="w-full h-full object-cover" loading="lazy" />
                      ) : thumb?.logo ? (
                        <CourseToolIcon logo={thumb.logo} name={course.tool} className="w-6 h-6 rounded-md" />
                      ) : (
                        <FallbackIcon size={16} className="text-white/70" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{course.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{course.duration}</span>
                        <Badge className={cn("text-[8px] h-3.5 px-1 border-0 shrink-0", courseLevelBadgeStyles[course.normalizedLevel])}>
                          {courseLevelLabels[course.normalizedLevel]}
                        </Badge>
                      </div>
                    </div>
                    <Lock size={12} className="text-fuchsia-300/50 shrink-0 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>

          <Link href="/precos">
            <Button size="sm" className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold gap-1 text-xs h-8">
              <Crown size={12} /> Ver Planos
            </Button>
          </Link>
        </Card>
      )}

      {/* ── CERTIFICATION INFO — compact ── */}
      <Card className="border-border bg-card p-4 md:p-5 overflow-hidden">
        <div className="flex items-center gap-2 mb-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
            <Award size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold truncate">Certificação</h3>
            <p className="text-xs text-muted-foreground">Como funciona no seu plano</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="bg-secondary rounded-lg p-3 border border-emerald-500/15">
            <p className="text-xs font-semibold text-emerald-300">Oferta do Mês — US$1</p>
            <p className="text-xs text-muted-foreground mt-1">Acesso vitalício + certificado verificável incluído.</p>
          </div>
          <div className="bg-secondary rounded-lg p-3 border border-border">
            <p className="text-xs font-semibold text-white">Cursos do plano</p>
            <p className="text-xs text-muted-foreground mt-1">
              {certificateDiscountPercent > 0
                ? `Certificação com ${certificateDiscountPercent}% de desconto no plano ${tierConfig.displayName}.`
                : "Certificação disponível ao concluir qualquer curso."}
            </p>
          </div>
        </div>
      </Card>

      {/* ── UPGRADE CTA ── */}
      {!tierConfig.limits.unlimited && (
        <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-r from-amber-950/60 via-card to-amber-950/60 p-4">
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
                <Crown size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate">Mais cursos e mais vagas</h3>
                <p className="text-[11px] text-muted-foreground truncate">Desbloqueie todos os níveis com upgrade.</p>
              </div>
            </div>
            <Link href="/precos" className="shrink-0">
              <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold gap-1 text-xs h-8 px-3 shadow-lg shadow-orange-500/20">
                <TrendingUp size={12} /> Upgrade
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
