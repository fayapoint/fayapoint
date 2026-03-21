/**
 * Push Course Content to MongoDB
 * 
 * Reads markdown content files from courses/{slug}/CONTENT.md
 * and updates the courseContent field in fayapointProdutos.products
 * 
 * Usage: npx tsx scripts/push-course-content.ts
 */

import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import {
  countCourseContentChapters,
  sanitizeCourseContent,
} from '../src/lib/course-content-sanitizer';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ricardofaya:3VJKNjK65tn5srSC@aicornercluster.2kiwt1o.mongodb.net/';
const DATABASE_NAME = 'fayapointProdutos';
const COLLECTION_NAME = 'products';

// All course slugs (existing + new)
const COURSE_SLUGS = [
  'chatgpt-masterclass',
  'n8n-automacao-avancada',
  'make-integracao-total',
  'gemini-ia-google',
  'leonardo-ai-criacao-visual',
  'banana-dev-deploy-ia',
  'midjourney-arte-profissional',
  'claude-ia-segura',
  'perplexity-pesquisa-inteligente',
  'chatgpt-allowlisting',
  'openclaw-ia-open-source',
  'claude-cowork-colaboracao',
  'prompt-engineering',
  'crie-agentes-de-ia-autonomos',
  'autoresearch-singularity',
];

