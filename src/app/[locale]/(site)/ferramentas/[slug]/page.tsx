import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Star, CheckCircle, LinkIcon, BookOpen, Rocket, Shield, AlertTriangle, User, Building2, TrendingUp, MessageCircle } from "lucide-react";
import { toolsData } from "@/data/tools-complete";
import { generatePageMetadata } from "@/lib/metadata";

type Tool = {
  title?: string;
  category?: string;
  vendor?: string;
  pricing?: string;
  rating?: number;
  description?: string;
  detailedDescription?: string;
  impactForIndividuals?: string[];
  impactForEntrepreneurs?: string[];
  impactForCompanies?: string[];
  features?: string[];
  gettingStarted?: string[];
  useCases?: string[];
  integrations?: string[];
  bestPractices?: string[];
  pitfalls?: string[];
  prompts: Array<{ title: string; content: string }>;
  relatedCourses: Array<{ title: string; slug: string; level: string; price: number }>;
  docUrl?: string;
};

const toolsMap: Record<string, Tool> = {
  ...(toolsData as unknown as Record<string, Tool>),
  // Legacy entries for backward compatibility
  dalle: {
    title: "DALL-E 3",
    category: "Imagem",
    vendor: "OpenAI",
    pricing: "Freemium",
    rating: 4.9,
    description: "Geração de imagens com IA integrada ao ChatGPT. Crie visuais instantâneos a partir de descrições.",
    detailedDescription: `DALL-E 3 é o gerador de imagens mais avançado da OpenAI, totalmente integrado ao ecossistema ChatGPT. Transforme ideias em imagens impressionantes instantaneamente.`,
    impactForIndividuals: [
      "🎨 Crie imagens profissionais instantaneamente",
      "💰 Elimine custos com designers para projetos simples",
      "🚀 Visualize ideias imediatamente"
    ],
    impactForEntrepreneurs: [
      "📸 Crie visuais para marketing rapidamente",
      "🎨 Prototipe conceitos visuais",
      "📈 Gere conteúdo visual ilimitado"
    ],
    impactForCompanies: [
      "🎨 Produção visual rápida para apresentações",
      "📊 Conceitos visuais instantâneos",
      "🚀 Marketing visual ágil"
    ],
    features: [
      "Geração de imagens HD",
      "Integrado ao ChatGPT",
      "Múltiplos estilos",
      "Edição e variações"
    ],
    gettingStarted: [
      "Crie uma conta gratuita no ChatGPT",
      "Defina suas Instruções Personalizadas",
      "Salve prompts e crie coleções por tema",
      "Teste modelos e parâmetros (temperature, system prompt)",
    ],
    useCases: [
      "Atendimento e suporte ao cliente",
      "Criação de conteúdo e marketing",
      "Geração de código e revisão",
      "Pesquisa e análise de informações",
    ],
    integrations: ["Zapier", "Make", "n8n", "Notion", "Google Docs", "Slack"],
    bestPractices: [
      "Seja específico sobre persona, objetivo e formato de saída",
      "Dê exemplos (few-shot) e critérios de avaliação",
      "Use etapas numeradas para raciocínio estruturado",
      "Crie prompts reutilizáveis por processo",
    ],
    pitfalls: [
      "Alucinações sem verificação de fontes",
      "Instruções vagas geram respostas genéricas",
      "Falta de contexto histórico sem memória",
    ],
    prompts: [
      { title: "Brief de Conteúdo", content: "Você é um estrategista de conteúdo. Gere um brief detalhado sobre [tema] para [público], incluindo objetivos, estrutura H2/H3 e CTAs." },
      { title: "Refatoração de Código", content: "Aja como senior engineer. Refatore o seguinte código para legibilidade, testes e performance:```[código]```" },
    ],
    relatedCourses: [
      { title: "ChatGPT Masterclass", slug: "chatgpt-masterclass", level: "Todos", price: 197 },
      { title: "Prompt Engineering Avançado", slug: "prompt-engineering", level: "Intermediário", price: 247 },
    ],
    docUrl: "https://platform.openai.com/docs",
  }
  // Note: Other legacy mappings removed to avoid duplication
};

