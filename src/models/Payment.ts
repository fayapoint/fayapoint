import mongoose, { Schema, Document, Model } from 'mongoose';

// =============================================================================
// TYPES
// =============================================================================

export type PaymentStatus = 
  | 'pending'           // Aguardando pagamento
  | 'processing'        // Processando
  | 'confirmed'         // Confirmado (aguardando compensação)
  | 'paid'              // Pago
  | 'failed'            // Falhou
  | 'refunded'          // Estornado
  | 'cancelled'         // Cancelado
  | 'expired';          // Expirado

export type PaymentMethod = 'pix' | 'boleto' | 'credit_card' | 'undefined';

export type PaymentProvider = 'asaas' | 'stripe' | 'mercadopago';

export interface IPaymentItem {
  productId?: string;
  productSlug?: string;
  type: 'course' | 'service' | 'subscription' | 'product' | 'pod';
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IPixData {
  qrCodeBase64?: string;
  qrCodePayload?: string;  // Copia e cola
  expirationDate?: Date;
}

export interface IBoletoData {
  barCode?: string;
  digitableLine?: string;  // Linha digitável
  bankSlipUrl?: string;
  dueDate?: Date;
}

export interface ICreditCardData {
  brand?: string;
  lastFourDigits?: string;
  holderName?: string;
  installments?: number;
  installmentValue?: number;
}

export interface IPayment extends Document {
  // Identifiers
  _id: mongoose.Types.ObjectId;
  orderNumber: string;          // Human-readable order number (FP-2024-XXXXX)
  
  // User reference
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  
  // Customer info (for payment gateway)
  customerCpfCnpj?: string;
  customerPhone?: string;
  customerAddress?: {
    postalCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  
  // Payment provider info
  provider: PaymentProvider;
  providerPaymentId?: string;    // Asaas payment ID
  providerCustomerId?: string;   // Asaas customer ID
  providerSubscriptionId?: string; // For recurring payments
  
  // Payment details
  method: PaymentMethod;
  status: PaymentStatus;
  
  // Items
  items: IPaymentItem[];
  
  // Values
  subtotal: number;
  discount: number;
  discountCode?: string;
  fees: number;               // Payment gateway fees
  total: number;
  currency: string;
  
  // Payment method specific data
  pixData?: IPixData;
  boletoData?: IBoletoData;
  creditCardData?: ICreditCardData;
  
  // URLs
  paymentUrl?: string;        // Checkout/payment link
  invoiceUrl?: string;        // Invoice/receipt URL
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  expiresAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
  
  // Refund info
  refundReason?: string;
  refundAmount?: number;
  
  // Metadata
  externalReference?: string; // For external integrations
  source?: string;            // checkout, admin, api, etc.
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
  
  // Webhook tracking
  webhookEvents: Array<{
    event: string;
    receivedAt: Date;
    data?: Record<string, unknown>;
  }>;
}

// =============================================================================
// SCHEMA
// =============================================================================

const PaymentItemSchema = new Schema<IPaymentItem>({
  productId: { type: String },
  productSlug: { type: String },
  type: { 
    type: String, 
    enum: ['course', 'service', 'subscription', 'product', 'pod'],
    required: true 
  },
  name: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
}, { _id: false });

const PixDataSchema = new Schema<IPixData>({
  qrCodeBase64: { type: String },
  qrCodePayload: { type: String },
  expirationDate: { type: Date },
}, { _id: false });

const BoletoDataSchema = new Schema<IBoletoData>({
  barCode: { type: String },
  digitableLine: { type: String },
  bankSlipUrl: { type: String },
  dueDate: { type: Date },
}, { _id: false });

const CreditCardDataSchema = new Schema<ICreditCardData>({
  brand: { type: String },
  lastFourDigits: { type: String },
  holderName: { type: String },
  installments: { type: Number },
  installmentValue: { type: Number },
}, { _id: false });

const PaymentSchema = new Schema<IPayment>({
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true,
    index: true,
  },
  
  // User reference
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true,
  },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  
  // Customer info
  customerCpfCnpj: { type: String },
  customerPhone: { type: String },
  customerAddress: {
    postalCode: { type: String },
    street: { type: String },
    number: { type: String },
    complement: { type: String },
    neighborhood: { type: String },
    city: { type: String },
    state: { type: String },
  },
  
  // Provider info
  provider: { 
    type: String, 
    enum: ['asaas', 'stripe', 'mercadopago'],
    default: 'asaas',
  },
  providerPaymentId: { type: String, index: true },
  providerCustomerId: { type: String },
  providerSubscriptionId: { type: String },
  
