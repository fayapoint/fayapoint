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

type ProjectMetric = {
  label: string;
  value: string;
};

type RealizadoProject = {
  id: string;
  title: string;
  client: string;
  industry: string;
  timeframe: string;
  description: string;
  highlights: string[];
  metrics: ProjectMetric[];
  stack: string[];
};

const impactMetrics = [
  { label: "Projetos entregues", value: "68+", icon: Layers },
  { label: "Tempo médio p/ ROI", value: "42 dias", icon: Clock4 },
  { label: "Processos automatizados", value: "210+", icon: BarChart3 },
  { label: "Setores atendidos", value: "14", icon: Building2 },
];

const projectCollections: Array<{
  title: string;
  description: string;
  projects: RealizadoProject[];
}> = [
  {
    title: "IA + Automação",
    description: "Agentes e fluxos que reduzem custo operacional e ampliam atendimento.",
    projects: [
      {
        id: "atlas-support-ai",
        title: "Atlas Seguros • Operação de Suporte com IA",
        client: "Atlas Seguros",
        industry: "Financeiro",
        timeframe: "8 semanas",
        description:
          "Criamos um hub de automação conectando WhatsApp, Freshdesk e n8n com agentes de IA treinados no conhecimento da corretora.",
        highlights: [
          "Agente multilíngue com roteamento inteligente",
          "Alertas proativos quando um humano precisa assumir",
        ],
        metrics: [
          { label: "Tempo de resposta", value: "-65%" },
          { label: "CSAT", value: "+32%" },
          { label: "Automação", value: "78% tickets" },
        ],
        stack: ["OpenAI", "n8n", "Freshdesk", "MongoDB"],
      },
      {
        id: "aurora-learning-agent",
        title: "Aurora Educação • Tutor AI",
        client: "Aurora Educação",
        industry: "Educação",
        timeframe: "6 semanas",
        description:
          "Assistente personalizado integrado ao LMS que acompanha o progresso dos alunos e gera relatórios para os mentores.",
        highlights: ["Experiência multimodal", "Painel com insights semanais"],
        metrics: [
          { label: "Retenção", value: "+21%" },
          { label: "Tempo de mentoria", value: "-12h/sem" },
        ],
        stack: ["Next.js", "Supabase", "LangChain", "Whisper"],
      },
    ],
  },
  {
    title: "SaaS & Produtos Digitais",
    description: "Plataformas completas com dashboards, billing e onboarding assistido.",
    projects: [
      {
        id: "flux-orchestrator",
        title: "Flux Orchestrator • Plataforma B2B",
        client: "VertexOps",
        industry: "SaaS",
        timeframe: "10 semanas",
        description:
          "Aplicação multi-tenant que conecta Salesforce, Notion e Slack para squads de operações com automação baseada em eventos.",
        highlights: ["Arquitetura multi-região", "Biblioteca de componentes white-label"],
        metrics: [
          { label: "Onboarding", value: "-30 dias" },
          { label: "MRR", value: "+18%" },
        ],
        stack: ["Next.js", "Prisma", "PostgreSQL", "Segment"],
      },
      {
        id: "omni-commerce",
        title: "Omni Commerce • Hub de produtos digitais",
        client: "RumoX",
        industry: "Varejo",
        timeframe: "9 semanas",
        description:
          "Marketplace headless com CMS proprietário, pagamentos recorrentes e área de parceiros.",
        highlights: ["Design system proprietário", "Integração com VTEX e Tiny"],
        metrics: [
          { label: "Conversão", value: "+27%" },
          { label: "Ticket médio", value: "+19%" },
        ],
        stack: ["Next.js", "Stripe", "Directus", "Redis"],
      },
      {
        id: "talent-scout",
        title: "Talent Scout • Marketplace de creators",
        client: "SparkClub",
        industry: "Economia criativa",
        timeframe: "7 semanas",
        description:
          "Plataforma que conecta marcas a creators com match baseado em IA e automação de contratos.",
        highlights: ["Motor de recomendações", "Assinatura via DocuSign"],
        metrics: [
          { label: "Matching", value: "+2.4x" },
          { label: "Tempo de proposta", value: "-72%" },
        ],
        stack: ["Next.js", "Neo4j", "Plaid", "Zapier"],
      },
    ],
  },
  {
    title: "Experiências Imersivas",
    description: "Brand experiences, portais e command centers para líderes digitais.",
    projects: [
      {
        id: "cortex-command",
        title: "Cortex Labs • Command Center",
        client: "Cortex Labs",
        industry: "Indústria 4.0",
        timeframe: "6 semanas",
        description:
          "Dashboard imersivo para monitorar KPIs de fábricas com alertas e copiloto que sugere ações.",
        highlights: ["TV wall em tempo real", "Playbooks interativos"],
        metrics: [
          { label: "Alertas críticos", value: "-43%" },
          { label: "Precisão preditiva", value: "+18%" },
        ],
        stack: ["Next.js", "Pandas", "PowerBI", "Azure"],
      },
      {
        id: "lumina-experience",
        title: "Lumina • Portal de inovação",
        client: "Lumina Ventures",
        industry: "Venture Capital",
        timeframe: "5 semanas",
        description:
          "Site editorial com biblioteca de deals, seção de pesquisas e integração a um mini CRM.",
        highlights: ["Pesquisa semântica", "Publicação colaborativa"],
        metrics: [
          { label: "Assinantes", value: "+12k" },
          { label: "MQL qualificados", value: "+34%" },
        ],
        stack: ["Next.js", "Contentful", "Algolia", "HubSpot"],
      },
    ],
  },
];

