import mongoose, { Schema, Document, Model } from 'mongoose';

// =============================================================================
// TYPES
// =============================================================================

export type FulfillmentType = 
  | 'digital'      // Courses, subscriptions, digital products
  | 'pod'          // Print-on-Demand (Printify/Prodigi)
  | 'dropshipping' // Third-party fulfillment
  | 'physical';    // Our own inventory

export type FulfillmentStatus = 
  | 'pending'           // Awaiting payment confirmation
  | 'processing'        // Being processed
  | 'awaiting_supplier' // Waiting for supplier response
  | 'in_production'     // Being manufactured (POD)
  | 'shipped'           // On the way
  | 'delivered'         // Delivered to customer
  | 'cancelled'         // Cancelled
  | 'failed'            // Failed to fulfill
  | 'refunded';         // Refunded

export type DeliveryType = 
  | 'instant'      // Immediate access (digital)
  | 'email'        // Delivered via email
  | 'google_drive' // Shared via Google Drive
  | 'shipping';    // Physical shipping

// Timeline event for tracking
export interface ITimelineEvent {
  status: FulfillmentStatus;
  timestamp: Date;
  message: string;
  details?: Record<string, unknown>;
  notified: boolean; // Whether customer was notified
}

// Shipping information
export interface IShippingInfo {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  shippingMethod?: string;
  shippingCost?: number;
  address: {
    name: string;
    street: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    countryCode: string;
    phone?: string;
  };
}

// Digital delivery information
export interface IDigitalDelivery {
  type: 'course_access' | 'download_link' | 'google_drive' | 'email' | 'subscription';
  accessUrl?: string;
  downloadLinks?: Array<{
    name: string;
    url: string;
    expiresAt?: Date;
  }>;
  googleDrive?: {
    folderId: string;
    shareLink: string;
    sharedAt?: Date;
  };
  courseSlug?: string;
  subscriptionPlan?: string;
  expiresAt?: Date;
}

// Supplier order info (for POD/dropshipping)
export interface ISupplierOrder {
  provider: 'printify' | 'prodigi' | 'aliexpress' | 'amazon' | 'other';
  providerOrderId?: string;
  providerStatus?: string;
  submittedAt?: Date;
  confirmedAt?: Date;
  estimatedShipDate?: Date;
  actualShipDate?: Date;
  cost: number;
  currency: string;
  lastSyncAt?: Date;
  rawResponse?: Record<string, unknown>;
}

// Fulfillment item
export interface IFulfillmentItem {
  productId?: string;
  productSlug?: string;
  type: 'course' | 'subscription' | 'product' | 'pod' | 'service';
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  thumbnail?: string;
  fulfillmentType: FulfillmentType;
  status: FulfillmentStatus;
  deliveredAt?: Date;
  // For POD items
  podProductId?: mongoose.Types.ObjectId;
  printifyProductId?: string;
  printifyVariantId?: number;
  designUrl?: string;
  // For digital items
  digitalDelivery?: IDigitalDelivery;
  // Creator commission (for POD)
  creatorId?: mongoose.Types.ObjectId;
  creatorCommission?: number;
}

// =============================================================================
// MAIN INTERFACE
// =============================================================================

export interface IFulfillmentOrder extends Document {
  // References
  orderNumber: string;              // Our internal order number
  paymentId: mongoose.Types.ObjectId; // Reference to Payment
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  
  // Order details
  items: IFulfillmentItem[];
  fulfillmentType: FulfillmentType; // Primary type
  status: FulfillmentStatus;
  deliveryType: DeliveryType;
  
  // Shipping (for physical)
  shipping?: IShippingInfo;
  
  // Supplier orders (for POD/dropshipping)
  supplierOrders: ISupplierOrder[];
  
  // Timeline
  timeline: ITimelineEvent[];
  
  // Digital delivery
  digitalDelivery?: IDigitalDelivery;
  
