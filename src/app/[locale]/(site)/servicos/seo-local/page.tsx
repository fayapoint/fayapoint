import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleConsultationButton } from "@/components/consultation/ScheduleConsultationButton";
import { ServiceBuilderSection } from "@/components/home/ServiceBuilderSection";
import { ArrowRight, MapPin, Star, TrendingUp, Users, Globe, Search } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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
];

export default function LocalSEOPage() {
  const t = useTranslations("Home.Services.local-seo");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-16">
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
              <Link href="/contato">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                  Falar com especialista
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
                <Star className="w-6 h-6 text-yellow-400 mb-4" />
                <h3 className="text-xl font-semibold mb-3">{highlight.title}</h3>
                <p className="text-muted-foreground">{highlight.description}</p>
              </div>
            ))}
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
      <Footer />
    </div>
  );
}
