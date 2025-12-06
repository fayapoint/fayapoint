/**
 * Course Access Tier System
 * 
 * Defines subscription plans and their course access limits.
 * Course levels: free, beginner, intermediate, advanced
 * 
 * TIER LIMITS:
 * - Free: 1 free/beginner course
 * - Starter (Intermediate): 1 intermediate + 2 free/beginner
 * - Pro (Advanced): 1 advanced + 2 intermediate + 5 free/beginner
 * - Business: Unlimited access
 */

export type CourseLevel = 'free' | 'beginner' | 'intermediate' | 'advanced';
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'business';

export interface TierLimits {
  free: number;      // free + beginner courses
  beginner: number;  // free + beginner courses
  intermediate: number;
  advanced: number;
  unlimited: boolean;
}

export interface TierConfig {
  name: string;
  displayName: string;
  limits: TierLimits;
  canAccessLevel: (level: CourseLevel) => boolean;
}

// Course level hierarchy (higher number = more advanced)
export const COURSE_LEVEL_HIERARCHY: Record<CourseLevel, number> = {
  free: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3
};

// Tier configurations with course access limits
export const TIER_CONFIGS: Record<SubscriptionPlan, TierConfig> = {
  free: {
    name: 'free',
    displayName: 'Gratuito',
    limits: {
      free: 1,      // Can enroll in 1 free/beginner total
      beginner: 1,  // Same pool as free
      intermediate: 0,
      advanced: 0,
      unlimited: false
    },
    canAccessLevel: (level: CourseLevel) => level === 'free' || level === 'beginner'
  },
  starter: {
    name: 'starter',
    displayName: 'Iniciante',
    limits: {
      free: 2,      // Can enroll in 2 free/beginner
      beginner: 2,  // Same pool as free
      intermediate: 1,
      advanced: 0,
      unlimited: false
    },
    canAccessLevel: (level: CourseLevel) => level !== 'advanced'
  },
  pro: {
    name: 'pro',
    displayName: 'Profissional',
    limits: {
      free: 5,      // Can enroll in 5 free/beginner
      beginner: 5,  // Same pool as free
      intermediate: 2,
      advanced: 1,
      unlimited: false
    },
    canAccessLevel: () => true // Can access all levels
  },
  business: {
    name: 'business',
    displayName: 'Empresarial',
    limits: {
      free: Infinity,
      beginner: Infinity,
      intermediate: Infinity,
      advanced: Infinity,
      unlimited: true
    },
    canAccessLevel: () => true // Unlimited access
  }
};

/**
 * Map Portuguese course level strings to standardized CourseLevel
 */
export function normalizeCourseLevel(levelString: string): CourseLevel {
  const normalized = levelString.toLowerCase();
  
  // Free courses (explicitly marked as free or price = 0)
  if (normalized.includes('grátis') || normalized.includes('gratuito') || normalized === 'free') {
    return 'free';
  }
  
  // Advanced courses
  if (
    normalized.includes('avançado') ||
    normalized === 'advanced' ||
    normalized.includes('intermediário a avançado')
  ) {
    return 'advanced';
  }
  
  // Intermediate courses
  if (
    normalized === 'intermediário' ||
    normalized === 'intermediate'
  ) {
    return 'intermediate';
  }
  
  // Beginner courses (default for "Todos os níveis", "Iniciante", etc.)
  if (
    normalized.includes('iniciante') ||
    normalized.includes('todos os níveis') ||
    normalized === 'beginner' ||
    normalized === 'all'
  ) {
    return 'beginner';
  }
  
  // Default to beginner if unknown
  return 'beginner';
}

/**
 * Check if a course level can be accessed by a subscription tier
 */
export function canTierAccessLevel(plan: SubscriptionPlan, level: CourseLevel): boolean {
  const config = TIER_CONFIGS[plan];
  return config ? config.canAccessLevel(level) : false;
}

/**
 * Get the effective slot category for a course level
 * Free and beginner share the same slot pool
 */
export function getSlotCategory(level: CourseLevel): 'free' | 'intermediate' | 'advanced' {
  if (level === 'free' || level === 'beginner') return 'free';
  return level;
}

export interface EnrollmentSlots {
  free: { used: number; limit: number; available: number };
  intermediate: { used: number; limit: number; available: number };
  advanced: { used: number; limit: number; available: number };
}

export interface EnrolledCourse {
  courseId: string;
  level: CourseLevel;
  enrolledAt: Date;
  isActive: boolean;
}

/**
 * Calculate remaining enrollment slots for a user
 */
