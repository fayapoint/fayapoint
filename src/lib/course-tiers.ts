/**
 * FayAI Course Access & Credit System
 *
 * ═══════════════════════════════════════════════════════════
 * SUBSCRIPTION TIERS
 * ═══════════════════════════════════════════════════════════
 *
 * Free:        R$0        — 3 chapter preview per course, no full access
 * Explorador:  R$57/mês   — 3 beginner courses/month, 100 credits
 * Profissional: R$97/mês  — 5 beginner + 2 intermediate + 1 advanced, 300 credits
 * Expert:      R$167/mês  — 7 beginner + 4 intermediate + 3 advanced, 800 credits
 *
 * ═══════════════════════════════════════════════════════════
 * COURSE LEVELS & PURCHASE PRICES
 * ═══════════════════════════════════════════════════════════
 *
 * Beginner:     R$57 individual purchase
 * Intermediate:  R$97 individual purchase
 * Advanced:      R$167 individual purchase
 * Tier discounts apply: Explorador 10%, Profissional 20%, Expert 50%
 *
 * ═══════════════════════════════════════════════════════════
 * MONTHLY ROTATING POOL
 * ═══════════════════════════════════════════════════════════
 *
 * 10 beginner courses available per month
 * 8 intermediate courses available per month
 * 3 advanced courses available per month
 * (rotation managed via admin/mission-control)
 *
 * ═══════════════════════════════════════════════════════════
 * CREDIT SYSTEM (Higgsfield-style)
 * ═══════════════════════════════════════════════════════════
 *
 * Monthly allocation (resets each billing cycle, no rollover):
 *   Free: 0 | Explorador: 100 | Profissional: 300 | Expert: 800
 *
 * Credit costs:
 *   Quiz attempt: 10 | Certificate generation: 20
 *   AI Chat message: 1 | Image generation: 5
 *   Custom course generation: 50
 *
 * Credit packs (one-time purchase, expire in 90 days):
 *   50 credits: R$15 | 150 credits: R$35
 *   500 credits: R$99 | 1000 credits: R$179
 *
 * ═══════════════════════════════════════════════════════════
 * QUIZ & CERTIFICATE PRICING
 * ═══════════════════════════════════════════════════════════
 *
 * Base price: Beginner R$29, Intermediate R$79, Advanced R$199
 * Tier discounts: Explorador 10%, Profissional 20%, Expert 50%
 * Certificate is verifiable online at /certificado/[code]
 */

// ─── Types ───────────────────────────────────────────────

export type CourseLevel = 'free' | 'beginner' | 'intermediate' | 'advanced';
export type SubscriptionPlan = 'free' | 'explorador' | 'profissional' | 'expert';

// Backwards compatibility alias for existing code referencing old plan names
export type LegacyPlan = 'starter' | 'pro' | 'business';

/** Map legacy plan slugs → new plan slugs (for migration) */
export const LEGACY_PLAN_MAP: Record<string, SubscriptionPlan> = {
  free: 'free',
  starter: 'explorador',
  pro: 'profissional',
  business: 'expert',
};

/** Resolve a plan slug that could be legacy or current */
export function resolvePlan(planSlug: string): SubscriptionPlan {
  return LEGACY_PLAN_MAP[planSlug] ?? (planSlug as SubscriptionPlan) ?? 'free';
}

// ─── Tier Limits ─────────────────────────────────────────

export interface TierLimits {
  beginner: number;
  intermediate: number;
  advanced: number;
  unlimited: boolean;
}

export interface TierConfig {
  name: string;
  displayName: string;
  slug: SubscriptionPlan;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: TierLimits;
  monthlyCredits: number;
  purchaseDiscount: number;   // 0–1 discount on individual course purchases
  quizDiscount: number;       // 0–1 discount on quiz + certificate
  canAccessLevel: (level: CourseLevel) => boolean;
  features: string[];
}

