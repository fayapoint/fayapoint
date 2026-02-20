import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScheduleConsultationButton } from "@/components/consultation/ScheduleConsultationButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VideoToolbox } from "@/components/services/VideoToolbox";
import {
  ArrowRight,
  Camera,
  CheckCircle,
  Clapperboard,
  Film,
  Globe,
  MonitorPlay,
  Music2,
  Palette,
  Rocket,
  Scissors,
  Share2,
  Sparkles,
  TrendingUp,
  Video,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ServiceBuilderSection } from "@/components/home/ServiceBuilderSection";
import { ServiceCartProvider } from "@/contexts/ServiceCartContext";
import Script from "next/script";

const benefits = [
  { icon: TrendingUp, stat: "3x", label: "Mais alcance orgânico" },
  { icon: MonitorPlay, stat: "150+", label: "Assets/mês produzidos" },
  { icon: Share2, stat: "5 plataformas", label: "Entrega otimizada" },
  { icon: Music2, stat: "100%", label: "Identidade sonora e visual" },
];

const services = [
  {
    icon: Clapperboard,
    title: "Story design",
    description: "Roteiros, hooks e estruturas para reels, shorts e narrativas long-form.",
  },
  {
    icon: Palette,
    title: "Motion & identidade",
    description: "Pacotes de motion graphics, lower thirds e branding consistente.",
  },
  {
    icon: Scissors,
    title: "Edição multicorte",
    description: "Versionamento para TikTok, Instagram, YouTube e ads com legendas nativas.",
  },
  {
    icon: Camera,
    title: "Direção remota",
    description: "Guiamos gravações e entregamos referência visual para criadores e executivos.",
  },
  {
    icon: Film,
    title: "Documentais & lançamentos",
    description: "Séries, bastidores, conteúdo premium e peças para lançamentos." ,
  },
  {
    icon: Wand2,
    title: "IA assistida",
    description: "Pipelines com IA para transcrições, cortes automáticos e legendagem multilíngue.",
  },
];

const faqItems = [
  {
    q: "Vocês entregam formatos para todas as redes?",
    a: "Sim. Planejamos e versionamos para Instagram, TikTok e YouTube (vertical e horizontal), com legendas, títulos e variações por canal.",
  },
  {
    q: "Como funciona o fluxo de aprovação?",
    a: "Trabalhamos em sprints semanais com checklist de qualidade e revisões. Você aprova por lote e nós iteramos com base no desempenho.",
  },
  {
    q: "Vocês usam IA?",
    a: "Sim, como acelerador: transcrição, cortes iniciais, legendas e organização. A curadoria e o acabamento final são humanos para manter padrão premium.",
  },
  {
    q: "Quanto tempo até ver resultado?",
    a: "Em geral, o primeiro sprint já melhora cadência e consistência. Resultados de alcance e conversão ficam mais claros após 3-6 semanas com ajustes orientados por métricas.",
  },
];

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://fayai.shop";

const processSteps = [
  {
    step: "01",
    title: "Discovery & brand kit",
    description: "Analisamos identidade, personas e canais para definir o tom visual e narrativo.",
  },
  {
    step: "02",
    title: "Roteiro & captura",
    description: "Guias de gravação, prompts e modelos de briefing para acelerar produção.",
  },
  {
    step: "03",
    title: "Edição & versionamento",
    description: "Montagem, motion, mixagem, correção de cor e variações por canal.",
  },
  {
    step: "04",
    title: "Entrega & performance",
    description: "Pacote final com legendas, thumbnails, templates e métricas de acompanhamento.",
  },
];

const testimonials = [
  {
    quote:
      "Transformaram nossa rotina de conteúdo. Hoje publicamos diário em 4 canais sem perder qualidade.",
    author: "Marina Torres",
    role: "CMO, VibePay",
    rating: 5,
  },
  {
    quote:
      "O time criou um look & feel cinematográfico para nosso lançamento e cuidou de cada detalhe sonoro.",
    author: "Rafael Lins",
    role: "Head de Conteúdo, Nubia Studios",
    rating: 5,
  },
];

const packages = [
  {
    tier: "Starter",
    title: "Social Clips",
    description: "Calendário quinzenal de vídeos curtos com identidade exclusiva.",
    highlights: [
      "12 vídeos/mês (até 90s)",
      "Legendagem automática + revisão humana",
      "Versões verticais e horizontais",
      "Templates editáveis no Figma/Canva",
    ],
    featured: false,
    cta: {
      label: "Reservar vaga",
      href: "/agendar-consultoria",
    },
  },
  {
    tier: "Pro",
    title: "Content Lab",
    description: "Squad dedicado para creators, squads de marketing e executivos porta-voz.",
    highlights: [
      "30 assets/mês entre cortes e hero videos",
      "Direção remota + roteiro semanal",
      "Pacote motion + sound design",
      "Dashboard com métricas e feedback",
    ],
    featured: true,
    cta: {
      label: "Falar com o time",
      href: "/agendar-consultoria",
    },
  },
  {
    tier: "Enterprise",
    title: "Studios+",
    description: "Produções completas para lançamentos, documentais e assets para TV/OTT.",
    highlights: [
      "Planejamento 360º",
      "Entrega em múltiplos idiomas",
      "Equipe on-site sob demanda",
      "Suporte 24/7 durante go-live",
    ],
    featured: false,
    cta: {
      label: "Solicitar proposta",
      href: "/contato",
    },
  },
];

