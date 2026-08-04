/**
 * FayAI Course Access & Credit System
 *
 * ═══════════════════════════════════════════════════════════
 * SUBSCRIPTION TIERS
 * ═══════════════════════════════════════════════════════════
 *
 * Free:        R$0        — 3 chapter preview per course, no full access
 * Explorador:  R$57/mês   — 3 beginner courses/month, 100 credits
 * Profissional: R$97/mês  — 5 beginner + 2 intermediate + 1 advanced, 300 credits
 * Expert:      R$167/mês  — 7 beginner + 4 intermediate + 3 advanced, 800 credits
 *
 * ═══════════════════════════════════════════════════════════
 * INDIVIDUAL COURSE PURCHASES
 * ═══════════════════════════════════════════════════════════
 *
 * Every course has its own price in fayapointProdutos.products.
 * Checkout resolves that catalog price on the server; course level is never
 * used as a substitute for the product price.
 * Tier discounts apply: Explorador 10%, Profissional 20%, Expert 50%
 *
 * ═══════════════════════════════════════════════════════════
 * MONTHLY ROTATING POOL
 * ═══════════════════════════════════════════════════════════
 *
 * 10 beginner courses available per month
 * 8 intermediate courses available per month
 * 3 advanced courses available per month
 * (rotation managed via admin/mission-control)
 *
 * ═══════════════════════════════════════════════════════════
 * CREDIT SYSTEM (Higgsfield-style)
 * ═══════════════════════════════════════════════════════════
 *
 * Monthly allocation (resets each billing cycle, no rollover):
 *   Free: 0 | Explorador: 100 | Profissional: 300 | Expert: 800
 *
 * Credit costs:
 *   Quiz attempt: 10 | Certificate generation: 20
 *   AI Chat message: 1 | Image generation: 5
 *   Custom course generation: 50
 *
 * Credit packs (one-time purchase, expire in 90 days):
 *   50 credits: R$15 | 150 credits: R$35
 *   500 credits: R$99 | 1000 credits: R$179
 *
 * ═══════════════════════════════════════════════════════════
 * QUIZ & CERTIFICATE PRICING
 * ═══════════════════════════════════════════════════════════
 *
 * Base price: Beginner R$29, Intermediate R$79, Advanced R$199
 * Tier discounts: Explorador 10%, Profissional 20%, Expert 50%
 * Certificate is verifiable online at /certificado/[code]
 */

// ─── Types ───────────────────────────────────────────────

export type CourseLevel = 'free' | 'beginner' | 'intermediate' | 'advanced';
export type SubscriptionPlan = 'free' | 'explorador' | 'profissional' | 'expert';

// Backwards compatibility alias for existing code referencing old plan names
export type LegacyPlan = 'starter' | 'pro' | 'business';

/** Map legacy plan slugs → new plan slugs (for migration) */
export const LEGACY_PLAN_MAP: Record<string, SubscriptionPlan> = {
  free: 'free',
  starter: 'explorador',
  pro: 'profissional',
  business: 'expert',
};

/** Resolve a plan slug that could be legacy or current */
export function resolvePlan(planSlug: string): SubscriptionPlan {
  const resolved = LEGACY_PLAN_MAP[planSlug] ?? planSlug;
  return ['free', 'explorador', 'profissional', 'expert'].includes(resolved)
    ? resolved as SubscriptionPlan
    : 'free';
}

// ─── Tier Limits ─────────────────────────────────────────

export interface TierLimits {
  beginner: number;
  intermediate: number;
  advanced: number;
  unlimited: boolean;
}

export interface TierConfig {
  name: string;
  displayName: string;
  slug: SubscriptionPlan;
  monthlyPrice: number;
  yearlyPrice: number;
  limits: TierLimits;
  monthlyCredits: number;
  purchaseDiscount: number;   // 0–1 discount on individual course purchases
  quizDiscount: number;       // 0–1 discount on quiz + certificate
  canAccessLevel: (level: CourseLevel) => boolean;
  features: string[];
}

