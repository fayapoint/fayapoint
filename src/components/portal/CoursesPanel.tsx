"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Crown,
  Gift,
  Loader2,
  Lock,
  PlayCircle,
  Rocket,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { allCourses, getNormalizedLevel } from "@/data/courses";
import type { EnrollmentSlots, TierConfig } from "@/lib/course-tiers";
import { canPlanAccessMonthlyOffer, getCourseMonthlyOfferMeta } from "@/lib/monthly-course-offers";
import { useExchangeRate } from "@/hooks/useExchangeRate";

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

  const { formattedBrl, conversionDisplay } = useExchangeRate();

  // Fetch the real free course slug from the API (reads Mission Control override)
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
      // Use API slug (Mission Control truth) over sync algorithm
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
  const rotationPreviewCourses = courseCatalog
    .filter(
      (course) =>
        !course.isEnrolled &&
        !course.isFreeMonthlyCourse &&
        !course.monthlyOffer?.includedInPool &&
        course.canAccessLevel
    )
    .slice(0, 3);
  const lockedByPlanCourses = courseCatalog
    .filter(
      (course) =>
        !course.isEnrolled &&
        !course.isFreeMonthlyCourse &&
        Boolean(course.monthlyOffer?.includedInPool) &&
        (!course.canAccessLevel || !course.canAccessThisMonth)
    )
    .slice(0, 4);
  const slotLockedCourses = courseCatalog
    .filter(
      (course) =>
        !course.isEnrolled &&
        !course.isFreeMonthlyCourse &&
        Boolean(course.monthlyOffer?.includedInPool) &&
        course.canAccessLevel &&
        course.canAccessThisMonth &&
        !course.hasAvailableSlot
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
  const monthlyPoolByLevel = {
    beginner: currentMonthlyPool.filter((course) => course.monthlyOffer?.poolLevel === "beginner"),
    intermediate: currentMonthlyPool.filter((course) => course.monthlyOffer?.poolLevel === "intermediate"),
    advanced: currentMonthlyPool.filter((course) => course.monthlyOffer?.poolLevel === "advanced"),
  };
  const featuredCourse = journeyCourses[0] ?? completedCourses[0] ?? null;
  const featuredCourseState = featuredCourse
    ? activeCourses.some((course) => course._id === featuredCourse._id)
      ? "active"
      : readyToStartCourses.some((course) => course._id === featuredCourse._id)
        ? "ready"
        : "completed"
    : null;
  const secondaryJourneyCourses = journeyCourses
    .filter((course) => course._id !== featuredCourse?._id)
    .slice(0, 6);
  const totalSlotsAvailable = enrollmentSlots
    ? enrollmentSlots.beginner.available + enrollmentSlots.intermediate.available + enrollmentSlots.advanced.available
    : 0;
  const coursesAvailableNow = readyToStartCourses.length + planMonthlyCourses.length + (freeMonthlyCourseCanClaim ? 1 : 0);
  const certificateDiscountPercent = Math.round((tierConfig.quizDiscount || 0) * 100);
  const featuredBadgeLabel =
    featuredCourseState === "active"
      ? "Continue agora"
      : featuredCourseState === "ready"
        ? "Pronto para começar"
        : "Concluído";
  const featuredEyebrow =
    featuredCourseState === "active"
      ? "Curso em destaque da sua jornada"
      : featuredCourseState === "ready"
        ? "Próximo curso pronto para destravar"
        : "Conquista já concluída";
  const featuredDescription =
    featuredCourseState === "active"
      ? featuredCourse?.details?.shortDescription || "Retome exatamente de onde você parou, com progresso salvo e continuidade imediata."
      : featuredCourseState === "ready"
        ? featuredCourse?.details?.shortDescription || "Esse curso já está liberado para você começar agora, sem atrito e sem perder ritmo."
        : featuredCourse?.details?.shortDescription || "Curso concluído com sucesso. Você pode revisar pontos-chave ou seguir para a próxima trilha."
  const featuredNextStepCopy =
    featuredCourseState === "active"
      ? "Seu próximo passo já está pronto para continuar."
      : featuredCourseState === "ready"
        ? "Tudo pronto para começar essa trilha agora."
        : "Essa trilha já foi concluída. Hora de puxar a próxima."

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(147,51,234,0.22),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_32%),linear-gradient(135deg,rgba(10,10,20,0.98),rgba(15,23,42,0.95))] p-6">
        <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.4fr,0.9fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-purple-400/30 bg-purple-500/10 text-purple-200">
                Plano {tierConfig.displayName}
              </Badge>
              <Badge className="border-emerald-400/30 bg-emerald-500/10 text-emerald-200">
                {userCourses.length} curso{userCourses.length === 1 ? "" : "s"} no seu acervo
              </Badge>
              {!tierConfig.limits.unlimited && enrollmentSlots && (
                <Badge className="border-white/10 bg-white/5 text-white/80">
                  {totalSlotsAvailable} vaga{totalSlotsAvailable === 1 ? "" : "s"} livre{totalSlotsAvailable === 1 ? "" : "s"} este mês
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                Seu próximo passo em IA precisa estar claro.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-gray-300 md:text-base">
                Retome seu próximo capítulo, enxergue o que cabe no seu plano agora e descubra quais cursos desbloqueiam mais valor sem sair da jornada.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Em andamento</p>
                <p className="mt-2 text-3xl font-black text-white">{activeCourses.length}</p>
                <p className="mt-1 text-xs text-gray-400">Cursos que realmente pedem retomada agora.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Disponíveis agora</p>
                <p className="mt-2 text-3xl font-black text-emerald-300">{coursesAvailableNow}</p>
                <p className="mt-1 text-xs text-gray-400">Entre cursos liberados, grátis do mês e catálogo atual do plano.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Concluídos</p>
                <p className="mt-2 text-3xl font-black text-fuchsia-300">{completedCourses.length}</p>
                <p className="mt-1 text-xs text-gray-400">Cursos já fechados e prontos para certificação ou revisão.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Capacidade do plano</p>
                <h3 className="mt-2 text-xl font-bold text-white">Mapa de vagas</h3>
              </div>
              {!tierConfig.limits.unlimited && (
                <Link href="/precos">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <Crown size={16} className="mr-2" />
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>

            <div className="mt-5 space-y-4">
              {[
                { key: "beginner", label: "Iniciantes", accent: "bg-cyan-400", tone: "text-cyan-300" },
                { key: "intermediate", label: "Intermediários", accent: "bg-amber-400", tone: "text-amber-300" },
                { key: "advanced", label: "Avançados", accent: "bg-fuchsia-400", tone: "text-fuchsia-300" },
              ].map(({ key, label, accent, tone }) => {
                const slot = enrollmentSlots?.[key as keyof EnrollmentSlots];
                const used = slot?.used ?? 0;
                const limit = slot?.limit ?? 0;
                const width = limit && limit !== Infinity ? Math.min(100, (used / limit) * 100) : 0;
                return (
                  <div key={key} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className={cn("text-sm font-semibold", tone)}>{label}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          {slot ? `${slot.available} ${slot.available === 1 ? "vaga disponível" : "vagas disponíveis"}` : "Carregando vagas..."}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-white">{used}/{limit === Infinity ? "∞" : limit}</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className={cn("h-full rounded-full", accent)} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="overflow-hidden border-emerald-500/20 bg-[linear-gradient(135deg,rgba(6,95,70,0.18),rgba(3,7,18,0.98))] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                <Gift size={13} className="mr-2" />
                Oferta do Mês — R$1
              </Badge>
              <div>
                <h3 className="text-2xl font-black text-white">
                  {freeMonthlyCourse?.title || `Todo mês um curso completo por apenas US$1 (${formattedBrl})`}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/80">
                  {freeMonthlyCourse
                    ? `Curso completo com acesso vitalício + certificado verificável por US$1 (${formattedBrl}). Oferta exclusiva deste mês.`
                    : `A cada mês um curso completo fica disponível por US$1 (${formattedBrl}) para qualquer conta experimentar o valor real da academia.`}
                </p>
              </div>
            </div>
            {freeMonthlyCourse && (
              <Badge className={cn("border text-xs", courseLevelBadgeStyles[freeMonthlyCourse.normalizedLevel])}>
                {courseLevelLabels[freeMonthlyCourse.normalizedLevel]}
              </Badge>
            )}
          </div>

          {freeMonthlyCourse ? (
            <div className="mt-6 grid gap-4 md:grid-cols-[1fr,auto]">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Ferramenta</p>
                  <p className="mt-2 text-lg font-bold text-white">{freeMonthlyCourse.tool}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Duração</p>
                  <p className="mt-2 text-lg font-bold text-white">{freeMonthlyCourse.duration}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Certificado</p>
                  <p className="mt-2 text-lg font-bold text-white">Incluído</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Link href={`/curso/${freeMonthlyCourse.slug}`}>
                  <Button variant="outline" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10">
                    Ver detalhes
                  </Button>
                </Link>
                {freeMonthlyCourseIsEnrolled ? (
                  <Link href={`/portal/learn/${freeMonthlyCourse.slug}`}>
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:from-emerald-400 hover:to-cyan-400">
                      <CheckCircle2 size={16} className="mr-2" />
                      Já liberado
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/curso/${freeMonthlyCourse.slug}`}>
                    <Button
                      className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:from-emerald-400 hover:to-cyan-400"
                    >
                      <Gift size={16} className="mr-2" />
                      Adquirir por US$1
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-gray-400">
              A rotação mensal não encontrou um curso gratuito válido. Vale revisar o catálogo ativo deste mês.
            </div>
          )}
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(3,7,18,0.96))] p-6">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-1 text-cyan-300" size={20} />
            <div>
              <h3 className="text-xl font-bold text-white">Seu plano neste mês</h3>
              <p className="mt-1 text-sm text-gray-400">
                Clareza total sobre o que já está incluído, o que entra na rotação e o que depende de upgrade.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Incluído agora</p>
              <p className="mt-2 text-2xl font-black text-white">{planMonthlyCourses.length + (freeMonthlyCourseCanClaim ? 1 : 0)}</p>
              <p className="mt-1 text-xs text-gray-400">Oferta do mês (US$1) + catálogo do seu plano disponível nesta rotação.</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Exige upgrade</p>
              <p className="mt-2 text-2xl font-black text-fuchsia-300">{lockedByPlanCourses.length}</p>
              <p className="mt-1 text-xs text-gray-400">Cursos do mês atual fora da faixa desbloqueada pelo seu plano.</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Próxima rotação</p>
              <p className="mt-2 text-2xl font-black text-cyan-300">{rotationPreviewCourses.length}</p>
              <p className="mt-1 text-xs text-gray-400">Cursos que podem aparecer em outro mês, mantendo a vitrine sempre fresca.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_10%,rgba(3,7,18,0.96)_100%)] p-6 backdrop-blur-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Pool mensal completo</h3>
              <p className="mt-1 text-sm text-gray-400">
                Aqui está a vitrine inteira do mês, com a oferta por US$1, o que seu plano já libera e o que ainda pede upgrade.
              </p>
            </div>
            <Badge className="border-white/10 bg-white/[0.04] text-white/80">
              {currentMonthlyPool.length} curso{currentMonthlyPool.length === 1 ? "" : "s"} na rotação
            </Badge>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {[
              { key: "beginner", title: "Iniciantes", tone: "text-cyan-300" },
              { key: "intermediate", title: "Intermediários", tone: "text-amber-300" },
              { key: "advanced", title: "Avançados", tone: "text-fuchsia-300" },
            ].map(({ key, title, tone }) => {
              const courses = monthlyPoolByLevel[key as keyof typeof monthlyPoolByLevel];

              return (
                <div key={key} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className={cn("text-sm font-semibold", tone)}>{title}</h4>
                    <span className="text-xs text-gray-500">{courses.length}</span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {courses.length > 0 ? (
                      courses.map((course) => {
                        const statusLabel = course.isFreeMonthlyCourse
                          ? `US$1 (${formattedBrl}) — Oferta do mês`
                          : course.isEnrolled
                            ? "Já no seu acervo"
                            : course.canAccessLevel && course.canAccessThisMonth && course.hasAvailableSlot
                              ? "Disponível no seu plano"
                              : course.canAccessLevel && course.canAccessThisMonth && !course.hasAvailableSlot
                                ? "Sem vaga neste ciclo"
                                : "Upgrade necessário";
                        const statusClass = course.isFreeMonthlyCourse
                          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                          : course.isEnrolled
                            ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
                            : course.canAccessLevel && course.canAccessThisMonth && course.hasAvailableSlot
                              ? "border-white/10 bg-white/[0.05] text-white/80"
                              : course.canAccessLevel && course.canAccessThisMonth && !course.hasAvailableSlot
                                ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
                                : "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200";

                        return (
                          <div key={course.slug} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{course.title}</p>
                                <p className="mt-1 text-xs text-gray-500">{course.duration} · {course.tool}</p>
                              </div>
                              <Badge className={cn("border text-[10px]", statusClass)}>
                                {statusLabel}
                              </Badge>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-sm text-gray-500">
                        Nenhum curso nessa faixa nesta rotação.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(3,7,18,0.96))] p-6 backdrop-blur-2xl">
          <div className="flex items-start gap-3">
            <Award className="mt-1 text-emerald-300" size={20} />
            <div>
              <h3 className="text-xl font-bold text-white">Certificação neste mês</h3>
              <p className="mt-1 text-sm text-gray-400">
                Entenda em quais cursos o certificado já está incluído e onde o seu plano entra como vantagem.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-[22px] border border-emerald-400/15 bg-emerald-500/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Oferta do Mês — US$1 ({formattedBrl})</p>
              <p className="mt-2 text-lg font-bold text-white">Acesso vitalício + certificado por US$1</p>
              <p className="mt-1 text-sm leading-6 text-emerald-50/75">
                O curso do mês inclui acesso permanente e certificado verificável. Uma aquisição real por um valor simbólico.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Cursos do plano neste mês</p>
              <p className="mt-2 text-lg font-bold text-white">
                {certificateDiscountPercent > 0
                  ? `Certificação com ${certificateDiscountPercent}% de desconto no seu plano`
                  : "Certificação disponível conforme a trilha escolhida"}
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-400">
                Ao concluir qualquer curso da sua pool mensal, você decide em qual deles quer avançar com a certificação usando o benefício do seu plano.
              </p>
            </div>

            <div className="rounded-[22px] border border-cyan-400/10 bg-cyan-500/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Como aproveitar melhor este mês</p>
              <p className="mt-2 text-sm leading-6 text-cyan-50/75">
                Comece pela oferta do mês por US$1, compare a pool liberada no seu plano e use o upgrade só quando quiser destravar o próximo nível.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {featuredCourse && (
        <div className="grid gap-4 xl:grid-cols-[1.3fr,0.7fr]">
          <Link href={`/portal/learn/${featuredCourse.courseId}`}>
            <Card className="group relative overflow-hidden border-emerald-500/20 bg-[linear-gradient(135deg,rgba(6,78,59,0.24),rgba(3,7,18,0.98))] p-6 transition hover:-translate-y-0.5 hover:border-emerald-400/40">
              <div className="absolute right-4 top-4 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                {featuredBadgeLabel}
              </div>
              <div className="flex h-full flex-col justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-200/80">
                    <TrendingUp size={14} />
                    {featuredEyebrow}
                  </div>
                  <div>
                    <h3 className="max-w-2xl text-2xl font-black leading-tight text-white md:text-3xl">
                      {featuredCourse.details?.title || featuredCourse.courseId}
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80">
                      {featuredDescription}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Progresso</p>
                    <p className="mt-2 text-3xl font-black text-white">{featuredCourse.progressPercent}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Ferramenta</p>
                    <p className="mt-2 text-lg font-bold text-white">{featuredCourse.details?.tool || "IA"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Duração</p>
                    <p className="mt-2 text-lg font-bold text-white">{featuredCourse.details?.duration || "Curso completo"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Progress value={featuredCourse.progressPercent} className="h-2.5 bg-white/10" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-emerald-100/80">{featuredNextStepCopy}</p>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200">
                      Abrir curso
                      <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <div className="space-y-4">
            {secondaryJourneyCourses.length > 0 ? (
              secondaryJourneyCourses.map((course) => {
                const isActive = course.progressPercent > 0 && course.progressPercent < 100;
                const badgeLabel = isActive ? "Em andamento" : "Pronto para começar";
                const badgeClassName = isActive
                  ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200"
                  : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
                const progressCopy = isActive ? `${course.progressPercent}% concluído` : "Ainda não iniciado";

                return (
                <Link key={course._id} href={`/portal/learn/${course.courseId}`}>
                  <Card className="group border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-400/30 hover:bg-white/[0.05]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <Badge className={badgeClassName}>{badgeLabel}</Badge>
                        <h4 className="line-clamp-2 text-base font-bold text-white group-hover:text-cyan-200">
                          {course.details?.title || course.courseId}
                        </h4>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          <span className="inline-flex items-center gap-1"><Clock size={12} />{course.details?.duration || "Curso completo"}</span>
                          <span className="inline-flex items-center gap-1"><BarChart3 size={12} />{progressCopy}</span>
                        </div>
                      </div>
                      <PlayCircle className="mt-1 text-cyan-300 transition group-hover:scale-105" size={22} />
                    </div>
                    <Progress value={course.progressPercent} className="mt-4 h-2 bg-white/10" />
                  </Card>
                </Link>
                );
              })
            ) : (
              <Card className="border-dashed border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start gap-3">
                  <Rocket className="mt-0.5 text-purple-300" size={20} />
                  <div>
                    <h4 className="font-semibold text-white">Pronto para acelerar?</h4>
                    <p className="mt-1 text-sm text-gray-400">
                      Assim que você começar novas trilhas, elas aparecem aqui como atalhos de retomada.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {completedCourses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Cursos concluídos</h3>
              <p className="mt-1 text-sm text-gray-400">
                Revise o que já concluiu, escolha onde emitir certificado e mantenha sua evolução visível.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-gray-300">
              {completedCourses.length} concluído{completedCourses.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {completedCourses.slice(0, 6).map((course) => (
              <Link key={course._id} href={`/portal/learn/${course.courseId}`}>
                <Card className="group border-white/10 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),rgba(3,7,18,0.96))] p-5 transition hover:border-emerald-400/30 hover:bg-[linear-gradient(180deg,rgba(16,185,129,0.12),rgba(3,7,18,0.98))]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <Badge className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                        Concluído
                      </Badge>
                      <h4 className="line-clamp-2 text-lg font-bold text-white group-hover:text-emerald-200">
                        {course.details?.title || course.courseId}
                      </h4>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1"><Clock size={12} />{course.details?.duration || "Curso completo"}</span>
                        <span className="inline-flex items-center gap-1"><BarChart3 size={12} />100% concluído</span>
                      </div>
                    </div>
                    <BookOpen className="mt-1 text-emerald-300 transition group-hover:scale-105" size={22} />
                  </div>

                  <div className="mt-5 space-y-3">
                    <Progress value={100} className="h-2 bg-white/10" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-100/80">Pronto para revisar ou emitir certificado.</span>
                      <span className="inline-flex items-center gap-2 font-semibold text-emerald-200">
                        Abrir
                        <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {planMonthlyCourses.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white">Catálogo do seu plano neste mês</h3>
            <p className="mt-1 text-sm text-gray-400">
              Estes cursos já fazem parte da vitrine mensal do seu plano e podem ser liberados agora, sem adivinhação.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {planMonthlyCourses.map((course) => (
              <Card key={course.slug} className="group overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(3,7,18,0.95))] transition hover:-translate-y-0.5 hover:border-emerald-400/30">
                <div className="relative overflow-hidden border-b border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_28%),linear-gradient(135deg,rgba(15,23,42,1),rgba(3,7,18,1))] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Badge className={cn("border text-xs", courseLevelBadgeStyles[course.normalizedLevel])}>
                      {courseLevelLabels[course.normalizedLevel]}
                    </Badge>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Oferta</p>
                      <p className="text-sm font-semibold text-white">Incluído no mês</p>
                    </div>
                  </div>
                  <h4 className="mt-5 text-xl font-bold leading-tight text-white group-hover:text-emerald-200">
                    {course.title}
                  </h4>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-400">
                    {course.shortDescription}
                  </p>
                </div>
                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Aulas</p>
                      <p className="mt-2 text-lg font-bold text-white">{course.totalLessons}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Duração</p>
                      <p className="mt-2 text-lg font-bold text-white">{course.duration}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Ferramenta</p>
                      <p className="mt-2 text-lg font-bold text-white">{course.tool}</p>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:from-emerald-400 hover:to-cyan-400"
                    onClick={() => onEnroll(course.slug)}
                    disabled={isEnrolling === course.slug}
                  >
                    {isEnrolling === course.slug ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Sparkles size={16} className="mr-2" />
                    )}
                    Liberar no plano
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {lockedByPlanCourses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">O que exige upgrade neste mês</h3>
              <p className="mt-1 text-sm text-gray-400">
                Aqui fica explícito o que está na vitrine mensal, mas pede um plano acima para ser liberado.
              </p>
            </div>
            <Link href="/precos">
              <Button variant="outline" className="border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200 hover:bg-fuchsia-500/20">
                <Crown size={16} className="mr-2" />
                Ver planos
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {lockedByPlanCourses.map((course) => (
              <Card key={course.slug} className="overflow-hidden border-fuchsia-500/15 bg-[linear-gradient(180deg,rgba(120,40,200,0.08),rgba(3,7,18,0.96))]">
                <div className="border-b border-white/5 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge className={cn("border text-xs", courseLevelBadgeStyles[course.normalizedLevel])}>
                      {courseLevelLabels[course.normalizedLevel]}
                    </Badge>
                    <Lock size={16} className="text-fuchsia-300" />
                  </div>
                  <h4 className="mt-4 line-clamp-2 text-lg font-bold text-white">{course.title}</h4>
                </div>
                <div className="space-y-4 p-4">
                  <p className="line-clamp-3 text-sm leading-6 text-gray-400">{course.shortDescription}</p>
                  <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-500/5 p-3 text-sm text-fuchsia-100">
                    Esse curso faz parte da vitrine mensal, mas está fora da faixa desbloqueada pelo seu plano atual.
                  </div>
                  <Link href="/precos">
                    <Button className="w-full bg-white/5 text-white hover:bg-white/10">
                      <Crown size={15} className="mr-2" />
                      Fazer upgrade
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {slotLockedCourses.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white">Seu plano já permite, mas faltam vagas</h3>
            <p className="mt-1 text-sm text-gray-400">
              Esses cursos já combinam com seu plano, porém as vagas mensais dessa faixa foram consumidas.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {slotLockedCourses.map((course) => (
              <Card key={course.slug} className="overflow-hidden border-amber-500/15 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(3,7,18,0.96))]">
                <div className="border-b border-white/5 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge className={cn("border text-xs", courseLevelBadgeStyles[course.normalizedLevel])}>
                      {courseLevelLabels[course.normalizedLevel]}
                    </Badge>
                    <CalendarDays size={16} className="text-amber-300" />
                  </div>
                  <h4 className="mt-4 line-clamp-2 text-lg font-bold text-white">{course.title}</h4>
                </div>
                <div className="space-y-4 p-4">
                  <p className="line-clamp-3 text-sm leading-6 text-gray-400">{course.shortDescription}</p>
                  <div className="rounded-2xl border border-amber-400/15 bg-amber-500/5 p-3 text-sm text-amber-100">
                    Aguarde a próxima virada mensal ou faça upgrade para ganhar mais capacidade nesta faixa.
                  </div>
                  <Link href="/precos">
                    <Button className="w-full bg-white/5 text-white hover:bg-white/10">
                      <Crown size={15} className="mr-2" />
                      Ver opções
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {rotationPreviewCourses.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white">Mais cursos entram na próxima rotação</h3>
            <p className="mt-1 text-sm text-gray-400">
              Transparência total: estes ainda não estão no pool deste mês, mas podem aparecer em ciclos seguintes.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {rotationPreviewCourses.map((course) => (
              <Card key={course.slug} className="border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge className={cn("border text-xs", courseLevelBadgeStyles[course.normalizedLevel])}>
                    {courseLevelLabels[course.normalizedLevel]}
                  </Badge>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Outro mês</span>
                </div>
                <h4 className="mt-4 text-lg font-bold text-white">{course.title}</h4>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-400">{course.shortDescription}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span>{course.duration}</span>
                  <span>{course.totalLessons} aulas</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
