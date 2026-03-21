import { MONTHLY_POOL, TIER_CONFIGS, type SubscriptionPlan } from "@/lib/course-tiers";

const PAID_PLAN_ORDER = ["explorador", "profissional", "expert"] as const;

type PaidSubscriptionPlan = (typeof PAID_PLAN_ORDER)[number];

export interface SubscriptionMarketingFact {
  title: string;
  description: string;
}

export interface SubscriptionMarketingPlan {
  slug: PaidSubscriptionPlan;
  displayName: string;
  description: string;
  priceLabel: string;
  periodLabel: string;
  badge?: string;
  highlighted?: boolean;
  href: string;
  featureHighlights: string[];
  details: string[];
}

function isPt(locale?: string) {
  return locale === "pt" || locale === "pt-BR";
}

function formatPriceLabel(price: number, locale?: string) {
  return new Intl.NumberFormat(isPt(locale) ? "pt-BR" : "en-US", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(price);
}

function getCourseMix(plan: PaidSubscriptionPlan, locale?: string) {
  const limits = TIER_CONFIGS[plan].limits;

  if (plan === "explorador") {
    return isPt(locale)
      ? `${limits.beginner} cursos iniciantes por mes`
      : `${limits.beginner} beginner courses per month`;
  }

  if (plan === "profissional") {
    return isPt(locale)
      ? `${limits.beginner} iniciantes + ${limits.intermediate} intermediarios + ${limits.advanced} avancado por mes`
      : `${limits.beginner} beginner + ${limits.intermediate} intermediate + ${limits.advanced} advanced per month`;
  }

  return isPt(locale)
    ? `${limits.beginner} iniciantes + ${limits.intermediate} intermediarios + ${limits.advanced} avancados por mes`
    : `${limits.beginner} beginner + ${limits.intermediate} intermediate + ${limits.advanced} advanced courses per month`;
}

function getPoolCoverage(plan: PaidSubscriptionPlan, locale?: string) {
  if (plan === "explorador") {
    return isPt(locale)
      ? `Acesso a ${MONTHLY_POOL.beginner} cursos iniciantes na rotacao`
      : `Access to ${MONTHLY_POOL.beginner} beginner courses in the monthly rotation`;
  }

  if (plan === "profissional") {
    return isPt(locale)
      ? `Rotacao do mes com ${MONTHLY_POOL.beginner} iniciantes e ${MONTHLY_POOL.intermediate} intermediarios`
      : `Monthly rotation with ${MONTHLY_POOL.beginner} beginner and ${MONTHLY_POOL.intermediate} intermediate courses`;
  }

  return isPt(locale)
    ? `Rotacao completa do mes: ${MONTHLY_POOL.beginner} iniciantes, ${MONTHLY_POOL.intermediate} intermediarios e ${MONTHLY_POOL.advanced} avancados`
    : `Full monthly rotation: ${MONTHLY_POOL.beginner} beginner, ${MONTHLY_POOL.intermediate} intermediate, and ${MONTHLY_POOL.advanced} advanced courses`;
}

function getCertificateBenefit(plan: PaidSubscriptionPlan, locale?: string) {
  const discount = Math.round(TIER_CONFIGS[plan].quizDiscount * 100);
  return isPt(locale)
    ? `Certificacao com ${discount}% de desconto nos cursos do seu plano`
    : `Certificates with ${discount}% off on courses covered by your plan`;
}

function getPurchaseBenefit(plan: PaidSubscriptionPlan, locale?: string) {
  const discount = Math.round(TIER_CONFIGS[plan].purchaseDiscount * 100);
  return isPt(locale)
    ? `${discount}% de desconto em cursos avulsos fora da rotacao`
    : `${discount}% off on one-off course purchases outside the monthly rotation`;
}

function getPlanDescription(plan: PaidSubscriptionPlan, locale?: string) {
  if (plan === "explorador") {
    return isPt(locale)
      ? "Para entrar com clareza, testar o curso gratis do mes e avancar pela trilha iniciante."
      : "For getting started with clarity, trying the free course of the month, and moving through the beginner track.";
  }

  if (plan === "profissional") {
    return isPt(locale)
      ? "Para estudar com consistencia, subir de nivel e transformar certificacao em vantagem real."
      : "For consistent monthly study, cross-level progression, and turning certification into a real advantage.";
  }

  return isPt(locale)
    ? "Para quem quer a vitrine mensal mais completa, mais folego de estudo e o melhor ganho por curso."
    : "For learners who want the fullest monthly catalog, more learning capacity, and the strongest per-course value.";
}

function getPlanDetails(plan: PaidSubscriptionPlan, locale?: string) {
  const tier = TIER_CONFIGS[plan];
  const discount = Math.round(tier.quizDiscount * 100);

  if (isPt(locale)) {
    return [
      "O curso gratis do mes continua aberto para qualquer conta, com certificado incluido.",
      getPoolCoverage(plan, locale),
      "Voce escolhe quais cursos da vitrine mensal quer ocupar nas vagas do seu ciclo atual.",
      `Ao concluir um curso do plano, a certificacao segue como beneficio com ${discount}% de desconto.`,
      "No dia 1 a rotacao vira automaticamente e o portal mostra o que ficou incluido, o que saiu e o que pede upgrade.",
    ];
  }

  return [
    "The free course of the month stays open to every account, with the certificate included.",
    getPoolCoverage(plan, locale),
    "You choose which courses from the monthly showcase should occupy your plan slots for the current cycle.",
    `When you finish a covered course, certification stays available as a ${discount}% plan benefit.`,
    "On day 1 the rotation updates automatically and the portal shows what is included, what rotated out, and what now requires an upgrade.",
  ];
}

export function getSubscriptionMarketingFacts(locale?: string): SubscriptionMarketingFact[] {
  if (isPt(locale)) {
    return [
      {
        title: "Curso gratis do mes",
        description: "1 curso completo fica aberto para qualquer conta, com certificado incluido.",
      },
      {
        title: "Pool mensal rotativo",
        description: `${MONTHLY_POOL.beginner} iniciantes, ${MONTHLY_POOL.intermediate} intermediarios e ${MONTHLY_POOL.advanced} avancados mudam automaticamente no dia 1.`,
      },
      {
        title: "Plano define o incluido",
        description: "Cada assinatura libera uma parte dessa vitrine e deixa explicito quando um curso pede upgrade.",
      },
      {
        title: "Certificacao sem surpresa",
        description: "Gratis no curso do mes. Nos demais, o plano entra como beneficio real na emissao.",
      },
    ];
  }

  return [
    {
      title: "Free course of the month",
      description: "One full course opens to every account, with the certificate included.",
    },
    {
      title: "Monthly rotating pool",
      description: `${MONTHLY_POOL.beginner} beginner, ${MONTHLY_POOL.intermediate} intermediate, and ${MONTHLY_POOL.advanced} advanced courses rotate automatically on day 1.`,
    },
    {
      title: "Your plan defines access",
      description: "Each subscription unlocks part of that showcase and makes upgrade-only courses explicit.",
    },
    {
      title: "No-surprise certification",
      description: "Free on the course of the month. On the rest, your plan becomes a real certification benefit.",
    },
  ];
}

export function getSubscriptionMarketingPlans(locale?: string): SubscriptionMarketingPlan[] {
  return PAID_PLAN_ORDER.map((plan) => {
    const tier = TIER_CONFIGS[plan];

    return {
      slug: plan,
      displayName: tier.displayName,
      description: getPlanDescription(plan, locale),
      priceLabel: formatPriceLabel(tier.monthlyPrice, locale),
      periodLabel: isPt(locale) ? "/mes" : "/month",
      badge:
        plan === "profissional"
          ? isPt(locale)
            ? "Mais equilibrado"
            : "Best balance"
          : undefined,
      highlighted: plan === "profissional",
      href: `/checkout/${plan}`,
      featureHighlights: [
        getCourseMix(plan, locale),
        isPt(locale)
          ? `${tier.monthlyCredits} creditos por mes para IA`
          : `${tier.monthlyCredits} AI credits per month`,
        getPoolCoverage(plan, locale),
        getCertificateBenefit(plan, locale),
        getPurchaseBenefit(plan, locale),
      ],
      details: getPlanDetails(plan, locale),
    };
  });
}

export function isPaidSubscriptionPlan(plan: string): plan is Exclude<SubscriptionPlan, "free"> {
  return PAID_PLAN_ORDER.includes(plan as PaidSubscriptionPlan);
}