const logoMap: Record<string, string> = {
  "chatgpt": "https://cdn.oaistatic.com/_next/static/media/apple-touch-icon.82af6fe1.png",
  "claude": "https://claude.ai/images/claude_app_icon.png",
  "midjourney": "https://cdn.midjourney.com/logo/logo-midjourney.svg",
  "dall-e": "https://cdn.oaistatic.com/_next/static/media/apple-touch-icon.82af6fe1.png",
  "perplexity": "https://www.perplexity.ai/favicon.svg",
  "gemini": "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  "stable-diffusion": "https://stability.ai/favicon.ico",
  "runwayml": "https://runwayml.com/favicon.ico",
  "elevenlabs": "https://elevenlabs.io/favicon.ico",
  "suno": "https://suno.com/favicon.ico",
  "github-copilot": "https://github.githubassets.com/favicons/favicon.svg",
  "cursor": "https://www.cursor.com/favicon.ico",
  "n8n": "https://n8n.io/favicon.ico",
  "make": "https://www.make.com/en/favicon.ico",
  "zapier": "https://cdn.zappy.app/8d67c00a2da6bb3b23e85d1c38fd2b07.png",
  "flowise": "https://docs.flowiseai.com/img/favicon.ico",
  "notebooklm": "https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7f294ce30.svg",
  "pika-labs": "https://pika.art/pika-logo.png",
  "leonardo": "https://leonardo.ai/favicon.ico",
  "meta-ai": "https://static.xx.fbcdn.net/rsrc.php/yD/r/d4ZIVX-5C-b.ico",
  "mistral": "https://mistral.ai/favicon.ico",
  "grok": "https://x.ai/favicon.ico",
  "deepseek": "https://www.deepseek.com/favicon.ico",
  "cohere": "https://cohere.com/favicon.ico",
  "jasper": "https://www.jasper.ai/favicon.ico",
  "copy-ai": "https://www.copy.ai/favicon.ico",
  "grammarly": "https://www.grammarly.com/favicon.ico",
  "gamma": "https://gamma.app/favicon.ico",
  "tome": "https://tome.app/favicon.ico",
  "beautiful-ai": "https://www.beautiful.ai/favicon.ico",
  "synthesia": "https://www.synthesia.io/favicon.ico",
  "heygen": "https://www.heygen.com/favicon.ico",
  "descript": "https://www.descript.com/favicon.ico",
  "kling": "https://klingai.com/favicon.ico",
  "luma": "https://lumalabs.ai/favicon.ico",
  "replit": "https://replit.com/public/icons/favicon-196.png",
  "v0": "https://v0.dev/favicon.ico",
  "lovable": "https://lovable.dev/favicon.ico",
  "bolt": "https://bolt.new/favicon.ico",
  "windsurf": "https://windsurf.com/favicon.ico",
  "notion-ai": "https://www.notion.so/images/favicon.ico",
  "microsoft-copilot": "https://www.microsoft.com/favicon.ico",
  "google-workspace-ai": "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
  "canva": "https://static.canva.com/static/images/favicon.ico",
  "figma": "https://static.figma.com/app/icon/1/favicon.ico",
  "adobe-firefly": "https://www.adobe.com/favicon.ico",
  "ideogram": "https://ideogram.ai/favicon.ico",
  "hugging-face": "https://huggingface.co/favicon.ico",
  "langchain": "https://python.langchain.com/img/favicon.ico",
  "vercel-ai": "https://vercel.com/favicon.ico",
  "supabase": "https://supabase.com/favicon.ico",
  "pinecone": "https://www.pinecone.io/favicon.ico",
  "slack-ai": "https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png",
  "discord": "https://discord.com/assets/847541504914fd33810e70a0ea73177e.ico",
  "napkin-ai": "https://www.napkin.ai/favicon.ico",
  "claude-code": "https://claude.ai/images/claude_app_icon.png",
};

