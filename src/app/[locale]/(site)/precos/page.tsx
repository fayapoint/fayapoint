"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/contexts/UserContext";
import { useLocale } from "next-intl";
import Link from "next/link";
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

type MonthlyOfferPayload = {
  monthKey: string;
  freeCourse: Product | null;
  pools: {
    beginner: Product[];
    intermediate: Product[];
    advanced: Product[];
  };
};

// ─── Plan Data (single source of truth) ─────────────────────────────────────

const PLANS = [
  {
    slug: "free",
    name: "Gratuito",
    nameEn: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Experimente antes de assinar. Um curso completo por mês, grátis.",
    descriptionEn: "Try before you subscribe. One full course per month, free.",
    cta: "Criar conta grátis",
    ctaEn: "Create free account",
    href: "/registro",
    highlighted: false,
    badge: null,
    gradient: "from-gray-500 to-slate-600",
    features: {
      "Curso grátis do mês": true,
      "Certificado no curso grátis": true,
      "3 capítulos de prévia em outros cursos": true,
      "Cursos iniciantes/mês": "0",
      "Cursos intermediários/mês": "0",
      "Cursos avançados/mês": "0",
      "Créditos IA/mês": "0",
      "Desconto em certificações": "—",
      "Desconto em cursos avulsos": "—",
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
      "Certificado no curso grátis": true,
      "3 capítulos de prévia em outros cursos": true,
      "Cursos iniciantes/mês": "3",
      "Cursos intermediários/mês": "0",
      "Cursos avançados/mês": "0",
      "Créditos IA/mês": "100",
      "Desconto em certificações": "10%",
      "Desconto em cursos avulsos": "10%",
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
    gradient: "from-purple-500 to-violet-600",
    features: {
      "Curso grátis do mês": true,
      "Certificado no curso grátis": true,
      "3 capítulos de prévia em outros cursos": true,
      "Cursos iniciantes/mês": "5",
      "Cursos intermediários/mês": "2",
      "Cursos avançados/mês": "1",
      "Créditos IA/mês": "300",
      "Desconto em certificações": "20%",
      "Desconto em cursos avulsos": "20%",
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
      "Certificado no curso grátis": true,
      "3 capítulos de prévia em outros cursos": true,
      "Cursos iniciantes/mês": "7",
      "Cursos intermediários/mês": "4",
      "Cursos avançados/mês": "3",
      "Créditos IA/mês": "800",
      "Desconto em certificações": "50%",
      "Desconto em cursos avulsos": "50%",
      "Suporte prioritário": true,
      "Conteúdo antecipado": true,
      "Consultoria mensal": true,
    },
  },
] as const;

const FEATURE_KEYS = Object.keys(PLANS[0].features) as (keyof typeof PLANS[0]["features"])[];

const FAQ_ITEMS_PT = [
  { q: "Posso cancelar a qualquer momento?", a: "Sim. Sem fidelidade, sem multa. Seu acesso continua até o fim do ciclo pago." },
  { q: "O que é o curso grátis do mês?", a: "Todo mês, um curso completo fica aberto para qualquer conta — incluindo certificado. É a melhor forma de experimentar a plataforma." },
  { q: "O que acontece se eu não usar todas as vagas do mês?", a: "As vagas não acumulam. No dia 1 do próximo mês, o catálogo rotativo atualiza e você recebe novas vagas do seu plano." },
  { q: "Posso comprar cursos avulsos sem assinar?", a: "Sim. Qualquer curso pode ser comprado individualmente. Assinantes recebem desconto." },
  { q: "O pagamento é seguro?", a: "100%. Usamos PIX, Boleto e Cartão de Crédito via gateways certificados (Asaas e MercadoPago). Seus dados nunca ficam nos nossos servidores." },
  { q: "E se eu quiser trocar de plano?", a: "Você pode fazer upgrade a qualquer momento. O valor é ajustado proporcionalmente ao ciclo vigente." },
];

const FAQ_ITEMS_EN = [
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
      <Header />
      <main>

        {/* ━━━ Hero ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="relative pt-28 pb-16 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none" />
          <div className="container mx-auto max-w-4xl relative text-center">
            <Badge className="mb-5 px-4 py-2 bg-purple-500/10 border-purple-500/20 text-purple-300" variant="outline">
              <Sparkles className="w-4 h-4 mr-2" />
              {isPt ? "Preços transparentes" : "Transparent pricing"}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight">
              {isPt ? (
                <>Comece grátis.{" "}<span className="bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">Escale quando quiser.</span></>
              ) : (
                <>Start free.{" "}<span className="bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">Scale when ready.</span></>
              )}
            </h1>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              {isPt
                ? "Todo mês um curso completo fica aberto para qualquer conta — com certificado incluso. Assine para desbloquear mais cursos, créditos de IA e descontos."
                : "Every month one full course opens for any account — certificate included. Subscribe to unlock more courses, AI credits and discounts."}
            </p>

            {/* Cycle Toggle */}
            <div className="inline-flex items-center gap-1 p-1 rounded-full border border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
              <button
                onClick={() => setCycle("monthly")}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  cycle === "monthly"
                    ? "bg-white text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {isPt ? "Mensal" : "Monthly"}
              </button>
              <button
                onClick={() => setCycle("yearly")}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  cycle === "yearly"
                    ? "bg-white text-black shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {isPt ? "Anual" : "Yearly"}
                <span className="text-xs font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  -17%
                </span>
              </button>
            </div>

            {/* Trust Bar */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {isPt ? "Garantia 7 dias" : "7-day guarantee"}
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                {isPt ? "Acesso imediato" : "Instant access"}
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" />
                {isPt ? "PIX, Cartão ou Boleto" : "PIX, Card or Boleto"}
              </div>
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-400" />
                {isPt ? "Cancele quando quiser" : "Cancel anytime"}
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
                        {isPt ? "Grátis este mês" : "Free this month"}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{monthlyOffers.freeCourse.name}</h2>
                    <p className="text-gray-400 mb-4">
                      {isPt
                        ? "Curso completo com certificado incluso. Sem cadastrar cartão. Sem pegadinha."
                        : "Full course with certificate included. No card required. No catch."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                        <Award className="w-3 h-3 mr-1" /> {isPt ? "Certificado grátis" : "Free certificate"}
                      </Badge>
                      <Badge variant="secondary" className="bg-gray-800 text-gray-300 border-gray-700">
                        <BookOpen className="w-3 h-3 mr-1" /> {monthlyOffers.freeCourse.metrics.lessons} {isPt ? "aulas" : "lessons"}
                      </Badge>
                      <Badge variant="secondary" className="bg-gray-800 text-gray-300 border-gray-700">
                        <Clock className="w-3 h-3 mr-1" /> {monthlyOffers.freeCourse.metrics.duration}
                      </Badge>
                    </div>
                  </div>
                  <Link href={`/curso/${monthlyOffers.freeCourse.slug}`}>
                    <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 shadow-lg shadow-emerald-500/20">
                      {isPt ? "Começar grátis" : "Start free"}
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
                        ? "border-purple-500/40 bg-purple-500/5 shadow-2xl shadow-purple-500/10 ring-1 ring-purple-500/20"
                        : "border-gray-800/50 bg-gray-900/30 hover:border-gray-700/50"
                    }`}>
                      {plan.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-purple-500 to-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                            <Star className="w-3 h-3 inline mr-1" />
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      {/* Plan Name */}
                      <h3 className="text-xl font-bold mb-1">{isPt ? plan.name : plan.nameEn}</h3>
                      <p className="text-sm text-gray-400 mb-5 min-h-[40px]">
                        {isPt ? plan.description : plan.descriptionEn}
                      </p>

                      {/* Price */}
                      <div className="mb-6">
                        {price === 0 ? (
                          <div>
                            <span className="text-4xl font-bold">R$0</span>
                            <span className="text-gray-400 ml-1">{isPt ? "/sempre" : "/forever"}</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-4xl font-bold">{formatBRL(price)}</span>
                            <span className="text-gray-400 ml-1">
                              /{cycle === "yearly" ? (isPt ? "ano" : "year") : (isPt ? "mês" : "month")}
                            </span>
                            {monthlyEquivalent && (
                              <p className="text-sm text-emerald-400 mt-1">
                                = {formatBRL(monthlyEquivalent)}/{isPt ? "mês" : "mo"}
                                {savings > 0 && (
                                  <span className="ml-2 text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    {isPt ? "Economia" : "Save"} {formatBRL(savings)}
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
                        {plan.slug === "explorador" && (
                          <>
                            <Feature text={isPt ? "3 cursos iniciantes/mês" : "3 beginner courses/month"} />
                            <Feature text={isPt ? "100 créditos IA/mês" : "100 AI credits/month"} />
                            <Feature text={isPt ? "10% desconto em certificações" : "10% off certifications"} />
                            <Feature text={isPt ? "10% desconto em cursos avulsos" : "10% off individual courses"} />
                          </>
                        )}
                        {plan.slug === "profissional" && (
                          <>
                            <Feature text={isPt ? "8 cursos/mês (todos os níveis)" : "8 courses/month (all levels)"} highlight />
                            <Feature text={isPt ? "300 créditos IA/mês" : "300 AI credits/month"} />
                            <Feature text={isPt ? "20% desconto em tudo" : "20% off everything"} />
                            <Feature text={isPt ? "Suporte prioritário" : "Priority support"} />
                            <Feature text={isPt ? "Conteúdo antecipado" : "Early access content"} />
                          </>
                        )}
                        {plan.slug === "expert" && (
                          <>
                            <Feature text={isPt ? "14 cursos/mês (todos os níveis)" : "14 courses/month (all levels)"} highlight />
                            <Feature text={isPt ? "800 créditos IA/mês" : "800 AI credits/month"} />
                            <Feature text={isPt ? "50% desconto em tudo" : "50% off everything"} highlight />
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
                              ? "bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg shadow-purple-500/20"
                              : plan.slug === "free"
                              ? "bg-white text-black hover:bg-gray-100"
                              : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
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

        {/* ━━━ Feature Comparison Table ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 px-4" id="comparar">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">
                {isPt ? "Compare os planos em detalhe" : "Compare plans in detail"}
              </h2>
              <p className="text-gray-400">
                {isPt ? "Tudo o que cada plano inclui, sem letra miúda." : "Everything each plan includes, no fine print."}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-4 text-sm text-gray-400 font-normal border-b border-gray-800/50 min-w-[200px]">
                      {isPt ? "Recurso" : "Feature"}
                    </th>
                    {PLANS.map((plan) => (
                      <th key={plan.slug} className={`p-4 text-center border-b min-w-[140px] ${
                        plan.highlighted ? "border-purple-500/30 bg-purple-500/5" : "border-gray-800/50"
                      }`}>
                        <span className="text-sm font-bold">{isPt ? plan.name : plan.nameEn}</span>
                        <br />
                        <span className="text-xs text-gray-400">
                          {plan.monthlyPrice === 0 ? "R$0" : formatBRL(cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice)}
                          /{cycle === "yearly" ? (isPt ? "ano" : "yr") : (isPt ? "mês" : "mo")}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_KEYS.map((feature, idx) => (
                    <tr key={feature} className={idx % 2 === 0 ? "bg-gray-900/20" : ""}>
                      <td className="p-4 text-sm text-gray-300 border-b border-gray-800/30">{feature}</td>
                      {PLANS.map((plan) => {
                        const val = plan.features[feature];
                        return (
                          <td key={plan.slug} className={`p-4 text-center border-b ${
                            plan.highlighted ? "border-purple-500/10 bg-purple-500/5" : "border-gray-800/30"
                          }`}>
                            {val === true ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                            ) : val === false ? (
                              <span className="text-gray-600">—</span>
                            ) : (
                              <span className="text-sm font-semibold text-white">{val}</span>
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
        <section className="py-16 px-4 border-t border-gray-800/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">
                {isPt ? "Como funciona o catálogo mensal" : "How the monthly catalog works"}
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                {isPt
                  ? "Todo dia 1 o catálogo atualiza. Você escolhe quais cursos da vitrine quer ocupar nas vagas do seu plano."
                  : "On the 1st of every month the catalog refreshes. You pick which showcase courses fill your plan slots."}
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-5">
              {[
                { icon: Gift, color: "emerald", title: isPt ? "Curso grátis" : "Free course", desc: isPt ? "1 curso completo aberto para qualquer conta, com certificado." : "1 full course open to any account, with certificate." },
                { icon: BookOpen, color: "blue", title: isPt ? "10 iniciantes" : "10 beginner", desc: isPt ? "Disponíveis na rotação mensal para Explorador, Profissional e Expert." : "Available in the monthly rotation for Explorer, Professional, Expert." },
                { icon: Zap, color: "purple", title: isPt ? "8 intermediários" : "8 intermediate", desc: isPt ? "Acessíveis para Profissional e Expert. Explorador pode comprar avulso." : "Accessible for Professional and Expert. Explorer can buy individually." },
                { icon: Award, color: "amber", title: isPt ? "5 avançados" : "5 advanced", desc: isPt ? "Reservados para Profissional (1 vaga) e Expert (3 vagas)." : "Reserved for Professional (1 slot) and Expert (3 slots)." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-gray-800/50 bg-gray-900/30 p-6"
                >
                  <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/10 flex items-center justify-center mb-4`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ Payment Methods & Security ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 px-4 border-t border-gray-800/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">
                {isPt ? "Pagamento simples e seguro" : "Simple and secure payment"}
              </h2>
              <p className="text-gray-400">
                {isPt
                  ? "Escolha como pagar. Todas as opções com proteção completa dos seus dados."
                  : "Choose how to pay. All options with complete data protection."}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: QrCode, name: "PIX", desc: isPt ? "Aprovação imediata" : "Instant approval", color: "emerald" },
                { icon: CreditCard, name: isPt ? "Cartão de Crédito" : "Credit Card", desc: isPt ? "Até 12x sem juros" : "Up to 12x interest-free", color: "purple" },
                { icon: FileText, name: "Boleto", desc: isPt ? "5% de desconto" : "5% discount", color: "blue" },
                { icon: ShieldCheck, name: "MercadoPago", desc: isPt ? "Checkout seguro" : "Secure checkout", color: "cyan" },
              ].map((method) => (
                <div key={method.name} className="rounded-2xl border border-gray-800/50 bg-gray-900/30 p-5 text-center">
                  <div className={`w-12 h-12 rounded-xl bg-${method.color}-500/10 flex items-center justify-center mx-auto mb-3`}>
                    <method.icon className={`w-6 h-6 text-${method.color}-400`} />
                  </div>
                  <h4 className="font-semibold mb-1">{method.name}</h4>
                  <p className="text-xs text-gray-400">{method.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {isPt ? "Dados criptografados" : "Encrypted data"}
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {isPt ? "Gateways certificados" : "Certified gateways"}
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {isPt ? "Sem armazenamento de cartão" : "No card storage"}
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ Social Proof ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 px-4 border-t border-gray-800/30">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex -space-x-2">
                {["bg-purple-500", "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-pink-500"].map((bg, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full ${bg} border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-white`}>
                    {["RF", "AS", "MK", "JL", "PT"][i]}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  <span className="text-sm text-gray-400 ml-1">4.9/5</span>
                </div>
                <p className="text-sm text-gray-400">+230 {isPt ? "alunos ativos" : "active students"}</p>
              </div>
            </div>
            <p className="text-lg text-gray-300 italic max-w-xl mx-auto">
              {isPt
                ? "&ldquo;Comecei pelo curso grátis do mês e em uma semana já tinha assinado o Profissional. O conteúdo é prático e atualizado.&rdquo;"
                : "&ldquo;I started with the free monthly course and within a week I subscribed to Professional. The content is practical and up-to-date.&rdquo;"}
            </p>
          </div>
        </section>

        {/* ━━━ FAQ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 px-4 border-t border-gray-800/30" id="faq">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-10">
              {isPt ? "Perguntas frequentes" : "Frequently asked questions"}
            </h2>
            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full text-left rounded-2xl border border-gray-800/50 bg-gray-900/30 p-5 transition-all hover:border-gray-700/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold">{item.q}</h3>
                    <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`} />
                  </div>
                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="text-sm text-gray-400 mt-3 overflow-hidden"
                      >
                        {item.a}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━ Final CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-20 px-4 border-t border-gray-800/30">
          <div className="container mx-auto max-w-3xl text-center">
            <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-gray-900/80 to-violet-500/5 p-10 md:p-14 backdrop-blur-sm">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {isPt ? "Pronto para dominar IA?" : "Ready to master AI?"}
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                {isPt
                  ? "Comece pelo curso grátis do mês. Se gostar, assine. Se não gostar, não pague nada."
                  : "Start with the free course of the month. If you like it, subscribe. If not, pay nothing."}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={monthlyOffers?.freeCourse ? `/curso/${monthlyOffers.freeCourse.slug}` : "/registro"}>
                  <Button size="lg" className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white font-bold px-8 shadow-lg shadow-purple-500/20">
                    {isPt ? "Começar grátis" : "Start free"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#planos">
                  <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 px-8">
                    {isPt ? "Ver planos" : "See plans"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}

// ─── Feature Row Component ────────────────────────────────────────────────────

function Feature({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? "text-emerald-400" : "text-gray-500"}`} />
      <span className={highlight ? "text-white font-medium" : "text-gray-300"}>{text}</span>
    </li>
  );
}
