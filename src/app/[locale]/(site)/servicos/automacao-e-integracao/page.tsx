import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScheduleConsultationButton } from "@/components/consultation/ScheduleConsultationButton";
import { ServiceBuilderSection } from "@/components/home/ServiceBuilderSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AutomationToolbox } from "@/components/services/AutomationToolbox";
import { ArrowRight, CheckCircle2, CircuitBoard, Gauge, Link2, Workflow, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Script from "next/script";

const highlights = [
  {
    title: "Mapeamento profundo",
    description: "Diagnóstico completo dos fluxos atuais para identificar gargalos e oportunidades de automação.",
  },
  {
    title: "Integrações inteligentes",
    description: "Conectamos suas ferramentas de marketing, vendas e operações com APIs e plataformas low-code.",
  },
  {
    title: "Governança e segurança",
    description: "Processos monitorados, alertas configurados e logs para garantir confiança em escala.",
  },
];

const processSteps = [
  {
    title: "Análise e descoberta",
    content: "Workshops com seu time, levantamento de métricas e priorização de fluxos críticos.",
  },
  {
    title: "Desenho da arquitetura",
    content: "Blueprint de integrações, escolha de ferramentas (n8n, Make, Zapier, APIs) e definição de KPIs.",
  },
  {
    title: "Implementação guiada",
    content: "Construção dos fluxos automatizados, documentação e transferência de conhecimento.",
  },
  {
    title: "Escala e otimização",
    content: "Monitoramos resultados, ajustamos gatilhos e criamos novas automações sob demanda.",
  },
];

const integrations = [
  "HubSpot",
  "RD Station",
  "Slack",
  "CRM proprietário",
  "Planilhas",
  "Sistemas legados",
];

const metrics = [
  { label: "Processos auditados", value: "120+" },
  { label: "Horas economizadas", value: "20h/sem" },
  { label: "Integrações concluídas", value: "300+" },
];

const packages = [
  {
    tier: "Starter",
    title: "Quick Wins",
    description: "Automação de 1-2 fluxos críticos com rastreabilidade e métricas.",
    highlights: [
      "Mapa de processos + priorização",
      "1-2 automações (webhook/API)",
      "Retentativas + logs",
      "Entrega em 2-3 semanas",
    ],
    featured: false,
    source: "automation-package-starter",
  },
  {
    tier: "Pro",
    title: "Ops Automation",
    description: "Integrações + governança: SLOs, alertas, dedupe e documentação viva.",
    highlights: [
      "3-6 automações",
      "SLA + alertas",
      "Idempotência + dedupe",
      "Documentação + handoff",
    ],
    featured: true,
    source: "automation-package-pro",
  },
  {
    tier: "Enterprise",
    title: "Automation Platform",
    description: "Arquitetura de automações em escala com filas, observabilidade e roadmap mensal.",
    highlights: [
      "Roadmap mensal",
      "Observabilidade completa",
      "Segurança + governança",
      "Squad dedicado",
    ],
    featured: false,
    source: "automation-package-enterprise",
  },
];

const faqItems = [
  {
    q: "Quais ferramentas vocês usam?",
    a: "Escolhemos por contexto: n8n, Make, Zapier, APIs custom, filas e serviços cloud. O foco é confiabilidade e governança, não só conectar." ,
  },
  {
    q: "Como evitam automações quebrando?",
    a: "Implementamos idempotência, retentativas, dead-letter, logs, alertas e SLAs. Em fluxos críticos, adicionamos validação + revisão humana.",
  },
  {
    q: "Isso integra com CRM e WhatsApp?",
    a: "Sim. Integramos CRM (HubSpot/RD/CRM próprio), WhatsApp, e-mail e sistemas internos. Também rastreamos UTMs para atribuição.",
  },
  {
    q: "Quanto tempo até ver resultado?",
    a: "Quick wins saem em 2-3 semanas. Operação estável e escalável normalmente evolui em 30-90 dias conforme volume e integrações.",
  },
];

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://fayai.shop";

const automations = [
  {
    title: "Funil de vendas",
    description: "Sincronizamos leads entre formulários, CRM e canais de nurturing em tempo real.",
  },
  {
    title: "Suporte inteligente",
    description: "Chatbots, automações com IA e roteamento automático para reduzir tempo de resposta.",
  },
  {
    title: "Operações internas",
    description: "Fluxos para onboarding, financeiro e relatórios com aprovações automáticas.",
  },
];

export default function AutomationIntegrationPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Home.Services.automation");
  const isEn = params.locale === "en";

  const serviceUrl = `${SITE_URL}/${params.locale}/servicos/automacao-e-integracao`;

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: isEn ? "Automation & Integration" : "Automação & Integração",
    url: serviceUrl,
    provider: {
      "@type": "Organization",
      name: "FayAi",
      url: SITE_URL,
    },
    areaServed: "BR",
    serviceType: isEn ? "Automation" : "Automação",
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Script id="ld-automation-service" type="application/ld+json">
        {JSON.stringify(serviceLd)}
      </Script>
      <Script id="ld-automation-faq" type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <div className="inline-flex items-center justify-center p-5 rounded-2xl bg-orange-500/10 mb-6">
            <Workflow className="w-12 h-12 text-orange-500" />
          </div>
          <p className="text-sm uppercase tracking-[0.3em] text-orange-400 mb-4">
            Automação + Integração
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("title")}</h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">{t("description")}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <ScheduleConsultationButton
              size="lg"
              className="px-8 py-6 text-lg"
              source="automation-hero"
              showCompanyRole
            >
              Agendar diagnóstico gratuito <ArrowRight className="ml-2 w-5 h-5" />
            </ScheduleConsultationButton>
            <a href="#toolbox">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                {isEn ? "Use the free tools" : "Usar ferramentas grátis"}
              </Button>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-emerald-500" />
              <span>{isEn ? "No lock-in" : "Sem fidelidade"}</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-emerald-500" />
              <span>{isEn ? "Observable + reliable" : "Observável + confiável"}</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-emerald-500" />
              <span>{isEn ? "UTM attribution" : "Atribuição por UTM"}</span>
            </div>
          </div>
        </div>

        <div id="toolbox" className="scroll-mt-28 mb-20">
          <AutomationToolbox locale={params.locale} />
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-16">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-border bg-card/80 p-6">
              <p className="text-sm uppercase tracking-wide text-muted-foreground">{metric.label}</p>
              <p className="text-4xl font-bold mt-2">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-20">
          {highlights.map((highlight) => (
            <div key={highlight.title} className="rounded-2xl border border-border bg-card/60 p-6">
              <CheckCircle2 className="w-6 h-6 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">{highlight.title}</h3>
              <p className="text-muted-foreground">{highlight.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-card/50 border border-border rounded-3xl p-8 md:p-12 mb-20">
          <div className="flex items-center gap-3 mb-8">
            <CircuitBoard className="w-6 h-6 text-orange-400" />
            <p className="text-sm uppercase tracking-[0.2em] text-orange-300">Metodologia</p>
          </div>
          <div className="grid gap-10">
            {processSteps.map((step, index) => (
              <div key={step.title} className="grid gap-6 md:grid-cols-[120px_1fr] items-start">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="text-3xl font-semibold text-orange-500">0{index + 1}</span>
                  <span className="font-medium uppercase tracking-wide">{step.title}</span>
                </div>
                <p className="text-lg text-muted-foreground/90">{step.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-10 md:grid-cols-2 mb-20">
          <div className="rounded-3xl border border-border bg-card/70 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Link2 className="w-5 h-5 text-sky-400" />
              <p className="text-sm uppercase tracking-[0.2em] text-sky-300">Integrações favoritas</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {integrations.map((tool) => (
                <div
                  key={tool}
                  className="rounded-2xl border border-border bg-background/60 px-4 py-5 text-center text-sm font-medium"
                >
                  {tool}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/70 p-8">
            <div className="flex items-center gap-3 mb-6">
              <Gauge className="w-5 h-5 text-lime-400" />
              <p className="text-sm uppercase tracking-[0.2em] text-lime-300">Automação em ação</p>
            </div>
            <div className="space-y-6">
              {automations.map((automation) => (
                <div key={automation.title} className="rounded-2xl border border-border/60 bg-background/50 p-5">
                  <h3 className="text-lg font-semibold mb-2">{automation.title}</h3>
                  <p className="text-muted-foreground text-sm">{automation.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">{isEn ? "Packages" : "Pacotes"}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">{isEn ? "Choose a plan" : "Escolha o plano ideal"}</h2>
            <p className="text-muted-foreground mt-3">
              {isEn
                ? "Start with quick wins, then scale with governance."
                : "Comece com quick wins e escale com governança."}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {packages.map((p) => (
              <Card
                key={p.tier}
                className={`p-7 rounded-3xl border-border bg-card/70 ${p.featured ? "ring-2 ring-orange-500/40" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <Badge variant={p.featured ? "default" : "secondary"}>{p.tier}</Badge>
                  {p.featured && (
                    <Badge className="bg-orange-600">{isEn ? "Most popular" : "Mais escolhido"}</Badge>
                  )}
                </div>
                <h3 className="text-2xl font-bold mt-5">{p.title}</h3>
                <p className="text-muted-foreground mt-2">{p.description}</p>
                <div className="mt-6 grid gap-3">
                  {p.highlights.map((h) => (
                    <div key={h} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                      <p className="text-sm text-muted-foreground">{h}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-7 flex gap-3">
                  <ScheduleConsultationButton
                    className="flex-1"
                    source={p.source}
                    showCompanyRole
                  >
                    {isEn ? "Book a call" : "Agendar conversa"}
                  </ScheduleConsultationButton>
                  <Link href="/precos">
                    <Button variant="outline">{isEn ? "Pricing" : "Preços"}</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-24">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-3">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">{isEn ? "Questions" : "Perguntas"}</h2>
            <p className="text-muted-foreground mt-3">
              {isEn ? "Clear answers before you book." : "Respostas rápidas antes de agendar."}
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        </div>
        
        <Suspense fallback={<div className="py-20 text-center">Carregando construtor de serviços...</div>}>
          <ServiceBuilderSection
            serviceSlug="automation-ai"
            restrictToServiceSlug
            badgeLabel="Personalize sua automação"
            title="Monte seu fluxo automatizado"
            subtitle="Escolha mapeamento, implementações simples ou complexas, e agentes de IA conforme sua necessidade."
            sectionId="builder"
            showServiceTabs={false}
          />
        </Suspense>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/80 backdrop-blur md:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">{isEn ? "Automation diagnosis" : "Diagnóstico de automação"}</p>
            <p className="text-xs text-muted-foreground">{isEn ? "Free + actionable" : "Grátis + acionável"}</p>
          </div>
          <a href="#toolbox">
            <Button className="px-4" variant="outline">{isEn ? "Tools" : "Ferramentas"}</Button>
          </a>
          <ScheduleConsultationButton source="automation-sticky" className="px-4">
            {isEn ? "Book" : "Agendar"}
          </ScheduleConsultationButton>
        </div>
      </div>
      <Footer />
    </div>
  );
}
