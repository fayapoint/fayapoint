import mongoose, { Schema, Document, Model } from 'mongoose';

export type SocialPlatform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp' | 'pinterest' | 'google';

export interface ISocialAccount extends Document {
  userId: mongoose.Types.ObjectId;
  platform: SocialPlatform;
  platformUserId: string;
  username: string;
  profileUrl: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  isActive: boolean;
  status: 'active' | 'pending' | 'error' | 'disconnected';
  lastSync?: Date;
  metadata: {
    followerCount: number;
    followingCount: number;
    postCount: number;
    averageEngagement: number;
    profilePictureUrl?: string;
    biography?: string;
    websiteUrl?: string;
    businessAccount?: boolean;
  };
  settings: {
    autoPost: boolean;
    notificationsEnabled: boolean;
    timezone: string;
    postApprovalRequired: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SocialAccountSchema = new Schema<ISocialAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: {
      type: String,
      enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 'whatsapp', 'pinterest', 'google'],
      required: true,
    },
    platformUserId: { type: String, required: true },
    username: { type: String, required: true },
    profileUrl: { type: String, default: '' },
    accessToken: { type: String, select: false },
    refreshToken: { type: String, select: false },
    tokenExpiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['active', 'pending', 'error', 'disconnected'],
      default: 'pending',
    },
    lastSync: { type: Date },
    metadata: {
      followerCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
      postCount: { type: Number, default: 0 },
      averageEngagement: { type: Number, default: 0 },
      profilePictureUrl: { type: String },
      biography: { type: String },
      websiteUrl: { type: String },
      businessAccount: { type: Boolean, default: false },
    },
    settings: {
      autoPost: { type: Boolean, default: false },
      notificationsEnabled: { type: Boolean, default: true },
      timezone: { type: String, default: 'America/Sao_Paulo' },
      postApprovalRequired: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

SocialAccountSchema.index({ userId: 1, platform: 1 }, { unique: true });

const SocialAccount =
  (mongoose.models.SocialAccount as Model<ISocialAccount>) ||
  mongoose.model<ISocialAccount>('SocialAccount', SocialAccountSchema);

export default SocialAccount;
