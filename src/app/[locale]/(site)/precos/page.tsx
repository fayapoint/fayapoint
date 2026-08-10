"use client";
import { useT } from "@/i18n/dicionario";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/contexts/UserContext";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Star,
  Gift,
  Zap,
  Award,
  BookOpen,
  Users,
  Clock,
  ChevronDown,
  X,
  CreditCard,
  QrCode,
  FileText,
  Infinity as InfinityIcon,
} from "lucide-react";
import type { Product } from "@/lib/products";
import {
  TIER_CONFIGS,
  CREDIT_COSTS,
  CREDIT_PACKS,
  CREDITO_EM_REAIS,
  type SubscriptionPlan,
} from "@/lib/course-tiers";

type MonthlyOfferPayload = {
  monthKey: string;
  freeCourse: Product | null;
  pools: {
    beginner: Product[];
    intermediate: Product[];
    advanced: Product[];
  };
};

// ─── Plan Data ──────────────────────────────────────────────────────────────

/**
 * ⚠️ Esta tabela dizia ser "single source of truth" e **não era**.
 *
 * A fonte de verdade do que a conta recebe é `TIER_CONFIGS` em
 * `lib/course-tiers.ts` — é dela que o webhook de pagamento tira a alocação, e
 * dela que `garantirRefillMensal` tira a reposição do mês. Esta página mantinha
 * uma segunda cópia dos mesmos números, e as duas divergiram (medido em
 * 10/08/2026):
 *
 * | plano | a página prometia | o sistema entregava |
 * |---|---|---|
 * | Gratuito | 0 crédito | **50** (boas-vindas, uma vez) |
 * | Explorador | 100 | 100 ✓ |
 * | Profissional | **300** | **200** |
 * | Expert | **800** | **400** |
 *
 * Prometer 800 e creditar 400 é a pior metade dessa divergência: quem assinasse
 * o plano mais caro receberia metade do anunciado, e a reclamação chegaria
 * depois do dinheiro. Nos cursos a divergência ia para o outro lado — a página
 * vendia "7 iniciantes/mês" ao Expert quando o Expert lê o **acervo inteiro
 * sem cadeado**, jogando fora o argumento mais forte do plano mais caro.
 *
 * Agora crédito, limites e descontos são LIDOS de `TIER_CONFIGS`. O que sobra
 * aqui é o que é próprio da página: texto de venda, ordem, badge e CTA.
 */
const creditoDe = (slug: SubscriptionPlan) => String(TIER_CONFIGS[slug].monthlyCredits);
const limiteDe = (slug: SubscriptionPlan, nivel: 'beginner' | 'intermediate' | 'advanced') => {
  const n = TIER_CONFIGS[slug].limits[nivel];
  // `Infinity` é como o Expert declara "sem cadeado". Imprimir "Infinity" numa
  // tabela de preços seria vazar o tipo do código para a cara do cliente.
  return n === Infinity ? 'Tudo' : String(n);
};
const descontoDe = (slug: SubscriptionPlan, campo: 'quizDiscount' | 'purchaseDiscount') => {
  const d = TIER_CONFIGS[slug][campo];
  return d > 0 ? `${Math.round(d * 100)}%` : '—';
};

