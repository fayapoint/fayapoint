/**
 * Prodigi Order Model
 * Tracks orders placed through Prodigi API for dropshipping
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// Prodigi-specific shipment info
export interface IProdigiShipment {
  prodigiShipmentId: string;
  status: 'Processing' | 'Cancelled' | 'Shipped';
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  dispatchDate?: Date;
  fulfillmentLocation?: {
    countryCode: string;
    labCode: string;
  };
  items: string[]; // Item IDs
}

// Prodigi order item
export interface IProdigiOrderItem {
  prodigiItemId?: string;
  sku: string;
  name: string;
  copies: number;
  sizing: 'fillPrintArea' | 'fitPrintArea' | 'stretchToPrintArea';
  attributes: Record<string, string>;
  assetUrl: string;
  assetStatus?: 'complete' | 'inProgress' | 'error' | 'NotYetDownloaded';
  
  // Pricing
  baseCostGBP: number; // Cost from Prodigi in GBP
  baseCostBRL: number; // Converted to BRL
  sellingPriceBRL: number; // What customer pays
  profitBRL: number; // Our profit
  
  // Commission for creator (if applicable)
  creatorId?: mongoose.Types.ObjectId;
  creatorCommission: number;
  platformFee: number;
}

// Prodigi charge tracking
export interface IProdigiCharge {
  prodigiChargeId: string;
  chargeType: 'Item' | 'Shipping' | 'Refund' | 'Other';
  invoiceNumber?: string;
  amount: number;
  currency: string;
}

export interface IProdigiOrder extends Document {
  // Internal reference
  orderNumber: string; // Our internal order number
  
  // Prodigi reference
  prodigiOrderId: string;
  prodigiMerchantReference: string;
  prodigiIdempotencyKey: string;
  
  // Customer info
  customerId: mongoose.Types.ObjectId;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  
  // Shipping address
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    stateOrCounty?: string;
    postalOrZipCode: string;
    countryCode: string;
    country: string;
    email?: string;
    phone?: string;
  };
  
  // Order items
  items: IProdigiOrderItem[];
  
  // Prodigi status tracking
  prodigiStatus: {
    stage: 'InProgress' | 'Complete' | 'Cancelled';
    details: {
      downloadAssets: string;
      printReadyAssetsPrepared: string;
      allocateProductionLocation: string;
      inProduction: string;
      shipping: string;
    };
    issues: {
      objectId: string;
      errorCode: string;
      description: string;
    }[];
  };
  
  // Our internal status (normalized)
  status: 'pending' | 'processing' | 'in_production' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  
  // Shipping
  shippingMethod: 'Budget' | 'Standard' | 'StandardPlus' | 'Express' | 'Overnight';
  shipments: IProdigiShipment[];
  
  // Charges from Prodigi
  charges: IProdigiCharge[];
  
  // Totals
  subtotalGBP: number; // Items cost in GBP
  shippingGBP: number; // Shipping cost in GBP
  totalCostGBP: number; // Total we pay Prodigi
  
  subtotalBRL: number; // Items selling price in BRL
  shippingBRL: number; // Shipping charged to customer
  taxBRL: number;
  discountBRL: number;
  grandTotalBRL: number; // What customer paid
  
  totalProfitBRL: number; // Our total profit
  totalCreatorCommission: number;
  totalPlatformFee: number;
  commissionRate: number; // Percentage to creator (default 70%)
  
  // Creator tracking (for dropshipping through our creators)
  creatorId?: mongoose.Types.ObjectId;
  creatorEmail?: string;
  creatorName?: string;
  
  // Source tracking
  source: 'website' | 'api' | 'admin' | 'storefront';
  storeProductIds?: mongoose.Types.ObjectId[]; // Links to StoreProduct
  
  // Webhook/callback
  callbackUrl?: string;
  lastCallbackReceived?: Date;
  
  // Timestamps
  paidAt?: Date;
  sentToProductionAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  
  // Estimated delivery
  estimatedDeliveryMin?: Date;
  estimatedDeliveryMax?: Date;
  
  // Notes
  customerNotes?: string;
  internalNotes?: string;
  metadata?: Record<string, unknown>;
  
  createdAt: Date;
  updatedAt: Date;
}

const ProdigiShipmentSchema = new Schema<IProdigiShipment>({
  prodigiShipmentId: { type: String, required: true },
  status: {
    type: String,
    enum: ['Processing', 'Cancelled', 'Shipped'],
    default: 'Processing',
  },
  carrier: String,
  trackingNumber: String,
  trackingUrl: String,
  dispatchDate: Date,
  fulfillmentLocation: {
    countryCode: String,
    labCode: String,
  },
  items: [String],
}, { _id: false });

const ProdigiOrderItemSchema = new Schema<IProdigiOrderItem>({
  prodigiItemId: String,
  sku: { type: String, required: true },
  name: { type: String, required: true },
  copies: { type: Number, required: true, min: 1 },
  sizing: {
    type: String,
    enum: ['fillPrintArea', 'fitPrintArea', 'stretchToPrintArea'],
    default: 'fillPrintArea',
  },
  attributes: { type: Map, of: String },
  assetUrl: { type: String, required: true },
  assetStatus: String,
  
  baseCostGBP: { type: Number, required: true },
  baseCostBRL: { type: Number, required: true },
  sellingPriceBRL: { type: Number, required: true },
  profitBRL: { type: Number, required: true },
  
  creatorId: { type: Schema.Types.ObjectId, ref: 'User' },
  creatorCommission: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
}, { _id: false });

const ProdigiChargeSchema = new Schema<IProdigiCharge>({
  prodigiChargeId: { type: String, required: true },
  chargeType: {
    type: String,
    enum: ['Item', 'Shipping', 'Refund', 'Other'],
    required: true,
  },
  invoiceNumber: String,
  amount: { type: Number, required: true },
  currency: { type: String, default: 'GBP' },
}, { _id: false });

const ProdigiOrderSchema = new Schema<IProdigiOrder>({
  orderNumber: { type: String, required: true, unique: true },
  
  prodigiOrderId: { type: String, index: true, sparse: true },
  prodigiMerchantReference: { type: String, required: true },
  prodigiIdempotencyKey: { type: String, required: true },
  
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerEmail: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: String,
  
  shippingAddress: {
    name: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    stateOrCounty: String,
    postalOrZipCode: { type: String, required: true },
    countryCode: { type: String, required: true },
    country: { type: String, required: true },
    email: String,
    phone: String,
  },
  
  items: [ProdigiOrderItemSchema],
  
  prodigiStatus: {
    stage: {
      type: String,
      enum: ['InProgress', 'Complete', 'Cancelled'],
      default: 'InProgress',
    },
    details: {
      downloadAssets: { type: String, default: 'NotStarted' },
      printReadyAssetsPrepared: { type: String, default: 'NotStarted' },
      allocateProductionLocation: { type: String, default: 'NotStarted' },
      inProduction: { type: String, default: 'NotStarted' },
      shipping: { type: String, default: 'NotStarted' },
    },
    issues: [{
      objectId: String,
      errorCode: String,
      description: String,
    }],
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'in_production', 'shipped', 'delivered', 'cancelled', 'failed'],
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
    enum: ['Budget', 'Standard', 'StandardPlus', 'Express', 'Overnight'],
    default: 'Standard',
  },
  shipments: [ProdigiShipmentSchema],
  charges: [ProdigiChargeSchema],
  
  subtotalGBP: { type: Number, required: true },
  shippingGBP: { type: Number, default: 0 },
  totalCostGBP: { type: Number, required: true },
  
  subtotalBRL: { type: Number, required: true },
  shippingBRL: { type: Number, default: 0 },
  taxBRL: { type: Number, default: 0 },
  discountBRL: { type: Number, default: 0 },
  grandTotalBRL: { type: Number, required: true },
  
  totalProfitBRL: { type: Number, default: 0 },
  totalCreatorCommission: { type: Number, default: 0 },
  totalPlatformFee: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 70 },
  
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  creatorEmail: String,
  creatorName: String,
  
  source: {
    type: String,
    enum: ['website', 'api', 'admin', 'storefront'],
    default: 'website',
  },
  storeProductIds: [{ type: Schema.Types.ObjectId, ref: 'StoreProduct' }],
  
  callbackUrl: String,
  lastCallbackReceived: Date,
  
  paidAt: Date,
  sentToProductionAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  estimatedDeliveryMin: Date,
  estimatedDeliveryMax: Date,
  
  customerNotes: String,
  internalNotes: String,
  metadata: Schema.Types.Mixed,
}, {
  timestamps: true,
});

// Indexes
ProdigiOrderSchema.index({ creatorId: 1, status: 1 });
ProdigiOrderSchema.index({ customerId: 1, createdAt: -1 });
ProdigiOrderSchema.index({ createdAt: -1 });
ProdigiOrderSchema.index({ 'prodigiStatus.stage': 1 });
ProdigiOrderSchema.index({ prodigiMerchantReference: 1 });

/**
 * Generate unique order number for Prodigi orders
 */
