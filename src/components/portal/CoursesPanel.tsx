"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Clock,
  Crown,
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

  const courseCatalog = useMemo(() => {
    return allCourses.map((course) => {
      const normalizedLevel = getNormalizedLevel(course);
      const isEnrolled = enrolledSlugs.includes(course.slug);
      const canAccessLevel = tierConfig.canAccessLevel(normalizedLevel);
      const slotCategory = normalizedLevel === "free" || normalizedLevel === "beginner" ? "beginner" : normalizedLevel;
      const slotsForLevel = enrollmentSlots?.[slotCategory as keyof EnrollmentSlots] ?? null;
      const hasAvailableSlot = tierConfig.limits.unlimited || !slotsForLevel || slotsForLevel.available > 0;

      return {
        ...course,
        normalizedLevel,
        isEnrolled,
        canAccessLevel,
        hasAvailableSlot,
        canEnroll: !isEnrolled && canAccessLevel && hasAvailableSlot,
      };
    });
  }, [enrolledSlugs, enrollmentSlots, tierConfig]);

  const featuredCourse = startedCourses[0] ?? null;
  const secondaryStartedCourses = startedCourses.slice(1, 4);
  const availableToEnrollCourses = courseCatalog.filter((course) => course.canEnroll).slice(0, 6);
  const upgradeCourses = courseCatalog.filter((course) => !course.isEnrolled && !course.canEnroll).slice(0, 4);
  const totalSlotsUsed = enrollmentSlots
    ? enrollmentSlots.beginner.used + enrollmentSlots.intermediate.used + enrollmentSlots.advanced.used
    : startedCourses.length;
  const totalSlotsAvailable = enrollmentSlots
    ? enrollmentSlots.beginner.available + enrollmentSlots.intermediate.available + enrollmentSlots.advanced.available
    : 0;

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
                {startedCourses.length} curso{startedCourses.length === 1 ? "" : "s"} na jornada
              </Badge>
              {!tierConfig.limits.unlimited && enrollmentSlots && (
                <Badge className="border-white/10 bg-white/5 text-white/80">
                  {totalSlotsAvailable} vaga{totalSlotsAvailable === 1 ? "" : "s"} livre{totalSlotsAvailable === 1 ? "" : "s"} este mês
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                Sua biblioteca precisa vender a próxima decisão.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-gray-300 md:text-base">
                Retome seu próximo capítulo, enxergue o que cabe no seu plano agora e descubra quais cursos desbloqueiam mais valor sem sair da jornada.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Em andamento</p>
                <p className="mt-2 text-3xl font-black text-white">{startedCourses.length}</p>
                <p className="mt-1 text-xs text-gray-400">Cursos com retomada instantânea.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Matrículas agora</p>
                <p className="mt-2 text-3xl font-black text-emerald-300">{availableToEnrollCourses.length}</p>
                <p className="mt-1 text-xs text-gray-400">Prontas para converter nesta tela.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Slots usados</p>
                <p className="mt-2 text-3xl font-black text-fuchsia-300">{totalSlotsUsed}</p>
                <p className="mt-1 text-xs text-gray-400">Uso real do seu plano neste ciclo.</p>
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
                          {slot ? `${slot.available} vaga${slot.available === 1 ? "" : "s"} disponível${slot.available === 1 ? "" : "eis"}` : "Carregando vagas..."}
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

      {featuredCourse && (
        <div className="grid gap-4 xl:grid-cols-[1.3fr,0.7fr]">
          <Link href={`/portal/learn/${featuredCourse.courseId}`}>
            <Card className="group relative overflow-hidden border-emerald-500/20 bg-[linear-gradient(135deg,rgba(6,78,59,0.24),rgba(3,7,18,0.98))] p-6 transition hover:-translate-y-0.5 hover:border-emerald-400/40">
              <div className="absolute right-4 top-4 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Continue agora
              </div>
              <div className="flex h-full flex-col justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-200/80">
                    <TrendingUp size={14} />
                    Curso em destaque da sua jornada
                  </div>
                  <div>
                    <h3 className="max-w-2xl text-2xl font-black leading-tight text-white md:text-3xl">
                      {featuredCourse.details?.title || featuredCourse.courseId}
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80">
                      {featuredCourse.details?.shortDescription || "Retome exatamente de onde você parou, com progresso salvo e continuidade imediata."}
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
                    <p className="text-sm text-emerald-100/80">Seu próximo passo já está pronto para continuar.</p>
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
            {secondaryStartedCourses.length > 0 ? (
              secondaryStartedCourses.map((course) => (
                <Link key={course._id} href={`/portal/learn/${course.courseId}`}>
                  <Card className="group border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-400/30 hover:bg-white/[0.05]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <Badge className="border-cyan-400/20 bg-cyan-500/10 text-cyan-200">Em andamento</Badge>
                        <h4 className="line-clamp-2 text-base font-bold text-white group-hover:text-cyan-200">
                          {course.details?.title || course.courseId}
                        </h4>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                          <span className="inline-flex items-center gap-1"><Clock size={12} />{course.details?.duration || "Curso completo"}</span>
                          <span className="inline-flex items-center gap-1"><BarChart3 size={12} />{course.progressPercent}% concluído</span>
                        </div>
                      </div>
                      <PlayCircle className="mt-1 text-cyan-300 transition group-hover:scale-105" size={22} />
                    </div>
                    <Progress value={course.progressPercent} className="mt-4 h-2 bg-white/10" />
                  </Card>
                </Link>
              ))
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

      {availableToEnrollCourses.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white">Melhores matrículas para você agora</h3>
            <p className="mt-1 text-sm text-gray-400">
              Cursos que cabem no seu plano hoje e fazem a página trabalhar a favor da próxima compra.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {availableToEnrollCourses.map((course) => (
              <Card key={course.slug} className="group overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(3,7,18,0.95))] transition hover:-translate-y-0.5 hover:border-emerald-400/30">
                <div className="relative overflow-hidden border-b border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.14),transparent_28%),linear-gradient(135deg,rgba(15,23,42,1),rgba(3,7,18,1))] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Badge className={cn("border text-xs", courseLevelBadgeStyles[course.normalizedLevel])}>
                      {courseLevelLabels[course.normalizedLevel]}
                    </Badge>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Ferramenta</p>
                      <p className="text-sm font-semibold text-white">{course.tool}</p>
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
                      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Avulso</p>
                      <p className="mt-2 text-lg font-bold text-white">R$ {course.price}</p>
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
                    Matricular agora
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {upgradeCourses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">O que você destrava com upgrade</h3>
              <p className="mt-1 text-sm text-gray-400">
                Cursos que deixam claro o próximo passo comercial sem esfriar a jornada.
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
            {upgradeCourses.map((course) => (
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
                    {course.canAccessLevel
                      ? "Seu plano acessa esse nível, mas as vagas deste ciclo acabaram."
                      : "Esse curso está fora da faixa desbloqueada pelo seu plano atual."}
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
    </div>
  );
}
