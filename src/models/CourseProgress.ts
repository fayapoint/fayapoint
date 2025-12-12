import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICourseProgress extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: string; // slug or ID
  completedLessons: string[];
  completedSections?: string[];
  lastAccessedLesson?: string;
  lastHeadingId?: string;
  progressPercent: number;
  totalSections?: number;
  lastScrollY?: number;
  lastScrollPercent?: number;
  isCompleted: boolean;
  completedAt?: Date;
  startedAt: Date;
  lastAccessedAt: Date;
}

const CourseProgressSchema = new Schema<ICourseProgress>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: String,
    required: true,
  },
  completedLessons: [{
    type: String,
  }],
  completedSections: [{
    type: String,
  }],
  lastAccessedLesson: String,
  lastHeadingId: String,
  progressPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  totalSections: {
    type: Number,
    min: 0,
  },
  lastScrollY: {
    type: Number,
    min: 0,
  },
  lastScrollPercent: {
    type: Number,
    min: 0,
    max: 100,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: Date,
  startedAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
CourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
CourseProgressSchema.index({ userId: 1, lastAccessedAt: -1 });

const CourseProgress: Model<ICourseProgress> = mongoose.models.CourseProgress || mongoose.model<ICourseProgress>('CourseProgress', CourseProgressSchema);

export default CourseProgress;
