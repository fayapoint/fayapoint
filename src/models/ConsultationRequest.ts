import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItemSnapshot {
  id: string;
  type: 'service' | 'course';
  name: string;
  quantity: number;
  price: number;
  serviceSlug?: string;
  unitLabel?: string;
  track?: string;
  slug?: string;
}

export interface IConsultationRequest extends Document {
  // User info
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  company?: string;
  role?: string;
  phone?: string;
  
  // Request details
  details?: string;
  source: string; // e.g., 'video-editing-page', 'home-page', 'contact-page'
  referrerUrl?: string;
  utm?: Record<string, string | undefined>;
  
  // Cart snapshot at time of request
  cartItems: ICartItemSnapshot[];
  cartTotal: number;
  
  // Scheduling info
  scheduledStartUtc?: Date;
  scheduledEndUtc?: Date;
  bookingUrl?: string;
  
  // Status tracking
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSnapshotSchema = new Schema<ICartItemSnapshot>({
  id: { type: String, required: true },
  type: { type: String, enum: ['service', 'course'], required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  serviceSlug: String,
  unitLabel: String,
  track: String,
  slug: String,
}, { _id: false });

const ConsultationRequestSchema = new Schema<IConsultationRequest>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: String,
  role: String,
  phone: String,
  
  details: String,
  source: { type: String, required: true },
  referrerUrl: String,
  utm: { type: Schema.Types.Mixed },
  
  cartItems: { type: [CartItemSnapshotSchema], default: [] },
  cartTotal: { type: Number, default: 0 },
  
  scheduledStartUtc: Date,
  scheduledEndUtc: Date,
  bookingUrl: String,
  
  status: { 
    type: String, 
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
}, {
  timestamps: true,
});

// Index for efficient queries
ConsultationRequestSchema.index({ email: 1 });
ConsultationRequestSchema.index({ status: 1 });
ConsultationRequestSchema.index({ createdAt: -1 });

export const ConsultationRequest = mongoose.models.ConsultationRequest || 
  mongoose.model<IConsultationRequest>('ConsultationRequest', ConsultationRequestSchema);