export const TIER_CONFIGS: Record<SubscriptionPlan, TierConfig> = {
  free: {
    name: 'free',
    displayName: 'Gratuito',
    slug: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      unlimited: false,
    },
    /**
     * ── A ESCADA DE CRÉDITOS (03/08/2026) ─────────────────────────────────
     *
     * A regra, em uma frase que cabe na página de preços: **cada real da sua
     * assinatura vira crédito com bônus — e quanto maior o plano, maior o
     * bônus.**
     *
     * | plano | paga/mês | recebe | multiplicador | dá para personalizar |
     * |---|---|---|---|---|
     * | Gratuito | R$0 | **50** (uma vez) | boas-vindas | 1 curso de entrada inteiro (25 capítulos) |
     * | Explorador | R$57 | **100** | **1,75×** | ~3 cursos medianos |
     * | Profissional | R$97 | **200** | **2,06×** | ~6 cursos medianos |
     * | Expert | R$167 | **400** | **2,40×** | ~12 cursos medianos |
     *
     * ⚠️ O teto do Expert é decisão do Ricardo e tem faixa: *"no plano expert o
     * valor deve ser algo em torno de 2 a 3× o valor da assinatura"*. 400 sobre
     * 167 dá 2,40× — dentro da faixa, com folga dos dois lados. **Se mexer no
     * preço do plano, mexa aqui junto**, senão o multiplicador escorrega sem
     * ninguém perceber.
     *
     * O gratuito recebe **50, uma vez** (não por mês). É a promessa que o
     * Ricardo pediu — *"no plano gratuito, o usuário ganha o equivalente para
     * criar um curso"* — e a R$2 o capítulo isso é um curso de até 25
     * capítulos, que cobre a maior parte do catálogo. Vale só depois que o
     * curso está no acervo dele: o `POST /api/user/curso-personalizado` recusa
     * personalizar curso que a pessoa não pode abrir, para o crédito de
     * boas-vindas não virar dinheiro queimado em capítulo trancado.
     */
    monthlyCredits: 50,
    purchaseDiscount: 0,
    quizDiscount: 0,
    canAccessLevel: (level) => level === 'free',
    features: [
      '50 créditos de boas-vindas (= R$50)',
      'Dá para personalizar um curso inteiro',
      '3 capítulos grátis por curso',
      '1 curso aberto por vez',
    ],
  },
  explorador: {
    name: 'explorador',
    displayName: 'Explorador',
    slug: 'explorador',
    monthlyPrice: 57,
    yearlyPrice: 570,      // ~R$47.50/mês (2 meses grátis)
    limits: {
      beginner: 3,
      intermediate: 0,
      advanced: 0,
      unlimited: false,
    },
    /** R$57 viram 57 + 43 de bônus (75%). ~6 cursos medianos personalizados. */
    monthlyCredits: 100,
    purchaseDiscount: 0.10,
    quizDiscount: 0.10,
    canAccessLevel: (level) => level === 'free' || level === 'beginner',
    features: [
      '2 cursos abertos ao mesmo tempo',
      '3 cursos iniciantes por mês',
      '100 créditos/mês (= R$100, com 75% de bônus)',
      '10% de desconto em certificações',
      '10% de desconto na compra de cursos avulsos',
      'Certificados verificáveis online',
      'Acesso à comunidade',
    ],
  },
  profissional: {
    name: 'profissional',
    displayName: 'Profissional',
    slug: 'profissional',
    monthlyPrice: 97,
    yearlyPrice: 970,      // ~R$80.83/mês (2 meses grátis)
    limits: {
      beginner: 5,
      intermediate: 2,
      advanced: 1,
      unlimited: false,
    },
    /** R$97 viram 97 + 103 de bônus (106%). ~12 cursos medianos. */
    monthlyCredits: 200,
    purchaseDiscount: 0.20,
    quizDiscount: 0.20,
    canAccessLevel: () => true,
    features: [
      '3 cursos abertos ao mesmo tempo',
      '5 cursos iniciantes por mês',
      '2 cursos intermediários por mês',
      '1 curso avançado por mês',
      '200 créditos/mês (= R$200, com 106% de bônus)',
      '20% de desconto em certificações',
      '20% de desconto na compra de cursos avulsos',
      'Suporte prioritário',
      'Conteúdo exclusivo e antecipado',
    ],
  },
  expert: {
    name: 'expert',
    displayName: 'Expert',
    slug: 'expert',
    monthlyPrice: 167,
    yearlyPrice: 1670,     // ~R$139.17/mês (2 meses grátis)
    /**
     * ── O Expert lê o acervo INTEIRO (03/08/2026) ─────────────────────────
     *
     * Ricardo, assinante do plano máximo, batendo em "Exige upgrade":
     * *"eu estar com o plano melhor do site, o expert, e não conseguir ver os
     * cursos novos... fica sendo muito frustrante"* — e upgrade para ONDE, se
     * não existe degrau acima do Expert? O rótulo apontava para uma porta que
     * não existe.
     *
     * A escassez não foi removida, foi MOVIDA. A decisão original (assinar não
     * é ler tudo) continua valendo para Explorador e Profissional, e o que o
     * Expert paga passa a comprar duas coisas melhores que um cadeado de
     * leitura:
     *
     *   1. o CERTIFICADO, que nenhum plano dá de graça — exige concluir as
     *      aulas, passar no quiz e pagar a taxa (aqui com 50% de desconto).
     *      Certificado que vem junto com a assinatura não vale nada na parede;
     *   2. a PERSONALIZAÇÃO, que se paga em créditos — e é o que faz os 800
     *      créditos/mês deixarem de ser número morto.
     *
     * `CURSOS_SIMULTANEOS` continua valendo e não é afrouxado por isto: o teto
     * de 4 cursos abertos ao mesmo tempo é outra conversa ("termine um"), não
     * um pedido de dinheiro. Ler tudo, sim; ler tudo AO MESMO TEMPO, não.
     */
    limits: {
      beginner: Infinity,
      intermediate: Infinity,
      advanced: Infinity,
      unlimited: true,
    },
    /** R$167 viram 167 + 233 de bônus (140%). ~25 cursos medianos — o catálogo tem 22. */
    monthlyCredits: 400,
    purchaseDiscount: 0.50,
    quizDiscount: 0.50,
    canAccessLevel: () => true,
    features: [
      'Acervo completo — todos os cursos, sem cadeado',
      '4 cursos abertos ao mesmo tempo',
      '400 créditos/mês (= R$400, com 140% de bônus)',
      '50% de desconto em certificações',
      '50% de desconto na compra de cursos avulsos',
      'Suporte VIP + conteúdo exclusivo',
      'Consultoria mensal com especialista',
    ],
  },
};

