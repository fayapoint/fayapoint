import mongoose, { Schema, Document, Model } from 'mongoose';

// Course enrollment tracking for tier system
export interface IEnrolledCourse {
  courseId: string;
  courseSlug: string;
  level: 'free' | 'beginner' | 'intermediate' | 'advanced';
  enrolledAt: Date;
  isActive: boolean;
  source: 'subscription' | 'purchase' | 'gift' | 'promotion';
}

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  image?: string;
  role: 'student' | 'instructor' | 'admin';
  emailVerified?: Date;
  enrolledCourses: IEnrolledCourse[];
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
    xp: number;
    xpToNextLevel: number;
    lastActiveDate?: Date;
    weeklyXp: number;
    monthlyXp: number;
  };
  gamification: {
    achievements: {
      id: string;
      unlockedAt: Date;
      progress?: number;
    }[];
    dailyChallenge?: {
      id: string;
      date: Date;
      completed: boolean;
      reward: number;
    };
    weeklyGoal: {
      target: number;
      current: number;
      type: 'lessons' | 'hours' | 'xp';
    };
    streakFreeze: number;
    totalImagesGenerated: number;
    totalAiChats: number;
    referrals: number;
  };
  // POD earnings and commissions
  podEarnings: {
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    lastPayoutDate?: Date;
    payoutMethod?: 'pix' | 'bank_transfer' | 'paypal';
    payoutDetails?: {
      pixKey?: string;
      bankAccount?: string;
      bankAgency?: string;
      bankName?: string;
      paypalEmail?: string;
    };
    commissionRate: number; // Default 70%
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
  // Helper methods for course access
  getActiveEnrollments(): IEnrolledCourse[];
  isEnrolledIn(courseSlug: string): boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const EnrolledCourseSchema = new Schema({
  courseId: { type: String, required: true },
  courseSlug: { type: String, required: true },
  level: {
    type: String,
    enum: ['free', 'beginner', 'intermediate', 'advanced'],
    required: true
  },
  enrolledAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  source: {
    type: String,
    enum: ['subscription', 'purchase', 'gift', 'promotion'],
    default: 'subscription'
  }
}, { _id: false });

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    select: false, // Don't return password by default
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
  enrolledCourses: [EnrolledCourseSchema],
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
    xp: { type: Number, default: 0 },
    xpToNextLevel: { type: Number, default: 100 },
    lastActiveDate: Date,
    weeklyXp: { type: Number, default: 0 },
    monthlyXp: { type: Number, default: 0 },
  },
  gamification: {
    achievements: [{
      id: String,
      unlockedAt: Date,
      progress: Number,
    }],
    dailyChallenge: {
      id: String,
      date: Date,
      completed: { type: Boolean, default: false },
      reward: Number,
    },
    weeklyGoal: {
      target: { type: Number, default: 5 },
      current: { type: Number, default: 0 },
      type: { type: String, enum: ['lessons', 'hours', 'xp'], default: 'lessons' },
    },
    streakFreeze: { type: Number, default: 0 },
    totalImagesGenerated: { type: Number, default: 0 },
    totalAiChats: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
  },
  podEarnings: {
    totalEarnings: { type: Number, default: 0 },
    pendingEarnings: { type: Number, default: 0 },
    paidEarnings: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    lastPayoutDate: Date,
    payoutMethod: { type: String, enum: ['pix', 'bank_transfer', 'paypal'] },
    payoutDetails: {
      pixKey: String,
      bankAccount: String,
      bankAgency: String,
      bankName: String,
      paypalEmail: String,
    },
    commissionRate: { type: Number, default: 70 },
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
UserSchema.index({ 'subscription.stripeCustomerId': 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'enrolledCourses.courseSlug': 1 });

// Instance methods
UserSchema.methods.getActiveEnrollments = function(): IEnrolledCourse[] {
  return this.enrolledCourses?.filter((c: IEnrolledCourse) => c.isActive) || [];
};

UserSchema.methods.isEnrolledIn = function(courseSlug: string): boolean {
  return this.enrolledCourses?.some(
    (c: IEnrolledCourse) => c.courseSlug === courseSlug && c.isActive
  ) || false;
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
