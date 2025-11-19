"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, CircuitBoard, Gauge, Link2, Workflow } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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

export default function AutomationIntegrationPage() {
  const t = useTranslations("Home.Services.automation");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
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
            <Link href="/agendar-consultoria">
              <Button size="lg" className="px-8 py-6 text-lg">
                Agendar diagnóstico gratuito <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contato">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                Falar com um especialista
              </Button>
            </Link>
          </div>
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
