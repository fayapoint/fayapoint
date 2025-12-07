"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useServicePrices } from "@/hooks/useServicePrices";
import { useTranslations, useLocale } from "next-intl";
import { getPricingTranslation } from "@/data/pricing-translations";
import { ScheduleConsultationButton } from "@/components/consultation/ScheduleConsultationButton";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";
import {
  Globe,
  Video,
  Bot,
  Zap,
  MapPin,
  Share2,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Sparkles,
  Users,
  Clock,
  ShieldCheck,
  Star,
  Package,
  Lock,
  LogIn,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
} from "lucide-react";

// Service configurations with emojis and colors
const serviceConfig: Record<
  string,
  {
    icon: React.ElementType;
    emoji: string;
    gradient: string;
    tileBg: string;
    tileBorder: string;
    accentColor: string;
    href: string;
  }
> = {
  "website-full": {
    icon: Globe,
    emoji: "🌐",
    gradient: "from-blue-500 to-cyan-400",
    tileBg: "bg-blue-500/10",
    tileBorder: "border-blue-500/20",
    accentColor: "text-blue-500",
    href: "/servicos/construcao-de-sites",
  },
  "social-management": {
    icon: Share2,
    emoji: "📱",
    gradient: "from-pink-500 to-rose-400",
    tileBg: "bg-pink-500/10",
    tileBorder: "border-pink-500/20",
    accentColor: "text-pink-500",
    href: "/servicos/social-media",
  },
  "local-seo": {
    icon: MapPin,
    emoji: "📍",
    gradient: "from-emerald-500 to-green-400",
    tileBg: "bg-emerald-500/10",
    tileBorder: "border-emerald-500/20",
    accentColor: "text-emerald-500",
    href: "/servicos/seo-local",
  },
  "video-production": {
    icon: Video,
    emoji: "🎬",
    gradient: "from-purple-500 to-violet-400",
    tileBg: "bg-purple-500/10",
    tileBorder: "border-purple-500/20",
    accentColor: "text-purple-500",
    href: "/servicos/edicao-de-video",
  },
  "automation-ai": {
    icon: Zap,
    emoji: "⚡",
    gradient: "from-amber-500 to-orange-400",
    tileBg: "bg-amber-500/10",
    tileBorder: "border-amber-500/20",
    accentColor: "text-amber-500",
    href: "/servicos/automacao-e-integracao",
  },
  consulting: {
    icon: Bot,
    emoji: "🤖",
    gradient: "from-indigo-500 to-blue-400",
    tileBg: "bg-indigo-500/10",
    tileBorder: "border-indigo-500/20",
    accentColor: "text-indigo-500",
    href: "/servicos/consultoria-ai",
  },
};

