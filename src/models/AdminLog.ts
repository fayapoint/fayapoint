import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminLog extends Document {
  adminId: mongoose.Types.ObjectId;
  adminEmail: string;
  action: string;
  category: 'auth' | 'user' | 'product' | 'order' | 'system' | 'database';
  targetType?: 'user' | 'product' | 'order' | 'setting';
  targetId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const AdminLogSchema = new Schema<IAdminLog>({
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  adminEmail: { type: String, required: true },
  action: { type: String, required: true },
  category: {
    type: String,
    enum: ['auth', 'user', 'product', 'order', 'system', 'database'],
    required: true
  },
  targetType: {
    type: String,
    enum: ['user', 'product', 'order', 'setting'],
  },
  targetId: String,
  details: { type: Schema.Types.Mixed },
  ip: String,
  userAgent: String,
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

// Index for efficient querying
AdminLogSchema.index({ createdAt: -1 });
AdminLogSchema.index({ adminId: 1 });
AdminLogSchema.index({ category: 1 });
AdminLogSchema.index({ action: 1 });

const AdminLog: Model<IAdminLog> = mongoose.models.AdminLog || mongoose.model<IAdminLog>('AdminLog', AdminLogSchema);

export default AdminLog;