  // Payment details
  method: { 
    type: String, 
    enum: ['pix', 'boleto', 'credit_card', 'undefined'],
    required: true,
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'confirmed', 'paid', 'failed', 'refunded', 'cancelled', 'expired'],
    default: 'pending',
    index: true,
  },
  
  // Items
  items: [PaymentItemSchema],
  
  // Values
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountCode: { type: String },
  fees: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: 'BRL' },
  
  // Payment method data
  pixData: PixDataSchema,
  boletoData: BoletoDataSchema,
  creditCardData: CreditCardDataSchema,
  
  // URLs
  paymentUrl: { type: String },
  invoiceUrl: { type: String },
  
  // Timestamps
  paidAt: { type: Date },
  expiresAt: { type: Date },
  cancelledAt: { type: Date },
  refundedAt: { type: Date },
  
  // Refund
  refundReason: { type: String },
  refundAmount: { type: Number },
  
  // Metadata
  externalReference: { type: String, index: true },
  source: { type: String, default: 'checkout' },
  ipAddress: { type: String },
  userAgent: { type: String },
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

PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ provider: 1, providerPaymentId: 1 });

// =============================================================================
// STATICS
// =============================================================================

/**
 * Generate unique order number
 */
PaymentSchema.statics.generateOrderNumber = async function(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await this.countDocuments({
    createdAt: {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${year + 1}-01-01`),
    },
  });
  const sequence = String(count + 1).padStart(5, '0');
  return `FP-${year}-${sequence}`;
};

/**
 * Find payment by provider ID
 */
PaymentSchema.statics.findByProviderPaymentId = function(
  provider: PaymentProvider,
  paymentId: string
) {
  return this.findOne({ provider, providerPaymentId: paymentId });
};

/**
 * Get user's payment history
 */
PaymentSchema.statics.getUserPayments = function(
  userId: mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number; status?: PaymentStatus } = {}
) {
  const query: Record<string, unknown> = { userId };
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// =============================================================================
// METHODS
// =============================================================================

/**
 * Add webhook event to history
 */
PaymentSchema.methods.addWebhookEvent = function(
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
 * Mark as paid
 */
PaymentSchema.methods.markAsPaid = function() {
  this.status = 'paid';
  this.paidAt = new Date();
  return this.save();
};

/**
 * Mark as failed
 */
PaymentSchema.methods.markAsFailed = function(reason?: string) {
  this.status = 'failed';
  if (reason) this.notes = reason;
  return this.save();
};

/**
 * Mark as refunded
 */
PaymentSchema.methods.markAsRefunded = function(
  amount?: number,
  reason?: string
) {
  this.status = 'refunded';
  this.refundedAt = new Date();
  if (amount) this.refundAmount = amount;
  if (reason) this.refundReason = reason;
  return this.save();
};

// =============================================================================
// MODEL INTERFACE
// =============================================================================

interface IPaymentModel extends Model<IPayment> {
  generateOrderNumber(): Promise<string>;
  findByProviderPaymentId(
    provider: PaymentProvider,
    paymentId: string
  ): Promise<IPayment | null>;
  getUserPayments(
    userId: mongoose.Types.ObjectId,
    options?: { limit?: number; skip?: number; status?: PaymentStatus }
  ): Promise<IPayment[]>;
}

// =============================================================================
// EXPORT
// =============================================================================

const Payment = (mongoose.models.Payment as IPaymentModel) || 
  mongoose.model<IPayment, IPaymentModel>('Payment', PaymentSchema);

export default Payment;

// Helper to map Asaas status to our status
export function mapAsaasStatusToPaymentStatus(asaasStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'PENDING': 'pending',
    'AWAITING_RISK_ANALYSIS': 'processing',
    'CONFIRMED': 'confirmed',
    'RECEIVED': 'paid',
    'RECEIVED_IN_CASH': 'paid',
    'OVERDUE': 'expired',
    'REFUNDED': 'refunded',
    'REFUND_REQUESTED': 'refunded',
    'REFUND_IN_PROGRESS': 'refunded',
    'CHARGEBACK_REQUESTED': 'failed',
    'CHARGEBACK_DISPUTE': 'failed',
    'DUNNING_REQUESTED': 'failed',
    'DUNNING_RECEIVED': 'paid',
  };
  return statusMap[asaasStatus] || 'pending';
}

// Helper to map our method to Asaas billing type
export function mapPaymentMethodToAsaasBillingType(
  method: PaymentMethod
): 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED' {
  const methodMap: Record<PaymentMethod, 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED'> = {
    'pix': 'PIX',
    'boleto': 'BOLETO',
    'credit_card': 'CREDIT_CARD',
    'undefined': 'UNDEFINED',
  };
  return methodMap[method];
}
