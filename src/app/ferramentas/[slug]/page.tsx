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

const toolsMap: Record<string, any> = {
  ...toolsData,
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

// Old duplicate entries removed - using main toolsData instead
const oldToolsMap = {
  "old-claude": {
    category: "IA Conversacional",
    vendor: "Anthropic",
    pricing: "Freemium",
    rating: 4.9,
    description: "IA com foco em segurança e janelas de contexto extensas. Excelente para análise de documentos e programação.",
    features: ["Contexto longo", "Raciocínio forte", "Ferramentas/funcalls", "Foco em segurança"],
    gettingStarted: ["Crie conta", "Teste modelos Claude", "Configure tool use", "Integre com seu fluxo (API)"],
    useCases: ["Análise de contratos", "Resumo de pesquisas", "Code review", "Assistente interno"],
    integrations: ["n8n", "Slack", "GitHub", "Notion"],
    bestPractices: ["Divida tarefas em etapas", "Use doc snippets", "Reforce critérios de qualidade"],
    pitfalls: ["Timeouts com arquivos grandes", "Custo/latência em contextos gigantes"],
    prompts: [
      { title: "Análise de Documento", content: "Você é analista jurídico. Leia o contrato abaixo e gere um resumo com riscos, prazos e cláusulas críticas:```[trechos]```" },
    ],
    relatedCourses: [],
    detailedDescription: "DALL-E é o gerador de imagens da OpenAI, integrado ao ecossistema ChatGPT.",
    impactForIndividuals: ["Crie imagens instantâneas", "Explore criatividade", "Gere arte única"],
    impactForEntrepreneurs: ["Crie visuais para marketing", "Prototipe ideias", "Gere conteúdo visual"],
    impactForCompanies: ["Produção visual rápida", "Conceitos visuais", "Marketing visual"],
    docUrl: "https://openai.com/dall-e"
  },
  "dall-e": {
    title: "Gemini",
    category: "IA Conversacional",
    vendor: "Google",
    pricing: "Gratuito",
    rating: 4.7,
    description: "IA multimodal com integração ao ecossistema Google (Docs, Drive).",
    features: ["Multimodal", "Integração Google", "Ferramentas"],
    gettingStarted: ["Ative Gemini", "Teste prompts multimodais", "Integre com Apps Script"],
    useCases: ["Resumo de reuniões", "Auxílio em planilhas", "Geração de imagens"],
    integrations: ["Google Workspace", "Firebase", "Apps Script"],
    bestPractices: ["Defina formatos (tabelas)", "Combine texto e imagens"],
    pitfalls: ["Limites por região", "APIs em evolução"],
    prompts: [{ title: "Resumo de Reunião", content: "Resuma esta transcrição com decisões e responsáveis:```[texto]```" }],
    relatedCourses: [{ title: "Google Gemini Essencial", slug: "gemini-essencial", level: "Iniciante", price: 97 }],
  },
  perplexity: {
    title: "Perplexity",
    category: "Pesquisa",
    vendor: "Perplexity",
    pricing: "Freemium",
    rating: 4.8,
    description: "Pesquisa com fontes verificáveis e respostas objetivas.",
    features: ["Citações", "Atualidade", "Coleções"],
    gettingStarted: ["Crie conta", "Pesquise com follow-ups", "Salve coleções"],
    useCases: ["Pesquisa de mercado", "Revisão sistemática", "News tracking"],
    integrations: ["Zapier", "Make"],
    bestPractices: ["Peça links e datas", "Itere com follow-ups"],
    pitfalls: ["Fontes por paywall", "Limites em queries longas"],
    prompts: [{ title: "Pesquisa Guiada", content: "Faça uma revisão sobre [tema] com fontes confiáveis, datas e resumo crítico." }],
    relatedCourses: [{ title: "Pesquisa Avançada com IA", slug: "perplexity-pesquisa", level: "Iniciante", price: 67 }],
  },
  midjourney: {
    title: "Midjourney",
    category: "Imagem",
    vendor: "Midjourney",
    pricing: "Pago",
    rating: 4.8,
    description: "Geração de imagens de alto nível para arte e design.",
    features: ["Styles", "Parameters", "Consistência"],
    gettingStarted: ["Assine", "Entre no Discord", "Teste prompts básicos", "Explore styles"],
    useCases: ["Direção de arte", "Branding", "Conceitos visuais"],
    integrations: ["Discord", "Photoshop"],
    bestPractices: ["Use referências visuais", "Controle parâmetros"],
    pitfalls: ["Aspectos éticos de estilo", "Consistência de personagens"],
    prompts: [{ title: "Estilo Cinematográfico", content: "[tema], cinematic lighting, 35mm, depth of field, --ar 3:2 --v 6 --stylize 400" }],
    relatedCourses: [{ title: "Midjourney Masterclass", slug: "midjourney-masterclass", level: "Intermediário", price: 147 }],
  },
  "stable-diffusion": {
    title: "Stable Diffusion",
    category: "Imagem",
    vendor: "Stability AI",
    pricing: "Open Source",
    rating: 4.6,
    description: "Pipeline open-source para geração de imagens com alto controle.",
    features: ["Checkpoint models", "LoRAs", "ControlNet"],
    gettingStarted: ["Instale o Automatic1111 ou ComfyUI", "Baixe modelos", "Teste ControlNet"],
    useCases: ["Design", "Produto", "Arte procedural"],
    integrations: ["ComfyUI", "Automatic1111"],
    bestPractices: ["Gerencie versões", "Documente seeds"],
    pitfalls: ["Configuração complexa", "Uso de GPU"],
    prompts: [{ title: "Produto", content: "photo of [produto], studio lighting, 8k, ultra-detailed, --seed 1234" }],
    relatedCourses: [{ title: "Stable Diffusion Essencial", slug: "stable-diffusion-essencial", level: "Intermediário", price: 147 }],
  },
  leonardo: {
    title: "Leonardo AI",
    category: "Imagem",
    vendor: "Leonardo",
    pricing: "Freemium",
    rating: 4.7,
    description: "Ferramenta prática para gerar imagens com presets e modelos prontos.",
    features: ["Presets", "Canvas", "Modelos próprios"],
    gettingStarted: ["Crie conta", "Use presets", "Ajuste parâmetros"],
    useCases: ["E-commerce", "Social media", "Thumbnail"],
    integrations: ["Canva"],
    bestPractices: ["Itere variações", "Biblioteca de presets"],
    pitfalls: ["Limites de créditos"],
    prompts: [{ title: "Packshots", content: "[produto], background branco, high-key, sombras suaves" }],
    relatedCourses: [{ title: "Leonardo AI para Criadores", slug: "leonardo", level: "Iniciante", price: 97 }],
  },
  n8n: {
    title: "n8n",
    category: "Automação",
    vendor: "n8n",
    pricing: "Open Source",
    rating: 4.8,
    description: "Automação visual com nós, webhooks e integrações.",
    features: ["Self-host", "Nodes", "Webhooks"],
    gettingStarted: ["Crie conta/cloud ou docker", "Monte primeiro fluxo", "Teste webhooks"],
    useCases: ["Marketing automation", "Ops", "Chatbots"],
    integrations: ["OpenAI", "Slack", "Google Sheets", "CRMs"],
    bestPractices: ["Versione fluxos", "Log e retries"],
    pitfalls: ["Manutenção de instância", "Rate limits"],
    prompts: [],
    relatedCourses: [{ title: "Automação com n8n", slug: "automacao-n8n", level: "Intermediário", price: 297 }],
  },
  make: {
    title: "Make",
    category: "Automação",
    vendor: "Make",
    pricing: "Pago",
    rating: 4.5,
    description: "Automação visual com centenas de integrações.",
    features: ["Cenários", "Integrações"],
    gettingStarted: ["Crie conta", "Monte cenário", "Teste gatilhos"],
    useCases: ["Relatórios", "CRM", "Leads"],
    integrations: ["Gmail", "Drive", "CRMs"],
    bestPractices: ["Tratamento de erros", "Paginação"],
    pitfalls: ["Custos por operações"],
    prompts: [],
    relatedCourses: [],
  },
  zapier: {
    title: "Zapier",
    category: "Automação",
    vendor: "Zapier",
    pricing: "Pago",
    rating: 4.4,
    description: "Automação simples para apps SaaS.",
    features: ["Zaps", "Triggers", "Multi-step"],
    gettingStarted: ["Crie conta", "Conecte apps", "Crie primeiro Zap"],
    useCases: ["Leads", "Notificações", "Planilhas"],
    integrations: ["Gmail", "Sheets", "Slack"],
    bestPractices: ["Nomeie zaps claramente", "Documente dependências"],
    pitfalls: ["Limites de tarefas"],
    prompts: [],
    relatedCourses: [],
  },
  flowise: {
    title: "Flowise",
    category: "Low-code",
    vendor: "Flowise",
    pricing: "Open Source",
    rating: 4.6,
    description: "Construa chatbots e pipelines de LLMs com interface visual.",
    features: ["Canvas", "LLM chains", "Connectors"],
    gettingStarted: ["Suba instância", "Monte chain", "Teste provider"],
    useCases: ["FAQ bots", "RAG", "Formulários inteligentes"],
    integrations: ["OpenAI", "Anthropic", "Vector DBs"],
    bestPractices: ["Salve versões", "Monitore latência"],
    pitfalls: ["Complexidade de deploy"],
    prompts: [],
    relatedCourses: [],
  },
};

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = toolsMap[params.slug];

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
                  {tool.docUrl && (
                    <Link href={tool.docUrl} target="_blank" className="text-purple-400 hover:text-purple-300">Documentação Oficial</Link>
                  )}
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
                      <Link href={`/cursos?search=${encodeURIComponent(tool.title)}`}>
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
                            {tool.impactForIndividuals.slice(0, 3).map((impact: string, i: number) => (
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
                            {tool.impactForEntrepreneurs.slice(0, 3).map((impact: string, i: number) => (
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
                            {tool.impactForCompanies.slice(0, 3).map((impact: string, i: number) => (
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
                            {tool.features.map((f: string, i: number) => (
                              <li key={i} className="flex items-center gap-2"><CheckCircle className="text-green-400" size={18} /> {f}</li>
                            ))}
                          </ul>
                        </Card>
                        <Card className="p-6 backdrop-blur border-border">
                          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><BookOpen size={18} /> Casos de Uso</h3>
                          <ul className="space-y-2">
                            {tool.useCases.map((u: string, i: number) => (
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
                          {tool.gettingStarted.map((s: string, i: number) => (<li key={i}>{s}</li>))}
                        </ol>
                      </Card>
                    </TabsContent>

                    <TabsContent value="integrations">
                      <Card className="p-6 backdrop-blur border-border">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><LinkIcon size={18} /> Integrações</h3>
                        <div className="flex flex-wrap gap-2">
                          {tool.integrations.map((name: string) => (
                            <Badge key={name} variant="outline" className="border-purple-500/30">{name}</Badge>
                          ))}
                        </div>
                      </Card>
                    </TabsContent>

                    <TabsContent value="prompts">
                      <Card className="p-6 backdrop-blur border-border">
                        <h3 className="text-xl font-semibold mb-4">Prompts Recomendados</h3>
                        <div className="space-y-4">
                          {tool.prompts.length === 0 && (
                            <p className="text-gray-400">Prompts em breve.</p>
                          )}
                          {tool.prompts.map((p: {title: string; content: string}, i: number) => (
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
                        {tool.relatedCourses.length === 0 && (
                          <Card className="p-6 backdrop-blur border-border">Sem cursos relacionados no momento.</Card>
                        )}
                        {tool.relatedCourses.map((c: {slug: string; title: string; level: string; price: number}) => (
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
                            {tool.bestPractices.map((b: string, i: number) => (<li key={i} className="list-disc list-inside">{b}</li>))}
                          </ul>
                        </Card>
                        <Card className="p-6 backdrop-blur border-border">
                          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><AlertTriangle size={18} /> Armadilhas comuns</h3>
                          <ul className="space-y-2 text-gray-300">
                            {tool.pitfalls.map((p: string, i: number) => (<li key={i} className="list-disc list-inside">{p}</li>))}
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
                        {tool.integrations.slice(0, 6).map((i: string) => (
                          <Badge key={i} variant="outline" className="border-purple-500/30">{i}</Badge>
                        ))}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-primary/15 to-accent/10 border-purple-500/30">
                    <h3 className="text-xl font-semibold mb-2">Aprenda {tool.title} de forma prática</h3>
                    <p className="text-gray-300 mb-4">Cursos com projetos do mundo real, templates e certificado.</p>
                    <Link href={`/cursos?search=${encodeURIComponent(tool.title)}`}>
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
