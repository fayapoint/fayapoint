import mongoose, { Schema, Document, Model } from 'mongoose';

// =============================================================================
// TYPES
// =============================================================================

export type SubscriptionStatus = 'active' | 'inactive' | 'expired' | 'cancelled' | 'pending';

export type SubscriptionCycle = 
  | 'weekly' 
  | 'biweekly' 
  | 'monthly' 
  | 'bimonthly' 
  | 'quarterly' 
  | 'semiannually' 
  | 'yearly';

export type BillingType = 'pix' | 'boleto' | 'credit_card' | 'undefined';

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId;
  
  // User reference
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  
  // Plan info
  planId: string;
  planName: string;
  planSlug: string;
  
  // Asaas info
  asaasSubscriptionId: string;
  asaasCustomerId: string;
  
  // Subscription details
  status: SubscriptionStatus;
  billingType: BillingType;
  value: number;
  cycle: SubscriptionCycle;
  description?: string;
  
  // Dates
  startDate: Date;
  nextDueDate: Date;
  endDate?: Date;
  cancelledAt?: Date;
  
  // Credit card info (if tokenized)
  creditCardToken?: string;
  creditCardLastFour?: string;
  creditCardBrand?: string;
  
  // Discount settings
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  
  // Fine/Interest settings
  fine?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
  };
  
  // Statistics
  totalPayments: number;
  totalPaid: number;
  lastPaymentDate?: Date;
  
  // Metadata
  externalReference?: string;
  notes?: string;
  
  // Webhook tracking
  webhookEvents: Array<{
    event: string;
    receivedAt: Date;
    data?: Record<string, unknown>;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SCHEMA
// =============================================================================

const SubscriptionSchema = new Schema<ISubscription>({
  // User reference
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true,
  },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  
  // Plan info
  planId: { type: String, required: true },
  planName: { type: String, required: true },
  planSlug: { type: String, required: true, index: true },
  
  // Asaas info
  asaasSubscriptionId: { type: String, required: true, unique: true, index: true },
  asaasCustomerId: { type: String, required: true },
  
  // Subscription details
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'expired', 'cancelled', 'pending'],
    default: 'pending',
    index: true,
  },
  billingType: { 
    type: String, 
    enum: ['pix', 'boleto', 'credit_card', 'undefined'],
    required: true,
  },
  value: { type: Number, required: true },
  cycle: { 
    type: String, 
    enum: ['weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannually', 'yearly'],
    required: true,
  },
  description: { type: String },
  
  // Dates
  startDate: { type: Date, required: true },
  nextDueDate: { type: Date, required: true },
  endDate: { type: Date },
  cancelledAt: { type: Date },
  
  // Credit card info
  creditCardToken: { type: String },
  creditCardLastFour: { type: String },
  creditCardBrand: { type: String },
  
  // Discount settings
  discount: {
    value: { type: Number },
    dueDateLimitDays: { type: Number },
    type: { type: String, enum: ['FIXED', 'PERCENTAGE'] },
  },
  
  // Fine/Interest
  fine: {
    value: { type: Number },
    type: { type: String, enum: ['FIXED', 'PERCENTAGE'] },
  },
  interest: {
    value: { type: Number },
  },
  
  // Statistics
  totalPayments: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  lastPaymentDate: { type: Date },
  
  // Metadata
  externalReference: { type: String, index: true },
  notes: { type: String },
  
  // Webhooks
  webhookEvents: [{
    event: { type: String },
    receivedAt: { type: Date, default: Date.now },
    data: { type: Schema.Types.Mixed },
  }],
}, {
  timestamps: true,
});

// =============================================================================
// INDEXES
// =============================================================================

SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ asaasSubscriptionId: 1 });
SubscriptionSchema.index({ nextDueDate: 1 });

// =============================================================================
// STATICS
// =============================================================================

/**
 * Find subscription by Asaas ID
 */
SubscriptionSchema.statics.findByAsaasId = function(asaasSubscriptionId: string) {
  return this.findOne({ asaasSubscriptionId });
};

/**
 * Get user's active subscriptions
 */
