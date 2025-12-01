import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Star, CheckCircle, LinkIcon, BookOpen, Rocket, Shield, AlertTriangle, User, Building2, TrendingUp } from "lucide-react";
import { toolsData } from "@/data/tools-complete";

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

export async function generateStaticParams() {
  return Object.keys(toolsMap).map((slug) => ({
    slug,
  }));
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
              <p className="text-gray-400 mb-6">Verifique o endereço ou explore o diretório.</p>
              <Link href="/ferramentas">
                <Button className="bg-purple-600 hover:bg-purple-700">Voltar ao Diretório</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/50">{tool.category}</Badge>
                  <Badge variant="outline">{tool.vendor}</Badge>
                  <Badge className="bg-green-600/20 text-green-400 border-green-500/50">{tool.pricing}</Badge>
                </div>
                <h1 className="text-4xl font-bold mb-2">{tool.title}</h1>
                <div className="flex items-center gap-3 text-gray-400">
                  <span className="flex items-center gap-1"><Star className="text-yellow-400" size={18} /> {tool.rating}</span>
                  {tool.docUrl ? (
                    <Link href={tool.docUrl} target="_blank" className="text-purple-400 hover:text-purple-300">Documentação Oficial</Link>
                  ) : null}
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="p-6 backdrop-blur border-border">
                    <h2 className="text-xl font-semibold mb-3">Sobre {tool.title}</h2>
                    <p className="text-gray-300 mb-4">{tool.description}</p>
                    {tool.detailedDescription && (
                      <p className="text-gray-400 text-sm">{tool.detailedDescription}</p>
                    )}
                    <div className="mt-6 flex gap-3">
                      <Link href={`/cursos?search=${encodeURIComponent(tool.title ?? '')}`}>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          Ver Cursos Relacionados
                        </Button>
                      </Link>
                      <Link href="/aula-gratis">
                        <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
                          Assistir Aula Grátis
                        </Button>
                      </Link>
                    </div>
                  </Card>

                  {/* Impact Section */}
                  {(tool.impactForIndividuals || tool.impactForEntrepreneurs || tool.impactForCompanies) && (
                    <div className="grid md:grid-cols-3 gap-4">
                      {tool.impactForIndividuals && (
                        <Card className="p-4 backdrop-blur border-purple-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <User className="text-purple-400" size={20} />
                            <h3 className="font-semibold">Para Você</h3>
                          </div>
                          <ul className="space-y-2">
                            {(tool.impactForIndividuals || []).slice(0, 3).map((impact: string, i: number) => (
                              <li key={i} className="text-xs text-gray-300">{impact}</li>
                            ))}
                          </ul>
                        </Card>
                      )}
                      {tool.impactForEntrepreneurs && (
                        <Card className="p-4 backdrop-blur border-purple-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="text-purple-400" size={20} />
                            <h3 className="font-semibold">Para Empreendedores</h3>
                          </div>
                          <ul className="space-y-2">
                            {(tool.impactForEntrepreneurs || []).slice(0, 3).map((impact: string, i: number) => (
                              <li key={i} className="text-xs text-gray-300">{impact}</li>
                            ))}
                          </ul>
                        </Card>
                      )}
                      {tool.impactForCompanies && (
                        <Card className="p-4 backdrop-blur border-purple-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Building2 className="text-purple-400" size={20} />
                            <h3 className="font-semibold">Para Empresas</h3>
                          </div>
                          <ul className="space-y-2">
                            {(tool.impactForCompanies || []).slice(0, 3).map((impact: string, i: number) => (
                              <li key={i} className="text-xs text-gray-300">{impact}</li>
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
                              <li key={i} className="list-disc list-inside text-gray-300">{u}</li>
                            ))}
                          </ul>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="getting">
                      <Card className="p-6 backdrop-blur border-border">
                        <h3 className="text-xl font-semibold mb-4">Como começar</h3>
                        <ol className="list-decimal list-inside space-y-2 text-gray-300">
                          {(tool.gettingStarted || []).map((s: string, i: number) => (<li key={i}>{s}</li>))}
                        </ol>
                      </Card>
                    </TabsContent>

                    <TabsContent value="integrations">
                      <Card className="p-6 backdrop-blur border-border">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><LinkIcon size={18} /> Integrações</h3>
                        <div className="flex flex-wrap gap-2">
                          {(tool.integrations || []).map((name: string) => (
                            <Badge key={name} variant="outline" className="border-purple-500/30">{name}</Badge>
                          ))}
                        </div>
                      </Card>
                    </TabsContent>

                    <TabsContent value="prompts">
                      <Card className="p-6 backdrop-blur border-border">
                        <h3 className="text-xl font-semibold mb-4">Prompts Recomendados</h3>
                        <div className="space-y-4">
                          {(tool.prompts?.length ?? 0) === 0 && (
                            <p className="text-gray-400">Prompts em breve.</p>
                          )}
                          {(tool.prompts || []).map((p: {title: string; content: string}, i: number) => (
                            <div key={i} className="border border-gray-800 rounded-lg p-4">
                              <h4 className="font-semibold mb-2">{p.title}</h4>
                              <pre className="text-sm whitespace-pre-wrap text-gray-300">{p.content}</pre>
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
                              <p className="text-sm text-gray-400 mt-2">R$ {c.price.toLocaleString("pt-BR")}</p>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="faq">
                      <div className="grid md:grid-cols-2 gap-6">
                        <Card className="p-6 backdrop-blur border-border">
                          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><Shield size={18} /> Boas práticas</h3>
                          <ul className="space-y-2 text-gray-300">
                            {(tool.bestPractices || []).map((b: string, i: number) => (<li key={i} className="list-disc list-inside">{b}</li>))}
                          </ul>
                        </Card>
                        <Card className="p-6 backdrop-blur border-border">
                          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><AlertTriangle size={18} /> Armadilhas comuns</h3>
                          <ul className="space-y-2 text-gray-300">
                            {(tool.pitfalls || []).map((p: string, i: number) => (<li key={i} className="list-disc list-inside">{p}</li>))}
                          </ul>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="space-y-6">
                  <Card className="p-6 backdrop-blur border-border">
                    <h3 className="text-lg font-semibold mb-3">Resumo Rápido</h3>
                    <div className="space-y-2 text-sm text-gray-300">
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
                          <Badge key={i} variant="outline" className="border-purple-500/30">{i}</Badge>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-primary/15 to-accent/10 border-purple-500/30">
                    <h3 className="text-xl font-semibold mb-2">Aprenda {tool.title} de forma prática</h3>
                    <p className="text-gray-300 mb-4">Cursos com projetos do mundo real, templates e certificado.</p>
                    <Link href={`/cursos?search=${encodeURIComponent(tool.title ?? '')}`}>
                      <Button className="bg-purple-600 hover:bg-purple-700">Ver cursos</Button>
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
