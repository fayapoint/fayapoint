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

// Saved card for tokenized credit cards
export interface ISavedCard {
  _id: mongoose.Types.ObjectId;
  token: string;
  lastFour: string;
  brand: string;
  holderName: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  image?: string;
  role: 'student' | 'instructor' | 'admin';
  emailVerified?: Date;
  enrolledCourses: IEnrolledCourse[];
  // Billing info for payments
  billing: {
    phone?: string;
    cpfCnpj?: string;
    postalCode?: string;
    addressNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    asaasCustomerId?: string;
  };
  savedCards: ISavedCard[];
  subscription: {
    plan: 'free' | 'starter' | 'pro' | 'business' | 'explorador' | 'profissional' | 'expert';
    status: 'active' | 'pending' | 'cancelled' | 'past_due' | 'expired';
    pendingPlan?: 'explorador' | 'profissional' | 'expert';
    expiresAt?: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    asaasSubscriptionId?: string;
  };
  credits: {
    balance: number;                // Current available credits
    monthlyAllocation: number;      // Credits granted per billing cycle
    lastRefillDate?: Date;          // When credits were last refilled
    totalSpent: number;             // Lifetime credits spent
    totalPurchased: number;         // Lifetime credits purchased (packs)
    purchasedCredits: {             // Purchased credit packs (expire in 90 days)
      amount: number;
      purchasedAt: Date;
      expiresAt: Date;
    }[];
    history: {
      action: string;               // e.g. 'quiz_attempt', 'image_generation', 'purchase'
      amount: number;               // positive = added, negative = spent
      description: string;
      createdAt: Date;
    }[];
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
    landingXpClaimed?: boolean;
    /** Exemplos do minigame da landing já creditados (idempotência por exampleId) */
    gateExamples?: string[];
    totalImagesGenerated: number;
    totalAiChats: number;
    referrals: number;
  };
  /** Sequência de e-mails pós-cadastro (P5.2) — idempotência por marcação */
  followups?: {
    d2SentAt?: Date;
    d2Ok?: boolean;
    d7SentAt?: Date;
    d7Ok?: boolean;
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
  // Social Persona (USS integration — gamified onboarding + RAG)
  socialPersona: {
    // Visual selections (from persona builder — zero-typing)
    industry: string[];
    toneOfVoice: string[];
    marketingGoals: string[];
    contentTypes: string[];
    experienceLevel: string;
    // AI-extracted from social accounts
    topHashtags: string[];
    contentThemes: string[];
    audienceInsights: string;
    writingStyle: string;
    postingFrequency: string;
    // Aggregated intelligence
    primaryInterests: string[];
    recommendedCourses: string[];
    recommendationReasoning: string[];
    // Metadata
    personaVersion: number;
    weights: { profile: number; social: number; custom: number };
    lastAnalyzed?: Date;
    completionPercent: number;
    /**
     * Quantos passos e blocos já RENDERAM XP. Sem este teto, desmarcar e
     * remarcar uma opção viraria fazenda de XP — o mesmo defeito que o
     * check-in diário teve em 16/07. Ver a rota `social-persona`.
     */
    xpPassosPagos?: number;
    xpBlocosPagos?: number;
    /**
     * A profundidade que o USS de 2024 já tinha e aqui faltava (27/07/2026).
     *
     * Os campos acima são rótulos: bons para escolher com o dedo, fracos para
     * escrever. Estes são o que faz um texto soar como a pessoa — sobretudo
     * `voz.amostra`, que vale mais no prompt do que todos os adjetivos de tom
     * somados. Ver `src/lib/persona.ts`, que é quem lê e escreve isto.
     *
     * Tudo opcional de propósito: a persona é preenchida ao longo do tempo, e
     * o painel do dossiê mede o quanto já sabemos em vez de exigir tudo de uma
     * vez.
     */
    identidade?: {
      marca?: string;
      papel?: string;
      cidade?: string;
      missao?: string;
      valores?: string[];
      site?: string;
    };
    voz?: {
      emoji?: number;
      formalidade?: number;
      bordoes?: string[];
      usaHumor?: boolean;
      usaPergunta?: boolean;
      usaHistoria?: boolean;
      usaCta?: boolean;
      vocabulario?: string;
      amostra?: string;
    };
    publico?: {
      idade?: number[];
      lugares?: string[];
      quemE?: string;
      dores?: string[];
      desejos?: string[];
    };
    estrategia?: {
      pilares?: string[];
      porSemana?: number;
      melhoresHorarios?: string[];
      assinatura?: string;
      naoFalar?: string[];
    };
    aprendizado?: {
      objetivo?: string;
      ritmo?: string;
      tempo?: string;
      ferramentas?: string[];
      travando?: string;
    };
    /** Rosto do usuário por contexto de uso — ver TIPOS_FOTO em lib/persona.ts */
    fotos?: {
      tipo: string;
      url: string;
      origem: string;
      publicId?: string;
      addedAt?: Date;
    }[];
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
  billing: {
    phone: String,
    cpfCnpj: String,
    postalCode: String,
    addressNumber: String,
    address: String,
    city: String,
    state: String,
    asaasCustomerId: String,
  },
  savedCards: [{
    token: String,
    lastFour: String,
    brand: String,
    holderName: String,
    expiryMonth: String,
    expiryYear: String,
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'business', 'explorador', 'profissional', 'expert'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'cancelled', 'past_due', 'expired'],
      default: 'active',
    },
    pendingPlan: {
      type: String,
      enum: ['explorador', 'profissional', 'expert'],
    },
    expiresAt: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    asaasSubscriptionId: String,
  },
  credits: {
    balance: { type: Number, default: 0 },
    monthlyAllocation: { type: Number, default: 0 },
    lastRefillDate: Date,
    totalSpent: { type: Number, default: 0 },
    totalPurchased: { type: Number, default: 0 },
    purchasedCredits: [{
      amount: { type: Number, required: true },
      purchasedAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
    }],
    history: [{
      action: { type: String, required: true },
      amount: { type: Number, required: true },
      description: String,
      createdAt: { type: Date, default: Date.now },
    }],
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
    landingXpClaimed: { type: Boolean, default: false },
    gateExamples: { type: [String], default: [] },
    totalImagesGenerated: { type: Number, default: 0 },
    totalAiChats: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 },
  },
  // Sequência de e-mails pós-cadastro (P5.2)
  followups: {
    d2SentAt: Date,
    d2Ok: Boolean,
    d7SentAt: Date,
    d7Ok: Boolean,
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
  socialPersona: {
    industry: [{ type: String }],
    toneOfVoice: [{ type: String }],
    marketingGoals: [{ type: String }],
    contentTypes: [{ type: String }],
    experienceLevel: { type: String, default: '' },
    topHashtags: [{ type: String }],
    contentThemes: [{ type: String }],
    audienceInsights: { type: String, default: '' },
    writingStyle: { type: String, default: '' },
    postingFrequency: { type: String, default: '' },
    primaryInterests: [{ type: String }],
    recommendedCourses: [{ type: String }],
    recommendationReasoning: [{ type: String }],
    personaVersion: { type: Number, default: 0 },
    weights: {
      profile: { type: Number, default: 34 },
      social: { type: Number, default: 33 },
      custom: { type: Number, default: 33 },
    },
    lastAnalyzed: { type: Date },
    completionPercent: { type: Number, default: 0 },
    xpPassosPagos: { type: Number, default: 0 },
    xpBlocosPagos: { type: Number, default: 0 },
    // Profundidade USS (27/07) — ver a interface acima para o porquê de cada bloco
    identidade: {
      marca: { type: String, default: '' },
      papel: { type: String, default: '' },
      cidade: { type: String, default: '' },
      missao: { type: String, default: '' },
      valores: [{ type: String }],
      site: { type: String, default: '' },
    },
    voz: {
      emoji: { type: Number },
      formalidade: { type: Number },
      bordoes: [{ type: String }],
      usaHumor: { type: Boolean },
      usaPergunta: { type: Boolean },
      usaHistoria: { type: Boolean },
      usaCta: { type: Boolean },
      vocabulario: { type: String, default: '' },
      amostra: { type: String, default: '' },
    },
    publico: {
      idade: [{ type: Number }],
      lugares: [{ type: String }],
      quemE: { type: String, default: '' },
      dores: [{ type: String }],
      desejos: [{ type: String }],
    },
    estrategia: {
      pilares: [{ type: String }],
      porSemana: { type: Number },
      melhoresHorarios: [{ type: String }],
      assinatura: { type: String, default: '' },
      naoFalar: [{ type: String }],
    },
    aprendizado: {
      objetivo: { type: String, default: '' },
      ritmo: { type: String, default: '' },
      tempo: { type: String, default: '' },
      ferramentas: [{ type: String }],
      travando: { type: String, default: '' },
    },
    fotos: [
      {
        _id: false,
        tipo: { type: String },
        url: { type: String },
        origem: { type: String, default: 'upload' },
        publicId: { type: String },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  lastLoginAt: Date,
}, {
  timestamps: true,
});

// Indexes for better query performance
UserSchema.index({ 'subscription.stripeCustomerId': 1 });
UserSchema.index({ 'billing.asaasCustomerId': 1 });
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