const PLANS = [
  {
    slug: "free",
    name: "Gratuito",
    nameEn: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Experimente antes de assinar. Um curso completo fica grátis todo mês.",
    descriptionEn: "Try before you subscribe. One full course is free every month.",
    cta: "Criar conta grátis",
    ctaEn: "Create free account",
    href: "/registro",
    highlighted: false,
    badge: null,
    gradient: "from-gray-500 to-slate-600",
    features: {
      "Curso grátis do mês": true,
      "Certificado na oferta do mês": true,
      "3 capítulos de prévia em outros cursos": true,
      "Cursos iniciantes/mês": limiteDe("free", "beginner"),
      "Cursos intermediários/mês": limiteDe("free", "intermediate"),
      "Cursos avançados/mês": limiteDe("free", "advanced"),
      // Boas-vindas, uma vez — não por mês. Ver `garantirBoasVindas`.
      "Créditos IA/mês": `${creditoDe("free")} (uma vez)`,
      "Desconto em certificações": descontoDe("free", "quizDiscount"),
      "Desconto em cursos avulsos": descontoDe("free", "purchaseDiscount"),
      "Suporte prioritário": false,
      "Conteúdo antecipado": false,
      "Consultoria mensal": false,
    },
  },
  {
    slug: "explorador",
    name: "Explorador",
    nameEn: "Explorer",
    monthlyPrice: 57,
    yearlyPrice: 570,
    description: "Para quem está começando na IA com foco e clareza.",
    descriptionEn: "For those starting in AI with focus and clarity.",
    cta: "Assinar Explorador",
    ctaEn: "Subscribe Explorer",
    href: "/checkout/explorador",
    highlighted: false,
    badge: null,
    gradient: "from-emerald-500 to-teal-600",
    features: {
      "Curso grátis do mês": true,
      "Certificado na oferta do mês": true,
      "3 capítulos de prévia em outros cursos": true,
      "Cursos iniciantes/mês": limiteDe("explorador", "beginner"),
      "Cursos intermediários/mês": limiteDe("explorador", "intermediate"),
      "Cursos avançados/mês": limiteDe("explorador", "advanced"),
      "Créditos IA/mês": creditoDe("explorador"),
      "Desconto em certificações": descontoDe("explorador", "quizDiscount"),
      "Desconto em cursos avulsos": descontoDe("explorador", "purchaseDiscount"),
      "Suporte prioritário": false,
      "Conteúdo antecipado": false,
      "Consultoria mensal": false,
    },
  },
  {
    slug: "profissional",
    name: "Profissional",
    nameEn: "Professional",
    monthlyPrice: 97,
    yearlyPrice: 970,
    description: "Para estudar com consistência e subir de nível a cada mês.",
    descriptionEn: "For consistent learning and monthly level-ups.",
    cta: "Assinar Profissional",
    ctaEn: "Subscribe Professional",
    href: "/checkout/profissional",
    highlighted: true,
    badge: "Mais Popular",
    badgeEn: "Most Popular",
    gradient: "from-amber-500 to-yellow-600",
    features: {
      "Curso grátis do mês": true,
      "Certificado na oferta do mês": true,
      "3 capítulos de prévia em outros cursos": true,
      "Cursos iniciantes/mês": limiteDe("profissional", "beginner"),
      "Cursos intermediários/mês": limiteDe("profissional", "intermediate"),
      "Cursos avançados/mês": limiteDe("profissional", "advanced"),
      "Créditos IA/mês": creditoDe("profissional"),
      "Desconto em certificações": descontoDe("profissional", "quizDiscount"),
      "Desconto em cursos avulsos": descontoDe("profissional", "purchaseDiscount"),
      "Suporte prioritário": true,
      "Conteúdo antecipado": true,
      "Consultoria mensal": false,
    },
  },
  {
    slug: "expert",
    name: "Expert",
    nameEn: "Expert",
    monthlyPrice: 167,
    yearlyPrice: 1670,
    description: "O catálogo mais completo, com o maior ganho por curso.",
    descriptionEn: "The fullest catalog with the strongest per-course value.",
    cta: "Assinar Expert",
    ctaEn: "Subscribe Expert",
    href: "/checkout/expert",
    highlighted: false,
    badge: null,
    gradient: "from-amber-500 to-orange-600",
    features: {
      "Curso grátis do mês": true,
      "Certificado na oferta do mês": true,
      "3 capítulos de prévia em outros cursos": true,
      "Cursos iniciantes/mês": limiteDe("expert", "beginner"),
      "Cursos intermediários/mês": limiteDe("expert", "intermediate"),
      "Cursos avançados/mês": limiteDe("expert", "advanced"),
      "Créditos IA/mês": creditoDe("expert"),
      "Desconto em certificações": descontoDe("expert", "quizDiscount"),
      "Desconto em cursos avulsos": descontoDe("expert", "purchaseDiscount"),
      "Suporte prioritário": true,
      "Conteúdo antecipado": true,
      "Consultoria mensal": true,
    },
  },
] as const;

const FEATURE_KEYS = Object.keys(PLANS[0].features) as (keyof typeof PLANS[0]["features"])[];

/**
 * O rótulo inglês de cada linha da tabela de comparação.
 *
 * As CHAVES de `features` continuam em português porque são o que amarra plano
 * e recurso — renomeá-las obrigaria a mexer nos quatro planos e em qualquer
 * lugar que leia `plan.features["..."]`. O que a pessoa lê passa por aqui.
 *
 * ⚠️ Chave nova em `features` sem entrada aqui aparece em português no site em
 * inglês. É o comportamento certo (ver `escolher` em @/lib/idioma): melhor a
 * linha aparecer na língua errada do que sumir da tabela.
 */
const FEATURE_LABELS_EN: Record<string, string> = {
  "Curso grátis do mês": "Free course of the month",
  "Certificado na oferta do mês": "Certificate on the monthly offer",
  "3 capítulos de prévia em outros cursos": "3 preview chapters in other courses",
  "Cursos iniciantes/mês": "Beginner courses/mo",
  "Cursos intermediários/mês": "Intermediate courses/mo",
  "Cursos avançados/mês": "Advanced courses/mo",
  "Créditos IA/mês": "AI credits/mo",
  "Desconto em certificações": "Discount on certifications",
  "Suporte prioritário": "Priority support",
  "Conteúdo antecipado": "Early access to content",
};

