import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  id: string;
  type: 'service' | 'course' | 'product';
  name: string;
  quantity: number;
  price: number;
  image?: string;
  details?: Record<string, unknown>;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  items: IOrderItem[];
  totalAmount: number;
  discountAmount?: number;
  couponCode?: string;
  status: 'pending' | 'processing' | 'completed' | 'shipped' | 'delivered' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod?: string;
  paymentId?: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  items: [{
    id: String,
    type: {
      type: String,
      enum: ['service', 'course', 'product'],
      required: true,
    },
    name: String,
    quantity: Number,
    price: Number,
    image: String,
    details: Schema.Types.Mixed,
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  couponCode: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'shipped', 'delivered', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: String,
  paymentId: String,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  notes: String,
}, {
  timestamps: true,
});

OrderSchema.index({ userId: 1 });
OrderSchema.index({ userEmail: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
