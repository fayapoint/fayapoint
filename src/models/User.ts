import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  image?: string;
  role: 'student' | 'instructor' | 'admin';
  emailVerified?: Date;
  subscription: {
    plan: 'free' | 'starter' | 'pro' | 'business';
    status: 'active' | 'cancelled' | 'past_due';
    expiresAt?: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  profile: {
    bio?: string;
    linkedin?: string;
    company?: string;
    position?: string;
    interests: string[];
    skills: string[];
    website?: string;
    location?: string;
  };
  progress: {
    totalHours: number;
    coursesCompleted: number;
    coursesInProgress: number;
    currentStreak: number;
    longestStreak: number;
    badges: mongoose.Types.ObjectId[];
    points: number;
    level: number;
  };
  preferences: {
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
      courseUpdates: boolean;
      communityActivity: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    playbackSpeed: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  image: String,
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student',
  },
  emailVerified: Date,
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'business'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'past_due'],
      default: 'active',
    },
    expiresAt: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
  },
  profile: {
    bio: String,
    linkedin: String,
    company: String,
    position: String,
    interests: [String],
    skills: [String],
    website: String,
    location: String,
  },
  progress: {
    totalHours: { type: Number, default: 0 },
    coursesCompleted: { type: Number, default: 0 },
    coursesInProgress: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    badges: [{ type: Schema.Types.ObjectId, ref: 'Badge' }],
    points: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
  },
  preferences: {
    language: { type: String, default: 'pt-BR' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
      courseUpdates: { type: Boolean, default: true },
      communityActivity: { type: Boolean, default: true },
    },
    theme: { 
      type: String, 
      enum: ['light', 'dark', 'system'],
      default: 'system' 
    },
    playbackSpeed: { type: Number, default: 1 },
  },
  lastLoginAt: Date,
}, {
  timestamps: true,
});

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ 'subscription.stripeCustomerId': 1 });
UserSchema.index({ createdAt: -1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