SubscriptionSchema.statics.getUserActiveSubscriptions = function(
  userId: mongoose.Types.ObjectId
) {
  return this.find({ userId, status: 'active' }).sort({ createdAt: -1 });
};

/**
 * Get subscriptions due for renewal
 */
SubscriptionSchema.statics.getDueForRenewal = function(days: number = 3) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    nextDueDate: { $lte: futureDate },
  });
};

// =============================================================================
// METHODS
// =============================================================================

/**
 * Add webhook event
 */
SubscriptionSchema.methods.addWebhookEvent = function(
  event: string,
  data?: Record<string, unknown>
) {
  this.webhookEvents.push({
    event,
    receivedAt: new Date(),
    data,
  });
  return this.save();
};

/**
 * Mark as active
 */
SubscriptionSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

/**
 * Mark as cancelled
 */
SubscriptionSchema.methods.cancel = function(reason?: string) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  if (reason) this.notes = reason;
  return this.save();
};

/**
 * Record payment
 */
SubscriptionSchema.methods.recordPayment = function(amount: number, nextDueDate?: Date) {
  this.totalPayments += 1;
  this.totalPaid += amount;
  this.lastPaymentDate = new Date();
  if (nextDueDate) this.nextDueDate = nextDueDate;
  return this.save();
};

// =============================================================================
// MODEL INTERFACE
// =============================================================================

interface ISubscriptionModel extends Model<ISubscription> {
  findByAsaasId(asaasSubscriptionId: string): Promise<ISubscription | null>;
  getUserActiveSubscriptions(userId: mongoose.Types.ObjectId): Promise<ISubscription[]>;
  getDueForRenewal(days?: number): Promise<ISubscription[]>;
}

// =============================================================================
// EXPORT
// =============================================================================

const Subscription = (mongoose.models.Subscription as ISubscriptionModel) || 
  mongoose.model<ISubscription, ISubscriptionModel>('Subscription', SubscriptionSchema);

export default Subscription;

// =============================================================================
// HELPERS
// =============================================================================

export function mapAsaasCycleToSubscriptionCycle(
  asaasCycle: string
): SubscriptionCycle {
  const cycleMap: Record<string, SubscriptionCycle> = {
    'WEEKLY': 'weekly',
    'BIWEEKLY': 'biweekly',
    'MONTHLY': 'monthly',
    'BIMONTHLY': 'bimonthly',
    'QUARTERLY': 'quarterly',
    'SEMIANNUALLY': 'semiannually',
    'YEARLY': 'yearly',
  };
  return cycleMap[asaasCycle] || 'monthly';
}

export function mapSubscriptionCycleToAsaas(
  cycle: SubscriptionCycle
): string {
  const cycleMap: Record<SubscriptionCycle, string> = {
    'weekly': 'WEEKLY',
    'biweekly': 'BIWEEKLY',
    'monthly': 'MONTHLY',
    'bimonthly': 'BIMONTHLY',
    'quarterly': 'QUARTERLY',
    'semiannually': 'SEMIANNUALLY',
    'yearly': 'YEARLY',
  };
  return cycleMap[cycle];
}

export function mapAsaasStatusToSubscriptionStatus(
  asaasStatus: string
): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    'ACTIVE': 'active',
    'INACTIVE': 'inactive',
    'EXPIRED': 'expired',
  };
  return statusMap[asaasStatus] || 'pending';
}

// Plan configurations
export const SUBSCRIPTION_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    slug: 'starter',
    monthlyPrice: 29.90,
    yearlyPrice: 299.00,
    features: [
      '50 imagens IA/mês',
      'Acesso a 3 cursos',
      'Suporte por email',
      'Certificados digitais',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    slug: 'pro',
    monthlyPrice: 79.90,
    yearlyPrice: 799.00,
    features: [
      'Imagens IA ilimitadas',
      'Acesso a todos os cursos',
      'Suporte prioritário',
      'Certificados digitais',
      'Assistente IA',
      'Recursos exclusivos',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    slug: 'business',
    monthlyPrice: 199.90,
    yearlyPrice: 1999.00,
    features: [
      'Tudo do Pro',
      'Consultoria mensal',
      'API access',
      'White-label',
      'Suporte 24/7',
      'Treinamentos exclusivos',
    ],
  },
} as const;
