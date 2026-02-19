"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  PlayCircle, CheckCircle, ArrowRight, BookOpen, Clock, Award,
  Sparkles, Brain, Zap, Target, ChevronDown, ChevronUp, MessageCircle,
  Lightbulb, Copy, FileText
} from "lucide-react";

const FREE_LESSONS = [
  {
    id: 1,
    title: "O que é IA Generativa e Por Que Você Precisa Aprender",
    titleEn: "What is Generative AI and Why You Need to Learn It",
    duration: "12 min leitura",
    durationEn: "12 min read",
    description: "Entenda o que está por trás do ChatGPT, como funciona um LLM e por que dominar IA é a habilidade mais valiosa de 2025.",
    descriptionEn: "Understand what's behind ChatGPT, how an LLM works and why mastering AI is the most valuable skill of 2025.",
    topics: [
      "O que são Large Language Models (LLMs)",
      "Como o ChatGPT realmente funciona (simplificado)",
      "Por que IA não vai substituir você — mas alguém que usa IA vai",
      "5 áreas onde IA já está gerando resultados reais",
      "O mercado de trabalho e as oportunidades com IA"
    ],
    topicsEn: [
      "What are Large Language Models (LLMs)",
      "How ChatGPT really works (simplified)",
      "Why AI won't replace you — but someone using AI will",
      "5 areas where AI is already generating real results",
      "The job market and opportunities with AI"
    ],
    content: `**O que é IA Generativa?**

IA Generativa é um tipo de inteligência artificial capaz de criar conteúdo novo — textos, imagens, código, música — a partir de padrões aprendidos com bilhões de dados. O ChatGPT, da OpenAI, é o exemplo mais popular.

**Como funciona um LLM (simplificado)**

Um Large Language Model (LLM) é treinado lendo bilhões de textos da internet. Ele aprende padrões estatísticos de linguagem — essencialmente, qual é a próxima palavra mais provável dado um contexto. Quando você faz uma pergunta, ele gera a resposta palavra por palavra, escolhendo a continuação mais coerente.

Pense assim: se alguém leu todos os livros do mundo e você pede para completar uma frase, essa pessoa saberia a resposta mais provável. O ChatGPT faz algo similar, mas com 175 bilhões de parâmetros.

**Por que você precisa aprender**

Segundo o Fórum Econômico Mundial, 85 milhões de empregos serão transformados por IA até 2025. Profissionais que dominam ferramentas de IA já relatam ganhos de produtividade de 40-70% em tarefas como escrita, pesquisa e análise.

A questão não é se a IA vai impactar seu trabalho — é quando. E quem aprende primeiro tem vantagem competitiva.

**5 áreas com resultados reais:**
1. **Marketing**: Criação de copy, posts para redes sociais, análise de concorrência
2. **Programação**: Geração e debugging de código, documentação automática
3. **Atendimento**: Chatbots inteligentes, respostas padronizadas
4. **Educação**: Tutoria personalizada, criação de materiais didáticos
5. **Gestão**: Análise de dados, relatórios automatizados, tomada de decisão`,
    contentEn: `**What is Generative AI?**

Generative AI is a type of artificial intelligence capable of creating new content — texts, images, code, music — from patterns learned from billions of data points. ChatGPT, by OpenAI, is the most popular example.

**How an LLM works (simplified)**

A Large Language Model (LLM) is trained by reading billions of texts from the internet. It learns statistical language patterns — essentially, what the most probable next word is given a context. When you ask a question, it generates the answer word by word, choosing the most coherent continuation.

Think of it this way: if someone read every book in the world and you asked them to complete a sentence, they would know the most likely answer. ChatGPT does something similar, but with 175 billion parameters.

**Why you need to learn**

According to the World Economic Forum, 85 million jobs will be transformed by AI by 2025. Professionals who master AI tools already report productivity gains of 40-70% in tasks like writing, research, and analysis.

The question isn't whether AI will impact your work — it's when. And those who learn first have a competitive advantage.

**5 areas with real results:**
1. **Marketing**: Copy creation, social media posts, competitor analysis
2. **Programming**: Code generation and debugging, automatic documentation
3. **Customer Service**: Intelligent chatbots, standardized responses
4. **Education**: Personalized tutoring, creating educational materials
5. **Management**: Data analysis, automated reports, decision making`,
  },
  {
    id: 2,
    title: "Seu Primeiro Prompt Profissional: A Fórmula CRIE",
    titleEn: "Your First Professional Prompt: The CRIE Formula",
    duration: "15 min leitura",
    durationEn: "15 min read",
    description: "Aprenda a fórmula CRIE para criar prompts que geram resultados profissionais toda vez. Saia desta aula já aplicando.",
    descriptionEn: "Learn the CRIE formula for creating prompts that generate professional results every time. Leave this lesson already applying it.",
    topics: [
      "Por que 90% das pessoas usam ChatGPT errado",
      "A Fórmula CRIE: Contexto, Resultado, Instrução, Exemplo",
      "Exercício prático: transforme um prompt ruim em excelente",
      "3 templates prontos para usar hoje",
      "Antes vs Depois: resultados reais de bons prompts"
    ],
    topicsEn: [
      "Why 90% of people use ChatGPT wrong",
      "The CRIE Formula: Context, Result, Instruction, Example",
      "Hands-on: transform a bad prompt into an excellent one",
      "3 ready-to-use templates for today",
      "Before vs After: real results from good prompts"
    ],
    content: `**Por que a maioria usa ChatGPT errado**

A maioria das pessoas escreve prompts vagos como "me ajuda a escrever um email" ou "crie um post para Instagram". O resultado? Respostas genéricas e inúteis. A diferença entre um resultado medíocre e um resultado profissional está na qualidade do prompt.

**A Fórmula CRIE**

Use esta fórmula toda vez que interagir com ChatGPT:

- **C - Contexto**: Diga quem você é e qual a situação
- **R - Resultado**: Descreva exatamente o que quer obter
- **I - Instrução**: Dê diretrizes específicas de formato e tom
- **E - Exemplo**: Forneça um exemplo do que espera

**Exemplo prático — Antes vs Depois:**

❌ **Prompt ruim:** "Escreva um email para meu chefe"

✅ **Prompt com fórmula CRIE:**
"Sou gerente de marketing em uma empresa de tecnologia (C). Preciso de um email profissional pedindo aprovação para um orçamento de R$15.000 para uma campanha de Google Ads (R). O tom deve ser formal mas persuasivo, com no máximo 200 palavras, incluindo dados que justifiquem o investimento (I). Exemplo de estrutura: saudação > contexto > proposta > dados > chamada para ação (E)."

**3 Templates para usar agora:**

**Template 1 — Criação de Conteúdo:**
"Atue como um [especialista em X]. Crie [tipo de conteúdo] sobre [tema] para [público-alvo]. O tom deve ser [formal/casual/técnico]. Inclua [elementos específicos]. Formato: [estrutura desejada]."

**Template 2 — Análise:**
"Analise [dados/texto/situação] considerando [critérios]. Identifique [pontos fortes/fracos/oportunidades]. Apresente em formato de [lista/tabela/relatório] com [número] itens principais."

**Template 3 — Resolução de Problemas:**
"Estou enfrentando [problema específico] no contexto de [situação]. Já tentei [tentativas anteriores]. Sugira [número] soluções práticas, ordenadas por facilidade de implementação, com prós e contras de cada."`,
    contentEn: `**Why most people use ChatGPT wrong**

Most people write vague prompts like "help me write an email" or "create an Instagram post". The result? Generic and useless answers. The difference between a mediocre result and a professional result is in the prompt quality.

**The CRIE Formula**

Use this formula every time you interact with ChatGPT:

- **C - Context**: Say who you are and the situation
- **R - Result**: Describe exactly what you want to get
- **I - Instruction**: Give specific format and tone guidelines
- **E - Example**: Provide an example of what you expect

**Practical Example — Before vs After:**

❌ **Bad prompt:** "Write an email to my boss"

✅ **Prompt with CRIE formula:**
"I'm a marketing manager at a tech company (C). I need a professional email requesting approval for a $3,000 Google Ads campaign budget (R). The tone should be formal but persuasive, max 200 words, including data to justify the investment (I). Structure example: greeting > context > proposal > data > call to action (E)."

**3 Templates to use now:**

**Template 1 — Content Creation:**
"Act as a [specialist in X]. Create [type of content] about [topic] for [target audience]. The tone should be [formal/casual/technical]. Include [specific elements]. Format: [desired structure]."

**Template 2 — Analysis:**
"Analyze [data/text/situation] considering [criteria]. Identify [strengths/weaknesses/opportunities]. Present in [list/table/report] format with [number] main items."

**Template 3 — Problem Solving:**
"I'm facing [specific problem] in the context of [situation]. I've already tried [previous attempts]. Suggest [number] practical solutions, ordered by ease of implementation, with pros and cons for each."`,
  },
  {
    id: 3,
    title: "Automatize Sua Primeira Tarefa com IA em 10 Minutos",
    titleEn: "Automate Your First Task with AI in 10 Minutes",
    duration: "10 min leitura",
    durationEn: "10 min read",
    description: "Veja na prática como automatizar uma tarefa real do seu dia a dia usando ChatGPT. Resultado imediato, sem programação.",
    descriptionEn: "See in practice how to automate a real daily task using ChatGPT. Immediate results, no programming.",
    topics: [
      "Identificando tarefas automatizáveis no seu dia",
      "Passo a passo: Custom Instructions do ChatGPT",
      "3 automações práticas que qualquer pessoa pode fazer",
      "Economize 5+ horas por semana",
      "Próximos passos: o caminho para dominar IA"
    ],
    topicsEn: [
      "Identifying automatable tasks in your day",
      "Step by step: ChatGPT Custom Instructions",
      "3 practical automations anyone can do",
      "Save 5+ hours per week",
      "Next steps: the path to mastering AI"
    ],
    content: `**Identificando tarefas automatizáveis**

Faça este exercício agora: pense nas tarefas que você repete toda semana. Emails, relatórios, resumos, pesquisas, respostas padrão... Qualquer tarefa que segue um padrão pode ser acelerada com IA.

**Regra prática:** Se você faz algo mais de 3 vezes por semana e leva mais de 10 minutos, vale automatizar com IA.

**Configurando Custom Instructions**

O ChatGPT permite salvar instruções personalizadas que se aplicam a todas as conversas. Vá em Configurações > Custom Instructions e configure:

**Campo 1 — "Sobre você":**
"Sou [sua profissão] na área de [setor]. Trabalho com [tarefas principais]. Meu público é [seu público]. Prefiro respostas [diretas/detalhadas] em português brasileiro."

**Campo 2 — "Como responder":**
"Seja direto e prático. Use bullet points. Dê exemplos reais. Evite frases genéricas. Quando relevante, sugira próximos passos."

**3 Automações para fazer agora:**

**Automação 1 — Resumo de Conteúdo:**
Cole qualquer texto longo (artigo, documento, email extenso) e use: "Resuma este texto em 5 pontos principais, destacando ações necessárias e prazos mencionados."

**Automação 2 — Templates de Email:**
"Crie 5 templates de email de [tipo: follow-up / proposta / agradecimento] para [contexto]. Cada template deve ter no máximo 100 palavras e incluir espaço para personalização marcado com [INSERIR]."

**Automação 3 — Análise de Reunião:**
Após uma reunião, cole suas anotações e use: "Organize estas anotações em: 1) Decisões tomadas, 2) Ações pendentes com responsáveis, 3) Pontos que precisam de mais discussão. Formato de tabela."

**Resultado esperado:** Com estas 3 automações, você economiza em média 5-8 horas por semana em tarefas repetitivas.

**Próximos passos:**
Este mini-curso cobriu os fundamentos. Para dominar técnicas avançadas como chain-of-thought prompting, integração com APIs, criação de assistentes customizados e automação com n8n/Make, explore nossos cursos completos.`,
    contentEn: `**Identifying automatable tasks**

Do this exercise now: think about the tasks you repeat every week. Emails, reports, summaries, research, standard responses... Any task that follows a pattern can be accelerated with AI.

**Practical rule:** If you do something more than 3 times per week and it takes more than 10 minutes, it's worth automating with AI.

**Setting up Custom Instructions**

ChatGPT lets you save personalized instructions that apply to all conversations. Go to Settings > Custom Instructions and set up:

**Field 1 — "About you":**
"I'm a [your profession] in [sector]. I work with [main tasks]. My audience is [your audience]. I prefer [direct/detailed] answers."

**Field 2 — "How to respond":**
"Be direct and practical. Use bullet points. Give real examples. Avoid generic phrases. When relevant, suggest next steps."

**3 Automations to do now:**

**Automation 1 — Content Summary:**
Paste any long text (article, document, lengthy email) and use: "Summarize this text in 5 key points, highlighting required actions and mentioned deadlines."

**Automation 2 — Email Templates:**
"Create 5 email templates for [type: follow-up / proposal / thank you] for [context]. Each template should be max 100 words and include space for personalization marked with [INSERT]."

**Automation 3 — Meeting Analysis:**
After a meeting, paste your notes and use: "Organize these notes into: 1) Decisions made, 2) Pending actions with responsible parties, 3) Points that need further discussion. Table format."

**Expected result:** With these 3 automations, you save on average 5-8 hours per week on repetitive tasks.

**Next steps:**
This mini-course covered the fundamentals. To master advanced techniques like chain-of-thought prompting, API integration, custom assistant creation and automation with n8n/Make, explore our full courses.`,
  },
];

