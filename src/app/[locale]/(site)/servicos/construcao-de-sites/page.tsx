import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle,
  ArrowRight,
  Rocket,
  Globe,
  Layers,
  Shield,
  Monitor,
  Code,
  Zap,
  TrendingUp,
  Palette,
  Compass,
  Blocks,
  Spline,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ScheduleConsultationButton } from "@/components/consultation/ScheduleConsultationButton";
import { ServiceBuilderSection } from "@/components/home/ServiceBuilderSection";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WebsiteToolbox } from "@/components/services/WebsiteToolbox";
import Script from "next/script";

const stats = [
  { icon: TrendingUp, value: "+43%", label: "Conversão média" },
  { icon: Globe, value: "12", label: "Países atendidos" },
  { icon: Zap, value: "95", label: "Performance Lighthouse" },
  { icon: Shield, value: "100%", label: "Uptime monitorado" },
];

const showcases = [
  {
    title: "Bookreator",
    url: "https://bookreator.netlify.app/",
    images: ["/bookreator.png"],
  },
  {
    title: "Ultimate Social Suite",
    url: "https://ultimatesocialsuite.shop/",
    images: ["/ultimate.png"],
  },
  {
    title: "JRG Imóveis",
    url: "https://www.jrgimoveis.com.br/",
    images: ["/jrg.png"],
  },
  {
    title: "AI in Seconds",
    url: "https://ainseconds.shop/",
    images: ["/ainxecond1.png", "/ainxecond2.png", "/ainxecond3.png"],
  },
  {
    title: "Jus Simples",
    url: "https://jusimplespagesale.netlify.app/",
    images: ["/work.png"],
  },
  {
    title: "Esquina da Ilha",
    url: "https://esquinadailha.netlify.app/",
    images: ["/quinadailha.png"],
  },
];

const faqItems = [
  {
    q: "Em quanto tempo fica pronto?",
    a: "Depende do escopo. Landing pages podem ser entregues em 10-20 dias. Sites institucionais normalmente levam 3-6 semanas. Portais e áreas logadas variam conforme integrações e governança.",
  },
  {
    q: "Vocês entregam SEO e performance?",
    a: "Sim. Trabalhamos com performance (Core Web Vitals), SEO técnico, schema e instrumentação (eventos + UTMs) para rastrear conversão desde o dia 1.",
  },
  {
    q: "Dá para eu editar depois?",
    a: "Sim. Podemos entregar com CMS headless e componentes aprovados para você editar com segurança, sem quebrar layout/performance.",
  },
  {
    q: "Integra com CRM e automações?",
    a: "Sim. Integramos com HubSpot/RD/CRMs, automações (n8n/Make) e eventos para atribuição completa.",
  },
];

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://fayai.shop";

const differentiators = [
  {
    icon: Palette,
    title: "Designs imersivos",
    description: "Sistemas visuais proprietários, tipografia premium e microinterações guiadas por UX research.",
  },
  {
    icon: Layers,
    title: "Stack moderna",
    description: "Next.js, edge functions, CMS headless, analytics em tempo real e automações nativas.",
  },
  {
    icon: Compass,
    title: "Estratégia de conteúdo",
    description: "Arquitetura da informação, SEO técnico, roteiros de páginas e componentização para growth.",
  },
  {
    icon: Blocks,
    title: "Infra + segurança",
    description: "CICD automatizado, monitoramento 24/7, backups e políticas de acesso granulares.",
  },
  {
    icon: Spline,
    title: "Integrações",
    description: "HubSpot, RD, Stripe, VTEX, n8n, CRMs proprietários e automações personalizadas.",
  },
  {
    icon: Monitor,
    title: "Dashboard & CMS",
    description: "Editores no-code com componentes aprovados, guard rails e workflows de aprovação.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Blueprint digital",
    description: "Workshops, definição de KPIs, mapa de páginas e inventário de integrações.",
  },
  {
    step: "02",
    title: "Design system",
    description: "Moodboards, tokens, bibliotecas de componentes e protótipos navegáveis.",
  },
  {
    step: "03",
    title: "Construção e QA",
    description: "Desenvolvimento front/back, testes cross-browser, acessibilidade e performance.",
  },
  {
    step: "04",
    title: "Lançamento assistido",
    description: "Cutover, observabilidade, treinamento do time e otimizações contínuas.",
  },
];

const testimonials = [
  {
    quote: "Nosso novo site elevou o posicionamento global. Manteve 99/100 em performance e triplicou os SQLs.",
    author: "Bianca Moreira",
    role: "VP Marketing, VoltPay",
  },
  {
    quote: "Conseguimos lançar landing pages em horas. O CMS headless com componentes aprovados salvou nosso time.",
    author: "Felipe Dornelles",
    role: "Head de Growth, Atena", 
  },
];

const packages = [
  {
    tier: "Sprint",
    title: "Landing express",
    description: "Campanhas, lançamentos e captação com copy + design premium.",
    highlights: [
      "Entrega em até 15 dias",
      "Componentes reutilizáveis",
      "Integração com automações",
      "Monitoramento de performance",
    ],
    cta: { label: "Reservar sprint", href: "/agendar-consultoria" },
  },
  {
    tier: "Scale",
    title: "Site institucional",
    description: "Presença digital completa com CMS e biblioteca de seções.",
    highlights: [
      "Arquitetura de navegação",
      "SEO técnico + schema",
      "Dashboard de métricas",
      "Treinamento do time interno",
    ],
    featured: true,
    cta: { label: "Falar com especialista", href: "/agendar-consultoria" },
  },
  {
    tier: "Orbit",
    title: "Plataformas & portais",
    description: "Áreas logadas, multi-idioma, integrações complexas e governança.",
    highlights: [
      "Squad dedicado",
      "Roadmap trimestral",
      "SLOs e suporte 24/7",
      "Playbooks de evolução",
    ],
    cta: { label: "Solicitar proposta", href: "/contato" },
  },
];

