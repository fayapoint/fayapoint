import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Experiment from "@/models/Experiment";
import {
  getVariant,
  trackImpression,
  trackConversion,
  analyzeExperiment,
} from "@/lib/ab-testing";

// CORS headers for cross-origin requests (mission-control on :3001)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function corsJson(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { ...init, headers: CORS_HEADERS });
}

// Preflight handler
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// =============================================================================
// GET - List experiments or get variant assignment
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    // Get variant for a specific user + experiment
    const assign = searchParams.get("assign");
    if (assign) {
      const userId = searchParams.get("userId");
      const plan = searchParams.get("plan") || undefined;
      const locale = searchParams.get("locale") || undefined;

      if (!userId) {
        return corsJson({ error: "userId required for assignment" }, { status: 400 });
      }

      const result = await getVariant(userId, assign, plan, locale);
      if (!result) {
        return corsJson({ variant: null });
      }

      // Auto-track impression
      await trackImpression(assign, result.variant.id);

      return corsJson({
        variant: result.variant,
        experimentKey: assign,
      });
    }

    // Analyze a specific experiment
    const analyze = searchParams.get("analyze");
    if (analyze) {
      const experiment = await Experiment.findOne({ key: analyze }).lean();
      if (!experiment) {
        return corsJson({ error: "Experiment not found" }, { status: 404 });
      }

      const analysis = analyzeExperiment(experiment.variants);
      return corsJson({ experiment, analysis });
    }

    // List all experiments
    const status = searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const experiments = await Experiment.find(filter).sort({ updatedAt: -1 }).lean();
    return corsJson({ experiments, count: experiments.length });
  } catch (error) {
    console.error("GET /api/experiments error:", error);
    return corsJson({ error: "Internal server error" }, { status: 500 });
  }
}

// =============================================================================
// POST - Create experiment, track events, or manage lifecycle
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action } = body;

    // Create new experiment
    if (action === "create") {
      const { name, key, description, variants, targetAudience, metrics, createdBy } = body;

      if (!name || !key || !variants?.length || !metrics?.primaryMetric) {
        return corsJson(
          { error: "name, key, variants, and metrics.primaryMetric required" },
          { status: 400 }
        );
      }

      // Validate weights sum to 100
      const totalWeight = variants.reduce((sum: number, v: { weight: number }) => sum + v.weight, 0);
      if (totalWeight !== 100) {
        return corsJson(
          { error: `Variant weights must sum to 100 (got ${totalWeight})` },
          { status: 400 }
        );
      }

      const experiment = await Experiment.create({
        name,
        key,
        description: description || "",
        variants: variants.map((v: { id: string; name: string; weight: number; config?: Record<string, unknown> }) => ({
          ...v,
          impressions: 0,
          conversions: 0,
          revenue: 0,
        })),
        targetAudience: targetAudience || { percentage: 100 },
        metrics,
        createdBy: createdBy || "system",
      });

      return corsJson({ success: true, experiment }, { status: 201 });
    }

    // Start experiment
    if (action === "start") {
      const experiment = await Experiment.findOne({ key: body.key });
      if (!experiment) return corsJson({ error: "Not found" }, { status: 404 });
      experiment.status = "running";
      experiment.startedAt = new Date();
      await experiment.save();
      return corsJson({ success: true, experiment });
    }

    // Pause experiment
    if (action === "pause") {
      const experiment = await Experiment.findOne({ key: body.key });
      if (!experiment) return corsJson({ error: "Not found" }, { status: 404 });
      experiment.status = "paused";
      await experiment.save();
      return corsJson({ success: true, experiment });
    }

    // Complete experiment (declare winner)
    if (action === "complete") {
      const experiment = await Experiment.findOne({ key: body.key });
      if (!experiment) return corsJson({ error: "Not found" }, { status: 404 });

      const analysis = analyzeExperiment(experiment.variants);
      experiment.status = "completed";
      experiment.endedAt = new Date();
      experiment.results = {
        winner: body.winner || analysis.winner || undefined,
        confidence: analysis.confidence,
        uplift: analysis.uplift,
        decidedAt: new Date(),
      };
      await experiment.save();
      return corsJson({ success: true, experiment, analysis });
    }

    // Track conversion
    if (action === "convert") {
      const { key, variantId, revenue } = body;
      if (!key || !variantId) {
        return corsJson({ error: "key and variantId required" }, { status: 400 });
      }
      await trackConversion(key, variantId, revenue || 0);
      return corsJson({ success: true });
    }

    return corsJson({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error("POST /api/experiments error:", error);
    return corsJson({ error: "Internal server error" }, { status: 500 });
  }
}
