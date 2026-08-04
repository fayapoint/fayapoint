import { allCourses, getCourseBySlug, getNormalizedLevel, type CourseData } from "@/data/courses";
import { MONTHLY_POOL, resolvePlan, type CourseLevel, type SubscriptionPlan } from "@/lib/course-tiers";
import mongoose from "mongoose";

const OFFER_TIMEZONE = "America/Sao_Paulo";

// ── MongoDB override cache (TTL 5 min) ────────────────────────────────────
let _overrideCache: { data: MonthlyCourseOfferSet | null; fetchedAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchMonthlyOverride(monthKey: string): Promise<MonthlyCourseOfferSet | null> {
  // Check cache
  if (_overrideCache && Date.now() - _overrideCache.fetchedAt < CACHE_TTL) {
    return _overrideCache.data;
  }

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return null;

    // CRITICAL: Use dbConnect() instead of direct mongoose.connect()!
    // Direct mongoose.connect() without dbName connects to "test" database,
    // which poisons the global Mongoose connection cache. All subsequent
    // model operations (User.findOne, etc.) would then hit test.users instead
    // of fayapoint.users — creating ghost documents in the wrong database.
    const dbConnectModule = await import("@/lib/mongodb");
    await dbConnectModule.default();

    const client = mongoose.connection.getClient();
    const db = client.db("fayapoint");

    const doc = await db.collection("monthly_offers").findOne({
      monthKey,
      status: { $in: ["active", "published"] },
    });

    // freeCourseSlug: null EXPLÍCITO é um override válido (decisão 20/07:
    // mês sem curso 100% grátis — cursos de entrada passam a preço simbólico).
    // Só rejeita quando o campo está AUSENTE (doc malformado) ou sem pools.
    if (!doc || doc.freeCourseSlug === undefined || !doc.pools) {
      _overrideCache = { data: null, fetchedAt: Date.now() };
      return null;
    }

    const bounds = buildMonthBounds();
    const override: MonthlyCourseOfferSet = {
      monthKey: doc.monthKey,
      startsAt: doc.startsAt || bounds.startsAt,
      endsAt: doc.endsAt || bounds.endsAt,
      freeCourseSlug: doc.freeCourseSlug ?? null,
      pools: {
        beginner: doc.pools.beginner || [],
        intermediate: doc.pools.intermediate || [],
        advanced: doc.pools.advanced || [],
      },
    };

    _overrideCache = { data: override, fetchedAt: Date.now() };
    return override;
  } catch (err) {
    console.error("[monthly-offers] MongoDB override fetch failed, using algorithm:", err);
    _overrideCache = { data: null, fetchedAt: Date.now() };
    return null;
  }
}

type PoolLevel = "beginner" | "intermediate" | "advanced";

export interface MonthlyCourseOfferSet {
  monthKey: string;
  startsAt: string;
  endsAt: string;
  freeCourseSlug: string | null;
  pools: Record<PoolLevel, string[]>;
}

export interface CourseMonthlyOfferMeta {
  monthKey: string;
  startsAt: string;
  endsAt: string;
  isFreeCourseOfMonth: boolean;
  includedInPool: boolean;
  poolLevel: PoolLevel | null;
  availablePlans: SubscriptionPlan[];
}

function getMonthParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: OFFER_TIMEZONE,
    year: "numeric",
    month: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value || date.getUTCFullYear());
  const month = Number(parts.find((part) => part.type === "month")?.value || date.getUTCMonth() + 1);

  return { year, month };
}

