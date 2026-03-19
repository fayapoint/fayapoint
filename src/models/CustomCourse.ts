import mongoose, { Schema, Document, Model } from 'mongoose';

// =============================================================================
// TYPES
// =============================================================================

export type CustomCourseStatus =
  | 'pending_payment'
  | 'paid'
  | 'generating'
  | 'quality_loop'
  | 'ready'
  | 'delivered'
  | 'failed'
  | 'refunded';

export interface ICustomCourseRequest extends Document {
  // User
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;

  // Request details
  topic: string;
  description: string;
  duration: number; // requested hours (2-40)
  language: string; // pt-BR, en, es
  level: 'beginner' | 'intermediate' | 'advanced';
  includeVideoScripts: boolean;
  includeQuizzes: boolean;
  includeExercises: boolean;
  includeCertificate: boolean;
  additionalNotes?: string;

  // Pricing
  pricePerHour: number; // R$49 default
  totalPrice: number;
  currency: string;

  // Payment
  paymentId?: mongoose.Types.ObjectId;
  paymentProvider?: 'asaas' | 'mercadopago';

  // Generation
  status: CustomCourseStatus;
  generatedCourseId?: mongoose.Types.ObjectId; // Links to Course once generated
  qualityScore?: number; // 0-10 from autoresearch loop
  qualityIterations?: number; // How many autoresearch iterations ran
  generationLog: Array<{
    step: string;
    status: 'started' | 'completed' | 'failed';
    timestamp: Date;
    details?: string;
    score?: number;
  }>;

  // Delivery
  deliveredAt?: Date;
  notifiedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SCHEMA
// =============================================================================

const CustomCourseSchema = new Schema<ICustomCourseRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },

    topic: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 2000 },
    duration: { type: Number, required: true, min: 2, max: 40 },
    language: { type: String, default: 'pt-BR' },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    includeVideoScripts: { type: Boolean, default: false },
    includeQuizzes: { type: Boolean, default: true },
    includeExercises: { type: Boolean, default: true },
    includeCertificate: { type: Boolean, default: true },
    additionalNotes: { type: String, maxlength: 1000 },

    pricePerHour: { type: Number, default: 49 },
    totalPrice: { type: Number, required: true },
    currency: { type: String, default: 'BRL' },

    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    paymentProvider: { type: String, enum: ['asaas', 'mercadopago'] },

    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'generating', 'quality_loop', 'ready', 'delivered', 'failed', 'refunded'],
      default: 'pending_payment',
      index: true,
    },
    generatedCourseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    qualityScore: { type: Number },
    qualityIterations: { type: Number, default: 0 },
    generationLog: [
      {
        step: { type: String },
        status: { type: String, enum: ['started', 'completed', 'failed'] },
        timestamp: { type: Date, default: Date.now },
        details: { type: String },
        score: { type: Number },
      },
    ],

    deliveredAt: { type: Date },
    notifiedAt: { type: Date },
  },
  { timestamps: true }
);

// =============================================================================
// INDEXES
// =============================================================================

CustomCourseSchema.index({ userId: 1, status: 1 });
CustomCourseSchema.index({ createdAt: -1 });

// =============================================================================
// STATICS
// =============================================================================

CustomCourseSchema.statics.getPendingGeneration = function () {
  return this.find({ status: { $in: ['paid', 'generating', 'quality_loop'] } }).sort({ createdAt: 1 });
};

// =============================================================================
// EXPORT
// =============================================================================

interface ICustomCourseModel extends Model<ICustomCourseRequest> {
  getPendingGeneration(): Promise<ICustomCourseRequest[]>;
}

const CustomCourse =
  (mongoose.models.CustomCourse as ICustomCourseModel) ||
  mongoose.model<ICustomCourseRequest, ICustomCourseModel>('CustomCourse', CustomCourseSchema);

export default CustomCourse;
