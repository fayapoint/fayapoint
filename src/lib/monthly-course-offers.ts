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

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri, { bufferCommands: false });
    }

    const db = mongoose.connection.db;
    if (!db) return null;

    const doc = await db.collection("monthly_offers").findOne({
      monthKey,
      status: { $in: ["active", "published"] },
    });

    if (!doc || !doc.freeCourseSlug || !doc.pools) {
      _overrideCache = { data: null, fetchedAt: Date.now() };
      return null;
    }

    const bounds = buildMonthBounds();
    const override: MonthlyCourseOfferSet = {
      monthKey: doc.monthKey,
      startsAt: doc.startsAt || bounds.startsAt,
      endsAt: doc.endsAt || bounds.endsAt,
      freeCourseSlug: doc.freeCourseSlug,
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

function getPaidCoursesByLevel(level: PoolLevel) {
  return allCourses.filter((course) => getNormalizedLevel(course) === level && course.price > 0);
}

// Synchronous fallback — deterministic algorithm (always works, no DB needed)
function computeAlgorithmicOfferSet(referenceDate: Date = new Date()): MonthlyCourseOfferSet {
  const monthKey = buildMonthKey(referenceDate);
  const bounds = buildMonthBounds(referenceDate);

  const beginnerCourses = getPaidCoursesByLevel("beginner");
  const intermediateCourses = getPaidCoursesByLevel("intermediate");
  const advancedCourses = getPaidCoursesByLevel("advanced");

  const freeCourseCandidates = sortForMonth(beginnerCourses, monthKey, "free-course");
  const freeCourseSlug = freeCourseCandidates[0]?.slug || null;

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
  return computeAlgorithmicOfferSet(referenceDate);
}

// Sync version — algorithm only (for places that can't await)
export function getMonthlyCourseOfferSet(referenceDate: Date = new Date()): MonthlyCourseOfferSet {
  // If we have a cached override, use it synchronously
  if (_overrideCache && _overrideCache.data && Date.now() - _overrideCache.fetchedAt < CACHE_TTL) {
    return _overrideCache.data;
  }
  return computeAlgorithmicOfferSet(referenceDate);
}

export function getCourseMonthlyOfferMeta(
  courseSlug: string,
  referenceDate: Date = new Date()
): CourseMonthlyOfferMeta | null {
  const course = getCourseBySlug(courseSlug);
  if (!course) return null;

  const level = getNormalizedLevel(course);
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

  const poolLevel = level === "beginner" || level === "intermediate" || level === "advanced" ? level : null;
  if (!poolLevel) return null;

  const includedInPool = offerSet.pools[poolLevel].includes(courseSlug);
  if (!includedInPool) {
    return {
      monthKey: offerSet.monthKey,
      startsAt: offerSet.startsAt,
      endsAt: offerSet.endsAt,
      isFreeCourseOfMonth: false,
      includedInPool: false,
      poolLevel,
      availablePlans: [],
    };
  }

  const availablePlans: SubscriptionPlan[] =
    poolLevel === "beginner"
      ? ["explorador", "profissional", "expert"]
      : ["profissional", "expert"];

  return {
    monthKey: offerSet.monthKey,
    startsAt: offerSet.startsAt,
    endsAt: offerSet.endsAt,
    isFreeCourseOfMonth: false,
    includedInPool: true,
    poolLevel,
    availablePlans,
  };
}

export function isCourseFreeThisMonth(courseSlug: string, referenceDate: Date = new Date()) {
  return getMonthlyCourseOfferSet(referenceDate).freeCourseSlug === courseSlug;
}

export function isCourseInCurrentMonthlyPool(courseSlug: string, referenceDate: Date = new Date()) {
  const offer = getCourseMonthlyOfferMeta(courseSlug, referenceDate);
  return Boolean(offer?.includedInPool);
}

export function canPlanAccessMonthlyOffer(
  plan: string,
  courseSlug: string,
  referenceDate: Date = new Date()
) {
  const resolvedPlan = resolvePlan(plan || "free");
  const offer = getCourseMonthlyOfferMeta(courseSlug, referenceDate);
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
