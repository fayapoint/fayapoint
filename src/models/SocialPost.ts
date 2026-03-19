import mongoose, { Schema, Document, Model } from 'mongoose';
import type { SocialPlatform } from './SocialAccount';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'suggested';

export interface ISocialPost extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  platform: SocialPlatform;
  content: string;
  mediaUrls: string[];
  mediaType?: 'image' | 'video' | 'carousel' | 'text';
  hashtags: string[];
  status: PostStatus;
  scheduledFor?: Date;
  publishedAt?: Date;
  platformPostId?: string;
  analytics: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    impressions: number;
    engagementRate: number;
    saves?: number;
    clicks?: number;
  };
  aiGenerated: boolean;
  aiModel?: string;
  aiCost?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SocialPostSchema = new Schema<ISocialPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'SocialAccount', required: true },
    platform: {
      type: String,
      enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'],
      required: true,
    },
    content: { type: String, required: true, maxlength: 5000 },
    mediaUrls: [{ type: String }],
    mediaType: { type: String, enum: ['image', 'video', 'carousel', 'text'] },
    hashtags: [{ type: String }],
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'failed', 'suggested'],
      default: 'draft',
      index: true,
    },
    scheduledFor: { type: Date },
    publishedAt: { type: Date },
    platformPostId: { type: String },
    analytics: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
    },
    aiGenerated: { type: Boolean, default: false },
    aiModel: { type: String },
    aiCost: { type: Number },
  },
  { timestamps: true }
);

SocialPostSchema.index({ userId: 1, status: 1 });
SocialPostSchema.index({ scheduledFor: 1 });
SocialPostSchema.index({ publishedAt: -1 });

const SocialPost =
  (mongoose.models.SocialPost as Model<ISocialPost>) ||
  mongoose.model<ISocialPost>('SocialPost', SocialPostSchema);

export default SocialPost;