export const TIER_CONFIGS: Record<SubscriptionPlan, TierConfig> = {
  free: {
    name: 'free',
    displayName: 'Gratuito',
    slug: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      unlimited: false,
    },
    monthlyCredits: 0,
    purchaseDiscount: 0,
    quizDiscount: 0,
    canAccessLevel: (level) => level === 'free',
    features: [
      '3 capítulos grátis por curso',
      'Acesso limitado para experimentar',
    ],
  },
  explorador: {
    name: 'explorador',
    displayName: 'Explorador',
    slug: 'explorador',
    monthlyPrice: 57,
    yearlyPrice: 570,      // ~R$47.50/mês (2 meses grátis)
    limits: {
      beginner: 3,
      intermediate: 0,
      advanced: 0,
      unlimited: false,
    },
    monthlyCredits: 100,
    purchaseDiscount: 0.10,
    quizDiscount: 0.10,
    canAccessLevel: (level) => level === 'free' || level === 'beginner',
    features: [
      '3 cursos iniciantes por mês',
      '100 créditos/mês para IA',
      '10% de desconto em certificações',
      '10% de desconto na compra de cursos avulsos',
      'Certificados verificáveis online',
      'Acesso à comunidade',
    ],
  },
  profissional: {
    name: 'profissional',
    displayName: 'Profissional',
    slug: 'profissional',
    monthlyPrice: 97,
    yearlyPrice: 970,      // ~R$80.83/mês (2 meses grátis)
    limits: {
      beginner: 5,
      intermediate: 2,
      advanced: 1,
      unlimited: false,
    },
    monthlyCredits: 300,
    purchaseDiscount: 0.20,
    quizDiscount: 0.20,
    canAccessLevel: () => true,
    features: [
      '5 cursos iniciantes por mês',
      '2 cursos intermediários por mês',
      '1 curso avançado por mês',
      '300 créditos/mês para IA',
      '20% de desconto em certificações',
      '20% de desconto na compra de cursos avulsos',
      'Suporte prioritário',
      'Conteúdo exclusivo e antecipado',
    ],
  },
  expert: {
    name: 'expert',
    displayName: 'Expert',
    slug: 'expert',
    monthlyPrice: 167,
    yearlyPrice: 1670,     // ~R$139.17/mês (2 meses grátis)
    limits: {
      beginner: 7,
      intermediate: 4,
      advanced: 3,
      unlimited: false,
    },
    monthlyCredits: 800,
    purchaseDiscount: 0.50,
    quizDiscount: 0.50,
    canAccessLevel: () => true,
    features: [
      '7 cursos iniciantes por mês',
      '4 cursos intermediários por mês',
      '3 cursos avançados por mês',
      '800 créditos/mês para IA',
      '50% de desconto em certificações',
      '50% de desconto na compra de cursos avulsos',
      'Suporte VIP + conteúdo exclusivo',
      'Consultoria mensal com especialista',
    ],
  },
};

// ─── Course Purchase Prices ──────────────────────────────

/** Individual course purchase price (for non-tier or beyond-limit purchases) */
export const COURSE_PURCHASE_PRICE: Record<CourseLevel, number> = {
  free: 0,
  beginner: 57,
  intermediate: 97,
  advanced: 167,
};

/** Quiz + Certificate base price */
export const QUIZ_CERTIFICATE_BASE_PRICE: Record<CourseLevel, number> = {
  free: 19,
  beginner: 29,
  intermediate: 79,
  advanced: 199,
};