const bundles = [
  {
    id: "local-authority",
    name: "Local Authority Launch",
    emoji: "📍",
    price: 2450,
    includes: ["GMB Optimization", "Review Management", "Local Citations"],
    gradient: "from-emerald-500 to-green-400",
  },
  {
    id: "content-engine",
    name: "Content Engine Pro",
    emoji: "📱",
    price: 4250,
    includes: ["12 Posts", "4 Reels", "Community Mgmt"],
    gradient: "from-pink-500 to-rose-400",
  },
  {
    id: "conversion-sprint",
    name: "Conversion Website",
    emoji: "🌐",
    price: 11800,
    includes: ["8 UX/UI Screens", "Frontend Dev", "CMS + SEO"],
    gradient: "from-blue-500 to-cyan-400",
    popular: true,
  },
  {
    id: "video-growth",
    name: "Video Growth Kit",
    emoji: "🎬",
    price: 14600,
    includes: ["Script + Storyboard", "2 Production Days", "Full Post"],
    gradient: "from-purple-500 to-violet-400",
  },
  {
    id: "ai-jumpstart",
    name: "AI Jumpstart",
    emoji: "⚡",
    price: 9800,
    includes: ["3 Workflows", "CRM Integration", "2mo Support"],
    gradient: "from-amber-500 to-orange-400",
  },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Subscription plans data
const planKeys = ["starter", "pro", "business"] as const;

// Plan details for expanded view
const planDetails: Record<string, string[]> = {
  starter: [
    "Acesso a 5 cursos básicos por mês para construir sua base de conhecimento",
    "Comunidade exclusiva para networking e tirar dúvidas com outros alunos",
    "Certificados digitais verificáveis para cada curso concluído",
    "Suporte por email com resposta em até 48h úteis",
    "Material complementar em PDF para download"
  ],
  pro: [
    "Acesso ILIMITADO a todos os 50+ cursos da plataforma, incluindo lançamentos",
    "2 sessões de mentoria em grupo por mês com especialistas da área",
    "Projetos práticos exclusivos com feedback personalizado",
    "Suporte prioritário via chat com resposta em até 4h",
    "Biblioteca completa de templates, prompts e automações prontas",
    "Acesso antecipado de 30 dias a novos cursos e ferramentas",
    "Descontos especiais em ferramentas parceiras (n8n, Make, OpenAI)"
  ],
  business: [
    "TUDO do plano Pro, mais benefícios exclusivos para empresas",
    "1 sessão mensal de consultoria individual (1h) para seu negócio",
    "Treinamento personalizado para até 5 membros da sua equipe",
    "Implementação assistida de automações e integrações",
    "Dashboard executivo com métricas de progresso e ROI",
    "Acesso à API para integrações customizadas",
    "Opção white-label para conteúdo interno",
    "Suporte 24/7 via WhatsApp direto com nosso time"
  ]
};

export default function PricingPage() {
  const t = useTranslations("Pricing");
  const tHome = useTranslations("Home.Pricing");
  const locale = useLocale();
  const { user } = useUser();
  const { loading, groupedByService } = useServicePrices();
  const [activeServiceSlug, setActiveServiceSlug] = useState<string>("website-full");
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const isLoggedIn = !!user;

  // Get subscription plans from translations
  const plans = planKeys.map((key) => {
    const plan = tHome.raw(`plans.${key}`) as {
      name: string;
      price: string;
      period: string;
      description: string;
      features: string[];
      highlighted?: boolean;
      badge?: string;
      cta: string;
      href: string;
    };
    return { key, highlighted: key === 'pro', ...plan };
  });

  const services = useMemo(() => {
    return Object.entries(groupedByService)
      .filter(([slug]) => slug !== "bundles" && serviceConfig[slug])
      .map(([slug, items]) => {
        const config = serviceConfig[slug];
        const tracks = items.reduce<Record<string, typeof items>>((acc, item) => {
          acc[item.track] = acc[item.track] || [];
          acc[item.track].push(item);
          return acc;
        }, {});

        const minPrice = Math.min(...items.map((i) => i.priceRange.min));
        const maxPrice = Math.max(...items.map((i) => i.priceRange.max));

        return { slug, items, tracks, minPrice, maxPrice, ...config };
      });
  }, [groupedByService]);

  const activeService = services.find((s) => s.slug === activeServiceSlug) || services[0];

  // Login prompt component
  const LoginPrompt = () => (
    <Link href="/login" className="block">
      <div className="flex items-center justify-center gap-2 py-3 px-4 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg transition-all group">
        <Lock className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary group-hover:underline">
          {locale === 'pt-BR' ? 'Faça login para ver preços' : 'Login to see prices'}
        </span>
        <LogIn className="w-4 h-4 text-primary" />
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        {/* Hero Section - Compact */}
        <section className="relative pt-28 pb-12 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="container mx-auto max-w-5xl relative text-center">
            <Badge className="mb-4 px-4 py-2" variant="secondary">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              {t("badge")}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{t("hero.title")}</h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                {t("hero.guarantee1")}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                {t("hero.guarantee2")}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                {t("hero.guarantee3")}
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Plans Section */}
        <section className="py-16 px-4" id="subscription">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="outline">
                <DollarSign className="w-4 h-4 mr-1" />
                {locale === 'pt-BR' ? 'Planos de Assinatura' : 'Subscription Plans'}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">{tHome("title")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">{tHome("description")}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -8 }}
                  transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  viewport={{ once: true }}
                  className={`relative ${plan.highlighted ? "md:-mt-4 md:mb-4" : ""}`}
                >
                  <Card className={`${plan.highlighted ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/20' : 'border-border bg-card/50'} backdrop-blur p-6 h-full flex flex-col`}>
                    {plan.badge && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-primary-foreground px-4">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        {plan.badge}
                      </Badge>
                    )}

                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>

                    {/* Price - Login Gated */}
                    <div className="mb-6">
                      {isLoggedIn ? (
                        <div>
                          <span className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            R${plan.price}
                          </span>
                          <span className="text-muted-foreground">{plan.period}</span>
                        </div>
                      ) : (
                        <LoginPrompt />
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6 flex-1">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="text-primary mt-0.5 flex-shrink-0" size={16} />
                          <span className="text-foreground/90">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Expand Details */}
                    <button
                      onClick={() => setExpandedPlan(expandedPlan === plan.key ? null : plan.key)}
                      className="flex items-center justify-center gap-2 text-sm text-primary hover:underline mb-4"
                    >
                      <Info size={14} />
                      {locale === 'pt-BR' ? 'Ver detalhes completos' : 'See full details'}
                      {expandedPlan === plan.key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedPlan === plan.key && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mb-4"
                        >
                          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              {locale === 'pt-BR' ? 'O que está incluído:' : 'What\'s included:'}
                            </p>
                            {planDetails[plan.key]?.map((detail, idx) => (
                              <p key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {detail}
                              </p>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* CTA */}
                    <Link href={isLoggedIn ? plan.href : '/login'} className="mt-auto">
                      <Button
                        className={`w-full ${plan.highlighted ? 'bg-primary hover:bg-primary/90' : ''}`}
                        variant={plan.highlighted ? 'default' : 'outline'}
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span>{tHome("guarantee")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span>{tHome("rating")}</span>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground/70 mt-4">
              {tHome("footnote")}
            </p>
          </div>
        </section>

        {/* Quick Bundles - Horizontal Cards */}
        <section className="py-12 px-4 bg-muted/30" id="bundles">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">{t("bundles.title")}</h2>
              </div>
              <Link href="#services" className="text-primary hover:underline text-sm flex items-center gap-1">
                {t("services.learnMore")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {bundles.map((bundle) => (
                <motion.div
                  key={bundle.id}
                  whileHover={{ y: -4 }}
                  className="relative"
                >
                  <Card className={`p-4 h-full ${bundle.popular ? "ring-2 ring-primary" : ""}`}>
                    {bundle.popular && (
                      <Badge className="absolute -top-2 right-2 text-xs bg-primary">⭐</Badge>
                    )}
                    <div className="text-3xl mb-2">{bundle.emoji}</div>
                    <h3 className="font-semibold text-sm mb-1">{getPricingTranslation(bundle.name, locale)}</h3>
                    {isLoggedIn ? (
                      <p className="text-2xl font-bold mb-3 text-primary">{currencyFormatter.format(bundle.price)}</p>
                    ) : (
                      <Link href="/login" className="flex items-center gap-1 text-xs text-primary hover:underline mb-3">
                        <Lock className="w-3 h-3" />
                        {locale === 'pt-BR' ? 'Login para ver' : 'Login to see'}
                      </Link>
                    )}
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {bundle.includes.map((item, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Service Selector - Like Main Page */}
        <section className="py-16 px-4" id="services">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">{t("services.title")}</h2>
              <p className="text-muted-foreground">{t("services.subtitle")}</p>
            </div>

            {/* Service Tiles - Main Page Style */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10">
              {services.map((service) => {
                const isActive = service.slug === activeServiceSlug;
                return (
                  <motion.button
                    key={service.slug}
                    onClick={() => setActiveServiceSlug(service.slug)}
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl ${service.tileBg} flex flex-col items-center justify-center border ${service.tileBorder} transition-all duration-300 ${
                      isActive ? "ring-2 ring-offset-2 ring-offset-background ring-primary shadow-lg scale-105" : "shadow-sm hover:scale-105"
                    }`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    <span className="text-2xl md:text-3xl mb-1">{service.emoji}</span>
                    <span className={`text-xs font-medium ${isActive ? service.accentColor : "text-muted-foreground"}`}>
                      {t(`services.categories.${service.slug.replace(/-/g, "_")}`).split(" ")[0]}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Active Service Detail Card */}
            {!loading && activeService && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeServiceSlug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className="grid gap-6 lg:grid-cols-[2fr_1fr]"
                >
                  {/* Left: Service Details */}
                  <Card className={`p-6 relative overflow-hidden`}>
                    <div className={`absolute inset-0 pointer-events-none bg-gradient-to-br ${activeService.gradient} opacity-5`} />
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeService.gradient} flex items-center justify-center shadow-lg`}>
                          <span className="text-3xl">{activeService.emoji}</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">
                            {t(`services.categories.${activeService.slug.replace(/-/g, "_")}`)}
                          </h3>
                          <p className="text-muted-foreground">
                            {activeService.items.length} {t("services.itemsAvailable")}
                          </p>
                        </div>
                      </div>

                      {/* Tracks Grid */}
                      <div className="space-y-4">
                        {Object.entries(activeService.tracks).map(([track, items]) => (
                          <div key={track} className="border rounded-xl p-4 bg-card/50">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${activeService.gradient}`} />
                              {getPricingTranslation(track, locale)}
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {items.length}
                              </Badge>
                            </h4>
                            <div className="grid gap-2">
                              {items.slice(0, 4).map((item) => (
                                <div key={item.unitLabel} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                                  <span className="text-muted-foreground">
                                    {getPricingTranslation(item.unitLabel, locale)}
                                  </span>
                                  {isLoggedIn ? (
                                    <span className={`font-semibold ${activeService.accentColor}`}>
                                      {currencyFormatter.format(item.priceRange.recommended)}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Lock className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                              ))}
                              {items.length > 4 && (
                                <p className="text-xs text-muted-foreground text-center pt-1">
                                  +{items.length - 4} {t("services.items")}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Right: Summary & CTA */}
                  <Card className="p-6 flex flex-col">
                    <div className="mb-6">
                      <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                        {t("services.priceRange")}
                      </p>
                      {isLoggedIn ? (
                        <p className="text-3xl font-bold">
                          {currencyFormatter.format(activeService.minPrice)}
                          <span className="text-muted-foreground text-lg font-normal"> - </span>
                          {currencyFormatter.format(activeService.maxPrice)}
                        </p>
                      ) : (
                        <LoginPrompt />
                      )}
                    </div>

                    <div className="flex-1 space-y-3 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{t("stats.rating")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>{t("hero.guarantee2")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span>{t("hero.guarantee1")}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button className="w-full" asChild>
                        <Link href={activeService.href}>
                          {t("services.learnMore")}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </Button>
                      <ScheduleConsultationButton
                        variant="outline"
                        className="w-full"
                        source={`pricing-${activeService.slug}`}
                      >
                        {t("services.getQuote")}
                      </ScheduleConsultationButton>
                    </div>
                  </Card>
                </motion.div>
              </AnimatePresence>
            )}

            {loading && (
              <div className="text-center py-12 text-muted-foreground">
                {t("services.noResults")}
              </div>
            )}
          </div>
        </section>

        {/* FAQ - Compact Accordion Style */}
        <section className="py-12 px-4 bg-muted/30" id="faq">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-center mb-8">{t("faq.title")}</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="p-4">
                  <h3 className="font-semibold text-sm mb-1">{t(`faq.q${i}`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`faq.a${i}`)}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA - Compact */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-3xl">
            <Card className="p-8 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <h2 className="text-2xl font-bold mb-3">{t("cta.title")}</h2>
              <p className="text-muted-foreground mb-6">{t("cta.subtitle")}</p>
              <ScheduleConsultationButton size="lg" className="px-8" source="pricing-final">
                {t("cta.button")}
                <ArrowRight className="ml-2 w-5 h-5" />
              </ScheduleConsultationButton>
              <p className="text-xs text-muted-foreground mt-4">{t("cta.disclaimer")}</p>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