  // Notifications
  emailsSent: Array<{
    type: string;
    sentAt: Date;
    status: 'sent' | 'failed' | 'bounced';
    messageId?: string;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  
  // Metadata
  notes?: string;
  internalNotes?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// SCHEMA
// =============================================================================

const TimelineEventSchema = new Schema<ITimelineEvent>({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  message: { type: String, required: true },
  details: Schema.Types.Mixed,
  notified: { type: Boolean, default: false },
}, { _id: false });

const ShippingAddressSchema = new Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  number: String,
  complement: String,
  neighborhood: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'Brasil' },
  countryCode: { type: String, default: 'BR' },
  phone: String,
}, { _id: false });

const ShippingInfoSchema = new Schema<IShippingInfo>({
  carrier: String,
  trackingNumber: String,
  trackingUrl: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
  shippingMethod: String,
  shippingCost: Number,
  address: ShippingAddressSchema,
}, { _id: false });

const DigitalDeliverySchema = new Schema<IDigitalDelivery>({
  type: {
    type: String,
    enum: ['course_access', 'download_link', 'google_drive', 'email', 'subscription'],
  },
  accessUrl: String,
  downloadLinks: [{
    name: String,
    url: String,
    expiresAt: Date,
  }],
  googleDrive: {
    folderId: String,
    shareLink: String,
    sharedAt: Date,
  },
  courseSlug: String,
  subscriptionPlan: String,
  expiresAt: Date,
}, { _id: false });

const SupplierOrderSchema = new Schema<ISupplierOrder>({
  provider: {
    type: String,
    enum: ['printify', 'prodigi', 'aliexpress', 'amazon', 'other'],
    required: true,
  },
  providerOrderId: String,
  providerStatus: String,
  submittedAt: Date,
  confirmedAt: Date,
  estimatedShipDate: Date,
  actualShipDate: Date,
  cost: { type: Number, required: true },
  currency: { type: String, default: 'BRL' },
  lastSyncAt: Date,
  rawResponse: Schema.Types.Mixed,
}, { _id: false });