export default function WebsiteBuildingPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Home.Services.website-building");
  const isEn = params.locale === "en";

  const serviceUrl = `${SITE_URL}/${params.locale}/servicos/construcao-de-sites`;

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: isEn ? "Website & Landing Page Development" : "Construção de Sites & Landing Pages",
    url: serviceUrl,
    provider: {
      "@type": "Organization",
      name: "FayAi",
      url: SITE_URL,
    },
    areaServed: "BR",
    serviceType: isEn ? "Website development" : "Desenvolvimento de sites",
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
      <Script id="ld-website-building-service" type="application/ld+json">
        {JSON.stringify(serviceLd)}
      </Script>
      <Script id="ld-website-building-faq" type="application/ld+json">
        {JSON.stringify(faqLd)}
      </Script>
      <main>
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/10 pointer-events-none" />
          <div className="container mx-auto max-w-6xl relative">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-6 px-4 py-2 text-sm font-medium" variant="secondary">
                Sites ultra-performáticos
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
                  source="website-building-hero"
                >
                  Planejar projeto
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </ScheduleConsultationButton>
                <Link href="/contato">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                    Receber estimativa
                  </Button>
                </Link>
              </div>
              <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                {["Stack moderna", "Squad plug-and-play", "Time to value < 30 dias"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-3">FAQ</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">{isEn ? "Questions" : "Perguntas"}</h2>
              <p className="text-muted-foreground mt-3">
                {isEn ? "Clear answers before you start." : "Respostas rápidas antes de começar."}
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

        <section id="toolbox" className="py-20 px-4 bg-muted/30 scroll-mt-28">
          <div className="container mx-auto max-w-6xl">
            <WebsiteToolbox locale={params.locale} />
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
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

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Do discovery ao go-live</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Sites que combinam velocidade, SEO, integrações e storytelling para converter.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {differentiators.map((item) => (
                <Card key={item.title} className="p-6 hover:shadow-lg transition-shadow border-border bg-card">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Trabalhos recentes</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Seleção de produtos digitais lançados pela squad FayAi — landing pages, portais e lojas completos.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {showcases.map((work) => (
                <Card key={work.title} className="overflow-hidden border-border/60 bg-card/80">
                  <div className="relative aspect-video">
                    <Image
                      src={work.images[0]}
                      alt={`Preview do projeto ${work.title}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
                        Website / Produto digital
                      </p>
                      <h3 className="text-xl font-semibold">{work.title}</h3>
                    </div>
                    {work.images.length > 1 && (
                      <div className="grid grid-cols-3 gap-3">
                        {work.images.slice(1).map((thumb) => (
                          <div key={thumb} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/40">
                            <Image src={thumb} alt={`${work.title} tela extra`} fill className="object-cover" sizes="120px" />
                          </div>
                        ))}
                      </div>
                    )}
                    <Link href={work.url} target="_blank" className="inline-flex items-center gap-2 text-primary font-medium">
                      Visitar projeto
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Processo co-criativo</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Cada sprint traz entregas navegáveis, documentação viva e indicadores claros.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((step) => (
                <div key={step.title} className="relative">
                  <div className="text-6xl font-bold text-primary/10 mb-4">{step.step}</div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.author} className="p-8 border-border bg-card">
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
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Formatos flexíveis</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Escolha o pacote certo para o estágio do seu produto digital.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <Card
                  key={pkg.title}
                  className={`p-8 border ${pkg.featured ? "border-primary shadow-lg relative" : "border-border"} bg-card`}
                >
                  {pkg.featured && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Mais pedido</Badge>}
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
                      source={`website-building-package-${pkg.tier.toLowerCase()}`}
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
            <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <Rocket className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Pronto para lançar?</h2>
              <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
                Em 48 horas entregamos blueprint, cronograma e estimativa de investimento para seu novo site.
              </p>
              <ScheduleConsultationButton
                size="lg"
                className="text-lg px-8 py-6 group"
                source="website-building-final"
                showCompanyRole
              >
                Agendar blueprint
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </ScheduleConsultationButton>
              <p className="text-sm text-muted-foreground mt-6">Inclui sessão estratégica + entregáveis em PDF</p>
            </Card>
          </div>
        </section>

        <Suspense fallback={<div className="py-20 text-center">Carregando construtor...</div>}>
          <ServiceBuilderSection
            serviceSlug="website-full"
            restrictToServiceSlug
            badgeLabel="Personalize seu projeto"
            title="Monte seu site sob medida"
            subtitle="Escolha discovery, UX/UI, desenvolvimento, QA e suporte conforme a maturidade do seu produto digital."
            sectionId="builder"
            showServiceTabs={false}
          />
        </Suspense>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/80 backdrop-blur md:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium">{isEn ? "Website blueprint" : "Blueprint do site"}</p>
            <p className="text-xs text-muted-foreground">{isEn ? "Free + actionable" : "Grátis + acionável"}</p>
          </div>
          <a href="#toolbox">
            <Button className="px-4" variant="outline">{isEn ? "Tools" : "Ferramentas"}</Button>
          </a>
          <ScheduleConsultationButton source="website-building-sticky" className="px-4">
            {isEn ? "Book" : "Agendar"}
          </ScheduleConsultationButton>
        </div>
      </div>
      <Footer />
    </div>
  );
}
