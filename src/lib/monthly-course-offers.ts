import { allCourses, getCourseBySlug, getNormalizedLevel, type CourseData } from "@/data/courses";
import { MONTHLY_POOL, resolvePlan, type CourseLevel, type SubscriptionPlan } from "@/lib/course-tiers";

const OFFER_TIMEZONE = "America/Sao_Paulo";

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

export function getMonthlyCourseOfferSet(referenceDate: Date = new Date()): MonthlyCourseOfferSet {
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

  return {
    monthKey,
    startsAt: bounds.startsAt,
    endsAt: bounds.endsAt,
    freeCourseSlug,
    pools,
  };
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
