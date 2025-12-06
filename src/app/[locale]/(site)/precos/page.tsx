"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useServicePrices } from "@/hooks/useServicePrices";
import { useTranslations, useLocale } from "next-intl";
import { getPricingTranslation, getPricingDescriptionTranslation } from "@/data/pricing-translations";
import { ScheduleConsultationButton } from "@/components/consultation/ScheduleConsultationButton";
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
  Sparkles,
  Search,
  DollarSign,
  Users,
  Clock,
  ShieldCheck,
  Star,
  TrendingUp,
  Package,
  ChevronDown,
  ChevronUp,
  Info,
  Calculator,
} from "lucide-react";

const serviceConfig: Record<
  string,
  {
    icon: React.ElementType;
    gradient: string;
    accentColor: string;
    href: string;
  }
> = {
  "website-full": {
    icon: Globe,
    gradient: "from-blue-500 to-cyan-400",
    accentColor: "text-blue-500",
    href: "/servicos/construcao-de-sites",
  },
  "social-management": {
    icon: Share2,
    gradient: "from-pink-500 to-rose-400",
    accentColor: "text-pink-500",
    href: "/servicos/social-media",
  },
  "local-seo": {
    icon: MapPin,
    gradient: "from-emerald-500 to-green-400",
    accentColor: "text-emerald-500",
    href: "/servicos/seo-local",
  },
  "video-production": {
    icon: Video,
    gradient: "from-purple-500 to-violet-400",
    accentColor: "text-purple-500",
    href: "/servicos/edicao-de-video",
  },
  "automation-ai": {
    icon: Zap,
    gradient: "from-amber-500 to-orange-400",
    accentColor: "text-amber-500",
    href: "/servicos/automacao-e-integracao",
  },
  consulting: {
    icon: Bot,
    gradient: "from-indigo-500 to-blue-400",
    accentColor: "text-indigo-500",
    href: "/servicos/consultoria-ai",
  },
};

