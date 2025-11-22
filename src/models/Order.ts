import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: {
    id: string;
    type: 'service' | 'course';
    name: string;
    quantity: number;
    price: number;
    details?: Schema.Types.Mixed;
  }[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [{
    id: String,
    type: {
      type: String,
      enum: ['service', 'course'],
      required: true,
    },
    name: String,
    quantity: Number,
    price: Number,
    details: Schema.Types.Mixed,
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentId: String,
}, {
  timestamps: true,
});

OrderSchema.index({ userId: 1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