function buildMonthKey(date: Date = new Date()) {
  const { year, month } = getMonthParts(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

function buildMonthBounds(date: Date = new Date()) {
  const { year, month } = getMonthParts(date);
  const startUtc = new Date(Date.UTC(year, month - 1, 1, 3, 0, 0));
  const endUtc = new Date(Date.UTC(year, month, 1, 2, 59, 59, 999));
  return {
    startsAt: startUtc.toISOString(),
    endsAt: endUtc.toISOString(),
  };
}

function scoreSeed(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sortForMonth(courses: CourseData[], monthKey: string, salt: string) {
  return [...courses].sort((left, right) => {
    const leftScore = scoreSeed(`${monthKey}:${salt}:${left.slug}`);
    const rightScore = scoreSeed(`${monthKey}:${salt}:${right.slug}`);
    if (leftScore !== rightScore) return leftScore - rightScore;
    return left.slug.localeCompare(right.slug);
  });
}

/* ── O catálogo que alimenta o sorteio ─────────────────────────────────────
 *
 * ⚠️ Até 04/08/2026 o sorteio lia `allCourses`, a lista ESTÁTICA. Medido
 * naquele dia, com 22 cursos ativos no banco e 18 na lista:
 *
 *   · **5 cursos ativos jamais podiam entrar no pool** nem ser o grátis do mês
 *     (`ia-producao`, `rag-knowledge`, `ia-no-whatsapp`, `ia-para-criar-videos`
 *     e o de IA no dia a dia). Não dava erro — eles simplesmente nunca eram
 *     sorteados, e ninguém tinha como notar a ausência.
 *   · **1 curso na lista estática é RASCUNHO no banco** (`banana-dev-deploy-ia`,
 *     sobre a banana.dev, que descontinuou o serviço). Ele era elegível a ser
 *     sorteado como oferta do mês — um curso não publicado, sobre plataforma
 *     morta, na vitrine.
 *
 * É a terceira vez que a classe "o curso existe mas o porteiro não o conhece"
 * volta. Ela morre aqui: o BANCO decide quem existe; a lista estática só entra
 * como rede de segurança enquanto o cache não aqueceu.
 */
interface CursoDoCatalogo {
  slug: string;
  level: string;
  price: number;
  isFree?: boolean;
}

let _catalogoCache: { cursos: CursoDoCatalogo[]; fetchedAt: number } | null = null;

async function fetchCatalogo(): Promise<CursoDoCatalogo[] | null> {
  if (_catalogoCache && Date.now() - _catalogoCache.fetchedAt < CACHE_TTL) {
    return _catalogoCache.cursos;
  }
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return null;

    // Mesma disciplina de `fetchMonthlyOverride`: `dbConnect()` e não
    // `mongoose.connect()` direto — sem `dbName` a conexão cai no banco "test"
    // e envenena o cache global do Mongoose.
    const dbConnectModule = await import("@/lib/mongodb");
    await dbConnectModule.default();

    const client = mongoose.connection.getClient();
    const docs = await client
      .db("fayapointProdutos")
      .collection("products")
      // `status: 'active'` é o filtro que impede rascunho de ir à vitrine — a
      // mesma regra que a `/api/products` já aplica.
      .find({ status: "active", type: "course" }, { projection: { slug: 1, level: 1, "pricing.price": 1 } })
      .toArray();

    const cursos: CursoDoCatalogo[] = docs
      .filter((d) => typeof d.slug === "string")
      .map((d) => ({
        slug: d.slug as string,
        level: (d.level as string) ?? "",
        // ⚠️ O preço mora em `pricing.price`, não em `price`. Lendo `d.price`
        // todo curso viria com preço 0 e o filtro `price > 0` esvaziaria o
        // pool inteiro — falha silenciosa e total.
        price: Number((d.pricing as { price?: number } | undefined)?.price ?? 0),
      }));

    if (!cursos.length) return null;
    _catalogoCache = { cursos, fetchedAt: Date.now() };
    return cursos;
  } catch (err) {
    console.error("[monthly-offers] catálogo do banco falhou, usando a lista estática:", err);
    return null;
  }
}

function getPaidCoursesByLevel(level: PoolLevel) {
  const doBanco = _catalogoCache && Date.now() - _catalogoCache.fetchedAt < CACHE_TTL
    ? _catalogoCache.cursos
    : null;

  const fonte: Array<{ slug: string; level: string; price: number; isFree?: boolean }> =
    doBanco ?? (allCourses as unknown as Array<{ slug: string; level: string; price: number; isFree?: boolean }>);

  return fonte.filter(
    (course) => getNormalizedLevel(course as unknown as CourseData) === level && course.price > 0,
  ) as unknown as CourseData[];
}

// Synchronous fallback — deterministic algorithm (always works, no DB needed)
function computeAlgorithmicOfferSet(referenceDate: Date = new Date()): MonthlyCourseOfferSet {
  const monthKey = buildMonthKey(referenceDate);
  const bounds = buildMonthBounds(referenceDate);

  const beginnerCourses = getPaidCoursesByLevel("beginner");
  const intermediateCourses = getPaidCoursesByLevel("intermediate");
  const advancedCourses = getPaidCoursesByLevel("advanced");

  // Regra de negócio 20/07/2026 (decisão do Ricardo): NENHUM curso é 100%
  // grátis — cursos de entrada usam preço simbólico (pricing.note no produto).
  // O algoritmo não elege mais "curso grátis do mês"; o antigo eleito passa a
  // integrar o pool beginner normalmente. Isso também elimina o bug do
  // fallback síncrono: enquanto o cache do override aquecia, o algoritmo
  // anunciava um curso grátis que o enroll (async, lendo o override) negava.
  const freeCourseSlug: string | null = null;

  const pools = {
    beginner: sortForMonth(
      beginnerCourses.filter((course) => course.slug !== freeCourseSlug),
      monthKey,
      "beginner-pool"
    ).slice(0, Math.min(MONTHLY_POOL.beginner, Math.max(0, beginnerCourses.length - (freeCourseSlug ? 1 : 0)))).map((course) => course.slug),
    intermediate: sortForMonth(intermediateCourses, monthKey, "intermediate-pool")
      .slice(0, Math.min(MONTHLY_POOL.intermediate, intermediateCourses.length))
      .map((course) => course.slug),
    advanced: sortForMonth(advancedCourses, monthKey, "advanced-pool")
      .slice(0, Math.min(MONTHLY_POOL.advanced, advancedCourses.length))
      .map((course) => course.slug),
  } satisfies Record<PoolLevel, string[]>;

  return { monthKey, startsAt: bounds.startsAt, endsAt: bounds.endsAt, freeCourseSlug, pools };
}

// Async version — checks MongoDB for Mission Control override first, falls back to algorithm
export async function getMonthlyCourseOfferSetAsync(referenceDate: Date = new Date()): Promise<MonthlyCourseOfferSet> {
  const monthKey = buildMonthKey(referenceDate);
  const override = await fetchMonthlyOverride(monthKey);
  if (override) return override;

  // ⚠️ O catálogo é buscado ANTES de calcular, e não em paralelo: o algoritmo
  // é síncrono e lê `_catalogoCache` no momento em que roda. Disparar a busca
  // sem esperar faria a primeira chamada de cada janela de cache sortear pela
  // lista estática e a seguinte sortear pelo banco — dois pools diferentes
  // para o mesmo mês, alternando conforme o cache.
  await fetchCatalogo();
  return computeAlgorithmicOfferSet(referenceDate);
}

// Track whether a background cache warm is in progress to avoid duplicate fetches
let _warmingPromise: Promise<void> | null = null;

/**
 * Sync version — returns cached Mission Control override if available,
 * otherwise returns the algorithmic fallback AND kicks off a background
 * fetch so the NEXT call will have the real data.
 */
export function getMonthlyCourseOfferSet(referenceDate: Date = new Date()): MonthlyCourseOfferSet {
  // If we have a cached override, use it synchronously
  if (_overrideCache && _overrideCache.data && Date.now() - _overrideCache.fetchedAt < CACHE_TTL) {
    return _overrideCache.data;
  }

  // Kick off a background cache warm (fire-and-forget) so subsequent sync
  // calls will have the Mission Control override. This avoids the scenario
  // where the sync function permanently returns algorithm results because
  // nothing ever populated the cache.
  if (!_warmingPromise) {
    _warmingPromise = getMonthlyCourseOfferSetAsync(referenceDate)
      .then(() => { _warmingPromise = null; })
      .catch(() => { _warmingPromise = null; });
  }

  return computeAlgorithmicOfferSet(referenceDate);
}

/**
 * Um curso identificado por slug, ou já resolvido com o nível junto.
 *
 * ⚠️ Aceitar o objeto não é conveniência — é o conserto de 03/08/2026.
 *
 * Passando só o slug, esta função dependia de `getCourseBySlug`, que lê
 * `allCourses` — a lista ESTÁTICA de 18 cursos em `src/data/courses/`. O banco
 * tem 27. Os nove que só existem no banco (`ia-no-whatsapp`,
 * `ia-para-criar-videos`, `ia-producao`, `rag-knowledge` e mais cinco) caíam no
 * `return null` da primeira linha, e a partir dali tudo desabava: sumiam da
 * biblioteca, sumiam do catálogo do plano, e o `POST /api/courses/enroll`
 * respondia 404. Ricardo, 03/08: *"eu que sou um usuário do tier expert, não
 * tenho acesso, um usuário que pague o tier máximo e não ter acesso ao curso
 * fará ele ficar frustrado."*
 *
 * Quem já tem o curso em mãos — a biblioteca tem, o `enroll` tem — passa o
 * objeto e não depende mais da lista estática.
 */
export type CursoOuSlug = string | { slug: string; level?: string; price?: number; isFree?: boolean };

function resolverCurso(entrada: CursoOuSlug): { slug: string; level: CourseLevel } | null {
  if (typeof entrada !== "string") {
    // O objeto manda. `getNormalizedLevel` aceita qualquer coisa com `level`,
    // `price` e `isFree` — é exatamente o que a biblioteca monta a partir do
    // banco.
    return {
      slug: entrada.slug,
      level: getNormalizedLevel(entrada as unknown as CourseData),
    };
  }
  const course = getCourseBySlug(entrada);
  if (!course) return null;
  return { slug: entrada, level: getNormalizedLevel(course) };
}

export function getCourseMonthlyOfferMeta(
  curso: CursoOuSlug,
  referenceDate: Date = new Date()
): CourseMonthlyOfferMeta | null {
  const resolvido = resolverCurso(curso);
  if (!resolvido) return null;

  const { slug: courseSlug, level } = resolvido;
  const offerSet = getMonthlyCourseOfferSet(referenceDate);

  if (offerSet.freeCourseSlug === courseSlug) {
    return {
      monthKey: offerSet.monthKey,
      startsAt: offerSet.startsAt,
      endsAt: offerSet.endsAt,
      isFreeCourseOfMonth: true,
      includedInPool: true,
      poolLevel: "beginner",
      availablePlans: ["free", "explorador", "profissional", "expert"],
    };
  }

  /**
   * Curso de nível `free` — aberto a todo mundo, inclusive a quem não assina.
   *
   * ⚠️ Defeito corrigido em 03/08/2026 (noite). `poolLevel` só aceitava
   * beginner/intermediate/advanced, então o `free` caía no `return null` de
   * baixo — e `canPlanAccessMonthlyOffer` lê `null` como "nenhum plano pode".
   * O curso mais aberto do catálogo era o único que a biblioteca marcava
   * **"Exige upgrade"**: `primeiras-automacoes` (`isFree: true`) aparecia assim
   * para o Ricardo, assinante Expert.
   *
   * O servidor nunca concordou com isso. O `POST /api/courses/enroll` decide
   * `isFreeEnrollment` ANTES de chegar aqui e matricula normalmente. Era a
   * etiqueta negando o que a matrícula concedia — o espelho exato do defeito
   * de 03/08, em que a etiqueta prometia o que a matrícula negava.
   */
  if (level === "free") {
    return {
      monthKey: offerSet.monthKey,
      startsAt: offerSet.startsAt,
      endsAt: offerSet.endsAt,
      // Não é o curso grátis ELEITO do mês (esse é o `freeCourseSlug` acima) —
      // é um curso que simplesmente não cobra. Os dois liberam; só um expira.
      isFreeCourseOfMonth: false,
      includedInPool: true,
      poolLevel: "beginner",
      availablePlans: ["free", "explorador", "profissional", "expert"],
    };
  }

  const poolLevel = level === "beginner" || level === "intermediate" || level === "advanced" ? level : null;
  if (!poolLevel) return null;

  /**
   * Quem pode abrir um curso deste nível.
   *
   * Sai do NÍVEL, não da rotação do mês. Antes, um curso fora do pool voltava
   * com `availablePlans: []` — ninguém, nem o Expert. Isso transformava "não
   * está na vitrine deste mês" em "proibido", que são coisas diferentes.
   *
   * E a rotação já era vazia na prática: `MONTHLY_POOL` libera 10/8/5 por mês
   * contra 18 cursos estáticos no total, então todos os que passavam pelo
   * filtro de preço já entravam. Derivar do nível não afrouxa nada que
   * estivesse apertado — só para de punir os cursos que a lista estática
   * esqueceu.
   *
   * O limite de verdade continua onde sempre esteve e continua valendo: as
   * VAGAS do plano (7/4/3 por mês no Expert) e o teto de cursos simultâneos,
   * checados no `POST /api/courses/enroll`.
   */
  const availablePlans: SubscriptionPlan[] =
    poolLevel === "beginner"
      ? ["explorador", "profissional", "expert"]
      : ["profissional", "expert"];

  return {
    monthKey: offerSet.monthKey,
    startsAt: offerSet.startsAt,
    endsAt: offerSet.endsAt,
    isFreeCourseOfMonth: false,
    // `includedInPool` continua dizendo a verdade sobre a vitrine do mês — é
    // rótulo ("em destaque neste mês"), não portão.
    includedInPool: offerSet.pools[poolLevel].includes(courseSlug),
    poolLevel,
    availablePlans,
  };
}

export function isCourseFreeThisMonth(courseSlug: string, referenceDate: Date = new Date()) {
  return getMonthlyCourseOfferSet(referenceDate).freeCourseSlug === courseSlug;
}

export function isCourseInCurrentMonthlyPool(curso: CursoOuSlug, referenceDate: Date = new Date()) {
  const offer = getCourseMonthlyOfferMeta(curso, referenceDate);
  return Boolean(offer?.includedInPool);
}

export function canPlanAccessMonthlyOffer(
  plan: string,
  curso: CursoOuSlug,
  referenceDate: Date = new Date()
) {
  const resolvedPlan = resolvePlan(plan || "free");
  const offer = getCourseMonthlyOfferMeta(curso, referenceDate);
  if (!offer) return false;
  return offer.availablePlans.includes(resolvedPlan);
}

export function getMonthlyOfferEntries(referenceDate: Date = new Date()) {
  const offerSet = getMonthlyCourseOfferSet(referenceDate);
  const freeCourse = offerSet.freeCourseSlug ? getCourseBySlug(offerSet.freeCourseSlug) : null;

  return {
    ...offerSet,
    freeCourse,
    beginnerCourses: offerSet.pools.beginner.map((slug) => getCourseBySlug(slug)).filter(Boolean),
    intermediateCourses: offerSet.pools.intermediate.map((slug) => getCourseBySlug(slug)).filter(Boolean),
    advancedCourses: offerSet.pools.advanced.map((slug) => getCourseBySlug(slug)).filter(Boolean),
  };
}
