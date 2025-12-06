import Link from "next/link";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScheduleConsultationButton } from "@/components/consultation/ScheduleConsultationButton";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock4,
  Layers,
  LineChart,
  MapPinned,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

// Project data structure with proper typing
type ProjectItem = {
  key: string;
  stack: string[];
  metricsKeys: string[];
};

type CollectionItem = {
  key: string;
  projects: ProjectItem[];
};

const projectCollections: CollectionItem[] = [
  {
    key: "aiAutomation",
    projects: [
      { key: "atlasSupportAi", stack: ["OpenAI", "n8n", "Freshdesk", "MongoDB"], metricsKeys: ["responseTime", "csat", "automation"] },
      { key: "auroraLearningAgent", stack: ["Next.js", "Supabase", "LangChain", "Whisper"], metricsKeys: ["retention", "mentorTime"] },
    ],
  },
  {
    key: "saasProducts",
    projects: [
      { key: "fluxOrchestrator", stack: ["Next.js", "Prisma", "PostgreSQL", "Segment"], metricsKeys: ["onboarding", "mrr"] },
      { key: "omniCommerce", stack: ["Next.js", "Stripe", "Directus", "Redis"], metricsKeys: ["conversion", "avgTicket"] },
      { key: "talentScout", stack: ["Next.js", "Neo4j", "Plaid", "Zapier"], metricsKeys: ["matching", "proposalTime"] },
    ],
  },
  {
    key: "immersive",
    projects: [
      { key: "cortexCommand", stack: ["Next.js", "Pandas", "PowerBI", "Azure"], metricsKeys: ["criticalAlerts", "predictiveAccuracy"] },
      { key: "luminaExperience", stack: ["Next.js", "Contentful", "Algolia", "HubSpot"], metricsKeys: ["subscribers", "qualifiedMql"] },
    ],
  },
];

const deliveryPillarKeys = ["blueprint", "execution", "operation"] as const;

export default function CasesPage() {
  const t = useTranslations("Cases");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const testimonials = t.raw("testimonials") as any[];

  const impactMetrics = [
    { labelKey: "projectsDelivered", value: "68+", icon: Layers },
    { labelKey: "avgTimeROI", value: "42 dias", icon: Clock4 },
    { labelKey: "automatedProcesses", value: "210+", icon: BarChart3 },
    { labelKey: "sectorsServed", value: "14", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-background to-purple-500/10 pointer-events-none" />
          <div className="container mx-auto max-w-6xl relative">
            <div className="max-w-4xl">
              <Badge className="mb-6 px-4 py-2 text-sm font-medium bg-white/10 text-white/90 border-white/30">
                {t("hero.badge")}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance leading-tight">
                {t("hero.title")}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-wrap gap-4">
                <ScheduleConsultationButton
                  size="lg"
                  className="gap-2"
                  source="cases-hero"
                  showCompanyRole
                >
                  <Sparkles className="w-5 h-5" />
                  {t("hero.secondaryCta")}
                </ScheduleConsultationButton>
                <Link href="/contato" className="inline-flex">
                  <Button size="lg" variant="outline" className="gap-2">
                    <ArrowRight className="w-5 h-5" />
                    {t("hero.primaryCta")}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-4 mt-12">
              {impactMetrics.map((metric) => (
                <Card key={metric.labelKey} className="bg-card/70 border-border/60 p-6">
                  <metric.icon className="w-6 h-6 text-primary mb-4" />
                  <p className="text-3xl font-semibold">{metric.value}</p>
                  <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mt-2">
                    {t(`metrics.${metric.labelKey}`)}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
              <div className="max-w-3xl">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
                  {t("projects.sectionTitle")}
                </h2>
                <p className="text-lg text-muted-foreground">
                  {t("projects.sectionDescription")}
                </p>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className="text-xs uppercase tracking-widest">
                  {t("projects.sectorsBadge")}
                </Badge>
              </div>
            </div>

            <div className="space-y-16">
              {projectCollections.map((collection) => (
                <div key={collection.key} className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold">
                        {t(`projects.collections.${collection.key}.title`)}
                      </h3>
                      <p className="text-muted-foreground max-w-2xl">
                        {t(`projects.collections.${collection.key}.description`)}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-8 md:grid-cols-2">
                    {collection.projects.map((project) => {
                      const highlights = t.raw(`projects.items.${project.key}.highlights`) as string[];

                      return (
                        <Card key={project.key} className="border-border/60 bg-card/70 p-8 flex flex-col">
                          <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
                            <Target className="w-4 h-4" />
                            {t(`projects.items.${project.key}.industry`)} • {t(`projects.items.${project.key}.timeframe`)}
                          </div>
                          <h4 className="text-2xl font-semibold mb-2 text-balance">
                            {t(`projects.items.${project.key}.title`)}
                          </h4>
                          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                            {t(`projects.items.${project.key}.client`)}
                          </p>
                          <p className="text-muted-foreground mb-6 leading-relaxed">
                            {t(`projects.items.${project.key}.description`)}
                          </p>
                          <ul className="space-y-2 text-sm mb-6">
                            {highlights.map((highlight, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1" />
                                <span>{highlight}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                            {project.metricsKeys.map((metricKey) => (
                              <div key={metricKey} className="rounded-2xl border border-border/60 px-4 py-3">
                                <p className="text-2xl font-semibold">
                                  {t(`projects.items.${project.key}.metrics.${metricKey}.value`)}
                                </p>
                                <p className="text-muted-foreground text-xs uppercase tracking-widest mt-1">
                                  {t(`projects.items.${project.key}.metrics.${metricKey}.label`)}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-auto">
                            {project.stack.map((tool) => (
                              <span key={tool} className="px-3 py-1 rounded-full border border-border/60">
                                {tool}
                              </span>
                            ))}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Delivery Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
                {t("delivery.title")}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t("delivery.description")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {deliveryPillarKeys.map((pillarKey, index) => (
                <Card key={pillarKey} className="border-border/60 bg-background/80 p-8">
                  <div className="text-6xl font-bold text-primary/10 mb-4">
                    {(index + 1).toString().padStart(2, "0")}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">
                    {t(`delivery.pillars.${pillarKey}.title`)}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(`delivery.pillars.${pillarKey}.description`)}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Indicators Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-border/60 bg-card/70 p-10">
                <div className="flex items-center gap-3 mb-6 text-sm uppercase tracking-widest text-muted-foreground">
                  <LineChart className="w-5 h-5" />
                  {t("indicators.title")}
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {(["timeToValue", "teamAdoption", "handoffQuality"] as const).map((key) => (
                    <div key={key}>
                      <p className="text-2xl font-semibold">{t(`indicators.${key}.value`)}</p>
                      <p className="text-sm text-muted-foreground mt-2">{t(`indicators.${key}.label`)}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="border-border/60 bg-card/70 p-10 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">{t("squad.title")}</h3>
                  <p className="text-muted-foreground mb-6">
                    {t("squad.description")}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Users className="w-5 h-5" />
                  {t("squad.availability")}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, idx) => (
                <Card key={idx} className="border-border/60 bg-card/70 p-8">
                  <p className="text-lg leading-relaxed mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <MapPinned className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
                {t("cta.title")}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t("cta.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ScheduleConsultationButton
                  size="lg"
                  className="gap-2"
                  source="cases-final"
                  showCompanyRole
                >
                  <ArrowRight className="w-5 h-5" />
                  {t("cta.primaryButton")}
                </ScheduleConsultationButton>
                <Link href="/contato">
                  <Button size="lg" variant="outline">
                    {t("cta.secondaryButton")}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