const bundles = [
  {
    id: "local-authority",
    name: "Local Authority Launch",
    price: 2450,
    description: "GBP setup, listing enhancement, 2 city pages, review workflow",
    includes: ["GMB Optimization", "Review Management System", "Local Citation Pack"],
    gradient: "from-emerald-500 to-green-400",
    popular: false,
  },
  {
    id: "content-engine",
    name: "Content Engine Pro",
    price: 4250,
    description: "Strategy audit, 12 static posts, 4 reels, moderation 10h, monthly report",
    includes: ["Social Strategy Audit", "Static Post Design x12", "Reel/Short Editing x4", "Community Management"],
    gradient: "from-pink-500 to-rose-400",
    popular: false,
  },
  {
    id: "conversion-sprint",
    name: "Conversion Website Sprint",
    price: 11800,
    description: "Discovery, 8 UX/UI screens, copywriting, FE build, CMS, QA, launch",
    includes: ["Discovery Workshop", "UX/UI Design x8", "Frontend Development", "CMS Integration", "SEO Pack"],
    gradient: "from-blue-500 to-cyan-400",
    popular: true,
  },
  {
    id: "video-growth",
    name: "Video Growth Kit",
    price: 14600,
    description: "Concept, script, storyboard, 2 production days, edit, color, sound, subtitles",
    includes: ["Concept Treatment", "Scriptwriting", "Storyboard", "2 Production Days", "Full Post-Production"],
    gradient: "from-purple-500 to-violet-400",
    popular: false,
  },
  {
    id: "ai-jumpstart",
    name: "AI Automation Jumpstart",
    price: 9800,
    description: "Workshop, roadmap, 3 workflows, CRM integration, training, 2-mo support",
    includes: ["Process Mapping Workshop", "Automation Roadmap", "3 Workflow Implementations", "CRM Integration"],
    gradient: "from-amber-500 to-orange-400",
    popular: false,
  },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function PricingPage() {
  const t = useTranslations("Pricing");
  const locale = useLocale();
  const { prices, loading, groupedByService } = useServicePrices();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeService, setActiveService] = useState<string | null>(null);
  const [expandedTracks, setExpandedTracks] = useState<Record<string, boolean>>({});

  const services = useMemo(() => {
    return Object.entries(groupedByService)
      .filter(([slug]) => slug !== "bundles")
      .map(([slug, items]) => {
        const config = serviceConfig[slug] || {
          icon: Zap,
          gradient: "from-gray-500 to-gray-400",
          accentColor: "text-gray-500",
          href: "#",
        };

        const tracks = items.reduce<Record<string, typeof items>>((acc, item) => {
          acc[item.track] = acc[item.track] || [];
          acc[item.track].push(item);
          return acc;
        }, {});

        const minPrice = Math.min(...items.map((i) => i.priceRange.min));
        const maxPrice = Math.max(...items.map((i) => i.priceRange.max));

        return {
          slug,
          items,
          tracks,
          minPrice,
          maxPrice,
          ...config,
        };
      });
  }, [groupedByService]);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;

    const query = searchQuery.toLowerCase();
    return services
      .map((service) => {
        const filteredItems = service.items.filter(
          (item) =>
            item.unitLabel.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.track.toLowerCase().includes(query)
        );

        if (filteredItems.length === 0) return null;

        const tracks = filteredItems.reduce<Record<string, typeof filteredItems>>((acc, item) => {
          acc[item.track] = acc[item.track] || [];
          acc[item.track].push(item);
          return acc;
        }, {});

        return {
          ...service,
          items: filteredItems,
          tracks,
        };
      })
      .filter(Boolean) as typeof services;
  }, [services, searchQuery]);

  const toggleTrack = (serviceSlug: string, track: string) => {
    const key = `${serviceSlug}-${track}`;
    setExpandedTracks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isTrackExpanded = (serviceSlug: string, track: string) => {
    return expandedTracks[`${serviceSlug}-${track}`] ?? true;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

          <div className="container mx-auto max-w-6xl relative">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-6 px-4 py-2 text-sm font-medium" variant="secondary">
                <DollarSign className="w-4 h-4 mr-2 inline" />
                {t("badge")}
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance leading-tight">
                {t("hero.title")}
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-pretty max-w-3xl mx-auto leading-relaxed">
                {t("hero.subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <ScheduleConsultationButton
                  size="lg"
                  className="text-lg px-8 py-6 group"
                  source="pricing-hero"
                >
                  {t("hero.cta")}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </ScheduleConsultationButton>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                  <Link href="#builder">
                    <Calculator className="w-5 h-5 mr-2" />
                    {t("hero.ctaSecondary")}
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span>{t("hero.guarantee1")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>{t("hero.guarantee2")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>{t("hero.guarantee3")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 bg-muted/30 border-y">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: Users, value: "100+", label: t("stats.clients") },
                { icon: TrendingUp, value: "40%", label: t("stats.efficiency") },
                { icon: Star, value: "4.9/5", label: t("stats.rating") },
                { icon: Clock, value: "24h", label: t("stats.response") },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bundles Section */}
        <section className="py-20 px-4" id="bundles">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <Badge className="mb-4" variant="outline">
                <Package className="w-4 h-4 mr-2" />
                {t("bundles.badge")}
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
                {t("bundles.title")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                {t("bundles.subtitle")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map((bundle, i) => (
                <motion.div
                  key={bundle.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card
                    className={`relative p-6 h-full flex flex-col ${
                      bundle.popular ? "border-2 border-primary shadow-lg" : "border-border"
                    }`}
                  >
                    {bundle.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        {t("bundles.popular")}
                      </Badge>
                    )}

                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bundle.gradient} flex items-center justify-center mb-4`}
                    >
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>

                    <h3 className="text-xl font-bold mb-2">
                      {getPricingTranslation(bundle.name, locale)}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4 flex-grow">
                      {bundle.description}
                    </p>

                    <div className="mb-4">
                      <span className="text-3xl font-bold">{currencyFormatter.format(bundle.price)}</span>
                      <span className="text-muted-foreground ml-2">{t("bundles.perProject")}</span>
                    </div>

                    <ul className="space-y-2 mb-6">
                      {bundle.includes.map((item, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{getPricingTranslation(item, locale)}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full mt-auto"
                      variant={bundle.popular ? "default" : "outline"}
                      asChild
                    >
                      <Link href={`?bundle=${bundle.name}#builder`}>
                        {t("bundles.selectCta")}
                      </Link>
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Granular Pricing Section */}
        <section className="py-20 px-4 bg-muted/30" id="services">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="outline">
                <DollarSign className="w-4 h-4 mr-2" />
                {t("services.badge")}
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
                {t("services.title")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty mb-8">
                {t("services.subtitle")}
              </p>

              {/* Search */}
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={t("services.searchPlaceholder")}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Service Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Button
                variant={activeService === null ? "default" : "outline"}
                onClick={() => setActiveService(null)}
                className="rounded-full"
              >
                {t("services.all")}
              </Button>
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <Button
                    key={service.slug}
                    variant={activeService === service.slug ? "default" : "outline"}
                    onClick={() => setActiveService(service.slug)}
                    className="rounded-full"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {t(`services.categories.${service.slug.replace(/-/g, "_")}`)}
                  </Button>
                );
              })}
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="p-6">
                    <Skeleton className="h-8 w-48 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {(activeService
                  ? filteredServices.filter((s) => s.slug === activeService)
                  : filteredServices
                ).map((service) => {
                  const Icon = service.icon;
                  return (
                    <motion.div
                      key={service.slug}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                    >
                      <Card className="overflow-hidden">
                        {/* Service Header */}
                        <div
                          className={`p-6 bg-gradient-to-r ${service.gradient} bg-opacity-10`}
                        >
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-lg`}
                              >
                                <Icon className="w-7 h-7 text-white" />
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold">
                                  {t(`services.categories.${service.slug.replace(/-/g, "_")}`)}
                                </h3>
                                <p className="text-muted-foreground">
                                  {service.items.length} {t("services.itemsAvailable")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{t("services.priceRange")}</p>
                              <p className="text-xl font-bold">
                                {currencyFormatter.format(service.minPrice)} -{" "}
                                {currencyFormatter.format(service.maxPrice)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Tracks */}
                        <div className="p-6 space-y-6">
                          {Object.entries(service.tracks).map(([track, items]) => (
                            <div key={track} className="border rounded-xl overflow-hidden">
                              <button
                                onClick={() => toggleTrack(service.slug, track)}
                                className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${service.gradient}`} />
                                  <span className="font-semibold">{getPricingTranslation(track, locale)}</span>
                                  <Badge variant="secondary" className="ml-2">
                                    {items.length} {t("services.items")}
                                  </Badge>
                                </div>
                                {isTrackExpanded(service.slug, track) ? (
                                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                )}
                              </button>

                              <AnimatePresence>
                                {isTrackExpanded(service.slug, track) && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <div className="divide-y">
                                      {items.map((item) => (
                                        <div
                                          key={item.unitLabel}
                                          className="p-4 hover:bg-muted/20 transition-colors"
                                        >
                                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                              <h4 className="font-medium flex items-center gap-2">
                                                {getPricingTranslation(item.unitLabel, locale)}
                                                <button className="text-muted-foreground hover:text-foreground">
                                                  <Info className="w-4 h-4" />
                                                </button>
                                              </h4>
                                              <p className="text-sm text-muted-foreground mt-1">
                                                {getPricingDescriptionTranslation(
                                                  item.description,
                                                  item.unitLabel,
                                                  locale
                                                )}
                                              </p>
                                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                  <span className="font-medium">{t("services.unit")}:</span>
                                                  {item.unitType.replace("per_", "")}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                  <span className="font-medium">{t("services.minQty")}:</span>
                                                  {item.minQuantity}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-6 md:text-right">
                                              <div>
                                                <p className="text-xs text-muted-foreground">{t("services.range")}</p>
                                                <p className="text-sm">
                                                  {currencyFormatter.format(item.priceRange.min)} -{" "}
                                                  {currencyFormatter.format(item.priceRange.max)}
                                                </p>
                                              </div>
                                              <div className="border-l pl-6">
                                                <p className="text-xs text-muted-foreground">{t("services.recommended")}</p>
                                                <p className={`text-lg font-bold ${service.accentColor}`}>
                                                  {currencyFormatter.format(item.priceRange.recommended)}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>

                        {/* Service CTA */}
                        <div className="p-6 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <p className="text-sm text-muted-foreground">
                            {t("services.ctaText")}
                          </p>
                          <div className="flex gap-3">
                            <Button variant="outline" asChild>
                              <Link href={service.href}>
                                {t("services.learnMore")}
                              </Link>
                            </Button>
                            <ScheduleConsultationButton source={`pricing-${service.slug}`}>
                              {t("services.getQuote")}
                            </ScheduleConsultationButton>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}

                {filteredServices.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">{t("services.noResults")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Builder Section */}
        <section className="py-20 px-4" id="builder">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="outline">
                <Calculator className="w-4 h-4 mr-2" />
                {t("builder.badge")}
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
                {t("builder.title")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                {t("builder.subtitle")}
              </p>
            </div>

            <Card className="p-8 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <Sparkles className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h3 className="text-2xl font-bold mb-4">{t("builder.interactiveTitle")}</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                {t("builder.interactiveDesc")}
              </p>
              <Button size="lg" asChild>
                <Link href="/#service-builder">
                  {t("builder.ctaButton")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 bg-muted/30" id="faq">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
                {t("faq.title")}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t("faq.subtitle")}
              </p>
            </div>

            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="p-6">
                  <h3 className="font-semibold mb-2">{t(`faq.q${i}`)}</h3>
                  <p className="text-muted-foreground">{t(`faq.a${i}`)}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
                {t("cta.title")}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
                {t("cta.subtitle")}
              </p>
              <ScheduleConsultationButton
                size="lg"
                className="text-lg px-8 py-6 group"
                source="pricing-final"
              >
                {t("cta.button")}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </ScheduleConsultationButton>
              <p className="text-sm text-muted-foreground mt-6">
                {t("cta.disclaimer")}
              </p>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
