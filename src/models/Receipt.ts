import mongoose, { Schema, Document, Model } from 'mongoose';

// =============================================================================
// TYPES
// =============================================================================

export interface IReceiptItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: 'course' | 'subscription' | 'service' | 'product';
  slug?: string;
  lifetimeAccess?: boolean;
  certificateIncluded?: boolean;
}

export interface IReceipt extends Document {
  _id: mongoose.Types.ObjectId;
  receiptNumber: string;        // REC-2026-XXXXX
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;

  // Payment reference
  paymentId?: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  asaasPaymentId?: string;

  // Items
  items: IReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;

  // Payment details
  paymentMethod: 'pix' | 'boleto' | 'credit_card' | 'mercadopago';
  paymentMethodLabel: string;
  paidAt: Date;

  // Subscription details (if applicable)
  planName?: string;
  planCycle?: 'monthly' | 'yearly';

  // Status
  status: 'issued' | 'voided';
  voidedAt?: Date;
  voidReason?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SCHEMA
// =============================================================================

const ReceiptItemSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  type: { type: String, enum: ['course', 'subscription', 'service', 'product'], required: true },
  slug: String,
  lifetimeAccess: { type: Boolean, default: false },
  certificateIncluded: { type: Boolean, default: false },
}, { _id: false });

const ReceiptSchema = new Schema<IReceipt>({
  receiptNumber: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },

  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
  orderNumber: String,
  asaasPaymentId: String,

  items: [ReceiptItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },

  paymentMethod: { type: String, enum: ['pix', 'boleto', 'credit_card', 'mercadopago'], required: true },
  paymentMethodLabel: { type: String, required: true },
  paidAt: { type: Date, required: true },

  planName: String,
  planCycle: { type: String, enum: ['monthly', 'yearly'] },

  status: { type: String, enum: ['issued', 'voided'], default: 'issued' },
  voidedAt: Date,
  voidReason: String,
}, {
  timestamps: true,
});

// Generate receipt number
ReceiptSchema.pre('save', async function (next) {
  if (this.isNew && !this.receiptNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Receipt').countDocuments();
    this.receiptNumber = `REC-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// =============================================================================
// MODEL
// =============================================================================

const Receipt: Model<IReceipt> =
  mongoose.models.Receipt || mongoose.model<IReceipt>('Receipt', ReceiptSchema);

export default Receipt;

// =============================================================================
// HELPERS
// =============================================================================

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX — Transferência instantânea',
  boleto: 'Boleto Bancário',
  credit_card: 'Cartão de Crédito',
  mercadopago: 'MercadoPago',
};

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] || method;
}