export function generateProdigiOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRD-${timestamp}-${random}`;
}

/**
 * Calculate profit split between creator and platform
 */
export function calculateProdigiCommissionSplit(
  sellingPriceBRL: number,
  baseCostBRL: number,
  commissionRate: number = 70
): { profit: number; creatorCommission: number; platformFee: number } {
  const profit = Math.max(0, sellingPriceBRL - baseCostBRL);
  const creatorCommission = Math.round((profit * commissionRate / 100) * 100) / 100;
  const platformFee = Math.round((profit - creatorCommission) * 100) / 100;
  
  return { profit, creatorCommission, platformFee };
}

/**
 * Map Prodigi status to our internal status
 */
export function mapProdigiStatusToInternal(
  stage: 'InProgress' | 'Complete' | 'Cancelled',
  details: {
    downloadAssets: string;
    inProduction: string;
    shipping: string;
  }
): IProdigiOrder['status'] {
  if (stage === 'Cancelled') return 'cancelled';
  if (stage === 'Complete') return 'delivered';
  
  if (details.shipping === 'InProgress' || details.shipping === 'Complete') return 'shipped';
  if (details.inProduction === 'InProgress') return 'in_production';
  if (details.downloadAssets === 'InProgress') return 'processing';
  
  return 'pending';
}

const ProdigiOrder: Model<IProdigiOrder> = 
  mongoose.models.ProdigiOrder || 
  mongoose.model<IProdigiOrder>('ProdigiOrder', ProdigiOrderSchema);

export default ProdigiOrder;
