import mongoose, { Schema, Document, Model } from 'mongoose';
import type { SocialPlatform } from './SocialAccount';

export interface IPlatformMetrics {
  followers: number;
  following: number;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  reach: number;
  impressions: number;
  engagementRate: number;
}

export interface ISocialAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  platform: SocialPlatform;
  date: Date;
  metrics: IPlatformMetrics;
  topPosts: Array<{
    postId: mongoose.Types.ObjectId;
    engagementRate: number;
    reach: number;
  }>;
  createdAt: Date;
}

const PlatformMetricsSchema = {
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  posts: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 },
};

const SocialAnalyticsSchema = new Schema<ISocialAnalytics>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'SocialAccount', required: true },
    platform: {
      type: String,
      enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'],
      required: true,
    },
    date: { type: Date, required: true },
    metrics: PlatformMetricsSchema,
    topPosts: [
      {
        postId: { type: Schema.Types.ObjectId, ref: 'SocialPost' },
        engagementRate: { type: Number },
        reach: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

SocialAnalyticsSchema.index({ userId: 1, platform: 1, date: -1 });
SocialAnalyticsSchema.index({ accountId: 1, date: -1 });

const SocialAnalytics =
  (mongoose.models.SocialAnalytics as Model<ISocialAnalytics>) ||
  mongoose.model<ISocialAnalytics>('SocialAnalytics', SocialAnalyticsSchema);

export default SocialAnalytics;