/**
 * Quantos cursos podem estar ABERTOS ao mesmo tempo, por plano.
 *
 * ── Por que este limite existe (03/08/2026) ────────────────────────────────
 *
 * Os limites que já existiam em `TierConfig.limits` são de MATRÍCULA POR MÊS —
 * quantos cursos novos o plano libera no período. Eles não impedem que a pessoa
 * abra sete cursos e não termine nenhum, e é exatamente isso que corrói a
 * assinatura: quem tem acesso a tudo de uma vez sente que já levou tudo no
 * primeiro mês e cancela. Um catálogo grande vira argumento contra a
 * recorrência em vez de a favor.
 *
 * O limite simultâneo transforma o catálogo em fila. Terminar um curso é o que
 * abre a vaga do próximo, e isso alinha três coisas que antes brigavam: o aluno
 * conclui mais, o certificado é emitido mais, e a assinatura tem motivo para
 * continuar no mês seguinte.
 *
 * O número do Expert — 4 — é decisão do Ricardo. Os outros degraus descem de um
 * em um a partir dele, para que subir de plano seja sentido na hora.
 *
 * Curso CONCLUÍDO não ocupa vaga: o limite é sobre o que está em andamento, não
 * sobre o que já foi feito. Sem isso o aluno aplicado seria o mais punido.
 */