const deliveryPillars = [
  {
    title: "Blueprint & discovery",
    description:
      "Workshops executivos, levantamento de dados e definição de KPIs guiada por mais de 20 frameworks proprietários.",
  },
  {
    title: "Execução guiada",
    description:
      "Squad híbrida (produto + engenharia + AI) operando em sprints com entregas navegáveis e documentação viva.",
  },
  {
    title: "Operação assistida",
    description:
      "Monitoramento, treinamentos e playbooks com foco em capacitar o time do cliente a evoluir o ativo digital.",
  },
];

const testimonialHighlights = [
  {
    quote:
      "A FayaPoint assumiu nosso backlog crítico e em 60 dias entregou um portal inteiro com IA embarcada. Hoje conseguimos testar novas ideias toda semana.",
    author: "Carla Ramos",
    role: "COO, SparkClub",
  },
  {
    quote:
      "Escalar o suporte com agentes inteligentes era prioridade. Reduzimos o tempo de resposta em 65% e os clientes notaram imediatamente.",
    author: "Leandro Vilela",
    role: "Head de CX, Atlas Seguros",
  },
];

export default function CasesPage() {
  const t = useTranslations("Cases");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24">
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
                <Card key={metric.label} className="bg-card/70 border-border/60 p-6">
                  <metric.icon className="w-6 h-6 text-primary mb-4" />
                  <p className="text-3xl font-semibold">{metric.value}</p>
                  <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mt-2">
                    {metric.label}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
              <div className="max-w-3xl">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
                  Projetos realizados
                </h2>
                <p className="text-lg text-muted-foreground">
                  Selecionamos cases que nasceram do nosso banco &quot;realizados&quot; — iniciativas completas,
                  com métricas acompanhadas e handoff pronto para o time do cliente.
                </p>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className="text-xs uppercase tracking-widest">
                  Operações, educação, varejo, SaaS e mais
                </Badge>
              </div>
            </div>

            <div className="space-y-16">
              {projectCollections.map((collection) => (
                <div key={collection.title} className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold">{collection.title}</h3>
                      <p className="text-muted-foreground max-w-2xl">{collection.description}</p>
                    </div>
                  </div>
                  <div className="grid gap-8 md:grid-cols-2">
                    {collection.projects.map((project) => (
                      <Card key={project.id} className="border-border/60 bg-card/70 p-8 flex flex-col">
                        <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
                          <Target className="w-4 h-4" />
                          {project.industry} • {project.timeframe}
                        </div>
                        <h4 className="text-2xl font-semibold mb-2 text-balance">{project.title}</h4>
                        <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                          {project.client}
                        </p>
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                          {project.description}
                        </p>
                        <ul className="space-y-2 text-sm mb-6">
                          {project.highlights.map((highlight) => (
                            <li key={highlight} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                          {project.metrics.map((metric) => (
                            <div key={metric.label} className="rounded-2xl border border-border/60 px-4 py-3">
                              <p className="text-2xl font-semibold">{metric.value}</p>
                              <p className="text-muted-foreground text-xs uppercase tracking-widest mt-1">
                                {metric.label}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {project.stack.map((tool) => (
                            <span key={tool} className="px-3 py-1 rounded-full border border-border/60">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Como entregamos</h2>
              <p className="text-lg text-muted-foreground">
                Todo realizado nasce de um playbook testado em +60 execuções, sempre com squad dedicado e indicadores claros.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {deliveryPillars.map((pillar, index) => (
                <Card key={pillar.title} className="border-border/60 bg-background/80 p-8">
                  <div className="text-6xl font-bold text-primary/10 mb-4">
                    {(index + 1).toString().padStart(2, "0")}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">{pillar.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-border/60 bg-card/70 p-10">
                <div className="flex items-center gap-3 mb-6 text-sm uppercase tracking-widest text-muted-foreground">
                  <LineChart className="w-5 h-5" />
                  Indicadores que acompanhamos
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { label: "Tempo até valor", value: "< 6 semanas" },
                    { label: "Adoção do time", value: "92%" },
                    { label: "Qualidade do handoff", value: "9.6/10" },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-2xl font-semibold">{item.value}</p>
                      <p className="text-sm text-muted-foreground mt-2">{item.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="border-border/60 bg-card/70 p-10 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Squad plug-and-play</h3>
                  <p className="text-muted-foreground mb-6">
                    Estrategista, lead de produto, engenheiro AI e designer se conectam ao seu time para acelerar entregas e transferir conhecimento.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Users className="w-5 h-5" />
                  4-7 especialistas disponíveis full-time durante o ciclo
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-8">
              {testimonialHighlights.map((testimonial) => (
                <Card key={testimonial.author} className="border-border/60 bg-card/70 p-8">
                  <p className="text-lg leading-relaxed mb-6">“{testimonial.quote}”</p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <MapPinned className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
                Quer ver um realizado no seu setor?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Enviamos um dossiê com diagnóstico, estimativa de esforço e quais ativos digitais podemos construir em até 90 dias.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ScheduleConsultationButton
                  size="lg"
                  className="gap-2"
                  source="cases-final"
                  showCompanyRole
                >
                  <ArrowRight className="w-5 h-5" />
                  Agendar diagnóstico
                </ScheduleConsultationButton>
                <Link href="/contato">
                  <Button size="lg" variant="outline">
                    Receber portfólio completo
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
