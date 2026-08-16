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

/**
 * Um e-mail a mais na MESMA conta (10/08/2026).
 *
 * Ricardo: *"não pode ter 2 contas com o mesmo email, tem que requerer o cpf,
 * um cpf por conta, tem que poder associar mais de um email por conta, mas não
 * mais de um cpf."*
 *
 * ⚠️ `verificado` é uma trava de segurança, não um selo bonito. Só e-mail
 * verificado entra na busca de login (ver `acharPorQualquerEmail`). Se um
 * e-mail digitado à mão servisse para entrar, bastaria eu escrever o e-mail de
 * outra pessoa aqui para que o próximo login dela caísse na MINHA conta.
 * Verificar = provar posse, e hoje só o login social prova.
 */
export interface IEmailVinculado {
  email: string;
  verificado: boolean;
  /** 'google' prova posse; 'manual' serve para contato e recibo, nunca login. */
  origem: 'login' | 'google' | 'manual';
  addedAt: Date;
}

export interface IUser extends Document {
  /** O e-mail principal — continua sendo a chave que o resto do sistema usa. */
  email: string;
  /** Os outros e-mails desta MESMA pessoa. Ver `IEmailVinculado`. */
  emails: IEmailVinculado[];
  /**
   * Os e-mails com posse PROVADA — e o único lugar com índice único.
   *
   * ⚠️ Existe por causa de um sequestro possível, achado pelo laço de críticos
   * em 10/08/2026. A primeira versão indexava `emails.email` inteiro, incluindo
   * os digitados à mão. Consequência: eu escrevo o e-mail de um estranho na
   * MINHA conta e, sem provar nada, aquele endereço fica reservado para sempre
   * — o dono real não consegue mais se cadastrar ("já está cadastrado") nem
   * entrar pelo Google (colisão de índice, erro 500). Negação de serviço a
   * custo zero, contra qualquer pessoa.
   *
   * Agora a exclusividade global vale só para quem provou posse. E-mail de
   * contato não verificado continua na lista, serve para recibo, e **não
   * bloqueia ninguém** — duas contas podem até listar o mesmo, porque um
   * rótulo sem poder não precisa ser único.
   */
  emailsVerificados: string[];
  /**
   * Só dígitos. Índice único esparso: uma conta por documento, e contas antigas
   * sem CPF continuam existindo (`sparse`) até a pessoa preencher.
   */
  cpf?: string;
  cpfVerifiedAt?: Date;
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
  /**
   * ── A FRANQUIA DE CONVERSA CONSUMIDA NESTE MÊS (11/08/2026) ───────────────
   *
   * Ricardo: *"conversar com o assistente, depende do plano"*. O teto por plano
   * vive em `TierConfig.chatMensagensMes` (e é editável no Mission Control);
   * aqui fica só o quanto já foi usado.
   *
   * ⚠️ `periodo` é a chave do mês (`AAAA-MM`) e é o que faz a franquia zerar
   * sem cron: quando a chave lida difere da chave de hoje, a contagem recomeça.
   * É o mesmo desenho do refill de créditos — o gatilho é o USO, não o relógio.
   * Guardar só o número, sem o período, faria a franquia valer para sempre.
   */
  aiChatUsage?: {
    periodo: string;
    mensagens: number;
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
      /** 'masculino' | 'feminino' | 'neutro' — ver `TRATAMENTOS` em `lib/persona.ts`. */
      tratamento?: string;
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
    /**
     * ⚠️ FALTAVA NO SCHEMA (achado em 10/08/2026 pelo laço de críticos).
     *
     * A dimensão do NEGÓCIO entrou em 03/08 com tela, cálculo de confiança e
     * seis perguntas — e nunca foi declarada aqui. O Mongoose **descarta em
     * silêncio** o que não está no schema: a pessoa respondia "meu ticket é
     * R$180", a tela dizia "Anotado ✨", e o dado morria no caminho. Nenhum
     * erro, nenhum log; só a confiança que não subia e o exemplo do capítulo
     * que continuava dizendo "imagine que você atende clientes".
     *
     * É a mesma armadilha que já custou o fluxo de pagamento antes. Ao criar
     * bloco novo em `PersonaProfunda`, declare aqui NA MESMA EDIÇÃO.
     */
    negocio?: {
      oQueVende?: string;
      ticket?: number;
      canal?: string;
      objecao?: string;
      clientesPorMes?: number;
      orgulho?: string;
      referencias?: string[];
    };
    /** Mesmo caso: lido pelo Ateliê (`persona.caderno?.imagens`) e nunca gravável. */
    caderno?: {
      imagens?: string[];
      origem?: string[];
      geradoEm?: Date;
      status?: 'pendente' | 'pronto' | 'falhou';
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
  emails: {
    type: [
      new Schema<IEmailVinculado>(
        {
          email: { type: String, required: true, lowercase: true, trim: true },
          verificado: { type: Boolean, default: false },
          origem: { type: String, enum: ['login', 'google', 'manual'], default: 'manual' },
          addedAt: { type: Date, default: Date.now },
        },
        { _id: false },
      ),
    ],
    default: [],
  },
  emailsVerificados: {
    type: [String],
    default: [],
    lowercase: true,
    trim: true,
  },
  cpf: {
    type: String,
    trim: true,
    // ⚠️ `sparse` é obrigatório aqui: sem ele, TODA conta sem CPF conta como
    // um `null` duplicado e a segunda a ser criada explode no índice único.
    index: { unique: true, sparse: true },
  },
  cpfVerifiedAt: Date,
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
  // ⚠️ Campo NOVO — precisa estar AQUI, não só na interface. O Mongoose
  // descarta em silêncio o que não está no schema (foi o defeito de
  // `socialPersona.negocio`): sem esta declaração, a contagem nunca é gravada
  // e a franquia do assistente vira ilimitada para todo mundo, sem erro nenhum.
  aiChatUsage: {
    periodo: { type: String, default: '' },
    mensagens: { type: Number, default: 0 },
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
      /**
       * ⚠️ Sem esta linha o campo NÃO EXISTE. O Mongoose descarta em silêncio o
       * que não está declarado: a tela salva, mostra "Anotado ✨", e o dado some
       * — foi o que aconteceu com `socialPersona.negocio` por uma semana em
       * agosto. Ver `reference_mongoose_campo_fantasma`.
       *
       * Sem `default`, de propósito: 'não respondeu' e 'pediu neutro' precisam
       * ser distinguíveis. `blocoDePersona` trata ausência como neutro na hora
       * de escrever, mas o console precisa saber que a pergunta ainda está
       * aberta para continuar cobrando.
       */
      tratamento: { type: String },
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
    // Ver o comentário na interface acima: estes dois blocos existiam em
    // `PersonaProfunda`, tinham tela e não tinham schema — logo, não gravavam.
    negocio: {
      oQueVende: { type: String, default: '' },
      ticket: { type: Number },
      canal: { type: String, default: '' },
      objecao: { type: String, default: '' },
      clientesPorMes: { type: Number },
      orgulho: { type: String, default: '' },
      referencias: [{ type: String }],
    },
    caderno: {
      imagens: [{ type: String }],
      origem: [{ type: String }],
      geradoEm: { type: Date },
      status: { type: String, enum: ['pendente', 'pronto', 'falhou'] },
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
/**
 * ⚠️ Único e esparso, como o do CPF, e garante a regra do Ricardo: **um
 * endereço não pode estar em duas contas.**
 *
 * O índice é sobre `emailsVerificados` — só posse provada — e NUNCA sobre
 * `emails.email`. Indexar a lista inteira permitiria reservar o endereço de um
 * terceiro só digitando; ver o comentário de `emailsVerificados` na interface.
 *
 * A checagem em `lib/identidade.ts` existe para dar mensagem decente ANTES do
 * erro 11000; o índice é a rede embaixo dela.
 */
UserSchema.index({ emailsVerificados: 1 }, { unique: true, sparse: true });
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