// New product templates for courses that don't exist yet in MongoDB
const NEW_PRODUCTS: Record<string, any> = {
  'openclaw-ia-open-source': {
    productId: 'course-openclaw-ia-open-source',
    slug: 'openclaw-ia-open-source',
    type: 'course',
    status: 'active',
    name: 'OpenClaw: IA Open Source na Prática',
    shortName: 'OpenClaw IA',
    tool: 'OpenClaw',
    categoryPrimary: 'Inteligência Artificial',
    categorySecondary: 'Open Source',
    tags: ['ia', 'open-source', 'ollama', 'huggingface', 'langchain', 'llm', 'deploy'],
    level: 'Intermediário',
    targetAudience: ['Desenvolvedores', 'Entusiastas de IA', 'Startups', 'CTOs'],
    pricing: { currency: 'BRL', price: 197, originalPrice: 497, discount: 60 },
    metrics: { duration: '30+ horas', lessons: 180, students: 487, rating: 4.8, reviewCount: 89, completionRate: 78, lastUpdated: '2025-02-01' },
    copy: {
      headline: 'Domine IA Open Source e Construa Seus Próprios Sistemas de Inteligência Artificial',
      subheadline: 'Ollama, Hugging Face, LangChain, Open WebUI e Muito Mais — Tudo Sem Depender de APIs Pagas',
      shortDescription: 'Aprenda a instalar, configurar e operar modelos de IA open source localmente e na nuvem.',
      fullDescription: 'O curso mais completo sobre IA open source em português. Domine ferramentas como Ollama, Hugging Face, LangChain, LlamaIndex, Open WebUI e muito mais.',
      benefits: ['Rodar LLMs localmente sem custo', 'Fine-tuning de modelos', 'RAG completo', 'Deploy em produção'],
      impactIndividuals: ['Independência de APIs pagas', 'Privacidade total dos dados'],
      impactEntrepreneurs: ['Redução de custos com IA', 'Produtos próprios com IA'],
      impactCompanies: ['Soberania de dados', 'Compliance e LGPD']
    },
    curriculum: { moduleCount: 6, modules: [] },
    bonuses: [],
    guarantees: ['7 dias de garantia'],
    testimonials: [],
    faqs: [],
    cta: { primary: { text: 'Começar Agora', url: '/checkout/openclaw-ia-open-source', style: 'primary' } },
    seo: { metaTitle: 'OpenClaw: IA Open Source na Prática', metaDescription: 'Domine IA open source com Ollama, Hugging Face, LangChain e mais.', keywords: ['ia open source', 'ollama', 'hugging face', 'langchain'] },
    digitalAssets: [],
    features: ['180 aulas', '30+ horas', 'Projetos práticos', 'Certificado'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'perplexity-pesquisa-inteligente': {
    productId: 'course-perplexity-pesquisa-inteligente',
    slug: 'perplexity-pesquisa-inteligente',
    type: 'course',
    status: 'active',
    name: 'Perplexity: Pesquisa Inteligente com IA',
    shortName: 'Perplexity AI',
    tool: 'Perplexity',
    categoryPrimary: 'Inteligência Artificial',
    categorySecondary: 'Pesquisa',
    tags: ['perplexity', 'pesquisa', 'ia', 'research', 'fontes', 'verificação'],
    level: 'Todos os níveis',
    targetAudience: ['Profissionais', 'Pesquisadores', 'Jornalistas', 'Consultores'],
    pricing: { currency: 'BRL', price: 147, originalPrice: 397, discount: 63 },
    metrics: { duration: '22+ horas', lessons: 130, students: 356, rating: 4.8, reviewCount: 64, completionRate: 85, lastUpdated: '2025-02-01' },
    copy: {
      headline: 'Domine a Pesquisa Inteligente com Perplexity AI',
      subheadline: 'Pesquisa fundamentada com fontes verificáveis em tempo real',
      shortDescription: 'Aprenda a usar Perplexity para pesquisa profissional com fontes verificáveis.',
      fullDescription: 'O curso completo de Perplexity AI para pesquisa profissional.',
      benefits: ['Pesquisa com fontes verificáveis', 'Monitoramento de mercado', 'Relatórios fundamentados'],
      impactIndividuals: ['Pesquisa 10x mais rápida'],
      impactEntrepreneurs: ['Inteligência competitiva automatizada'],
      impactCompanies: ['Decisões baseadas em dados atualizados']
    },
    curriculum: { moduleCount: 6, modules: [] },
    bonuses: [],
    guarantees: ['7 dias de garantia'],
    testimonials: [],
    faqs: [],
    cta: { primary: { text: 'Começar Agora', url: '/checkout/perplexity-pesquisa-inteligente', style: 'primary' } },
    seo: { metaTitle: 'Perplexity: Pesquisa Inteligente com IA', metaDescription: 'Domine pesquisa com IA e fontes verificáveis.', keywords: ['perplexity', 'pesquisa ia', 'research ai'] },
    digitalAssets: [],
    features: ['130 aulas', '22+ horas', 'Projetos práticos', 'Certificado'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'chatgpt-allowlisting': {
    productId: 'course-chatgpt-allowlisting',
    slug: 'chatgpt-allowlisting',
    type: 'course',
    status: 'active',
    name: 'ChatGPT Allowlisting: Acesso Empresarial e Compliance',
    shortName: 'ChatGPT Enterprise',
    tool: 'ChatGPT',
    categoryPrimary: 'Inteligência Artificial',
    categorySecondary: 'Empresarial',
    tags: ['chatgpt', 'enterprise', 'allowlisting', 'compliance', 'lgpd', 'governança'],
    level: 'Intermediário a Avançado',
    targetAudience: ['CTOs', 'CISOs', 'Compliance Officers', 'IT Managers'],
    pricing: { currency: 'BRL', price: 197, originalPrice: 597, discount: 67 },
    metrics: { duration: '20+ horas', lessons: 120, students: 234, rating: 4.7, reviewCount: 42, completionRate: 79, lastUpdated: '2025-02-01' },
    copy: {
      headline: 'Implemente ChatGPT na Sua Empresa com Segurança e Compliance',
      subheadline: 'Políticas, governança, LGPD e rollout corporativo de IA',
      shortDescription: 'Guia completo para implementar ChatGPT em ambientes corporativos com segurança.',
      fullDescription: 'O curso definitivo para implementar IA generativa em empresas com compliance.',
      benefits: ['Implementação segura de IA', 'Compliance LGPD/GDPR', 'Políticas de governança'],
      impactIndividuals: ['Liderança em IA corporativa'],
      impactEntrepreneurs: ['IA segura para o negócio'],
      impactCompanies: ['ROI comprovado com governança']
    },
    curriculum: { moduleCount: 6, modules: [] },
    bonuses: [],
    guarantees: ['7 dias de garantia'],
    testimonials: [],
    faqs: [],
    cta: { primary: { text: 'Começar Agora', url: '/checkout/chatgpt-allowlisting', style: 'primary' } },
    seo: { metaTitle: 'ChatGPT Allowlisting: IA Empresarial', metaDescription: 'Implemente ChatGPT com segurança e compliance.', keywords: ['chatgpt enterprise', 'allowlisting', 'ia corporativa'] },
    digitalAssets: [],
    features: ['120 aulas', '20+ horas', 'Templates de política', 'Certificado'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'prompt-engineering': {
    productId: 'course-prompt-engineering',
    slug: 'prompt-engineering',
    type: 'course',
    status: 'active',
    name: 'Prompt Engineering: Domine a Arte de Conversar com IAs',
    shortName: 'Prompt Engineering',
    tool: 'Multi-Plataforma',
    categoryPrimary: 'Inteligência Artificial',
    categorySecondary: 'Fundamentos',
    tags: ['prompt', 'engineering', 'chatgpt', 'claude', 'gemini', 'chain-of-thought', 'few-shot'],
    level: 'Intermediário',
    targetAudience: ['Profissionais', 'Desenvolvedores', 'Criadores de Conteúdo', 'Consultores'],
    pricing: { currency: 'BRL', price: 97, originalPrice: 297, discount: 67 },
    metrics: { duration: '25+ horas', lessons: 150, students: 520, rating: 4.9, reviewCount: 95, completionRate: 83, lastUpdated: '2026-03-01' },
    copy: {
      headline: 'Domine a Habilidade Mais Valiosa de 2026: Prompt Engineering',
      subheadline: 'Chain-of-Thought, Tree of Thoughts, Few-Shot, Meta-Prompting — Técnicas que separam amadores de profissionais',
      shortDescription: 'O curso definitivo de prompt engineering para GPT-5, Claude e Gemini.',
      fullDescription: 'Aprenda as técnicas avançadas de prompt engineering que multiplicam resultados com qualquer modelo de IA.',
      benefits: ['50+ templates prontos', 'Técnicas para GPT-5, Claude e Gemini', 'Sistema pessoal de prompts'],
      impactIndividuals: ['Resultados 10x melhores com IA'],
      impactEntrepreneurs: ['Automações mais inteligentes'],
      impactCompanies: ['Padronização de uso de IA']
    },
    curriculum: { moduleCount: 6, modules: [] },
    bonuses: [], guarantees: ['7 dias de garantia'], testimonials: [], faqs: [],
    cta: { primary: { text: 'Começar Agora', url: '/checkout/prompt-engineering', style: 'primary' } },
    seo: { metaTitle: 'Prompt Engineering: Domine a Arte de Conversar com IAs', metaDescription: 'Curso completo de prompt engineering para ChatGPT, Claude e Gemini.', keywords: ['prompt engineering', 'chatgpt', 'claude', 'gemini'] },
    digitalAssets: [], features: ['150 aulas', '25+ horas', '50+ templates', 'Certificado'],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  'crie-agentes-de-ia-autonomos': {
    productId: 'course-crie-agentes-de-ia-autonomos',
    slug: 'crie-agentes-de-ia-autonomos',
    type: 'course',
    status: 'active',
    name: 'Crie Agentes de IA Autônomos: Do Conceito à Produção',
    shortName: 'Agentes de IA',
    tool: 'Multi-Framework',
    categoryPrimary: 'Inteligência Artificial',
    categorySecondary: 'Desenvolvimento',
    tags: ['agentes', 'ia', 'langchain', 'crewai', 'autogen', 'mcp', 'claude-sdk', 'openai-sdk'],
    level: 'Avançado',
    targetAudience: ['Desenvolvedores', 'Arquitetos de Software', 'CTOs', 'Tech Leads'],
    pricing: { currency: 'BRL', price: 167, originalPrice: 497, discount: 66 },
    metrics: { duration: '35+ horas', lessons: 200, students: 310, rating: 4.8, reviewCount: 58, completionRate: 76, lastUpdated: '2026-03-01' },
    copy: {
      headline: 'Construa Agentes de IA que Trabalham Sozinhos',
      subheadline: 'Claude Agent SDK, OpenAI Agents SDK, LangGraph, CrewAI, AutoGen e MCP — Os frameworks de 2026',
      shortDescription: 'O curso mais completo sobre agentes autônomos de IA em português.',
      fullDescription: 'Aprenda a construir, orquestrar e deployar agentes de IA com os frameworks mais avançados de 2026.',
      benefits: ['5 agentes completos prontos', 'Deploy em produção', 'Multi-agent orchestration'],
      impactIndividuals: ['Automação total de tarefas'],
      impactEntrepreneurs: ['Equipe de IA trabalhando 24/7'],
      impactCompanies: ['Agentes internos escaláveis']
    },
    curriculum: { moduleCount: 6, modules: [] },
    bonuses: [], guarantees: ['7 dias de garantia'], testimonials: [], faqs: [],
    cta: { primary: { text: 'Começar Agora', url: '/checkout/crie-agentes-de-ia-autonomos', style: 'primary' } },
    seo: { metaTitle: 'Crie Agentes de IA Autônomos', metaDescription: 'Construa agentes de IA com LangChain, CrewAI e Claude SDK.', keywords: ['agentes ia', 'langchain', 'crewai', 'autogen'] },
    digitalAssets: [], features: ['200 aulas', '35+ horas', '5 agentes completos', 'Certificado'],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  'autoresearch-singularity': {
    productId: 'course-autoresearch-singularity',
    slug: 'autoresearch-singularity',
    type: 'course',
    status: 'active',
    name: 'Autoresearch e a Singularidade: Quando a IA Melhora a Si Mesma',
    shortName: 'Autoresearch',
    tool: 'Autoresearch',
    categoryPrimary: 'Inteligência Artificial',
    categorySecondary: 'Avançado',
    tags: ['autoresearch', 'singularidade', 'self-improvement', 'loops', 'mutation', 'judge'],
    level: 'Avançado',
    targetAudience: ['Pesquisadores', 'Desenvolvedores Senior', 'Cientistas de Dados', 'Entusiastas'],
    pricing: { currency: 'BRL', price: 167, originalPrice: 497, discount: 66 },
    metrics: { duration: '25+ horas', lessons: 140, students: 180, rating: 4.9, reviewCount: 34, completionRate: 72, lastUpdated: '2026-03-01' },
    copy: {
      headline: 'Quando a IA Aprende a Melhorar a Si Mesma',
      subheadline: 'Loops iterativos, juízes automatizados e mutação — O futuro do aprendizado de máquina',
      shortDescription: 'Entenda e implemente sistemas de IA que se auto-aperfeiçoam.',
      fullDescription: 'O curso mais avançado sobre autoresearch, loops de melhoria e singularidade prática.',
      benefits: ['Template completo para implementar', 'Matemática da convergência', 'Casos reais'],
      impactIndividuals: ['Compreensão profunda de IA'],
      impactEntrepreneurs: ['Produtos que melhoram sozinhos'],
      impactCompanies: ['R&D automatizado']
    },
    curriculum: { moduleCount: 6, modules: [] },
    bonuses: [], guarantees: ['7 dias de garantia'], testimonials: [], faqs: [],
    cta: { primary: { text: 'Começar Agora', url: '/checkout/autoresearch-singularity', style: 'primary' } },
    seo: { metaTitle: 'Autoresearch: Quando a IA Melhora a Si Mesma', metaDescription: 'Sistemas de IA que se auto-aperfeiçoam com loops iterativos.', keywords: ['autoresearch', 'singularidade', 'self-improvement', 'ia'] },
    digitalAssets: [], features: ['140 aulas', '25+ horas', 'Template completo', 'Certificado'],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  },
  'claude-cowork-colaboracao': {
    productId: 'course-claude-cowork-colaboracao',
    slug: 'claude-cowork-colaboracao',
    type: 'course',
    status: 'active',
    name: 'Claude Cowork: Colaboração Profissional com IA',
    shortName: 'Claude Cowork',
    tool: 'Claude',
    categoryPrimary: 'Inteligência Artificial',
    categorySecondary: 'Produtividade',
    tags: ['claude', 'anthropic', 'colaboracao', 'produtividade', 'ia', 'artifacts', 'projects'],
    level: 'Intermediário',
    targetAudience: ['Profissionais', 'Equipes', 'Gerentes de Projeto', 'Desenvolvedores'],
    pricing: { currency: 'BRL', price: 197, originalPrice: 497, discount: 60 },
    metrics: { duration: '28+ horas', lessons: 160, students: 412, rating: 4.9, reviewCount: 76, completionRate: 82, lastUpdated: '2025-02-01' },
    copy: {
      headline: 'Transforme Claude em Seu Parceiro de Trabalho Mais Produtivo',
      subheadline: 'Artifacts, Projects, MCP, Análise de Documentos e Workflows Colaborativos — O Guia Definitivo',
      shortDescription: 'Aprenda a usar Claude como parceiro de trabalho para projetos complexos, análise e criação.',
      fullDescription: 'O curso definitivo para profissionais que querem usar Claude AI como um verdadeiro colega de trabalho.',
      benefits: ['Dominar Artifacts e Projects', 'Workflows colaborativos', 'Análise de documentos complexos', 'Integração com ferramentas'],
      impactIndividuals: ['10x produtividade pessoal', 'Qualidade superior de trabalho'],
      impactEntrepreneurs: ['Equipe virtual com IA', 'Entregas mais rápidas'],
      impactCompanies: ['Processos otimizados', 'Redução de custos operacionais']
    },
    curriculum: { moduleCount: 6, modules: [] },
    bonuses: [],
    guarantees: ['7 dias de garantia'],
    testimonials: [],
    faqs: [],
    cta: { primary: { text: 'Começar Agora', url: '/checkout/claude-cowork-colaboracao', style: 'primary' } },
    seo: { metaTitle: 'Claude Cowork: Colaboração Profissional com IA', metaDescription: 'Use Claude como parceiro de trabalho para projetos complexos.', keywords: ['claude ai', 'colaboracao', 'produtividade', 'anthropic'] },
    digitalAssets: [],
    features: ['160 aulas', '28+ horas', 'Projetos práticos', 'Certificado'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

async function pushCourseContent() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected!\n');

    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    let updated = 0;
    let created = 0;
    let skipped = 0;

    for (const slug of COURSE_SLUGS) {
      const contentPath = path.join(__dirname, '..', 'courses', slug, 'CONTENT.md');

      if (!fs.existsSync(contentPath)) {
        console.log(`⚠️  No content file for: ${slug} — skipping`);
        skipped++;
        continue;
      }

      const rawContent = fs.readFileSync(contentPath, 'utf-8');
      const sanitizedContent = sanitizeCourseContent(rawContent);
      const content = sanitizedContent.content;
      const chapterCount = countCourseContentChapters(content);

      console.log(
        `📖 ${slug}: ${content.length} chars, ${chapterCount} chapters, ${sanitizedContent.relocatedHeadings.length} secções movidas para apoio`
      );
      if (sanitizedContent.relocatedHeadings.length > 0) {
        console.log(`   🧩 ${sanitizedContent.relocatedHeadings.join(' | ')}`);
      }

      // Check if product exists
      const existing = await collection.findOne({ slug });

      if (existing) {
        await collection.updateOne(
          { slug },
          {
            $set: {
              courseContent: content,
              contentUpdatedAt: new Date().toISOString(),
              contentChapters: chapterCount,
              contentComplete: true
            }
          }
        );
        console.log(`   ✅ Updated existing product`);
        updated++;
      } else if (NEW_PRODUCTS[slug]) {
        // Create new product with content
        const newProduct = {
          ...NEW_PRODUCTS[slug],
          courseContent: content,
          contentUpdatedAt: new Date().toISOString(),
          contentChapters: chapterCount,
          contentComplete: true
        };
        await collection.insertOne(newProduct);
        console.log(`   🆕 Created new product`);
        created++;
      } else {
        console.log(`   ❌ Product not found and no template — skipping`);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${updated + created + skipped}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

pushCourseContent();