const FAQ_ITEMS_PT = [
  { q: "Posso cancelar a qualquer momento?", a: "Sim. Sem fidelidade, sem multa. Seu acesso continua até o fim do ciclo pago." },
  { q: "O que é o curso grátis do mês?", a: "Todo mês, um curso completo fica disponível sem cobrança — com acesso vitalício e certificado incluso. É a melhor forma de experimentar a plataforma." },
  { q: "O que acontece se eu não usar todas as vagas do mês?", a: "As vagas não acumulam. No dia 1 do próximo mês, o catálogo rotativo atualiza e você recebe novas vagas do seu plano." },
  { q: "Posso comprar cursos avulsos sem assinar?", a: "Sim. Qualquer curso pode ser comprado individualmente. Assinantes recebem desconto." },
  { q: "O pagamento é seguro?", a: "100%. Usamos PIX, Boleto e Cartão de Crédito via gateways certificados (Asaas e MercadoPago). Seus dados nunca ficam nos nossos servidores." },
  { q: "E se eu quiser trocar de plano?", a: "Você pode fazer upgrade a qualquer momento. O valor é ajustado proporcionalmente ao ciclo vigente." },
  { q: "O que é um crédito?", a: "1 crédito = R$1. É a moeda que paga a IA trabalhando no SEU material: reescrever um capítulo com o seu contexto, gerar uma imagem, emitir um certificado. Conversar com o assistente não custa crédito." },
  { q: "Os créditos acumulam de um mês para o outro?", a: "Os do plano, não — voltam ao teto na virada do ciclo. Os comprados em pacote, sim: valem 90 dias e não vencem junto com os do plano. Por isso o site gasta sempre o crédito do plano primeiro, para você não perder o que pagou à parte." },
  { q: "Posso comprar créditos sem assinar?", a: "Pode. Os pacotes ficam na sua conta, em Assinatura, e são pagos por PIX, boleto ou cartão como qualquer compra." },
];

const FAQ_ITEMS_EN = [
  { q: "What is a credit?", a: "1 credit = R$1. It is the currency that pays for AI working on YOUR material: rewriting a chapter in your context, generating an image, issuing a certificate. Chatting with the assistant costs no credit." },
  { q: "Do credits roll over?", a: "Plan credits do not — they reset to the cap when the cycle turns. Purchased packs do: they last 90 days and do not expire with your plan's. That is why the site always spends plan credit first, so you never lose what you paid for separately." },
  { q: "Can I cancel anytime?", a: "Yes. No contracts, no penalties. Your access continues until the end of the paid cycle." },
  { q: "What is the free course of the month?", a: "Every month, one full course opens to any account — certificate included. It's the best way to try the platform." },
  { q: "What happens if I don't use all my monthly slots?", a: "Slots don't carry over. On the 1st of each month, the rotating catalog updates and you get fresh plan slots." },
  { q: "Can I buy courses without subscribing?", a: "Yes. Any course can be purchased individually. Subscribers get a discount." },
  { q: "Is payment secure?", a: "100%. We use PIX, Boleto and Credit Card via certified gateways (Asaas and MercadoPago). Your data never touches our servers." },
  { q: "What if I want to switch plans?", a: "You can upgrade anytime. The amount is adjusted proportionally to the current cycle." },
];

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