const FulfillmentItemSchema = new Schema<IFulfillmentItem>({
  productId: String,
  productSlug: String,
  type: {
    type: String,
    enum: ['course', 'subscription', 'product', 'pod', 'service'],
    required: true,
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  thumbnail: String,
  fulfillmentType: {
    type: String,
    enum: ['digital', 'pod', 'dropshipping', 'physical'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'awaiting_supplier', 'in_production', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded'],
    default: 'pending',
  },
  deliveredAt: Date,
  podProductId: { type: Schema.Types.ObjectId, ref: 'UserPODProduct' },
  printifyProductId: String,
  printifyVariantId: Number,
  designUrl: String,
  digitalDelivery: DigitalDeliverySchema,
  creatorId: { type: Schema.Types.ObjectId, ref: 'User' },
  creatorCommission: Number,
}, { _id: false });

const FulfillmentOrderSchema = new Schema<IFulfillmentOrder>({
  orderNumber: { type: String, required: true, unique: true, index: true },
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  
  items: [FulfillmentItemSchema],
  fulfillmentType: {
    type: String,
    enum: ['digital', 'pod', 'dropshipping', 'physical'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'awaiting_supplier', 'in_production', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  deliveryType: {
    type: String,
    enum: ['instant', 'email', 'google_drive', 'shipping'],
    required: true,
  },
  
  shipping: ShippingInfoSchema,
  supplierOrders: [SupplierOrderSchema],
  timeline: [TimelineEventSchema],
  digitalDelivery: DigitalDeliverySchema,
  
  emailsSent: [{
    type: { type: String },
    sentAt: Date,
    status: { type: String, enum: ['sent', 'failed', 'bounced'] },
    messageId: String,
  }],
  
  processedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  
  notes: String,
  internalNotes: String,
  metadata: Schema.Types.Mixed,
}, {
  timestamps: true,
});

// Indexes
FulfillmentOrderSchema.index({ userId: 1, status: 1 });
FulfillmentOrderSchema.index({ createdAt: -1 });
FulfillmentOrderSchema.index({ 'supplierOrders.providerOrderId': 1 });
FulfillmentOrderSchema.index({ 'shipping.trackingNumber': 1 });

// =============================================================================
// METHODS
// =============================================================================

/**
 * Add timeline event
 */
FulfillmentOrderSchema.methods.addTimelineEvent = function(
  status: FulfillmentStatus,
  message: string,
  details?: Record<string, unknown>
) {
  this.timeline.push({
    status,
    timestamp: new Date(),
    message,
    details,
    notified: false,
  });
  return this.save();
};

/**
 * Update fulfillment status
 */
FulfillmentOrderSchema.methods.updateStatus = function(
  status: FulfillmentStatus,
  message: string
) {
  this.status = status;
  this.timeline.push({
    status,
    timestamp: new Date(),
    message,
    notified: false,
  });
  
  if (status === 'delivered') {
    this.completedAt = new Date();
  } else if (status === 'cancelled') {
    this.cancelledAt = new Date();
  } else if (status === 'processing') {
    this.processedAt = new Date();
  }
  
  return this.save();
};

// =============================================================================
// STATICS
// =============================================================================

/**
 * Create fulfillment order from payment
 */
FulfillmentOrderSchema.statics.createFromPayment = async function(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payment: any
): Promise<IFulfillmentOrder> {
  // Determine primary fulfillment type
  const hasPhysical = payment.items.some(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (i: any) => i.type === 'product' || i.type === 'pod'
  );
  
  const fulfillmentType: FulfillmentType = hasPhysical ? 'physical' : 'digital';
  const deliveryType: DeliveryType = hasPhysical ? 'shipping' : 'instant';
  
  // Map items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: IFulfillmentItem[] = payment.items.map((item: any) => {
    let itemFulfillmentType: FulfillmentType = 'digital';
    
    if (item.type === 'pod') {
      itemFulfillmentType = 'pod';
    } else if (item.type === 'product') {
      // Check if dropshipping or physical
      itemFulfillmentType = 'physical'; // Could be 'dropshipping' based on product source
    }
    
    return {
      productId: item.productId,
      productSlug: item.productSlug,
      type: item.type,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      fulfillmentType: itemFulfillmentType,
      status: 'pending',
    };
  });
  
  const fulfillmentOrder = new this({
    orderNumber: payment.orderNumber,
    paymentId: payment._id,
    userId: payment.userId,
    userEmail: payment.userEmail,
    userName: payment.userName,
    items,
    fulfillmentType,
    deliveryType,
    status: 'pending',
    shipping: hasPhysical && payment.customerAddress ? {
      address: {
        name: payment.userName,
        street: payment.customerAddress.street || '',
        number: payment.customerAddress.number,
        complement: payment.customerAddress.complement,
        neighborhood: payment.customerAddress.neighborhood,
        city: payment.customerAddress.city || '',
        state: payment.customerAddress.state || '',
        postalCode: payment.customerAddress.postalCode || '',
        country: 'Brasil',
        countryCode: 'BR',
        phone: payment.customerPhone,
      },
    } : undefined,
    timeline: [{
      status: 'pending',
      timestamp: new Date(),
      message: 'Pedido recebido, aguardando confirmação de pagamento',
      notified: false,
    }],
  });
  
  return fulfillmentOrder.save();
};

/**
 * Get pending fulfillment orders for processing
 */
FulfillmentOrderSchema.statics.getPendingOrders = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: 1 });
};

/**
 * Get orders needing status update
 */
FulfillmentOrderSchema.statics.getOrdersNeedingSync = function() {
  return this.find({
    status: { $in: ['awaiting_supplier', 'in_production', 'shipped'] },
    'supplierOrders.0': { $exists: true },
  }).sort({ 'supplierOrders.lastSyncAt': 1 });
};

// =============================================================================
// MODEL
// =============================================================================

interface IFulfillmentOrderModel extends Model<IFulfillmentOrder> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createFromPayment(payment: any): Promise<IFulfillmentOrder>;
  getPendingOrders(): Promise<IFulfillmentOrder[]>;
  getOrdersNeedingSync(): Promise<IFulfillmentOrder[]>;
}

const FulfillmentOrder: IFulfillmentOrderModel = 
  mongoose.models.FulfillmentOrder as IFulfillmentOrderModel ||
  mongoose.model<IFulfillmentOrder, IFulfillmentOrderModel>('FulfillmentOrder', FulfillmentOrderSchema);

export default FulfillmentOrder;
