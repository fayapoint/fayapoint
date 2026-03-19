// =============================================================================
// A/B Testing Engine — variant assignment, tracking, statistical analysis
// =============================================================================

import Experiment, { type IExperiment, type IVariant } from "@/models/Experiment";
import connectDB from "@/lib/mongodb";

// ---------- Variant Assignment ----------

/**
 * Deterministically assign a user to a variant using a hash.
 * Same user+experiment always gets the same variant.
 */
function hashAssign(userId: string, experimentKey: string, variants: IVariant[]): IVariant {
  // Simple FNV-1a hash for deterministic assignment
  let hash = 2166136261;
  const str = `${userId}:${experimentKey}`;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const bucket = Math.abs(hash) % 100;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant;
  }
  return variants[variants.length - 1];
}

/**
 * Get the variant a user should see for a given experiment.
 * Returns null if the experiment is not running or user is not in target audience.
 */
export async function getVariant(
  userId: string,
  experimentKey: string,
  userPlan?: string,
  userLocale?: string
): Promise<{ variant: IVariant; experiment: IExperiment } | null> {
  await connectDB();

  const experiment = await Experiment.findOne({ key: experimentKey, status: "running" }).lean() as IExperiment | null;
  if (!experiment) return null;

  // Check audience targeting
  const { targetAudience } = experiment;
  if (targetAudience.plans?.length && userPlan && !targetAudience.plans.includes(userPlan)) {
    return null;
  }
  if (targetAudience.locales?.length && userLocale && !targetAudience.locales.includes(userLocale)) {
    return null;
  }

  // Check enrollment percentage
  if (targetAudience.percentage < 100) {
    const enrollHash = Math.abs(hashAssign(userId, `${experimentKey}:enroll`, experiment.variants).weight) % 100;
    if (enrollHash >= targetAudience.percentage) return null;
  }

  const variant = hashAssign(userId, experimentKey, experiment.variants);
  return { variant, experiment };
}

// ---------- Event Tracking ----------

export async function trackImpression(experimentKey: string, variantId: string): Promise<void> {
  await connectDB();
  await Experiment.updateOne(
    { key: experimentKey, "variants.id": variantId },
    { $inc: { "variants.$.impressions": 1 } }
  );
}

export async function trackConversion(
  experimentKey: string,
  variantId: string,
  revenue = 0
): Promise<void> {
  await connectDB();
  await Experiment.updateOne(
    { key: experimentKey, "variants.id": variantId },
    {
      $inc: {
        "variants.$.conversions": 1,
        "variants.$.revenue": revenue,
      },
    }
  );
}

// ---------- Statistical Analysis ----------

/**
 * Calculate z-score for comparing two proportions (conversion rates).
 * Returns confidence level and whether the result is statistically significant.
 */
export function analyzeExperiment(variants: IVariant[]): {
  winner: string | null;
  confidence: number;
  uplift: number;
  details: Array<{
    variantId: string;
    name: string;
    conversionRate: number;
    impressions: number;
    conversions: number;
    revenue: number;
  }>;
} {
  if (variants.length < 2) {
    return { winner: null, confidence: 0, uplift: 0, details: [] };
  }

  const details = variants.map((v) => ({
    variantId: v.id,
    name: v.name,
    conversionRate: v.impressions > 0 ? v.conversions / v.impressions : 0,
    impressions: v.impressions,
    conversions: v.conversions,
    revenue: v.revenue,
  }));

  // Sort by conversion rate
  const sorted = [...details].sort((a, b) => b.conversionRate - a.conversionRate);
  const best = sorted[0];
  const control = sorted[sorted.length - 1]; // Worst = baseline

  if (control.impressions < 30 || best.impressions < 30) {
    return { winner: null, confidence: 0, uplift: 0, details };
  }

  // Z-test for two proportions
  const p1 = best.conversionRate;
  const p2 = control.conversionRate;
  const n1 = best.impressions;
  const n2 = control.impressions;
  const pPool = (best.conversions + control.conversions) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

  const zScore = se > 0 ? (p1 - p2) / se : 0;

  // Convert z-score to confidence (approximate using normal CDF)
  const confidence = zScore > 0 ? Math.min(normalCDF(zScore) * 100, 99.9) : 0;

  const uplift = p2 > 0 ? ((p1 - p2) / p2) * 100 : 0;

  return {
    winner: confidence >= 95 ? best.variantId : null,
    confidence: Math.round(confidence * 10) / 10,
    uplift: Math.round(uplift * 10) / 10,
    details,
  };
}

/**
 * Approximate normal CDF using Abramowitz & Stegun formula.
 */
function normalCDF(z: number): number {
  if (z < -6) return 0;
  if (z > 6) return 1;

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}
