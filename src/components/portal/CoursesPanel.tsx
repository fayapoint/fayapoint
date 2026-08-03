"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
// A lista encolheu junto com o painel: das onze seções de antes sobraram três,
// e com elas foram embora dezoito ícones que ninguém mais desenha.
import { Award, BookOpen, Crown, Filter, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { allCourses, getNormalizedLevel, type CourseData } from "@/data/courses";
import type { EnrollmentSlots, TierConfig } from "@/lib/course-tiers";
import { canPlanAccessMonthlyOffer, getCourseMonthlyOfferMeta } from "@/lib/monthly-course-offers";
import { TrilhoParallax } from "@/components/biblioteca/TrilhoParallax";
import { LivroDosCursos, TituloDoLivro } from "@/components/biblioteca/LivroDosCursos";

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

/**
 * Para onde o card da biblioteca leva.
 *
 * Antes: sempre direto para `/portal/learn/<slug>` — o leitor, no capítulo 1.
 * A pessoa caía dentro do curso sem nunca ver do que ele trata, quantos
 * capítulos tem ou o que vai conseguir fazer no fim. Pedido do Ricardo em
 * 03/08/2026: "antes de entrar direto no curso, devemos ter uma página de
 * apresentação, bonita e atraente".
 *
 * A página existe e é boa — `/curso/<slug>`, com promessa, ementa e prova
 * social. O que faltava era alguém mandar o aluno para lá.
 *
 * O corte é o progresso, não a matrícula: quem ainda não abriu o curso vai
 * para a apresentação; quem já começou vai direto para onde parou. Mandar
 * alguém no capítulo 12 para uma página de vendas seria um passo a mais no
 * caminho de quem já decidiu.
 */
function destinoDoCurso(slug: string, progressoPercent: number): string {
  return progressoPercent > 0 ? `/portal/learn/${slug}` : `/curso/${slug}`;
}

/**
 * A capa do curso na biblioteca.
 *
 * `COURSE_THUMBNAILS` é um mapa escrito à mão, com 17 dos 26 cursos e um
 * `public_id` aleatório em cada linha. Cada curso novo nascia sem capa até
 * alguém lembrar de editar este arquivo — a mesma doença da lista estática de
 * 18 cursos que escondia os cursos do laço da biblioteca inteira.
 *
 * As capas regeradas em 03/08/2026 sobem para um endereço PREVISÍVEL,
 * `fayai/courses/<slug>/capa-v2`, então o mapa deixou de ser necessário: a URL
 * se deduz do slug. O mapa continua como reserva histórica — se o `capa-v2`
 * não existir, `onError` no <img> cai nele e depois no gradiente.
 */
function getCourseThumbnailUrl(slug: string): string {
  return `${CLOUDINARY_BASE}/w_512,q_80,f_auto/fayai/courses/${slug}/capa-v2`;
}

/** A capa antiga, quando existir — só usada se a nova falhar ao carregar. */
function getCourseThumbnailFallback(slug: string): string | undefined {
  const entry = COURSE_THUMBNAILS[slug];
  return entry?.thumbnailPath ? `${CLOUDINARY_BASE}/${entry.thumbnailPath}` : undefined;
}

/**
 * O estado de um curso PARA ESTA PESSOA.
 *
 * Existe porque a biblioteca virou uma lista só em 03/08/2026. Enquanto havia
 * duas seções, o estado era implícito na seção em que o curso aparecia — e era
 * justamente isso que ninguém conseguia ler, porque as duas seções saíam da
 * mesma origem. Numa lista só, o estado tem que estar escrito no card.
 */
type EstadoDoCurso = "acervo" | "disponivel" | "upgrade" | "concluido" | "gratis";

/** A ordem do trilho: o que dá para usar agora vem antes do que custa. */
const PESO_ESTADO: Record<EstadoDoCurso, number> = {
  acervo: 0,
  gratis: 1,
  disponivel: 2,
  upgrade: 3,
  concluido: 4,
};

const ROTULOS_ESTADO: Record<EstadoDoCurso, { curto: string; filtro: string }> = {
  acervo: { curto: "No acervo", filtro: "No acervo" },
  gratis: { curto: "Grátis no mês", filtro: "Grátis" },
  disponivel: { curto: "Incluído no seu plano", filtro: "Disponíveis" },
  upgrade: { curto: "Exige upgrade", filtro: "Exigem upgrade" },
  concluido: { curto: "Concluído", filtro: "Concluídos" },
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


  const [apiFreeCourseSlug, setApiFreeCourseSlug] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/courses/monthly-offers", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.freeCourse?.slug) setApiFreeCourseSlug(data.freeCourse.slug);
      })
      .catch(() => {});
  }, []);

  /**
   * Cursos que só existem no banco.
   *
   * ⚠️ Defeito corrigido em 02/08/2026, relatado pelo Ricardo: "o curso novo de
   * criação de imagem e o de whatsapp não aparecem na biblioteca de cursos".
   *
   * A causa: esta biblioteca listava `allCourses`, a lista ESTÁTICA em
   * `@/data/courses` — 18 cursos congelados no arquivo. O banco tinha 21. Os
   * quatro cursos produzidos pelo laço (`ia-para-criar-videos`, `ia-producao`,
   * `rag-knowledge`, `aprenda-a-usar-...-dia-a-dia`) nasciam invisíveis para o
   * aluno logado, porque ninguém os acrescentou ao arquivo à mão.
   *
   * O banco é a fonte da verdade (o sitemap já tratava assim desde 19/07). A
   * lista estática continua entrando porque carrega metadados ricos que o
   * produto no banco não tem — módulos, depoimentos, FAQ.
   */
  const [cursosDoBanco, setCursosDoBanco] = useState<CourseData[]>([]);
  useEffect(() => {
    fetch("/api/products?type=course&limit=200", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const lista: unknown[] = data?.products ?? data?.data ?? (Array.isArray(data) ? data : []);
        const conhecidos = new Set(allCourses.map((c) => c.slug));

        const novos = lista
          .map((p) => p as Record<string, unknown>)
          .filter((p) => typeof p.slug === "string" && !conhecidos.has(p.slug as string))
          .map((p) => {
            // ⚠️ O preço mora em `pricing.price`, não em `price`.
            //
            // Lendo `p.price` (que não existe no documento) o preço caía em 0,
            // e `getNormalizedLevel` trata preço 0 como nível **free**: os
            // cursos novos apareciam etiquetados "Gratuito" — um curso de R$79
            // anunciado como grátis dentro do portal. O servidor nunca foi
            // enganado (o `enroll` lê `pricing.price` direto do banco), mas a
            // etiqueta prometia o que a matrícula ia negar.
            const pricing = (p.pricing ?? {}) as Record<string, unknown>;
            const metrics = (p.metrics ?? {}) as Record<string, unknown>;
            const copy = (p.copy ?? {}) as Record<string, unknown>;

            return {
              // Só os campos que a grade usa. O resto do `CourseData` fica
              // com o padrão — curso do banco não tem módulo nem depoimento.
              id: 0,
              slug: p.slug as string,
              title: (p.shortName as string) || (p.name as string) || (p.slug as string),
              subtitle: (p.subtitle as string) || "",
              tool: (p.tool as string) || "IA",
              category: (p.categoryPrimary as string) || "IA Generativa",
              level: (p.level as string) || "Iniciante",
              duration: (metrics.duration as string) || (p.duration as string) || "",
              totalLessons:
                (p.contentChapters as number) || (metrics.lessons as number) || 0,
              price: (pricing.price as number) ?? (p.price as number) ?? 0,
              originalPrice: (pricing.originalPrice as number) ?? 0,
              rating: (metrics.rating as number) ?? 0,
              students: (metrics.students as number) ?? 0,
              shortDescription:
                (copy.shortDescription as string) ||
                (p.shortDescription as string) ||
                (copy.subheadline as string) ||
                (p.description as string) ||
                "",
              modules: [],
              testimonials: [],
              bonuses: [],
              faqs: [],
            } as unknown as CourseData;
          });

        if (novos.length) setCursosDoBanco(novos);
      })
      .catch(() => {
        // Banco fora do ar não pode esvaziar a biblioteca — sem os novos, mas
        // com os 18 estáticos, ainda é uma página útil.
      });
  }, []);

  const courseCatalog = useMemo(() => {
    return [...allCourses, ...cursosDoBanco].map((course) => {
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
  }, [enrolledSlugs, enrollmentSlots, tierConfig, apiFreeCourseSlug, cursosDoBanco]);


  /**
   * ── A REFORMA DE 03/08/2026: onze seções viraram três ───────────────────
   *
   * Ricardo: *"está muito confuso, termos a biblioteca e logo abaixo, o
   * catálogo do plano, onde eu fiquei sem saber o que eu posso utilizar,
   * imagina então o usuário, e é ali que eu gostaria que fizéssemos a
   * atualização para reduzir muito o tamanho da página."*
   *
   * Ele estava certo pelo pior dos motivos: as duas listas saíam da MESMA
   * origem. "Catálogo do plano" era "Biblioteca" sem os matriculados e cortada
   * em seis. Duas listas, uma fonte, nenhum critério visível — não havia o que
   * o usuário pudesse deduzir, porque não havia distinção.
   *
   * O que ficou:
   *   1. O LIVRO   — os cursos matriculados, folheáveis.
   *   2. O TRILHO  — TODOS os cursos, numa lista só, com o estado estampado em
   *                  cada card e um filtro por estado.
   *   3. O RODAPÉ  — certificação e upgrade, juntos.
   *
   * O que saiu: Oferta do Mês (virou o estado "Grátis"), Curso em destaque e
   * Outros da jornada (o livro já é isso), Concluídos e Exigem upgrade
   * (viraram filtro), Catálogo do plano (fundiu com a biblioteca).
   */

  const totalSlotsAvailable = enrollmentSlots
    ? enrollmentSlots.beginner.available + enrollmentSlots.intermediate.available + enrollmentSlots.advanced.available
    : 0;
  const certificateDiscountPercent = Math.round((tierConfig.quizDiscount || 0) * 100);

  const progressoPorSlug = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of userCourses) m.set(c.courseId, c.progressPercent);
    return m;
  }, [userCourses]);

  const catalogoComEstado = useMemo(() => {
    return courseCatalog
      .map((course) => {
        const progresso = progressoPorSlug.get(course.slug);
        const estado: EstadoDoCurso =
          course.isFreeMonthlyCourse && !course.isEnrolled
            ? "gratis"
            : course.isEnrolled
              ? (progresso ?? 0) >= 100
                ? "concluido"
                : "acervo"
              : course.canEnroll
                ? "disponivel"
                : "upgrade";
        return { ...course, progresso, estado };
      })
      .sort((a, b) => {
        // Ordem: o que dá para usar agora primeiro, o que exige dinheiro
        // depois. Concluído vai para o fim — já rendeu o que tinha a render.
        if (PESO_ESTADO[a.estado] !== PESO_ESTADO[b.estado]) {
          return PESO_ESTADO[a.estado] - PESO_ESTADO[b.estado];
        }
        return a.title.localeCompare(b.title);
      });
  }, [courseCatalog, progressoPorSlug]);

  const [filtro, setFiltro] = useState<"todos" | EstadoDoCurso>("todos");

  const contagens = useMemo(() => {
    const c: Record<string, number> = { todos: catalogoComEstado.length };
    for (const curso of catalogoComEstado) c[curso.estado] = (c[curso.estado] ?? 0) + 1;
    return c;
  }, [catalogoComEstado]);

  const catalogoFiltrado = useMemo(
    () => (filtro === "todos" ? catalogoComEstado : catalogoComEstado.filter((c) => c.estado === filtro)),
    [catalogoComEstado, filtro],
  );

  /**
   * Os cursos do livro: os matriculados, o mais adiantado primeiro.
   *
   * ⚠️ O título vem do catálogo, e só depois de `details`.
   *
   * `details` é preenchido no `portal/page.tsx` por `getCourseBySlug()` — a
   * lista estática de 18. Para os cursos que só existem no banco ele volta
   * `undefined`, e o livro exibia o SLUG: a capa dizia "IA no WhatsApp" e a
   * página ao lado, `ia-no-whatsapp`. `courseCatalog` já funde as duas fontes,
   * então é dele que o nome deve sair.
   */
  const cursosDoLivro = useMemo(() => {
    const doCatalogo = new Map(courseCatalog.map((c) => [c.slug, c]));
    return startedCourses.map((c) => {
      const cat = doCatalogo.get(c.courseId);
      return {
        slug: c.courseId,
        titulo: c.details?.title || cat?.title || c.courseId,
        resumo: c.details?.shortDescription || cat?.shortDescription,
        capa: getCourseThumbnailUrl(c.courseId),
        capaReserva: getCourseThumbnailFallback(c.courseId),
        href: destinoDoCurso(c.courseId, c.progressPercent),
        ferramenta: c.details?.tool || cat?.tool,
        nivel: cat ? courseLevelLabels[cat.normalizedLevel] : undefined,
        aulas: cat?.totalLessons || undefined,
        duracao: c.details?.duration || cat?.duration,
        progresso: c.progressPercent,
      };
    });
  }, [startedCourses, courseCatalog]);

  return (
    <div className="space-y-5 min-w-0 overflow-hidden">
      {/* ═══ 1. O LIVRO — os cursos matriculados ═══ */}
      {cursosDoLivro.length > 0 ? (
        <Card className="border-border bg-card p-4 md:p-5 overflow-hidden">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <TituloDoLivro quantos={cursosDoLivro.length} />
            <div className="flex flex-wrap gap-1.5">
              <Badge className="border-amber-400/30 bg-amber-500/10 text-amber-200 text-[10px]">
                Plano {tierConfig.displayName}
              </Badge>
              {!tierConfig.limits.unlimited && enrollmentSlots && (
                <Badge className="border-border bg-secondary text-white/80 text-[10px]">
                  {totalSlotsAvailable} vaga{totalSlotsAvailable === 1 ? "" : "s"} livre
                  {totalSlotsAvailable === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
          </div>

          <LivroDosCursos cursos={cursosDoLivro} />
        </Card>
      ) : (
        <Card className="border-border bg-gradient-to-br from-card via-emerald-950/20 to-card p-5 text-center">
          <BookOpen size={22} className="mx-auto mb-2 text-emerald-300" />
          <h3 className="text-base font-bold">Sua estante ainda está vazia</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Escolha um curso abaixo para abrir o primeiro livro do seu acervo.
          </p>
        </Card>
      )}

      {/* ═══ 2. O TRILHO — todos os cursos, uma lista só ═══ */}
      <Card className="border-border bg-card p-4 md:p-5 overflow-hidden">
        <div className="mb-3 flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold">Todos os cursos</h3>
            <p className="text-xs text-muted-foreground">
              {catalogoComEstado.length} no catálogo · cada card diz em que pé está
            </p>
          </div>
        </div>

        {/* O filtro é por ESTADO, não por nível: a pergunta que a pessoa faz ao
            abrir esta tela é "o que eu posso usar?", não "o que é
            intermediário?". */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {(["todos", "acervo", "disponivel", "gratis", "upgrade", "concluido"] as const)
            .filter((chave) => chave === "todos" || (contagens[chave] ?? 0) > 0)
            .map((chave) => (
              <button
                key={chave}
                onClick={() => setFiltro(chave)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                  filtro === chave
                    ? "border border-amber-500/30 bg-amber-500/20 text-amber-300"
                    : "border border-border bg-secondary text-muted-foreground hover:text-white",
                )}
              >
                {chave === "todos" ? "Todos" : ROTULOS_ESTADO[chave].filtro}
                <span className="ml-1.5 text-[9px] opacity-70">{contagens[chave] ?? 0}</span>
              </button>
            ))}
        </div>

        {catalogoFiltrado.length > 0 ? (
          <div className="-mx-4 md:-mx-5">
            <TrilhoParallax
              itens={catalogoFiltrado.map((course) => ({
                slug: course.slug,
                titulo: course.title,
                resumo: course.shortDescription,
                capa: getCourseThumbnailUrl(course.slug),
                capaReserva: getCourseThumbnailFallback(course.slug),
                // Matriculado com progresso vai para onde parou; todo o resto
                // passa pela página de apresentação. Foi a decisão de 03/08:
                // ninguém entra num curso sem antes ver do que ele trata.
                href:
                  course.isEnrolled && (course.progresso ?? 0) > 0
                    ? `/portal/learn/${course.slug}`
                    : `/curso/${course.slug}`,
                ferramenta: course.tool,
                nivel: courseLevelLabels[course.normalizedLevel],
                aulas: course.totalLessons || undefined,
                duracao: course.duration || undefined,
                progresso: course.isEnrolled ? (course.progresso ?? 0) : undefined,
                estado: { rotulo: ROTULOS_ESTADO[course.estado].curto, tom: course.estado },
                acao:
                  !course.isEnrolled && course.canEnroll
                    ? {
                        rotulo: course.estado === "gratis" ? "Liberar grátis" : "Liberar no plano",
                        aoClicar: () => onEnroll(course.slug),
                        carregando: isEnrolling === course.slug,
                      }
                    : undefined,
              }))}
            />
          </div>
        ) : (
          <div className="py-6 text-center">
            <Filter size={20} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Nenhum curso neste estado</p>
          </div>
        )}
      </Card>

      {/* ═══ 3. O RODAPÉ — certificação e upgrade, juntos ═══ */}
      <Card className="border-border bg-card p-4 md:p-5 overflow-hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-2">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Award size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold">Certificação</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {certificateDiscountPercent > 0
                  ? `Certificado verificável ao concluir qualquer curso, com ${certificateDiscountPercent}% de desconto no plano ${tierConfig.displayName}.`
                  : "Certificado verificável ao concluir qualquer curso."}
              </p>
            </div>
          </div>

          {!tierConfig.limits.unlimited && (
            <Link href="/precos" className="shrink-0">
              <Button
                size="sm"
                className="gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-xs font-bold text-black hover:from-yellow-600 hover:to-orange-600"
              >
                <Crown size={12} /> Mais cursos e mais vagas
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