export default function VideoEditingPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Home.Services.video-editing");
  const isEn = params.locale === "en";

  const serviceUrl = `${SITE_URL}/${params.locale}/servicos/edicao-de-video`;

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: isEn ? "Video Editing & Content Engine" : "Edição de Vídeo & Content Engine",
    url: serviceUrl,
    provider: {
      "@type": "Organization",
      name: "FayAi",
      url: SITE_URL,
    },
    areaServed: "BR",
    serviceType: isEn ? "Video editing" : "Edição de vídeo",
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
      <Script id="ld-video-service" type="application/ld+json">
        {JSON.stringify(serviceLd)}
      </Script>
      <Script id="ld-video-faq" type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
      <main>
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 pointer-events-none" />
          <div className="container mx-auto max-w-6xl relative">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-6 px-4 py-2 text-sm font-medium" variant="secondary">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Conteúdo que causa impacto
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
                  source="video-editing-hero"
                >
                  Montar pipeline de conteúdo
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </ScheduleConsultationButton>
                <a href="#toolbox">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                    {isEn ? "Use the free tools" : "Usar ferramentas grátis"}
                  </Button>
                </a>
              </div>
              <div className="mt-4">
                <Link href="/contato" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  {isEn ? "Get portfolio" : "Receber portfólio"}
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                {["Sem estoque", "Pacotes mensais", "Time híbrido (humano + IA)"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="toolbox" className="py-20 px-4 bg-muted/30 scroll-mt-28">
          <div className="container mx-auto max-w-6xl">
            <VideoToolbox locale={params.locale} />
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {benefits.map((benefit) => (
                <div key={benefit.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                    <benefit.icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{benefit.stat}</div>
                  <div className="text-sm text-muted-foreground">{benefit.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Estúdio completo, zero atrito</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Operamos como o time de vídeo que cria, versiona, publica e mede o desempenho do seu conteúdo.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service.title} className="p-6 hover:shadow-lg transition-shadow border-border bg-card">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Nossa cadência</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Processos em sprints semanais, com quadros de acompanhamento e feedback instantâneo.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((item) => (
                <div key={item.title} className="relative">
                  <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
                Brands e creators que confiam
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Medimos tempo de produção, performance e impacto em comunidade em cada projeto.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.author} className="p-8 border-border bg-card">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, index) => (
                      <Sparkles key={index} className="w-5 h-5 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-lg mb-6 leading-relaxed text-pretty">“{testimonial.quote}”</p>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Planos sob medida</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Escolha o formato ideal para seu volume de produção e canais prioridade.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <Card
                  key={pkg.title}
                  className={`p-8 border ${pkg.featured ? "border-primary shadow-lg relative" : "border-border"} bg-card`}
                >
                  {pkg.featured && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Preferido</Badge>
                  )}
                  <div className="text-sm font-semibold text-primary mb-2">{pkg.tier}</div>
                  <h3 className="text-2xl font-bold mb-4">{pkg.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{pkg.description}</p>
                  <ul className="space-y-3 mb-8">
                    {pkg.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  {pkg.cta.href === "/agendar-consultoria" ? (
                    <ScheduleConsultationButton
                      className="w-full"
                      variant={pkg.featured ? "default" : "outline"}
                      source={`video-editing-package-${pkg.tier.toLowerCase()}`}
                      showCompanyRole
                    >
                      {pkg.cta.label}
                    </ScheduleConsultationButton>
                  ) : (
                    <Link href={pkg.cta.href}>
                      <Button className="w-full" variant={pkg.featured ? "default" : "outline"}>
                        {pkg.cta.label}
                      </Button>
                    </Link>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
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
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <Rocket className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Pronto para o próximo corte?</h2>
              <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
                Em menos de 7 dias montamos um sprint piloto com guidelines, exemplos e calendário aprovado.
              </p>
              <ScheduleConsultationButton
                size="lg"
                className="text-lg px-8 py-6 group"
                source="video-editing-final"
                showCompanyRole
              >
                Planejar produção agora
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </ScheduleConsultationButton>
              <p className="text-sm text-muted-foreground mt-6">
                Inclui diagnóstico gratuito • roadmap de 30 dias • squad dedicado
              </p>
            </Card>
          </div>
        </section>

        <ServiceCartProvider>
          <Suspense fallback={<div className="py-20 text-center">Carregando construtor...</div>}>
            <ServiceBuilderSection
              serviceSlug="video-production"
              restrictToServiceSlug
              badgeLabel="Configurar pipeline"
              title="Monte seu estúdio sob demanda"
              subtitle="Combine story design, captação, edição, motion e pós para criar um pacote perfeito para sua operação."
              sectionId="video-builder"
              showServiceTabs={false}
              source="video-editing-builder"
            />
          </Suspense>
        </ServiceCartProvider>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/80 backdrop-blur md:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">{isEn ? "Video content plan" : "Plano de conteúdo"}</p>
            <p className="text-xs text-muted-foreground">{isEn ? "Free + actionable" : "Grátis + acionável"}</p>
          </div>
          <a href="#toolbox">
            <Button className="px-4" variant="outline">{isEn ? "Tools" : "Ferramentas"}</Button>
          </a>
          <ScheduleConsultationButton source="video-editing-sticky" className="px-4" showCompanyRole>
            {isEn ? "Book" : "Agendar"}
          </ScheduleConsultationButton>
        </div>
      </div>
      <Footer />
    </div>
  );
}
