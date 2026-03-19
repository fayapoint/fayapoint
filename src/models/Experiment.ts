// =============================================================================
// A/B Experiment Model — tracks experiments, variants, and conversions
// =============================================================================

import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IVariant {
  id: string;
  name: string;
  weight: number; // 0-100 percentage
  config: Record<string, unknown>;
  impressions: number;
  conversions: number;
  revenue: number;
}

export interface IExperiment extends Document {
  name: string;
  description: string;
  key: string; // unique key for code reference (e.g., "pricing-page-v2")
  status: "draft" | "running" | "paused" | "completed";
  variants: IVariant[];
  targetAudience: {
    plans?: string[];
    locales?: string[];
    percentage: number; // % of users enrolled
  };
  metrics: {
    primaryMetric: string;
    secondaryMetrics: string[];
  };
  results?: {
    winner?: string; // variant id
    confidence: number;
    uplift: number;
    decidedAt?: Date;
  };
  startedAt?: Date;
  endedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  weight: { type: Number, required: true, min: 0, max: 100 },
  config: { type: Schema.Types.Mixed, default: {} },
  impressions: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
}, { _id: false });

const ExperimentSchema = new Schema<IExperiment>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    key: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["draft", "running", "paused", "completed"],
      default: "draft",
    },
    variants: { type: [VariantSchema], required: true },
    targetAudience: {
      plans: [String],
      locales: [String],
      percentage: { type: Number, default: 100 },
    },
    metrics: {
      primaryMetric: { type: String, required: true },
      secondaryMetrics: [String],
    },
    results: {
      winner: String,
      confidence: { type: Number, default: 0 },
      uplift: { type: Number, default: 0 },
      decidedAt: Date,
    },
    startedAt: Date,
    endedAt: Date,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

ExperimentSchema.index({ key: 1 });
ExperimentSchema.index({ status: 1 });

const Experiment =
  (mongoose.models.Experiment as Model<IExperiment>) ||
  mongoose.model<IExperiment>("Experiment", ExperimentSchema);

export default Experiment;