export default function PricingPage() {
  const T = useT();
  const locale = useLocale();
  const { user } = useUser();
  const isPt = locale === "pt-BR";
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [monthlyOffers, setMonthlyOffers] = useState<MonthlyOfferPayload | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const faqItems = isPt ? FAQ_ITEMS_PT : FAQ_ITEMS_EN;

  useEffect(() => {
    fetch("/api/courses/monthly-offers", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setMonthlyOffers(d))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <main>

        {/* ━━━ Hero ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="relative pt-28 pb-16 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none" />
          <div className="container mx-auto max-w-4xl relative text-center">
            <Badge className="mb-5 px-4 py-2 bg-amber-500/10 border-amber-500/20 text-amber-300" variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              {isPt ? T("Preços transparentes") : T("Transparent pricing")}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight">
              {isPt ? (
                <>{T("Comece grátis.")}{" "}<span className="bg-gradient-to-r from-amber-400 to-violet-300 bg-clip-text text-transparent">{T("Escale quando quiser.")}</span></>
              ) : (
                <>{T("Start free.")}{" "}<span className="bg-gradient-to-r from-amber-400 to-violet-300 bg-clip-text text-transparent">{T("Scale when ready.")}</span></>
              )}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {isPt
                ? T("Todo mês um curso completo fica aberto para qualquer conta — com certificado incluso. Assine para desbloquear mais cursos, créditos de IA e descontos.")
                : T("Every month one full course opens for any account — certificate included. Subscribe to unlock more courses, AI credits and discounts.")}
            </p>

            {/* Cycle Toggle */}
            <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm">
              <button
                onClick={() => setCycle("monthly")}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  cycle === "monthly"
                    ? "bg-white text-black shadow-md"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {isPt ? T("Mensal") : T("Monthly")}
              </button>
              <button
                onClick={() => setCycle("yearly")}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  cycle === "yearly"
                    ? "bg-white text-black shadow-md"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                {isPt ? T("Anual") : T("Yearly")}
                <span className="text-xs font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  -17%
                </span>
              </button>
            </div>

            {/* Trust Bar */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isPt ? T("Garantia 7 dias") : "7-day guarantee"}
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                {isPt ? T("Acesso imediato") : T("Instant access")}
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                {isPt ? T("PIX, Cartão ou Boleto") : T("PIX, Card or Boleto")}
              </div>
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-400" />
                {isPt ? T("Cancele quando quiser") : T("Cancel anytime")}
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ Free Course of the Month Banner ━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {monthlyOffers?.freeCourse && (
          <section className="px-4 pb-6">
            <div className="container mx-auto max-w-6xl">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-gray-900/80 to-emerald-500/5 p-6 md:p-8">
                <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Gift className="h-4 w-4 text-emerald-400" />
                      </div>
                      <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                        {isPt ? T("Grátis este mês") : T("Free this month")}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{T(monthlyOffers.freeCourse.name)}</h2>
                    <p className="text-muted-foreground mb-4">
                      {isPt
                        ? T("Curso completo com certificado incluso. Sem cadastrar cartão. Sem pegadinha.")
                        : T("Full course with certificate included. No card required. No catch.")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                        <Award className="w-3 h-3 mr-1" /> {isPt ? T("Certificado grátis") : T("Free certificate")}
                      </Badge>
                      <Badge variant="secondary" className="bg-secondary text-muted-foreground border-border">
                        <BookOpen className="w-3 h-3 mr-1" /> {monthlyOffers.freeCourse.metrics.lessons} {isPt ? T("aulas") : T("lessons")}
                      </Badge>
                      <Badge variant="secondary" className="bg-secondary text-muted-foreground border-border">
                        <Clock className="w-3 h-3 mr-1" /> {T(monthlyOffers.freeCourse.metrics.duration)}
                      </Badge>
                    </div>
                  </div>
                  <Link href={`/curso/${monthlyOffers.freeCourse.slug}`}>
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 shadow-lg shadow-emerald-500/20">
                      {isPt ? T("Começar grátis") : T("Start free")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ━━━ Plan Cards ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-12 px-4" id="planos">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
              {PLANS.map((plan, i) => {
                const price = cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
                const monthlyEquivalent = cycle === "yearly" && plan.yearlyPrice > 0
                  ? Math.round(plan.yearlyPrice / 12)
                  : null;
                const savings = cycle === "yearly" && plan.monthlyPrice > 0
                  ? plan.monthlyPrice * 12 - plan.yearlyPrice
                  : 0;

                return (
                  <motion.div
                    key={plan.slug}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 22 }}
                    viewport={{ once: true }}
                    className={`relative ${plan.highlighted ? "xl:-mt-4 xl:mb-4" : ""}`}
                  >
                    <div className={`rounded-2xl border p-6 h-full flex flex-col backdrop-blur-sm transition-all ${
                      plan.highlighted
                        ? "border-amber-500/40 bg-amber-500/5 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/20"
                        : "border-border/50 bg-card/30 hover:border-border/50"
                    }`}>
                      {plan.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                            <Star className="w-3 h-3 inline mr-1" />
                            {isPt ? plan.badge : (plan as { badgeEn?: string }).badgeEn ?? plan.badge}
                          </span>
                        </div>
                      )}

                      {/* Plan Name */}
                      <h3 className="text-xl font-bold mb-1">{isPt ? plan.name : plan.nameEn}</h3>
                      <p className="text-sm text-muted-foreground mb-5 min-h-[40px]">
                        {isPt ? plan.description : plan.descriptionEn}
                      </p>

                      {/* Price */}
                      <div className="mb-6">
                        {price === 0 ? (
                          <div>
                            <span className="text-4xl font-bold">{T("R$0")}</span>
                            <span className="text-muted-foreground ml-1">{isPt ? "/sempre" : "/forever"}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-4xl font-bold">{formatBRL(price)}</span>
                            <span className="text-muted-foreground ml-1">
                              /{cycle === "yearly" ? (isPt ? T("ano") : T("year")) : (isPt ? T("mês") : T("month"))}
                            </span>
                            {monthlyEquivalent && (
                              <p className="text-sm text-emerald-400 mt-1">
                                = {formatBRL(monthlyEquivalent)}/{isPt ? T("mês") : T("mo")}
                                {savings > 0 && (
                                  <span className="ml-2 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    {isPt ? T("Economia") : T("Save")} {formatBRL(savings)}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Top Features (quick scan) */}
                      <ul className="space-y-2.5 mb-6 flex-1">
                        {plan.slug === "free" && (
                          <>
                            <Feature text={isPt ? "1 curso completo grátis/mês" : "1 full free course/month"} />
                            <Feature text={isPt ? "Certificado incluso no curso grátis" : "Certificate on free course"} />
                            <Feature text={isPt ? "Prévia de 3 capítulos em outros cursos" : "3-chapter preview on others"} />
                          </>
                        )}
                        {/* ⚠️ TERCEIRA cópia dos mesmos números — a tabela de
                            comparação tinha a segunda, e `TIER_CONFIGS` é a
                            primeira. Esta lista dizia "800 créditos" ao Expert
                            (o sistema dá 400) e "14 cursos/mês" (o Expert lê o
                            acervo inteiro). Os números agora saem do mesmo
                            lugar de onde o crédito é realmente lançado. */}
                        {plan.slug === "explorador" && (
                          <>
                            <Feature text={isPt ? `${limiteDe("explorador", "beginner")} cursos iniciantes/mês` : `${limiteDe("explorador", "beginner")} beginner courses/month`} />
                            <Feature text={isPt ? `${creditoDe("explorador")} créditos IA/mês (= R$${creditoDe("explorador")})` : `${creditoDe("explorador")} AI credits/month`} />
                            <Feature text={isPt ? `${descontoDe("explorador", "quizDiscount")} desconto em certificações` : `${descontoDe("explorador", "quizDiscount")} off certifications`} />
                            <Feature text={isPt ? `${descontoDe("explorador", "purchaseDiscount")} desconto em cursos avulsos` : `${descontoDe("explorador", "purchaseDiscount")} off individual courses`} />
                          </>
                        )}
                        {plan.slug === "profissional" && (
                          <>
                            <Feature text={isPt ? "8 cursos/mês (todos os níveis)" : "8 courses/month (all levels)"} highlight />
                            <Feature text={isPt ? `${creditoDe("profissional")} créditos IA/mês (= R$${creditoDe("profissional")})` : `${creditoDe("profissional")} AI credits/month`} />
                            <Feature text={isPt ? `${descontoDe("profissional", "purchaseDiscount")} desconto em tudo` : `${descontoDe("profissional", "purchaseDiscount")} off everything`} />
                            <Feature text={isPt ? "Suporte prioritário" : "Priority support"} />
                            <Feature text={isPt ? "Conteúdo antecipado" : "Early access content"} />
                          </>
                        )}
                        {plan.slug === "expert" && (
                          <>
                            <Feature text={isPt ? "Acervo completo — todos os cursos, sem cadeado" : "Full catalog — every course, no locks"} highlight />
                            <Feature text={isPt ? `${creditoDe("expert")} créditos IA/mês (= R$${creditoDe("expert")})` : `${creditoDe("expert")} AI credits/month`} />
                            <Feature text={isPt ? `${descontoDe("expert", "purchaseDiscount")} desconto em tudo` : `${descontoDe("expert", "purchaseDiscount")} off everything`} highlight />
                            <Feature text={isPt ? "Suporte VIP dedicado" : "Dedicated VIP support"} />
                            <Feature text={isPt ? "Consultoria mensal" : "Monthly consultation"} />
                          </>
                        )}
                      </ul>

                      {/* CTA */}
                      <Link href={plan.href} className="mt-auto">
                        <Button
                          size="lg"
                          className={`w-full text-base font-bold rounded-xl transition-all ${
                            plan.highlighted
                              ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-violet-700 text-white shadow-lg shadow-amber-500/20"
                              : plan.slug === "free"
                              ? "bg-white text-black hover:bg-gray-100"
                              : "bg-secondary text-white hover:bg-gray-700 border border-border"
                          }`}
                        >
                          {isPt ? plan.cta : plan.ctaEn}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━ Como funcionam os créditos ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            Ricardo, 10/08/2026: *"ter uma explicação clara de como podemos
            usar os créditos na página de preços"*.

            A página citava "créditos IA/mês" em quatro cartões e numa linha da
            tabela, e **em nenhum lugar dizia o que um crédito é ou compra**. Um
            número sem unidade não vende: "800 créditos" não se compara com
            "R$167/mês" a menos que a pessoa saiba a régua.

            A régua existe e é o melhor argumento que temos — **1 crédito = R$1**
            (`CREDITO_EM_REAIS`). Com ela, "200 créditos por R$97" lê-se como
            "R$200 de trabalho por R$97", e o bônus de cada plano fica visível
            sem tabela de conversão.

            ⚠️ Preço de ação e pacote saem de `CREDIT_COSTS`/`CREDIT_PACKS` — os
            MESMOS objetos que a caixa registradora usa. Foi copiar número de
            crédito para dentro desta página que produziu o 800 contra 400. */}
        <section className="py-16 px-4 border-t border-border/30" id="creditos">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3 border-amber-400/40 text-amber-300">
                {isPt ? T("Créditos") : "Credits"}
              </Badge>
              <h2 className="text-3xl font-bold mb-3">
                {isPt ? T("O que são os créditos, em uma linha") : "What credits are, in one line"}
              </h2>
              <p className="text-lg text-muted-foreground">
                {isPt
                  ? T(`1 crédito = R$${CREDITO_EM_REAIS}. Sua assinatura vira crédito com bônus, e o crédito paga a IA trabalhando no SEU material.`)
                  : `1 credit = R$${CREDITO_EM_REAIS}. Your subscription becomes credit with a bonus, and credit pays for AI working on YOUR material.`}
              </p>
            </div>

            {/* O que o crédito compra */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-secondary/20 p-6">
                <h3 className="mb-1 flex items-center gap-2 text-lg font-bold">
                  <Zap size={18} className="text-amber-400" />
                  {isPt ? T("No que você gasta") : "What you spend on"}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {isPt
                    ? T("Crédito paga ENTREGA — uma coisa nova feita para você. Conversar com o assistente é do plano e não custa crédito.")
                    : "Credit pays for DELIVERY — something new made for you. Chatting with the assistant is included and costs nothing."}
                </p>
                <ul className="space-y-2.5">
                  {[
                    { k: "custom_course_chapter", pt: "Reescrever um capítulo com a sua cara", en: "Rewrite a chapter in your context", sufixo: isPt ? "por capítulo" : "per chapter" },
                    { k: "character_sheet", pt: "Caderno de personagem (o seu rosto, vários ângulos)", en: "Character sheet (your face, many angles)", sufixo: isPt ? "uma vez" : "once" },
                    { k: "certificate_generation", pt: "Emitir um certificado verificável", en: "Issue a verifiable certificate", sufixo: "" },
                    { k: "image_generation", pt: "Gerar uma imagem no seu contexto", en: "Generate an image in your context", sufixo: isPt ? "por imagem" : "per image" },
                    { k: "quiz_attempt", pt: "Uma tentativa no quiz do certificado", en: "One certificate quiz attempt", sufixo: "" },
                    { k: "ai_chat_message", pt: "Conversar com o assistente", en: "Chat with the assistant", sufixo: "" },
                  ].map((linha) => {
                    const custo = CREDIT_COSTS[linha.k as keyof typeof CREDIT_COSTS];
                    return (
                      <li key={linha.k} className="flex items-baseline justify-between gap-4 border-b border-border/40 pb-2 text-sm last:border-0">
                        <span className="min-w-0 text-muted-foreground">
                          {isPt ? T(linha.pt) : linha.en}
                        </span>
                        <span className="shrink-0 font-bold tabular-nums text-amber-300">
                          {custo === 0
                            ? (isPt ? T("grátis") : "free")
                            : `${custo} ${linha.sufixo ? `· ${linha.sufixo}` : ""}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Quanto cada plano dá, e o multiplicador */}
              <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/[0.07] via-transparent to-transparent p-6">
                <h3 className="mb-1 flex items-center gap-2 text-lg font-bold">
                  <Gift size={18} className="text-amber-400" />
                  {isPt ? T("Quanto cada plano devolve") : "What each plan gives back"}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {isPt
                    ? T("Cada real da assinatura vira mais de um real em crédito — e quanto maior o plano, maior o bônus.")
                    : "Every real of your subscription becomes more than a real in credit — the bigger the plan, the bigger the bonus."}
                </p>
                <ul className="space-y-2.5">
                  {(["free", "explorador", "profissional", "expert"] as SubscriptionPlan[]).map((slug) => {
                    const tier = TIER_CONFIGS[slug];
                    const preco = tier.monthlyPrice;
                    // O gratuito não tem multiplicador: não há mensalidade para
                    // multiplicar. Dizer "×∞" seria bonito e falso.
                    const mult = preco > 0 ? (tier.monthlyCredits / preco).toFixed(2).replace(".", ",") : null;
                    return (
                      <li key={slug} className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-2 text-sm last:border-0">
                        <span className="text-muted-foreground">
                          {tier.displayName}
                          <span className="ml-1.5 text-xs opacity-70">
                            {preco > 0 ? `R$${preco}/${isPt ? "mês" : "mo"}` : (isPt ? T("grátis") : "free")}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="font-bold tabular-nums text-amber-300">
                            {tier.monthlyCredits}
                          </span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            {mult ? `(${mult}×)` : (isPt ? T("uma vez") : "once")}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  {isPt
                    ? T("Os créditos do plano voltam ao teto todo mês e não acumulam. O plano gratuito recebe o valor uma única vez, de boas-vindas.")
                    : "Plan credits reset to the cap every month and do not roll over. The free plan receives its amount once, as a welcome."}
                </p>
              </div>
            </div>

            {/* Pacotes avulsos */}
            <div className="mt-6 rounded-2xl border border-border bg-secondary/20 p-6">
              <h3 className="mb-1 flex items-center gap-2 text-lg font-bold">
                <CreditCard size={18} className="text-amber-400" />
                {isPt ? T("Acabou no meio do mês?") : "Ran out mid-month?"}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {isPt
                  ? T("Dá para comprar crédito avulso sem trocar de plano. O volume vira bônus, e o crédito comprado vale 90 dias — não vence junto com o do plano.")
                  : "You can buy extra credit without changing plans. Volume becomes bonus, and purchased credit lasts 90 days — it does not expire with your plan's."}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CREDIT_PACKS.map((pack) => {
                  const bonus = pack.credits - pack.priceReais;
                  return (
                    <div key={pack.id} className="relative rounded-xl border border-border bg-background/60 p-4 text-center">
                      {bonus > 0 && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-black">
                          +{bonus} {isPt ? T("de bônus") : "bonus"}
                        </span>
                      )}
                      <div className="text-2xl font-extrabold tabular-nums text-amber-300">{pack.credits}</div>
                      <div className="text-[11px] text-muted-foreground">{isPt ? T("créditos") : "credits"}</div>
                      <div className="mt-2 text-sm font-bold">R${pack.priceReais}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ Feature Comparison Table ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 px-4" id="comparar">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">
                {isPt ? T("Compare os planos em detalhe") : T("Compare plans in detail")}
              </h2>
              <p className="text-muted-foreground">
                {isPt ? T("Tudo o que cada plano inclui, sem letra miúda.") : T("Everything each plan includes, no fine print.")}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-4 text-sm text-muted-foreground font-normal border-b border-border/50 min-w-[200px]">
                      {isPt ? T("Recurso") : T("Feature")}
                    </th>
                    {PLANS.map((plan) => (
                      <th key={plan.slug} className={`p-4 text-center border-b min-w-[140px] ${
                        plan.highlighted ? "border-amber-500/30 bg-amber-500/5" : "border-border/50"
                      }`}>
                        <span className="text-sm font-bold">{isPt ? plan.name : plan.nameEn}</span>
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {plan.monthlyPrice === 0 ? T("R$0") : formatBRL(cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice)}
                          /{cycle === "yearly" ? (isPt ? T("ano") : T("yr")) : (isPt ? T("mês") : T("mo"))}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_KEYS.map((feature, idx) => (
                    <tr key={feature} className={idx % 2 === 0 ? "bg-card/20" : ""}>
                      <td className="p-4 text-sm text-muted-foreground border-b border-border/30">
                        {/* O mapa curado manda; o dicionário é a rede embaixo.
                            Sem ela, chave nova em `features` cai em português —
                            e caiu: "Desconto em cursos avulsos" e "Consultoria
                            mensal" ficaram de fora do mapa e apareceram em
                            português na tabela inglesa. */}
                        {isPt ? feature : FEATURE_LABELS_EN[feature] ?? T(feature)}
                      </td>
                      {PLANS.map((plan) => {
                        const val = plan.features[feature];
                        return (
                          <td key={plan.slug} className={`p-4 text-center border-b ${
                            plan.highlighted ? "border-amber-500/10 bg-amber-500/5" : "border-border/30"
                          }`}>
                            {val === true ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                            ) : val === false ? (
                              <span className="text-gray-600">—</span>
                            ) : (
                              <span className="text-sm font-semibold text-white">{T(val)}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ━━━ Monthly Pool Info ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 px-4 border-t border-border/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">
                {isPt ? T("Como funciona o catálogo mensal") : T("How the monthly catalog works")}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {isPt
                  ? T("Todo dia 1 o catálogo atualiza. Você escolhe quais cursos da vitrine quer ocupar nas vagas do seu plano.")
                  : T("On the 1st of every month the catalog refreshes. You pick which showcase courses fill your plan slots.")}
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-5">
              {[
                { icon: Gift, color: "emerald", title: isPt ? T("Curso grátis") : "Free course", desc: isPt ? T("1 curso completo aberto para qualquer conta, com certificado.") : "1 full course open to any account, with certificate." },
                { icon: BookOpen, color: "blue", title: isPt ? "10 iniciantes" : "10 beginner", desc: isPt ? T("Disponíveis na rotação mensal para Explorador, Profissional e Expert.") : "Available in the monthly rotation for Explorer, Professional, Expert." },
                { icon: Zap, color: "amber", title: isPt ? T("8 intermediários") : "8 intermediate", desc: isPt ? T("Acessíveis para Profissional e Expert. Explorador pode comprar avulso.") : "Accessible for Professional and Expert. Explorer can buy individually." },
                { icon: Award, color: "amber", title: isPt ? T("5 avançados") : "5 advanced", desc: isPt ? T("Reservados para Profissional (1 vaga) e Expert (3 vagas).") : "Reserved for Professional (1 slot) and Expert (3 slots)." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-border/50 bg-card/30 p-6"
                >
                  <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/10 flex items-center justify-center mb-4`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                  </div>
                  <h3 className="font-bold mb-2">{T(item.title)}</h3>
                  <p className="text-sm text-muted-foreground">{T(item.desc)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ Payment Methods & Security ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 px-4 border-t border-border/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">
                {isPt ? T("Pagamento simples e seguro") : T("Simple and secure payment")}
              </h2>
              <p className="text-muted-foreground">
                {isPt
                  ? T("Escolha como pagar. Todas as opções com proteção completa dos seus dados.")
                  : T("Choose how to pay. All options with complete data protection.")}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: QrCode, name: "PIX", desc: isPt ? T("Aprovação imediata") : "Instant approval", color: "emerald" },
                { icon: CreditCard, name: isPt ? T("Cartão de Crédito") : "Credit Card", desc: isPt ? T("Até 12x sem juros") : "Up to 12x interest-free", color: "amber" },
                { icon: FileText, name: "Boleto", desc: isPt ? "5% de desconto" : "5% discount", color: "blue" },
                { icon: ShieldCheck, name: "MercadoPago", desc: isPt ? "Checkout seguro" : "Secure checkout", color: "cyan" },
              ].map((method) => (
                <div key={method.name} className="rounded-2xl border border-border/50 bg-card/30 p-5 text-center">
                  <div className={`w-12 h-12 rounded-xl bg-${method.color}-500/10 flex items-center justify-center mx-auto mb-3`}>
                    <method.icon className={`w-6 h-6 text-${method.color}-400`} />
                  </div>
                  <h4 className="font-semibold mb-1">{T(method.name)}</h4>
                  <p className="text-xs text-muted-foreground">{T(method.desc)}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {isPt ? T("Dados criptografados") : T("Encrypted data")}
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {isPt ? T("Gateways certificados") : T("Certified gateways")}
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {isPt ? T("Sem armazenamento de cartão") : T("No card storage")}
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ Social Proof ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 px-4 border-t border-border/30">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex -space-x-2">
                {["bg-amber-500", "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-yellow-500"].map((bg, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full ${bg} border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-white`}>
                    {T(["RF", "AS", "MK", "JL", "PT"][i])}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  <span className="text-sm text-muted-foreground ml-1">4.9/5</span>
                </div>
                <p className="text-sm text-muted-foreground">+230 {isPt ? T("alunos ativos") : T("active students")}</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground italic max-w-xl mx-auto">
              {isPt
                ? T("&ldquo;Comecei pelo curso grátis do mês e em uma semana já tinha assinado o Profissional. O conteúdo é prático e atualizado.&rdquo;")
                : T("&ldquo;I started with the free monthly course and within a week I subscribed to Professional. The content is practical and up-to-date.&rdquo;")}
            </p>
          </div>
        </section>

        {/* ━━━ FAQ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 px-4 border-t border-border/30" id="faq">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-10">
              {isPt ? T("Perguntas frequentes") : T("Frequently asked questions")}
            </h2>
            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full text-left rounded-2xl border border-border/50 bg-card/30 p-5 transition-all hover:border-border/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold">{T(item.q)}</h3>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`} />
                  </div>
                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-sm text-muted-foreground mt-3 overflow-hidden"
                      >
                        {T(item.a)}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ Final CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-20 px-4 border-t border-border/30">
          <div className="container mx-auto max-w-3xl text-center">
            <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-gray-900/80 to-violet-500/5 p-10 md:p-14 backdrop-blur-sm">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {isPt ? T("Pronto para dominar IA?") : T("Ready to master AI?")}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                {isPt
                  ? T("Comece pelo curso grátis do mês. Se gostar, assine. Se não gostar, não pague nada.")
                  : T("Start with the free course of the month. If you like it, subscribe. If not, pay nothing.")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={monthlyOffers?.freeCourse ? `/curso/${monthlyOffers.freeCourse.slug}` : "/registro"}>
                  <Button size="lg" className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-violet-700 text-white font-bold px-8 shadow-lg shadow-amber-500/20">
                    {isPt ? T("Começar grátis") : T("Start free")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#planos">
                  <Button size="lg" variant="outline" className="border-border text-muted-foreground hover:bg-secondary px-8">
                    {isPt ? T("Ver planos") : T("See plans")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

// ─── Feature Row Component ────────────────────────────────────────────────────

function Feature({ text, highlight }: { text: string; highlight?: boolean }) {
  const T = useT();
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? "text-emerald-400" : "text-muted-foreground"}`} />
      <span className={highlight ? "text-white font-medium" : "text-muted-foreground"}>{T(text)}</span>
    </li>
  );
}
