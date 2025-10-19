import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILesson {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: 'video' | 'text' | 'quiz' | 'assignment' | 'live';
  content?: string;
  videoUrl?: string;
  duration: number; // in minutes
  resources: {
    title: string;
    type: 'pdf' | 'link' | 'download' | 'code';
    url: string;
  }[];
  quiz?: {
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }[];
    passingScore: number;
  };
  order: number;
  isFree: boolean;
}

export interface IModule {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  order: number;
  lessons: ILesson[];
  duration: number; // calculated from lessons
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  instructor: mongoose.Types.ObjectId;
  category: string;
  subcategory: string;
  topics: string[];
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  language: string;
  duration: number; // total in hours
  price: {
    amount: number;
    currency: string;
    discount: number;
    discountEndsAt?: Date;
  };
  thumbnail: string;
  trailer?: string;
  modules: IModule[];
  requirements: string[];
  objectives: string[];
  targetAudience: string[];
  tools: string[]; // AI tools covered
  features: string[]; // Course features
  rating: {
    average: number;
    count: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  enrollments: number;
  status: 'draft' | 'published' | 'archived';
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  promotions: {
    featured: boolean;
    bestseller: boolean;
    new: boolean;
    trending: boolean;
  };
  certificate: {
    enabled: boolean;
    title?: string;
    description?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

const LessonSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['video', 'text', 'quiz', 'assignment', 'live'],
    required: true,
  },
  content: String,
  videoUrl: String,
  duration: { type: Number, default: 0 },
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['pdf', 'link', 'download', 'code'],
    },
    url: String,
  }],
  quiz: {
    questions: [{
      question: String,
      options: [String],
      correctAnswer: Number,
      explanation: String,
    }],
    passingScore: { type: Number, default: 70 },
  },
  order: { type: Number, required: true },
  isFree: { type: Boolean, default: false },
});

const ModuleSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  order: { type: Number, required: true },
  lessons: [LessonSchema],
  duration: { type: Number, default: 0 },
});

const CourseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  subtitle: String,
  description: {
    type: String,
    required: true,
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  subcategory: String,
  topics: [String],
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all'],
    default: 'all',
  },
  language: {
    type: String,
    default: 'pt-BR',
  },
  duration: {
    type: Number,
    default: 0,
  },
  price: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'BRL' },
    discount: { type: Number, default: 0 },
    discountEndsAt: Date,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  trailer: String,
  modules: [ModuleSchema],
  requirements: [String],
  objectives: [String],
  targetAudience: [String],
  tools: [String],
  features: [String],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 },
    },
  },
  enrollments: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
  },
  promotions: {
    featured: { type: Boolean, default: false },
    bestseller: { type: Boolean, default: false },
    new: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
  },
  certificate: {
    enabled: { type: Boolean, default: true },
    title: String,
    description: String,
  },
  publishedAt: Date,
}, {
  timestamps: true,
});

// Indexes
CourseSchema.index({ slug: 1 });
CourseSchema.index({ status: 1, category: 1 });
CourseSchema.index({ 'price.amount': 1 });
CourseSchema.index({ 'rating.average': -1 });
CourseSchema.index({ enrollments: -1 });
CourseSchema.index({ createdAt: -1 });

// Virtual for calculating total duration
CourseSchema.pre('save', function(next) {
  if (this.modules && this.modules.length > 0) {
    let totalMinutes = 0;
    this.modules.forEach(module => {
      let moduleDuration = 0;
      module.lessons.forEach(lesson => {
        moduleDuration += lesson.duration || 0;
      });
      module.duration = Math.round(moduleDuration / 60); // Convert to hours
      totalMinutes += moduleDuration;
    });
    this.duration = Math.round(totalMinutes / 60); // Total hours
  }
  next();
});

const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
