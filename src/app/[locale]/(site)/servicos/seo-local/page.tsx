import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScheduleConsultationButton } from "@/components/consultation/ScheduleConsultationButton";
import { ServiceBuilderSection } from "@/components/home/ServiceBuilderSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LocalSEOToolbox } from "@/components/services/LocalSEOToolbox";
import { ArrowRight, MapPin, Star, TrendingUp, Users, Search, CheckCircle2, BadgeCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Script from "next/script";

const highlights = [
  {
    title: "Dominância Local",
    description: "Posicione sua empresa no topo do Google Maps e buscas locais para quem procura seus serviços agora.",
  },
  {
    title: "Gestão de Reputação",
    description: "Automatize a coleta de reviews e transforme feedback positivo em motor de vendas.",
  },
  {
    title: "Tráfego Qualificado",
    description: "Atraia clientes que já estão na sua região e prontos para comprar ou contratar.",
  },
];

const processSteps = [
  {
    title: "Auditoria Local",
    content: "Análise completa da sua presença digital local, concorrência e oportunidades perdidas.",
  },
  {
    title: "Otimização GMB",
    content: "Configuração profissional do Perfil de Negócio Google com palavras-chave e fotos estratégicas.",
  },
  {
    title: "Gestão de Reviews",
    content: "Implementação de sistema para solicitar, monitorar e responder avaliações automaticamente.",
  },
  {
    title: "Citações e Autoridade",
    content: "Cadastro em diretórios locais relevantes para aumentar a confiança do domínio.",
  },
];

const metrics = [
  { label: "Aumento em ligações", value: "+150%" },
  { label: "Visitas ao perfil", value: "3x" },
  { label: "Avaliações positivas", value: "4.9/5" },
  { label: "Tempo até resultados", value: "2-6 semanas" },
];

const packages = [
  {
    tier: "Starter",
    title: "Foundation",
    description: "Organiza o básico com auditoria e otimização do Perfil do Google.",
    highlights: [
      "Auditoria local completa",
      "Otimização do Perfil do Google",
      "Checklist de ações por 30 dias",
      "Roteiro de palavras-chave locais",
    ],
    featured: false,
    source: "local-seo-package-starter",
  },
  {
    tier: "Pro",
    title: "Map Pack Growth",
    description: "Ataca ranking + reputação: reviews, fotos, posts e páginas-chave.",
    highlights: [
      "Setup de sistema de reviews",
      "Templates de respostas + SLAs",
      "Estratégia de posts no Google",
      "Páginas de serviço/bairro (estrutura)",
    ],
    featured: true,
    source: "local-seo-package-pro",
  },
  {
    tier: "Enterprise",
    title: "Local Domination",
    description: "Operação contínua com governança, automações e sprint mensal.",
    highlights: [
      "Automação de captação de reviews",
      "Citações locais + consistência NAP",
      "Monitoramento + relatórios",
      "Roadmap mensal de otimizações",
    ],
    featured: false,
    source: "local-seo-package-enterprise",
  },
];

const faqItems = [
  {
    q: "Em quanto tempo eu começo a ver resultado?",
    a: "Depende da sua região e da maturidade do seu Perfil do Google. Em geral vemos ganhos iniciais (mais visualizações e rotas) em 2-6 semanas, e evolução consistente em 60-90 dias.",
  },
  {
    q: "SEO Local funciona sem site?",
    a: "Funciona, mas você perde conversão e autoridade. O Perfil do Google pode ranquear, porém um site rápido com páginas de serviço/bairro melhora muito a relevância e aumenta ligações/WhatsApp.",
  },
  {
    q: "Vocês também cuidam de reviews e respostas?",
    a: "Sim. Implementamos o sistema (pedidos, roteiros e automações) e podemos assumir a operação com governança e SLAs de resposta.",
  },
  {
    q: "Isso serve para qualquer nicho?",
    a: "Sim, especialmente negócios locais (clínicas, serviços, restaurantes, imobiliárias, etc.). O plano é adaptado para seu ticket e seu ciclo de venda.",
  },
];

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://fayai.shop";

export default function LocalSEOPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Home.Services.local-seo");
  const isEn = params.locale === "en";

  const serviceUrl = `${SITE_URL}/${params.locale}/servicos/seo-local`;

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: isEn ? "Local SEO & Google Business" : "SEO Local & Google Business",
    url: serviceUrl,
    provider: {
      "@type": "Organization",
      name: "FayAi",
      url: SITE_URL,
    },
    areaServed: "BR",
    serviceType: isEn ? "Local SEO" : "SEO Local",
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
      <Script id="ld-local-seo-service" type="application/ld+json">
        {JSON.stringify(serviceLd)}
      </Script>
      <Script id="ld-local-seo-faq" type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-14">
            <div className="inline-flex items-center justify-center p-5 rounded-2xl bg-blue-500/10 mb-6">
              <MapPin className="w-12 h-12 text-blue-500" />
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-400 mb-4">
              SEO Local & Google Business
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("title")}</h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">{t("description")}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <ScheduleConsultationButton
                size="lg"
                className="px-8 py-6 text-lg"
                source="local-seo-hero"
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
                <span>{isEn ? "Fast wins + compounding" : "Resultados rápidos + cumulativos"}</span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-500" />
                <span>{isEn ? "Playbooks + automation" : "Playbooks + automações"}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4 mb-16">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-2xl border border-border bg-card/80 p-6">
                <p className="text-sm uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                <p className="text-4xl font-bold mt-2">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-8 md:grid-cols-3 mb-16">
            {highlights.map((highlight) => (
              <div key={highlight.title} className="rounded-2xl border border-border bg-card/60 p-6">
                <Star className="w-6 h-6 text-yellow-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">{highlight.title}</h3>
                <p className="text-muted-foreground">{highlight.description}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-20">
            <Card className="p-6 bg-card/60 border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <p className="text-sm uppercase tracking-[0.2em] text-blue-300">{isEn ? "Outcome" : "Resultado"}</p>
              </div>
              <h3 className="text-xl font-semibold">{isEn ? "More calls + WhatsApp" : "Mais ligações + WhatsApp"}</h3>
              <p className="text-muted-foreground mt-2">
                {isEn
                  ? "Rank for intent-heavy searches when people are ready to buy."
                  : "Posicione para buscas com intenção quando a pessoa já quer comprar."}
              </p>
            </Card>

            <Card className="p-6 bg-card/60 border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-emerald-400" />
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">{isEn ? "System" : "Sistema"}</p>
              </div>
              <h3 className="text-xl font-semibold">{isEn ? "Review engine" : "Motor de reviews"}</h3>
              <p className="text-muted-foreground mt-2">
                {isEn
                  ? "Automated requests + response playbook to protect reputation at scale."
                  : "Pedidos automatizados + playbook de respostas para escalar reputação."}
              </p>
            </Card>

            <Card className="p-6 bg-card/60 border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <p className="text-sm uppercase tracking-[0.2em] text-yellow-300">{isEn ? "Ops" : "Ops"}</p>
              </div>
              <h3 className="text-xl font-semibold">{isEn ? "Repeatable playbooks" : "Playbooks replicáveis"}</h3>
              <p className="text-muted-foreground mt-2">
                {isEn
                  ? "Monthly sprints with clear metrics, tasks and deliverables."
                  : "Sprints mensais com métricas, tarefas e entregáveis claros."}
              </p>
            </Card>
          </div>

          <div className="bg-card/50 border border-border rounded-3xl p-8 md:p-12 mb-20">
            <div className="flex items-center gap-3 mb-8">
              <Search className="w-6 h-6 text-blue-400" />
              <p className="text-sm uppercase tracking-[0.2em] text-blue-300">Nossa Metodologia</p>
            </div>
            <div className="grid gap-10">
              {processSteps.map((step, index) => (
                <div key={step.title} className="grid gap-6 md:grid-cols-[120px_1fr] items-start">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="text-3xl font-semibold text-blue-500">0{index + 1}</span>
                    <span className="font-medium uppercase tracking-wide">{step.title}</span>
                  </div>
                  <p className="text-lg text-muted-foreground/90">{step.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="toolbox" className="scroll-mt-28 mb-20">
            <LocalSEOToolbox locale={params.locale} />
          </div>

          <div className="max-w-6xl mx-auto mb-20">
            <div className="text-center mb-10">
              <Badge variant="secondary" className="mb-4">{isEn ? "Packages" : "Pacotes"}</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">{isEn ? "Choose a plan" : "Escolha o plano ideal"}</h2>
              <p className="text-muted-foreground mt-3">
                {isEn
                  ? "Start small, then scale with automation + governance."
                  : "Comece pequeno e escale com automação + governança."}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {packages.map((p) => (
                <Card
                  key={p.tier}
                  className={`p-7 rounded-3xl border-border bg-card/70 ${p.featured ? "ring-2 ring-blue-500/40" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={p.featured ? "default" : "secondary"}>{p.tier}</Badge>
                    {p.featured && (
                      <Badge className="bg-blue-600">{isEn ? "Most popular" : "Mais escolhido"}</Badge>
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
                {isEn
                  ? "Clear answers before you book." 
                  : "Respostas rápidas antes de agendar."}
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

        <Suspense fallback={<div className="py-20 text-center">Carregando construtor...</div>}>
          <ServiceBuilderSection
            serviceSlug="local-seo"
            restrictToServiceSlug
            badgeLabel="Personalize seu pacote"
            title="Domine sua região"
            subtitle="Escolha os serviços de SEO Local ideais para o momento do seu negócio."
            sectionId="builder"
            showServiceTabs={false}
          />
        </Suspense>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/80 backdrop-blur md:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">{isEn ? "Local SEO diagnosis" : "Diagnóstico SEO Local"}</p>
            <p className="text-xs text-muted-foreground">{isEn ? "Free + actionable" : "Grátis + acionável"}</p>
          </div>
          <ScheduleConsultationButton source="local-seo-sticky" className="px-4">
            {isEn ? "Book" : "Agendar"}
          </ScheduleConsultationButton>
        </div>
      </div>
      <Footer />
    </div>
  );
}