export async function generateStaticParams() {
  return Object.keys(toolsMap).map((slug) => ({
    slug,
  }));
}

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const tool = toolsMap[slug];

  const title = tool?.title
    ? `${tool.title} - Guia Completo e Cursos | FayAi`
    : "Ferramenta de IA | FayAi";
  
  const description = tool?.description 
    ? `${tool.description} Aprenda a usar ${tool.title} com cursos práticos e tutoriais. ${tool.category} | ${tool.vendor}`
    : "Aprenda a usar ferramentas de IA com cursos práticos e tutoriais da FayAi.";

  return generatePageMetadata({
    locale,
    path: `/ferramentas/${slug}`,
    title,
    description,
  });
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = toolsMap[slug];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {!tool ? (
            <div className="text-center py-20">
              <h1 className="text-3xl font-bold mb-2">Ferramenta não encontrada</h1>
              <p className="text-muted-foreground mb-6">Verifique o endereço ou explore o diretório.</p>
              <Link href="/ferramentas">
                <Button className="bg-amber-600 hover:bg-amber-700">Voltar ao Diretório</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Hero Banner */}
              <div className="relative mb-10 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card border border-border">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent" />
                <div className="relative p-8 md:p-12 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Logo */}
                  {logoMap[slug] && (
                    <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 flex items-center justify-center bg-white dark:bg-secondary/20 rounded-2xl shadow-lg border border-border/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoMap[slug]}
                        alt={`${tool.title} logo`}
                        className="w-12 h-12 md:w-14 md:h-14 object-contain"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/50">{tool.category}</Badge>
                      <Badge variant="outline">{tool.vendor}</Badge>
                      <Badge className="bg-green-600/20 text-green-400 border-green-500/50">{tool.pricing}</Badge>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{tool.title}</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">{tool.description}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="flex items-center gap-1 text-sm"><Star className="text-yellow-400" size={18} /> {tool.rating}</span>
                      {tool.docUrl && (
                        <Link href={tool.docUrl} target="_blank" className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1">
                          <LinkIcon size={14} /> Documentação Oficial
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="p-6 backdrop-blur border-border">
                    <h2 className="text-xl font-semibold mb-3">Sobre {tool.title}</h2>
                    <p className="text-muted-foreground mb-4">{tool.description}</p>
                    {tool.detailedDescription && (
                      <p className="text-muted-foreground text-sm">{tool.detailedDescription}</p>
                    )}
                    <div className="mt-6 flex gap-3">
                      <Link href={`/cursos?search=${encodeURIComponent(tool.title ?? '')}`}>
                        <Button className="bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800">
                          Ver Cursos Relacionados
                        </Button>
                      </Link>
                      <Link href="/aula-gratis">
                        <Button variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-500/10">
                          Assistir Aula Grátis
                        </Button>
                      </Link>
                    </div>
                  </Card>

                  {/* Impact Section */}
                  {(tool.impactForIndividuals || tool.impactForEntrepreneurs || tool.impactForCompanies) && (
                    <div className="grid md:grid-cols-3 gap-4">
                      {tool.impactForIndividuals && (
                        <Card className="p-4 backdrop-blur border-amber-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <User className="text-amber-400" size={20} />
                            <h3 className="font-semibold">Para Você</h3>
                          </div>
                          <ul className="space-y-2">
                            {(tool.impactForIndividuals || []).slice(0, 3).map((impact: string, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground">{impact}</li>
                            ))}
                          </ul>
                        </Card>
                      )}
                      {tool.impactForEntrepreneurs && (
                        <Card className="p-4 backdrop-blur border-amber-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="text-amber-400" size={20} />
                            <h3 className="font-semibold">Para Empreendedores</h3>
                          </div>
                          <ul className="space-y-2">
                            {(tool.impactForEntrepreneurs || []).slice(0, 3).map((impact: string, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground">{impact}</li>
                            ))}
                          </ul>
                        </Card>
                      )}
                      {tool.impactForCompanies && (
                        <Card className="p-4 backdrop-blur border-amber-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="text-amber-400" size={20} />
                            <h3 className="font-semibold">Para Empresas</h3>
                          </div>
                          <ul className="space-y-2">
                            {(tool.impactForCompanies || []).slice(0, 3).map((impact: string, i: number) => (
                              <li key={i} className="text-xs text-muted-foreground">{impact}</li>
                            ))}
                          </ul>
                        </Card>
                      )}
                    </div>
                  )}

                  <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-popover/50 border border-border">
                      <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                      <TabsTrigger value="getting">Primeiros Passos</TabsTrigger>
                      <TabsTrigger value="integrations">Integrações</TabsTrigger>
                      <TabsTrigger value="prompts">Prompts</TabsTrigger>
                      <TabsTrigger value="courses">Cursos</TabsTrigger>
                      <TabsTrigger value="faq">FAQ</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                      <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-6 backdrop-blur border-border">
                          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Rocket size={18} /> Capacidades</h3>
                          <ul className="space-y-2">
                            {(tool.features || []).map((f: string, i: number) => (
                              <li key={i} className="flex items-center gap-2"><CheckCircle className="text-green-400" size={18} /> {f}</li>
                            ))}
                          </ul>
                        </Card>
                        <Card className="p-6 backdrop-blur border-border">
                          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><BookOpen size={18} /> Casos de Uso</h3>
                          <ul className="space-y-2">
                            {(tool.useCases || []).map((u: string, i: number) => (
                              <li key={i} className="list-disc list-inside text-muted-foreground">{u}</li>
                            ))}
                          </ul>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="getting">
                      <Card className="p-6 backdrop-blur border-border">
                        <h3 className="text-xl font-semibold mb-4">Como começar</h3>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                          {(tool.gettingStarted || []).map((s: string, i: number) => (<li key={i}>{s}</li>))}
                        </ol>
                      </Card>
                    </TabsContent>

                    <TabsContent value="integrations">
                      <Card className="p-6 backdrop-blur border-border">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><LinkIcon size={18} /> Integrações</h3>
                        <div className="flex flex-wrap gap-2">
                          {(tool.integrations || []).map((name: string) => (
                            <Badge key={name} variant="outline" className="border-amber-500/30">{name}</Badge>
                          ))}
                        </div>
                      </Card>
                    </TabsContent>

                    <TabsContent value="prompts">
                      <Card className="p-6 backdrop-blur border-border">
                        <h3 className="text-xl font-semibold mb-4">Prompts Recomendados</h3>
                        <div className="space-y-4">
                          {(tool.prompts?.length ?? 0) === 0 && (
                            <p className="text-muted-foreground">Prompts em breve.</p>
                          )}
                          {(tool.prompts || []).map((p: {title: string; content: string}, i: number) => (
                            <div key={i} className="border border-border rounded-lg p-4">
                              <h4 className="font-semibold mb-2">{p.title}</h4>
                              <pre className="text-sm whitespace-pre-wrap text-muted-foreground">{p.content}</pre>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </TabsContent>

                    <TabsContent value="courses">
                      <div className="grid md:grid-cols-2 gap-6">
                        {(tool.relatedCourses?.length ?? 0) === 0 && (
                          <Card className="p-6 backdrop-blur border-border">Sem cursos relacionados no momento.</Card>
                        )}
                        {(tool.relatedCourses || []).map((c: {slug: string; title: string; level: string; price: number}) => (
                          <Link key={c.slug} href={`/curso/${c.slug}`}>
                            <Card className="p-6 backdrop-blur border-border hover:bg-card/80 transition">
                              <Badge variant="outline" className="mb-2 text-xs">{c.level}</Badge>
                              <h4 className="font-semibold">{c.title}</h4>
                              <p className="text-sm text-muted-foreground mt-2">R$ {c.price.toLocaleString("pt-BR")}</p>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="faq">
                      <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-6 backdrop-blur border-border">
                          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><Shield size={18} /> Boas práticas</h3>
                          <ul className="space-y-2 text-muted-foreground">
                            {(tool.bestPractices || []).map((b: string, i: number) => (<li key={i} className="list-disc list-inside">{b}</li>))}
                          </ul>
                        </Card>
                        <Card className="p-6 backdrop-blur border-border">
                          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><AlertTriangle size={18} /> Armadilhas comuns</h3>
                          <ul className="space-y-2 text-muted-foreground">
                            {(tool.pitfalls || []).map((p: string, i: number) => (<li key={i} className="list-disc list-inside">{p}</li>))}
                          </ul>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Free Class CTA Banner */}
                  <Card className="p-8 bg-gradient-to-r from-amber-600/20 via-primary/10 to-amber-600/20 border-amber-500/30 text-center">
                    <h3 className="text-2xl font-bold mb-2">Comece Grátis com {tool.title}</h3>
                    <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
                      Assista nossa aula gratuita e descubra como usar {tool.title} para transformar seu trabalho e aumentar sua produtividade.
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap">
                      <Link href="/aula-gratis">
                        <Button size="lg" className="bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800">
                          Assistir Aula Grátis
                        </Button>
                      </Link>
                      <Link href={`/cursos?search=${encodeURIComponent(tool.title ?? '')}`}>
                        <Button size="lg" variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-500/10">
                          Ver Todos os Cursos
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="p-6 backdrop-blur border-border">
                    <h3 className="text-lg font-semibold mb-3">Resumo Rápido</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>Categoria: <span className="text-gray-100">{tool.category}</span></div>
                      <div>Fornecedor: <span className="text-gray-100">{tool.vendor}</span></div>
                      <div>Preço: <span className="text-gray-100">{tool.pricing}</span></div>
                      <div>Avaliação: <span className="text-gray-100">{tool.rating}</span></div>
                    </div>
                    <Separator className="my-4 bg-border" />
                    <div className="space-y-2">
                      <h4 className="font-semibold">Integrações populares</h4>
                      <div className="flex flex-wrap gap-2">
                        {(tool.integrations || []).slice(0, 6).map((i: string) => (
                          <Badge key={i} variant="outline" className="border-amber-500/30">{i}</Badge>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-primary/15 to-accent/10 border-amber-500/30">
                    <h3 className="text-xl font-semibold mb-2">Aprenda {tool.title} de forma prática</h3>
                    <p className="text-muted-foreground mb-4">Cursos com projetos do mundo real, templates e certificado.</p>
                    <Link href={`/cursos?search=${encodeURIComponent(tool.title ?? '')}`}>
                      <Button className="bg-amber-600 hover:bg-amber-700">Ver cursos</Button>
                    </Link>
                  </Card>

                  {/* Request a Course CTA */}
                  <Card className="p-6 border-border bg-gradient-to-br from-card to-secondary/30">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle className="text-green-400" size={20} />
                      <h3 className="text-lg font-semibold">Quer um curso de {tool.title}?</h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">
                      Ainda não temos um curso específico? Solicite e nós criamos! Conte-nos o que você precisa aprender.
                    </p>
                    <Link
                      href={`https://wa.me/5511999999999?text=${encodeURIComponent(`Olá! Gostaria de solicitar um curso sobre ${tool.title}. Tenho interesse em aprender mais sobre essa ferramenta.`)}`}
                      target="_blank"
                    >
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <MessageCircle className="mr-2" size={16} />
                        Solicitar Curso via WhatsApp
                      </Button>
                    </Link>
                    <Link href="/contato" className="block mt-2">
                      <Button variant="outline" className="w-full border-border text-muted-foreground hover:text-foreground">
                        Ou envie um e-mail
                      </Button>
                    </Link>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
