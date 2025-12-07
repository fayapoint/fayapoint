import mongoose, { Schema, Document, Model } from 'mongoose';

// Commission tracking for POD product creators
export interface ICommissionPayment {
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paidAt?: Date;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
}

// Shipment tracking
export interface IShipment {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  shippedAt: Date;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  status: 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'exception';
}

// Line item in POD order
export interface IPODOrderItem {
  podProductId: mongoose.Types.ObjectId; // Reference to UserPODProduct
  storeProductId?: mongoose.Types.ObjectId; // Reference to StoreProduct if published
  printifyProductId: string;
  printifyVariantId: number;
  title: string;
  variantLabel: string;
  quantity: number;
  baseCost: number; // Cost from Printify (what we pay)
  sellingPrice: number; // What customer paid
  profit: number; // sellingPrice - baseCost
  creatorCommission: number; // Amount going to the creator
  platformFee: number; // Amount going to platform
  shippingCost: number;
  sku: string;
  mockupImage?: string;
  status: 'pending' | 'processing' | 'in_production' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  printifyStatus?: string;
  sentToProductionAt?: Date;
  fulfilledAt?: Date;
}

export interface IPODOrder extends Document {
  // Order identification
  orderNumber: string; // Our internal order number
  printifyOrderId?: string; // Printify's order ID
  shopId: number; // Printify shop ID
  
  // Customer info
  customerId: mongoose.Types.ObjectId;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  
  // Shipping address
  shippingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    region: string;
    zip: string;
    country: string;
    countryCode: string;
  };
  
  // Order items
  items: IPODOrderItem[];
  
  // Totals
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  currency: string;
  
  // Commission tracking
  totalCreatorCommission: number;
  totalPlatformFee: number;
  commissionRate: number; // Percentage that goes to creator
  commissionPayments: ICommissionPayment[];
  
  // Creator info (for commission tracking)
  creatorId: mongoose.Types.ObjectId;
  creatorEmail: string;
  creatorName: string;
  
  // Order status
  status: 'pending' | 'confirmed' | 'processing' | 'in_production' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'failed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  
  // Shipping
  shippingMethod: 'standard' | 'express' | 'economy' | 'printify_express';
  shippingMethodId: number;
  isPrintifyExpress: boolean;
  shipments: IShipment[];
  
  // Timestamps
  paidAt?: Date;
  sentToProductionAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
  
  // Printify specific
  printifyConnect?: {
    url: string;
    id: string;
  };
  
  // Notes and metadata
  customerNotes?: string;
  internalNotes?: string;
  metadata?: Record<string, unknown>;
  
  createdAt: Date;
  updatedAt: Date;
}

const CommissionPaymentSchema = new Schema<ICommissionPayment>({
  amount: { type: Number, required: true },
  currency: { type: String, default: 'BRL' },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending',
  },
  paidAt: Date,
  paymentMethod: String,
  transactionId: String,
  notes: String,
}, { _id: false });

const ShipmentSchema = new Schema<IShipment>({
  carrier: { type: String, required: true },
  trackingNumber: { type: String, required: true },
  trackingUrl: String,
  shippedAt: { type: Date, required: true },
  estimatedDelivery: Date,
  deliveredAt: Date,
  status: {
    type: String,
    enum: ['pending', 'shipped', 'in_transit', 'delivered', 'exception'],
    default: 'shipped',
  },
}, { _id: false });

const PODOrderItemSchema = new Schema<IPODOrderItem>({
  podProductId: { type: Schema.Types.ObjectId, ref: 'UserPODProduct', required: true },
  storeProductId: { type: Schema.Types.ObjectId, ref: 'StoreProduct' },
  printifyProductId: { type: String, required: true },
  printifyVariantId: { type: Number, required: true },
  title: { type: String, required: true },
  variantLabel: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  baseCost: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  profit: { type: Number, required: true },
  creatorCommission: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  sku: { type: String, required: true },
  mockupImage: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'in_production', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  printifyStatus: String,
  sentToProductionAt: Date,
  fulfilledAt: Date,
}, { _id: false });

const PODOrderSchema = new Schema<IPODOrder>({
  orderNumber: { type: String, required: true, unique: true },
  printifyOrderId: { type: String, index: true, sparse: true },
  shopId: { type: Number, required: true },
  
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerEmail: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: String,
  
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    company: String,
    address1: { type: String, required: true },
    address2: String,
    city: { type: String, required: true },
    region: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
    countryCode: { type: String, required: true },
  },
  
  items: [PODOrderItemSchema],
  
  subtotal: { type: Number, required: true },
  shippingTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  currency: { type: String, default: 'BRL' },
  
  totalCreatorCommission: { type: Number, default: 0 },
  totalPlatformFee: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 70 }, // 70% to creator by default
  commissionPayments: [CommissionPaymentSchema],
  
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  creatorEmail: { type: String, required: true },
  creatorName: { type: String, required: true },
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'in_production', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'],
    default: 'pending',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'economy', 'printify_express'],
    default: 'standard',
  },
  shippingMethodId: { type: Number, default: 1 },
  isPrintifyExpress: { type: Boolean, default: false },
  shipments: [ShipmentSchema],
  
  paidAt: Date,
  sentToProductionAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  refundedAt: Date,
  
  printifyConnect: {
    url: String,
    id: String,
  },
  
  customerNotes: String,
  internalNotes: String,
  metadata: Schema.Types.Mixed,
}, {
  timestamps: true,
});

// Indexes
PODOrderSchema.index({ creatorId: 1, status: 1 });
PODOrderSchema.index({ customerId: 1, createdAt: -1 });
PODOrderSchema.index({ createdAt: -1 });
PODOrderSchema.index({ 'commissionPayments.status': 1 });

// Generate unique order number
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `POD-${timestamp}-${random}`;
}

// Calculate commission split
export function calculateCommissionSplit(
  sellingPrice: number,
  baseCost: number,
  commissionRate: number = 70 // 70% to creator
): { profit: number; creatorCommission: number; platformFee: number } {
  const profit = sellingPrice - baseCost;
  const creatorCommission = Math.round((profit * commissionRate / 100) * 100) / 100;
  const platformFee = Math.round((profit - creatorCommission) * 100) / 100;
  
  return { profit, creatorCommission, platformFee };
}

const PODOrder: Model<IPODOrder> = mongoose.models.PODOrder || mongoose.model<IPODOrder>('PODOrder', PODOrderSchema);

export default PODOrder;