export const CURSOS_SIMULTANEOS: Record<SubscriptionPlan, number> = {
  free: 1,
  explorador: 2,
  profissional: 3,
  expert: 4,
};

export function limiteSimultaneo(plan: SubscriptionPlan): number {
  return CURSOS_SIMULTANEOS[plan] ?? 1;
}

/** Quiz + Certificate base price */
export const QUIZ_CERTIFICATE_BASE_PRICE: Record<CourseLevel, number> = {
  free: 19,
  beginner: 29,
  intermediate: 79,
  advanced: 199,
};

export const COURSE_LEVEL_HIERARCHY: Record<CourseLevel, number> = {
  free: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

// ─── Credit System ───────────────────────────────────────

/**
 * ═══════════════════════════════════════════════════════════
 * 1 CRÉDITO = R$ 1,00  (decisão do Ricardo, 03/08/2026)
 * ═══════════════════════════════════════════════════════════
 *
 * Antes, os créditos eram um número sem lastro: 800 no Expert, 50 para
 * personalizar um curso, pacotes a R$0,18–0,30 por crédito. Ninguém — nem nós —
 * conseguia dizer se 50 créditos era caro ou barato, porque não havia com o quê
 * comparar. Ricardo: *"ao invés de inventar um número qualquer baseado em nada,
 * quero que seja dinheiro de verdade."*
 *
 * Com a paridade, todo preço deste arquivo vira uma frase em português que o
 * aluno confere sozinho: "personalizar este curso custa 16 créditos" é
 * "custa R$16", e ele sabe na hora se vale.
 *
 * ## Preço de VENDA, nunca preço de custo
 *
 * O custo real de um capítulo personalizado é **R$0,002** (DeepSeek V4 flash a
 * US$0,09/0,18 por milhão, ~1.600 tokens de entrada e ~1.200 de saída, medido
 * em 03/08). Esse número **não** é a base do preço, e a regra é do Ricardo:
 * *"não interessa o quanto custa para nós, até porque todo meu investimento de
 * tempo de 3 anos neste projeto e todos os custos que tenho devem ser
 * embutidos... nossos custos devem ser justos mas não absolutamente a preço de
 * banana."*
 *
 * O que o aluno compra não é uma chamada de API: é um catálogo curado, três
 * anos de trabalho e um curso que passa a falar do negócio dele. O preço reflete
 * isso. A margem alta não é oportunismo — é o que financia o que já existe.
 *
 * ## As contas que sustentam os números abaixo
 *
 * Catálogo medido em 03/08: 22 cursos ativos, 451 capítulos. Menor curso 13
 * capítulos, mediana 16, média 20,5, maior 30. Preço médio de curso: R$91.
 */
export const CREDITO_EM_REAIS = 1;

export const CREDIT_COSTS = {
  /**
   * R$5 por tentativa. O quiz é o portão do certificado e precisa custar o
   * suficiente para não virar tentativa e erro — mas menos que o certificado,
   * senão errar uma vez sai mais caro que passar.
   */
  quiz_attempt: 5,
  /** R$15, além do quiz. O certificado é verificável e não vem com o plano. */
  certificate_generation: 15,
  /**
   * ZERO — o assistente entra no plano, não no crédito.
   *
   * Com a paridade, cobrar 1 crédito por mensagem viraria R$1 por mensagem, o
   * que é absurdo para uma conversa. E cobrar frações quebraria a legibilidade
   * que a paridade existe para criar. Conversa é volume; crédito aqui é para
   * ENTREGA (um capítulo, uma imagem, um certificado).
   */
  ai_chat_message: 0,
  /** R$3 por imagem gerada no seu contexto. */
  image_generation: 3,
  /**
   * ⚠️ Preço FIXO, de quando a personalização era um botão só (27/07). Um curso
   * de 5 capítulos e um de 30 custavam o mesmo — e o de 30 dá seis vezes mais
   * trabalho ao modelo. Continua exportado porque rotas antigas o citam, mas o
   * Ateliê cobra por capítulo (abaixo).
   */
  custom_course_generation: 50,
  /**
   * **R$2 por capítulo escrito** — o preço central do site.
   *
   * Com o catálogo medido, sai: curso de entrada (13 capítulos) **R$26**,
   * mediano (16) **R$32**, médio (20,5) **R$41**, o maior (30) **R$60**.
   * Contra um preço médio de curso de R$91, personalizar custa de 28% a 66% do
   * curso — é um segundo produto, não um acessório, e o preço diz isso.
   *
   * ⚠️ Começou em R$1 e subiu no mesmo dia, por instrução do Ricardo: a R$1 o
   * curso inteiro saía por R$16 e ficava mais barato que o almoço, o que
   * desvaloriza a única coisa que só nós fazemos.
   *
   * A cobrança é por capítulo ESCRITO, não por capítulo pedido: se o modelo
   * falhar no capítulo 12, o aluno paga 11. Ver `debitar` em `lib/creditos.ts`.
   */
  custom_course_chapter: 2,
  /**
   * **R$40, uma vez.** O caderno de personagem são 6 a 8 imagens do mesmo
   * rosto em ângulos diferentes — a R$3 a imagem já seriam R$18 a R$24 só de
   * geração, e o que se compra aqui é a CONSISTÊNCIA, que é o caro. É o insumo
   * sem o qual "curso com o SEU rosto" não passa de promessa.
   *
   * Cobrado uma vez porque serve para todas as imagens seguintes — cobrar por
   * uso puniria justamente quem usa.
   */
  character_sheet: 40,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

export interface CreditPack {
  id: string;
  credits: number;
  priceReais: number;
  expiresInDays: number;
  savings: string;       // e.g. "23% economia"
}

/**
 * Os pacotes, na paridade.
 *
 * ⚠️ O desconto mudou de LUGAR e isso é o ponto. Antes o pacote grande baixava
 * o preço do crédito (R$0,18 contra R$0,30), o que só funcionava porque o
 * crédito não valia nada definido — três preços diferentes para a mesma coisa.
 * Com 1 crédito = R$1 fixo, baixar o preço do crédito quebraria a paridade que
 * torna tudo legível. Então o volume passa a dar **crédito de bônus**: você
 * paga R$100 e recebe 115. O desconto existe, e a régua continua de pé.
 */
export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack-30',  credits: 30,  priceReais: 30,  expiresInDays: 90, savings: '' },
  { id: 'pack-100', credits: 115, priceReais: 100, expiresInDays: 90, savings: '+15 de bônus' },
  { id: 'pack-250', credits: 300, priceReais: 250, expiresInDays: 90, savings: '+50 de bônus' },
  { id: 'pack-500', credits: 650, priceReais: 500, expiresInDays: 90, savings: '+150 de bônus' },
];

// ─── Monthly Rotating Pool ───────────────────────────────

export const MONTHLY_POOL = {
  beginner: 10,       // all beginner courses available per month
  intermediate: 8,    // all intermediate courses available per month
  advanced: 5,        // all advanced courses available per month (Expert sees all)
} as const;

// ─── Price Calculations ──────────────────────────────────

/**
 * Calculate the quiz + certificate price for a user's tier
 */
export function getQuizCertificatePrice(
  plan: SubscriptionPlan,
  courseLevel: CourseLevel
): { basePrice: number; discount: number; finalPrice: number } {
  const basePrice = QUIZ_CERTIFICATE_BASE_PRICE[courseLevel];
  const config = TIER_CONFIGS[plan];
  const discount = config.quizDiscount;
  const finalPrice = Math.round(basePrice * (1 - discount));
  return { basePrice, discount, finalPrice };
}

// ─── Level Normalization ─────────────────────────────────

/**
 * Map Portuguese course level strings to standardized CourseLevel
 */
export function normalizeCourseLevel(levelString: string): CourseLevel {
  const normalized = levelString.toLowerCase();

  if (normalized.includes('grátis') || normalized.includes('gratuito') || normalized === 'free') {
    return 'free';
  }
  if (
    normalized.includes('avançado') ||
    normalized === 'advanced' ||
    normalized.includes('intermediário a avançado')
  ) {
    return 'advanced';
  }
  if (normalized === 'intermediário' || normalized === 'intermediate') {
    return 'intermediate';
  }
  if (
    normalized.includes('iniciante') ||
    normalized.includes('todos os níveis') ||
    normalized === 'beginner' ||
    normalized === 'all'
  ) {
    return 'beginner';
  }
  return 'beginner';
}

/**
 * A matrícula neste curso é gratuita?
 *
 * ⚠️ Existe para que a BIBLIOTECA e o SERVIDOR respondam a mesma coisa.
 *
 * O `POST /api/courses/enroll` já decidia assim (`isFreeEnrollment`) e
 * matriculava sem cobrar nem consumir vaga. A biblioteca decidia por outro
 * caminho — nível + vaga + rotação do mês — e chegava ao contrário: etiquetava
 * **"Exige upgrade"** num curso que o servidor liberaria sem discutir. Regra
 * duplicada é regra que diverge; agora é uma função só, chamada dos dois lados.
 *
 * `price === 0` fica explícito (e não `!price`) para que preço AUSENTE não
 * vire curso grátis por omissão — o erro cairia para o lado de dar de graça o
 * que é pago.
 */
export function matriculaEhGratuita(level: CourseLevel, price?: number): boolean {
  return level === 'free' || price === 0;
}

// ─── Enrollment Slots ────────────────────────────────────

export interface EnrollmentSlots {
  beginner: { used: number; limit: number; available: number };
  intermediate: { used: number; limit: number; available: number };
  advanced: { used: number; limit: number; available: number };
}

export interface EnrolledCourse {
  courseId: string;
  courseSlug?: string;
  level: CourseLevel;
  enrolledAt: Date;
  isActive: boolean;
}

/**
 * Calculate remaining enrollment slots for a user (monthly window)
 */
export function calculateEnrollmentSlots(
  plan: SubscriptionPlan,
  enrolledCourses: EnrolledCourse[]
): EnrollmentSlots {
  const resolved = resolvePlan(plan);
  const config = TIER_CONFIGS[resolved];
  const limits = config.limits;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthEnrollments = enrolledCourses.filter(
    (c) => c.isActive && new Date(c.enrolledAt) >= monthStart
  );

  const beginnerUsed = thisMonthEnrollments.filter(
    (c) => c.level === 'free' || c.level === 'beginner'
  ).length;
  const intermediateUsed = thisMonthEnrollments.filter(
    (c) => c.level === 'intermediate'
  ).length;
  const advancedUsed = thisMonthEnrollments.filter(
    (c) => c.level === 'advanced'
  ).length;

  return {
    beginner: {
      used: beginnerUsed,
      limit: limits.unlimited ? Infinity : limits.beginner,
      available: limits.unlimited
        ? Infinity
        : Math.max(0, limits.beginner - beginnerUsed),
    },
    intermediate: {
      used: intermediateUsed,
      limit: limits.unlimited ? Infinity : limits.intermediate,
      available: limits.unlimited
        ? Infinity
        : Math.max(0, limits.intermediate - intermediateUsed),
    },
    advanced: {
      used: advancedUsed,
      limit: limits.unlimited ? Infinity : limits.advanced,
      available: limits.unlimited
        ? Infinity
        : Math.max(0, limits.advanced - advancedUsed),
    },
  };
}

// ─── Enrollment Checks ───────────────────────────────────

export function getSlotCategory(level: CourseLevel): 'beginner' | 'intermediate' | 'advanced' {
  if (level === 'free' || level === 'beginner') return 'beginner';
  return level;
}

export function canTierAccessLevel(plan: SubscriptionPlan, level: CourseLevel): boolean {
  const resolved = resolvePlan(plan);
  const config = TIER_CONFIGS[resolved];
  return config ? config.canAccessLevel(level) : false;
}

export function canEnrollInCourse(
  plan: SubscriptionPlan,
  courseLevel: CourseLevel,
  enrolledCourses: EnrolledCourse[],
  targetCourseId: string
): { canEnroll: boolean; reason?: string; upgradeRequired?: boolean; canPurchase?: boolean } {
  const resolved = resolvePlan(plan);
  const config = TIER_CONFIGS[resolved];

  // Free plan — preview only, but they CAN purchase individual courses
  if (resolved === 'free') {
    return {
      canEnroll: false,
      reason: 'Assine um plano para acessar cursos completos, ou compre este curso individualmente.',
      upgradeRequired: true,
      canPurchase: true,
    };
  }

  // Check if tier can access this level
  if (!config.canAccessLevel(courseLevel)) {
    const levelName =
      courseLevel === 'advanced' ? 'avançados'
        : courseLevel === 'intermediate' ? 'intermediários'
          : 'deste nível';
    return {
      canEnroll: false,
      reason: `Seu plano ${config.displayName} não permite acesso a cursos ${levelName}. Faça upgrade ou compre individualmente.`,
      upgradeRequired: true,
      canPurchase: true,
    };
  }

  // Check if already enrolled
  const alreadyEnrolled = enrolledCourses.find(
    (c) => (c.courseId === targetCourseId || c.courseSlug === targetCourseId) && c.isActive
  );
  if (alreadyEnrolled) {
    return { canEnroll: true };
  }

  // Check slot availability
  const slots = calculateEnrollmentSlots(resolved, enrolledCourses);
  const slotCategory = getSlotCategory(courseLevel);

  if (slots[slotCategory].available <= 0) {
    const categoryName =
      slotCategory === 'beginner' ? 'iniciantes'
        : slotCategory === 'intermediate' ? 'intermediários'
          : 'avançados';
    return {
      canEnroll: false,
      reason: `Você atingiu o limite mensal de ${slots[slotCategory].limit} curso(s) ${categoryName}. Aguarde o próximo mês, faça upgrade, ou compre individualmente.`,
      upgradeRequired: true,
      canPurchase: true,
    };
  }

  return { canEnroll: true };
}

// ─── Upgrade Suggestions ─────────────────────────────────

export function getUpgradeSuggestion(
  currentPlan: SubscriptionPlan,
  desiredLevel: CourseLevel
): { suggestedPlan: SubscriptionPlan; benefits: string[] } | null {
  const resolved = resolvePlan(currentPlan);
  const planOrder: SubscriptionPlan[] = ['free', 'explorador', 'profissional', 'expert'];
  const currentIndex = planOrder.indexOf(resolved);

  for (let i = currentIndex + 1; i < planOrder.length; i++) {
    const plan = planOrder[i];
    const config = TIER_CONFIGS[plan];

    if (config.canAccessLevel(desiredLevel)) {
      return { suggestedPlan: plan, benefits: config.features };
    }
  }

  return null;
}

// ─── Credit Helpers ──────────────────────────────────────

/**
 * Check if user has enough credits for an action
 */
export function canAffordCredits(
  availableCredits: number,
  action: CreditAction
): boolean {
  return availableCredits >= CREDIT_COSTS[action];
}

/**
 * Get credit cost for a specific action
 */
export function getCreditCost(action: CreditAction): number {
  return CREDIT_COSTS[action];
}