export const COURSE_LEVEL_HIERARCHY: Record<CourseLevel, number> = {
  free: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

// ─── Credit System ───────────────────────────────────────

export const CREDIT_COSTS = {
  quiz_attempt: 10,
  certificate_generation: 20,
  ai_chat_message: 1,
  image_generation: 5,
  custom_course_generation: 50,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export interface CreditPack {
  id: string;
  credits: number;
  priceReais: number;
  expiresInDays: number;
  savings: string;       // e.g. "23% economia"
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack-50',   credits: 50,   priceReais: 15,  expiresInDays: 90, savings: '' },
  { id: 'pack-150',  credits: 150,  priceReais: 35,  expiresInDays: 90, savings: '23% economia' },
  { id: 'pack-500',  credits: 500,  priceReais: 99,  expiresInDays: 90, savings: '34% economia' },
  { id: 'pack-1000', credits: 1000, priceReais: 179, expiresInDays: 90, savings: '40% economia' },
];

// ─── Monthly Rotating Pool ───────────────────────────────

export const MONTHLY_POOL = {
  beginner: 10,       // all beginner courses available per month
  intermediate: 8,    // all intermediate courses available per month
  advanced: 5,        // all advanced courses available per month (Expert sees all)
} as const;

// ─── Price Calculations ──────────────────────────────────

/**
 * Get the discounted purchase price for a course
 */
export function getCoursePurchasePrice(
  plan: SubscriptionPlan,
  courseLevel: CourseLevel
): { basePrice: number; discount: number; finalPrice: number } {
  const basePrice = COURSE_PURCHASE_PRICE[courseLevel];
  const config = TIER_CONFIGS[plan];
  const discount = config.purchaseDiscount;
  const finalPrice = Math.round(basePrice * (1 - discount));
  return { basePrice, discount, finalPrice };
}

/**
 * Calculate the quiz + certificate price for a user's tier
 */
export function getQuizCertificatePrice(
  plan: SubscriptionPlan,
  courseLevel: CourseLevel
): { basePrice: number; discount: number; finalPrice: number } {
  const basePrice = QUIZ_CERTIFICATE_BASE_PRICE[courseLevel];
  const config = TIER_CONFIGS[plan];
  const discount = config.quizDiscount;
  const finalPrice = Math.round(basePrice * (1 - discount));
  return { basePrice, discount, finalPrice };
}

// ─── Level Normalization ─────────────────────────────────

/**
 * Map Portuguese course level strings to standardized CourseLevel
 */
export function normalizeCourseLevel(levelString: string): CourseLevel {
  const normalized = levelString.toLowerCase();

  if (normalized.includes('grátis') || normalized.includes('gratuito') || normalized === 'free') {
    return 'free';
  }
  if (
    normalized.includes('avançado') ||
    normalized === 'advanced' ||
    normalized.includes('intermediário a avançado')
  ) {
    return 'advanced';
  }
  if (normalized === 'intermediário' || normalized === 'intermediate') {
    return 'intermediate';
  }
  if (
    normalized.includes('iniciante') ||
    normalized.includes('todos os níveis') ||
    normalized === 'beginner' ||
    normalized === 'all'
  ) {
    return 'beginner';
  }
  return 'beginner';
}

// ─── Enrollment Slots ────────────────────────────────────

export interface EnrollmentSlots {
  beginner: { used: number; limit: number; available: number };
  intermediate: { used: number; limit: number; available: number };
  advanced: { used: number; limit: number; available: number };
}

export interface EnrolledCourse {
  courseId: string;
  courseSlug?: string;
  level: CourseLevel;
  enrolledAt: Date;
  isActive: boolean;
}

/**
 * Calculate remaining enrollment slots for a user (monthly window)
 */
export function calculateEnrollmentSlots(
  plan: SubscriptionPlan,
  enrolledCourses: EnrolledCourse[]
): EnrollmentSlots {
  const resolved = resolvePlan(plan);
  const config = TIER_CONFIGS[resolved];
  const limits = config.limits;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthEnrollments = enrolledCourses.filter(
    (c) => c.isActive && new Date(c.enrolledAt) >= monthStart
  );

  const beginnerUsed = thisMonthEnrollments.filter(
    (c) => c.level === 'free' || c.level === 'beginner'
  ).length;
  const intermediateUsed = thisMonthEnrollments.filter(
    (c) => c.level === 'intermediate'
  ).length;
  const advancedUsed = thisMonthEnrollments.filter(
    (c) => c.level === 'advanced'
  ).length;

  return {
    beginner: {
      used: beginnerUsed,
      limit: limits.unlimited ? Infinity : limits.beginner,
      available: limits.unlimited
        ? Infinity
        : Math.max(0, limits.beginner - beginnerUsed),
    },
    intermediate: {
      used: intermediateUsed,
      limit: limits.unlimited ? Infinity : limits.intermediate,
      available: limits.unlimited
        ? Infinity
        : Math.max(0, limits.intermediate - intermediateUsed),
    },
    advanced: {
      used: advancedUsed,
      limit: limits.unlimited ? Infinity : limits.advanced,
      available: limits.unlimited
        ? Infinity
        : Math.max(0, limits.advanced - advancedUsed),
    },
  };
}

// ─── Enrollment Checks ───────────────────────────────────

export function getSlotCategory(level: CourseLevel): 'beginner' | 'intermediate' | 'advanced' {
  if (level === 'free' || level === 'beginner') return 'beginner';
  return level;
}

export function canTierAccessLevel(plan: SubscriptionPlan, level: CourseLevel): boolean {
  const resolved = resolvePlan(plan);
  const config = TIER_CONFIGS[resolved];
  return config ? config.canAccessLevel(level) : false;
}

export function canEnrollInCourse(
  plan: SubscriptionPlan,
  courseLevel: CourseLevel,
  enrolledCourses: EnrolledCourse[],
  targetCourseId: string
): { canEnroll: boolean; reason?: string; upgradeRequired?: boolean; canPurchase?: boolean } {
  const resolved = resolvePlan(plan);
  const config = TIER_CONFIGS[resolved];

  // Free plan — preview only, but they CAN purchase individual courses
  if (resolved === 'free') {
    return {
      canEnroll: false,
      reason: 'Assine um plano para acessar cursos completos, ou compre este curso individualmente.',
      upgradeRequired: true,
      canPurchase: true,
    };
  }

  // Check if tier can access this level
  if (!config.canAccessLevel(courseLevel)) {
    const levelName =
      courseLevel === 'advanced' ? 'avançados'
        : courseLevel === 'intermediate' ? 'intermediários'
          : 'deste nível';
    return {
      canEnroll: false,
      reason: `Seu plano ${config.displayName} não permite acesso a cursos ${levelName}. Faça upgrade ou compre individualmente.`,
      upgradeRequired: true,
      canPurchase: true,
    };
  }

  // Check if already enrolled
  const alreadyEnrolled = enrolledCourses.find(
    (c) => (c.courseId === targetCourseId || c.courseSlug === targetCourseId) && c.isActive
  );
  if (alreadyEnrolled) {
    return { canEnroll: true };
  }

  // Check slot availability
  const slots = calculateEnrollmentSlots(resolved, enrolledCourses);
  const slotCategory = getSlotCategory(courseLevel);

  if (slots[slotCategory].available <= 0) {
    const categoryName =
      slotCategory === 'beginner' ? 'iniciantes'
        : slotCategory === 'intermediate' ? 'intermediários'
          : 'avançados';
    return {
      canEnroll: false,
      reason: `Você atingiu o limite mensal de ${slots[slotCategory].limit} curso(s) ${categoryName}. Aguarde o próximo mês, faça upgrade, ou compre individualmente.`,
      upgradeRequired: true,
      canPurchase: true,
    };
  }

  return { canEnroll: true };
}

// ─── Upgrade Suggestions ─────────────────────────────────

export function getUpgradeSuggestion(
  currentPlan: SubscriptionPlan,
  desiredLevel: CourseLevel
): { suggestedPlan: SubscriptionPlan; benefits: string[] } | null {
  const resolved = resolvePlan(currentPlan);
  const planOrder: SubscriptionPlan[] = ['free', 'explorador', 'profissional', 'expert'];
  const currentIndex = planOrder.indexOf(resolved);

  for (let i = currentIndex + 1; i < planOrder.length; i++) {
    const plan = planOrder[i];
    const config = TIER_CONFIGS[plan];

    if (config.canAccessLevel(desiredLevel)) {
      return { suggestedPlan: plan, benefits: config.features };
    }
  }

  return null;
}

// ─── Credit Helpers ──────────────────────────────────────

/**
 * Check if user has enough credits for an action
 */
export function canAffordCredits(
  availableCredits: number,
  action: CreditAction
): boolean {
  return availableCredits >= CREDIT_COSTS[action];
}

/**
 * Get credit cost for a specific action
 */
export function getCreditCost(action: CreditAction): number {
  return CREDIT_COSTS[action];
}
