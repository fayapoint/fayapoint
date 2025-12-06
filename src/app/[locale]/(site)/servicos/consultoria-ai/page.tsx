"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Bot, ArrowRight, Sparkles, TrendingUp, Users, Zap, Target, Brain, Rocket, Shield, Clock, DollarSign, Star } from 'lucide-react';
import { useTranslations } from "next-intl";
import { ScheduleConsultationButton } from "@/components/consultation/ScheduleConsultationButton";
import { ServiceBuilderSection } from "@/components/home/ServiceBuilderSection";


export default function AIConsultingPage() {
  const t = useTranslations("Home.Services.ai-consulting");
  const p = useTranslations("AIConsultingPage");

  const serviceKeys = ["strategy", "tools", "training", "agents", "optimization", "security"] as const;
  const serviceIcons = {
    strategy: Brain,
    tools: Zap,
    training: Users,
    agents: Bot,
    optimization: Target,
    security: Shield
  };

  const statKeys = ["productivity", "savedTime", "roi", "companies"] as const;
  const statIcons = {
    productivity: TrendingUp,
    savedTime: Clock,
    roi: DollarSign,
    companies: Users
  };

  const processKeys = ["discovery", "strategy", "implementation", "optimization"] as const;

  // Get testimonials as raw array
  const testimonials = p.raw("testimonials.items") as Array<{quote: string; author: string; role: string}>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 px-4 py-2 text-sm font-medium" variant="secondary">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              {p("hero.badge")}
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance leading-tight">
              {t("title")}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-pretty max-w-3xl mx-auto leading-relaxed">
              {t("description")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ScheduleConsultationButton
                size="lg"
                className="text-lg px-8 py-6 group"
                source="ai-consulting-hero"
              >
                {p("hero.cta.primary")}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </ScheduleConsultationButton>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                {p("hero.cta.secondary")}
              </Button>
            </div>
            
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{p("hero.guarantees.noContracts")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{p("hero.guarantees.results30days")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{p("hero.guarantees.moneyBack")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statKeys.map((key) => {
              const Icon = statIcons[key];
              return (
                <div key={key} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{p(`stats.${key}.value`)}</div>
                  <div className="text-sm text-muted-foreground">{p(`stats.${key}.label`)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

        {/* Services Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              {p("services.title")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              {p("services.subtitle")}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceKeys.map((key) => {
              const Icon = serviceIcons[key];
              return (
                <Card key={key} className="p-6 hover:shadow-lg transition-shadow border-border bg-card">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{p(`services.items.${key}.title`)}</h3>
                  <p className="text-muted-foreground leading-relaxed">{p(`services.items.${key}.description`)}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

        {/* Process Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              {p("process.title")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              {p("process.subtitle")}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processKeys.map((key, i) => (
              <div key={key} className="relative">
                <div className="text-6xl font-bold text-primary/10 mb-4">{p(`process.steps.${key}.step`)}</div>
                <h3 className="text-xl font-semibold mb-3">{p(`process.steps.${key}.title`)}</h3>
                <p className="text-muted-foreground leading-relaxed">{p(`process.steps.${key}.description`)}</p>
                {i < processKeys.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-8 -right-4 w-8 h-8 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

        {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              {p("testimonials.title")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              {p("testimonials.subtitle")}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="p-8 border-border bg-card">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed text-pretty">&quot;{testimonial.quote}&quot;</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

        {/* Pricing/Packages */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              {p("packages.title")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              {p("packages.subtitle")}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-border bg-card">
              <div className="text-sm font-semibold text-primary mb-2">{p("packages.starter.label")}</div>
              <h3 className="text-2xl font-bold mb-4">{p("packages.starter.title")}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {p("packages.starter.description")}
              </p>
              <ul className="space-y-3 mb-8">
                {(p.raw("packages.starter.features") as string[]).map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <ScheduleConsultationButton
                variant="outline"
                className="w-full"
                source="ai-consulting-starter"
                showCompanyRole
              >
                {p("packages.starter.cta")}
              </ScheduleConsultationButton>
            </Card>

            <Card className="p-8 border-primary shadow-lg relative bg-card">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                {p("packages.professional.badge")}
              </Badge>
              <div className="text-sm font-semibold text-primary mb-2">{p("packages.professional.label")}</div>
              <h3 className="text-2xl font-bold mb-4">{p("packages.professional.title")}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {p("packages.professional.description")}
              </p>
              <ul className="space-y-3 mb-8">
                {(p.raw("packages.professional.features") as string[]).map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <ScheduleConsultationButton
                className="w-full"
                source="ai-consulting-professional"
                showCompanyRole
              >
                {p("packages.professional.cta")}
              </ScheduleConsultationButton>
            </Card>

            <Card className="p-8 border-border bg-card">
              <div className="text-sm font-semibold text-primary mb-2">{p("packages.enterprise.label")}</div>
              <h3 className="text-2xl font-bold mb-4">{p("packages.enterprise.title")}</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {p("packages.enterprise.description")}
              </p>
              <ul className="space-y-3 mb-8">
                {(p.raw("packages.enterprise.features") as string[]).map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <ScheduleConsultationButton
                variant="outline"
                className="w-full"
                source="ai-consulting-enterprise"
                showCompanyRole
              >
                {p("packages.enterprise.cta")}
              </ScheduleConsultationButton>
            </Card>
          </div>
        </div>
      </section>

        {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <Rocket className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              {p("finalCta.title")}
            </h2>
            <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
              {p("finalCta.subtitle")}
            </p>
            <ScheduleConsultationButton
              size="lg"
              className="text-lg px-8 py-6 group"
              source="ai-consulting-final"
              showCompanyRole
            >
              {p("finalCta.button")}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </ScheduleConsultationButton>
            <p className="text-sm text-muted-foreground mt-6">
              {p("finalCta.disclaimer")}
            </p>
          </Card>
        </div>
      </section>

      <ServiceBuilderSection
        serviceSlug="consulting"
        restrictToServiceSlug
        badgeLabel={p("builder.badge")}
        title={p("builder.title")}
        subtitle={p("builder.subtitle")}
        sectionId="builder"
        showServiceTabs={false}
      />
      </main>
      <Footer />
    </div>
  );
}