export default function FreeClassPage() {
  const locale = useLocale();
  const isPtBr = locale === "pt-BR";
  const [expandedLesson, setExpandedLesson] = useState<number>(1);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2 text-sm">
              <Sparkles className="mr-2 inline" size={14} />
              {isPtBr ? "100% Gratuito — Sem Cadastro" : "100% Free — No Signup Required"}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {isPtBr 
                  ? "Mini-Curso Grátis: IA na Prática" 
                  : "Free Mini-Course: AI in Practice"}
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {isPtBr
                ? "3 aulas práticas com conteúdo real para você começar a usar Inteligência Artificial hoje. Leia, aplique e veja resultados imediatos."
                : "3 practical lessons with real content to start using Artificial Intelligence today. Read, apply, and see immediate results."}
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-purple-400" />
                <span>~37 {isPtBr ? "minutos de leitura" : "minutes reading"}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-purple-400" />
                <span>3 {isPtBr ? "aulas completas" : "complete lessons"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Copy size={16} className="text-purple-400" />
                <span>{isPtBr ? "Templates inclusos" : "Templates included"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Lessons */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto space-y-6">
            {FREE_LESSONS.map((lesson) => {
              const isExpanded = expandedLesson === lesson.id;
              const title = isPtBr ? lesson.title : lesson.titleEn;
              const desc = isPtBr ? lesson.description : lesson.descriptionEn;
              const content = isPtBr ? lesson.content : lesson.contentEn;
              const duration = isPtBr ? lesson.duration : lesson.durationEn;
              
              return (
                <Card 
                  key={lesson.id}
                  className={`bg-gray-900/50 border transition-all ${
                    isExpanded 
                      ? "border-purple-500/50 shadow-lg shadow-purple-500/10" 
                      : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <button
                    onClick={() => setExpandedLesson(isExpanded ? 0 : lesson.id)}
                    className="w-full p-6 text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isExpanded 
                          ? "bg-gradient-to-br from-purple-500 to-pink-500" 
                          : "bg-gray-800"
                      }`}>
                        {isExpanded ? <BookOpen size={24} className="text-white" /> : <PlayCircle size={24} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {isPtBr ? `Aula ${lesson.id}` : `Lesson ${lesson.id}`}
                          </Badge>
                          <span className="text-xs text-gray-500">{duration}</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
                        <p className="text-sm text-gray-400">{desc}</p>
                      </div>
                      <div className="flex-shrink-0 text-gray-500">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-800 pt-4">
                      {/* Real lesson content */}
                      <div className="prose prose-invert prose-sm max-w-none mb-6">
                        {content.split('\n\n').map((paragraph, i) => {
                          if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                            return <h3 key={i} className="text-lg font-bold text-purple-400 mt-6 mb-3">{paragraph.replace(/\*\*/g, '')}</h3>;
                          }
                          if (paragraph.startsWith('**')) {
                            const parts = paragraph.split('**');
                            return (
                              <div key={i} className="mb-4">
                                {parts.map((part, j) => (
                                  j % 2 === 1 
                                    ? <strong key={j} className="text-white">{part}</strong>
                                    : <span key={j} className="text-gray-300">{part}</span>
                                ))}
                              </div>
                            );
                          }
                          if (paragraph.startsWith('- ')) {
                            return (
                              <ul key={i} className="space-y-2 mb-4 ml-4">
                                {paragraph.split('\n').map((line, j) => (
                                  <li key={j} className="flex items-start gap-2 text-gray-300">
                                    <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>{line.replace(/^- /, '').replace(/\*\*/g, '')}</span>
                                  </li>
                                ))}
                              </ul>
                            );
                          }
                          if (paragraph.startsWith('1. ') || paragraph.startsWith('❌') || paragraph.startsWith('✅')) {
                            return (
                              <div key={i} className="mb-4 p-4 bg-gray-800/50 rounded-lg">
                                {paragraph.split('\n').map((line, j) => (
                                  <p key={j} className={`text-sm mb-1 ${line.startsWith('❌') ? 'text-red-400' : line.startsWith('✅') ? 'text-green-400' : 'text-gray-300'}`}>
                                    {line.replace(/\*\*/g, '')}
                                  </p>
                                ))}
                              </div>
                            );
                          }
                          return <p key={i} className="text-gray-300 mb-4 leading-relaxed">{paragraph.replace(/\*\*/g, '')}</p>;
                        })}
                      </div>

                      {/* Summary of topics */}
                      <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
                        <h4 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                          <Lightbulb size={16} />
                          {isPtBr ? "Pontos-chave desta aula:" : "Key takeaways:"}
                        </h4>
                        <ul className="space-y-2">
                          {(isPtBr ? lesson.topics : lesson.topicsEn).map((topic, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* What you'll be able to do */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-purple-500/30 p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                {isPtBr 
                  ? "Depois dessas 3 aulas, você vai saber:" 
                  : "After these 3 lessons, you'll know:"}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: Brain, text: isPtBr ? "Como a IA generativa funciona de verdade" : "How generative AI really works" },
                  { icon: Target, text: isPtBr ? "Criar prompts profissionais com a fórmula CRIE" : "Create professional prompts with the CRIE formula" },
                  { icon: Zap, text: isPtBr ? "Automatizar 3 tarefas reais do seu dia a dia" : "Automate 3 real daily tasks" },
                  { icon: FileText, text: isPtBr ? "Usar templates prontos para email, conteúdo e análise" : "Use ready-made templates for email, content and analysis" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                    <item.icon className="text-purple-400 flex-shrink-0" size={20} />
                    <span className="text-gray-200 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* CTA - Go to full course */}
        <section className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-gray-900/50 border-gray-800 p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-4">
                {isPtBr 
                  ? "Quer ir além dos fundamentos?" 
                  : "Want to go beyond the fundamentals?"}
              </h2>
              <p className="text-gray-400 mb-6 max-w-xl mx-auto">
                {isPtBr
                  ? "Este mini-curso cobre o essencial. Nos cursos completos, você domina técnicas avançadas de prompt engineering, automação com n8n e Make, criação de conteúdo com IA e muito mais — tudo com projetos práticos."
                  : "This mini-course covers the essentials. In the full courses, you master advanced prompt engineering, automation with n8n and Make, AI content creation and more — all with practical projects."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/cursos">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-6 text-lg">
                    {isPtBr ? "Ver Cursos Completos" : "See Full Courses"}
                    <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
                <Link href="https://wa.me/5521971908530">
                  <Button variant="outline" className="border-green-500 text-green-400 hover:bg-green-500/10 px-8 py-6 text-lg">
                    <MessageCircle className="mr-2" size={20} />
                    {isPtBr ? "Tirar Dúvidas no WhatsApp" : "Ask Questions on WhatsApp"}
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