export function calculateEnrollmentSlots(
  plan: SubscriptionPlan,
  enrolledCourses: EnrolledCourse[]
): EnrollmentSlots {
  const config = TIER_CONFIGS[plan];
  const limits = config.limits;
  
  // Count active enrollments by slot category
  const activeEnrollments = enrolledCourses.filter(c => c.isActive);
  
  const freeUsed = activeEnrollments.filter(
    c => c.level === 'free' || c.level === 'beginner'
  ).length;
  
  const intermediateUsed = activeEnrollments.filter(
    c => c.level === 'intermediate'
  ).length;
  
  const advancedUsed = activeEnrollments.filter(
    c => c.level === 'advanced'
  ).length;
  
  return {
    free: {
      used: freeUsed,
      limit: limits.unlimited ? Infinity : limits.free,
      available: limits.unlimited ? Infinity : Math.max(0, limits.free - freeUsed)
    },
    intermediate: {
      used: intermediateUsed,
      limit: limits.unlimited ? Infinity : limits.intermediate,
      available: limits.unlimited ? Infinity : Math.max(0, limits.intermediate - intermediateUsed)
    },
    advanced: {
      used: advancedUsed,
      limit: limits.unlimited ? Infinity : limits.advanced,
      available: limits.unlimited ? Infinity : Math.max(0, limits.advanced - advancedUsed)
    }
  };
}

/**
 * Check if a user can enroll in a specific course
 */
export function canEnrollInCourse(
  plan: SubscriptionPlan,
  courseLevel: CourseLevel,
  enrolledCourses: EnrolledCourse[],
  targetCourseId: string
): { canEnroll: boolean; reason?: string; upgradeRequired?: boolean } {
  const config = TIER_CONFIGS[plan];
  
  // Check if tier can access this level at all
  if (!config.canAccessLevel(courseLevel)) {
    return {
      canEnroll: false,
      reason: `Seu plano ${config.displayName} não permite acesso a cursos ${courseLevel === 'advanced' ? 'avançados' : 'deste nível'}`,
      upgradeRequired: true
    };
  }
  
  // Check if already enrolled
  const alreadyEnrolled = enrolledCourses.find(
    c => c.courseId === targetCourseId && c.isActive
  );
  
  if (alreadyEnrolled) {
    return { canEnroll: true }; // Already enrolled, can access
  }
  
  // Unlimited plan - always can enroll
  if (config.limits.unlimited) {
    return { canEnroll: true };
  }
  
  // Check slot availability
  const slots = calculateEnrollmentSlots(plan, enrolledCourses);
  const slotCategory = getSlotCategory(courseLevel);
  
  if (slots[slotCategory].available <= 0) {
    return {
      canEnroll: false,
      reason: `Você atingiu o limite de ${slots[slotCategory].limit} curso(s) ${slotCategory === 'free' ? 'gratuitos/iniciantes' : slotCategory === 'intermediate' ? 'intermediários' : 'avançados'} do seu plano`,
      upgradeRequired: true
    };
  }
  
  return { canEnroll: true };
}

/**
 * Get user-friendly tier upgrade suggestions
 */
export function getUpgradeSuggestion(
  currentPlan: SubscriptionPlan,
  desiredLevel: CourseLevel
): { suggestedPlan: SubscriptionPlan; benefits: string[] } | null {
  const upgradePath: SubscriptionPlan[] = ['starter', 'pro', 'business'];
  
  for (const plan of upgradePath) {
    if (COURSE_LEVEL_HIERARCHY[currentPlan as unknown as CourseLevel] >= COURSE_LEVEL_HIERARCHY[plan as unknown as CourseLevel]) {
      continue; // Skip lower or equal tiers
    }
    
    const config = TIER_CONFIGS[plan];
    if (config.canAccessLevel(desiredLevel)) {
      const benefits: string[] = [];
      
      if (plan === 'starter') {
        benefits.push('2 cursos gratuitos/iniciantes');
        benefits.push('1 curso intermediário');
      } else if (plan === 'pro') {
        benefits.push('5 cursos gratuitos/iniciantes');
        benefits.push('2 cursos intermediários');
        benefits.push('1 curso avançado');
        benefits.push('Assistente IA ilimitado');
      } else if (plan === 'business') {
        benefits.push('Acesso ilimitado a todos os cursos');
        benefits.push('Recursos empresariais');
        benefits.push('Suporte prioritário');
      }
      
      return { suggestedPlan: plan, benefits };
    }
  }
  
  return null;
}
