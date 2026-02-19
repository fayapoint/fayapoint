/**
 * Admin API to fix all course data in MongoDB
 * Makes metrics honest, improves copy, and ensures sellability
 * 
 * POST /api/admin/fix-courses
 */

import { NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/database';

const DATABASE_NAME = 'fayapointProdutos';
const COLLECTION_NAME = 'products';

// Honest course updates - realistic metrics for a new platform
const courseUpdates: Record<string, {
  metrics: {
    students: number;
    rating: number;
    reviewCount: number;
    completionRate: number;
    lessons: number;
    duration: string;
    lastUpdated: string;
  };
  pricing: {
    price: number;
    originalPrice: number;
    discount: number;
    currency: string;
    installments: { enabled: boolean; maxInstallments: number };
  };
  copy: {
    shortDescription: string;
    subheadline: string;
  };
  guarantees: string[];
  features: string[];
}> = {
  // TIER 1: Flagship courses (enriched, have courseContent)
  'chatgpt-masterclass': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 250,
      duration: '40+ horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 197,
      originalPrice: 497,
      discount: 60,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 12 },
    },
    copy: {
      shortDescription: 'O curso mais completo de ChatGPT em português. Do zero ao avançado: prompt engineering, automação, integração com ferramentas e monetização. Conteúdo prático com projetos reais.',
      subheadline: 'Domine o ChatGPT com o curso mais completo em português — 40+ horas de conteúdo prático, do básico ao avançado',
    },
    guarantees: [
      '7 dias de garantia incondicional',
      'Acesso vitalício ao conteúdo',
      'Atualizações incluídas',
      'Suporte por email',
    ],
    features: ['Conteúdo completo em texto', 'Projetos práticos', 'Templates de prompts', 'Certificado digital', 'Atualizações gratuitas'],
  },
  'n8n-automacao-avancada': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 180,
      duration: '35+ horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 247,
      originalPrice: 697,
      discount: 65,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 12 },
    },
    copy: {
      shortDescription: 'Domine o n8n e crie automações empresariais poderosas. Workflows complexos, integração com APIs, e cases reais de empresas. O curso mais completo de n8n em português.',
      subheadline: 'Crie automações empresariais poderosas com n8n — o curso mais completo de automação no-code em português',
    },
    guarantees: [
      '7 dias de garantia incondicional',
      'Acesso vitalício ao conteúdo',
      'Atualizações incluídas',
      'Suporte por email',
    ],
    features: ['Conteúdo completo em texto', 'Workflows prontos', 'Projetos práticos', 'Certificado digital', 'Atualizações gratuitas'],
  },
  'midjourney-arte-profissional': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 200,
      duration: '32+ horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 197,
      originalPrice: 497,
      discount: 60,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 12 },
    },
    copy: {
      shortDescription: 'Crie arte digital profissional com Midjourney. Prompt engineering artístico, estilos visuais, e aplicações comerciais. Inclui biblioteca de prompts.',
      subheadline: 'Domine a criação de arte digital profissional com Midjourney — do conceito à obra-prima comercial',
    },
    guarantees: [
      '7 dias de garantia incondicional',
      'Acesso vitalício ao conteúdo',
      'Atualizações incluídas',
    ],
    features: ['Conteúdo completo em texto', 'Biblioteca de prompts artísticos', 'Projetos práticos', 'Certificado digital'],
  },
  'make-integracao-total': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 150,
      duration: '25+ horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 197,
      originalPrice: 497,
      discount: 60,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 12 },
    },
    copy: {
      shortDescription: 'Domine o Make (ex-Integromat) e crie automações visuais poderosas. Conecte centenas de aplicações sem escrever código. Templates prontos inclusos.',
      subheadline: 'Conecte centenas de aplicações e automatize seu negócio sem programar — o caminho mais rápido para automação',
    },
    guarantees: [
      '7 dias de garantia incondicional',
      'Acesso vitalício ao conteúdo',
    ],
    features: ['Conteúdo completo em texto', 'Templates prontos', 'Projetos práticos', 'Certificado digital'],
  },
  'claude-ia-segura': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 170,
      duration: '28+ horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 197,
      originalPrice: 497,
      discount: 60,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 12 },
    },
    copy: {
      shortDescription: 'Domine o Claude da Anthropic — a IA preferida por desenvolvedores e analistas. Análise de documentos longos, programação avançada e raciocínio complexo.',
      subheadline: 'A IA mais poderosa para trabalhos complexos — análise profunda, código e raciocínio superior com Claude',
    },
    guarantees: [
      '7 dias de garantia incondicional',
      'Acesso vitalício ao conteúdo',
    ],
    features: ['Conteúdo completo em texto', 'Templates de análise', 'Projetos práticos', 'Certificado digital'],
  },
  'banana-dev-deploy-ia': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 120,
      duration: '20+ horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 197,
      originalPrice: 597,
      discount: 67,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 12 },
    },
    copy: {
      shortDescription: 'Coloque modelos de Machine Learning em produção facilmente. Deploy, scaling e monetização de modelos de IA sem complexidade de infraestrutura.',
      subheadline: 'Lance modelos de ML em minutos e escale como as big techs — sem precisar de DevOps',
    },
    guarantees: [
      '7 dias de garantia incondicional',
      'Acesso vitalício ao conteúdo',
    ],
    features: ['Conteúdo completo em texto', 'Modelos prontos', 'Projetos práticos', 'Certificado digital'],
  },

  // TIER 2: Basic/intro courses (smaller, lower price)
  'aprenda-a-usar-inteligencia-artificial-no-seu-dia-a-dia': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 20,
      duration: '3 horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 47,
      originalPrice: 97,
      discount: 52,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 6 },
    },
    copy: {
      shortDescription: 'Curso introdutório e prático para usar IA no dia a dia. Aprenda a economizar tempo com ChatGPT e outras ferramentas de IA — ideal para iniciantes.',
      subheadline: 'Comece a usar IA hoje — um curso prático e direto para iniciantes',
    },
    guarantees: ['7 dias de garantia incondicional'],
    features: ['Conteúdo em texto', 'Exercícios práticos', 'Certificado digital'],
  },
  'chatgpt-zero': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 15,
      duration: '2 horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 37,
      originalPrice: 97,
      discount: 62,
      currency: 'BRL',
      installments: { enabled: false, maxInstallments: 1 },
    },
    copy: {
      shortDescription: 'Aprenda os fundamentos do ChatGPT do zero. Crie prompts eficazes e gere conteúdo de qualidade — curso rápido e objetivo para quem está começando.',
      subheadline: 'Domine os fundamentos do ChatGPT em 2 horas — do zero ao seu primeiro resultado',
    },
    guarantees: ['7 dias de garantia incondicional'],
    features: ['Conteúdo em texto', 'Templates de prompts', 'Certificado digital'],
  },
  'primeiras-automacoes': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 25,
      duration: '4 horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 67,
      originalPrice: 147,
      discount: 54,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 6 },
    },
    copy: {
      shortDescription: 'Crie suas primeiras automações e economize horas de trabalho repetitivo. Curso prático usando n8n — sem precisar programar.',
      subheadline: 'Automatize tarefas repetitivas em poucas horas — sem programação',
    },
    guarantees: ['7 dias de garantia incondicional'],
    features: ['Conteúdo em texto', 'Workflows prontos', 'Certificado digital'],
  },
  'prompt-engineering': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 30,
      duration: '5 horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 77,
      originalPrice: 197,
      discount: 61,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 6 },
    },
    copy: {
      shortDescription: 'Domine a arte do prompt engineering. Técnicas avançadas para extrair o máximo do ChatGPT e outras IAs — resultados melhores com prompts melhores.',
      subheadline: 'Crie prompts que geram resultados profissionais — técnicas avançadas para ChatGPT e outras IAs',
    },
    guarantees: ['7 dias de garantia incondicional'],
    features: ['Conteúdo em texto', 'Templates avançados', 'Projetos práticos', 'Certificado digital'],
  },
  'automacao-n8n': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 40,
      duration: '8 horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 97,
      originalPrice: 247,
      discount: 61,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 6 },
    },
    copy: {
      shortDescription: 'Curso intermediário de automação com n8n. Crie workflows complexos, integre APIs e automatize processos reais de negócio.',
      subheadline: 'Crie automações avançadas com n8n — workflows complexos e integrações com APIs',
    },
    guarantees: ['7 dias de garantia incondicional'],
    features: ['Conteúdo em texto', 'Workflows prontos', 'Projetos práticos', 'Certificado digital'],
  },
  'midjourney-masterclass': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 35,
      duration: '6 horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 77,
      originalPrice: 197,
      discount: 61,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 6 },
    },
    copy: {
      shortDescription: 'Aprenda a criar imagens de alta qualidade com Midjourney. Técnicas de prompts, estilos visuais e projetos criativos para designers e criadores.',
      subheadline: 'Crie imagens profissionais com Midjourney — técnicas práticas para resultados impressionantes',
    },
    guarantees: ['7 dias de garantia incondicional'],
    features: ['Conteúdo em texto', 'Prompts testados', 'Projetos criativos', 'Certificado digital'],
  },
  'crie-agentes-de-ia-autonomos': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 50,
      duration: '10 horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 147,
      originalPrice: 397,
      discount: 63,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 12 },
    },
    copy: {
      shortDescription: 'Crie agentes de IA autônomos com Flowise e LangChain. Curso avançado para desenvolvedores que querem construir soluções de IA sofisticadas.',
      subheadline: 'Desenvolva agentes de IA capazes de tomar decisões e executar tarefas complexas',
    },
    guarantees: ['7 dias de garantia incondicional'],
    features: ['Conteúdo em texto', 'Projetos práticos', 'Code templates', 'Certificado digital'],
  },
  'rag-knowledge': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 60,
      duration: '12 horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 147,
      originalPrice: 497,
      discount: 70,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 12 },
    },
    copy: {
      shortDescription: 'Domine RAG (Retrieval-Augmented Generation) e crie IAs que consultam seus próprios dados. Chatbots inteligentes, assistentes de pesquisa e mais.',
      subheadline: 'Crie sistemas de IA que respondem com base nos seus próprios dados — RAG na prática',
    },
    guarantees: ['7 dias de garantia incondicional'],
    features: ['Conteúdo em texto', 'Projetos práticos', 'Code templates', 'Certificado digital'],
  },
  'ia-producao': {
    metrics: {
      students: 0,
      rating: 0,
      reviewCount: 0,
      completionRate: 0,
      lessons: 70,
      duration: '15 horas',
      lastUpdated: '2025-01',
    },
    pricing: {
      price: 197,
      originalPrice: 597,
      discount: 67,
      currency: 'BRL',
      installments: { enabled: true, maxInstallments: 12 },
    },
    copy: {
      shortDescription: 'Aprenda a colocar modelos de IA em produção com Docker, Kubernetes e CI/CD. Deploy escalável e seguro para seus modelos de machine learning.',
      subheadline: 'Faça o deploy de modelos de IA de forma escalável e segura — do notebook à produção',
    },
    guarantees: ['7 dias de garantia incondicional'],
    features: ['Conteúdo em texto', 'DevOps templates', 'Projetos práticos', 'Certificado digital'],
  },
};

export async function POST() {
  try {
    const client = await getMongoClient();
    const collection = client.db(DATABASE_NAME).collection(COLLECTION_NAME);

    const results: { slug: string; success: boolean; error?: string }[] = [];

    for (const [slug, updates] of Object.entries(courseUpdates)) {
      try {
        // Remove fake testimonials for courses with 0 students
        const result = await collection.updateOne(
          { slug },
          {
            $set: {
              'metrics.students': updates.metrics.students,
              'metrics.rating': updates.metrics.rating,
              'metrics.reviewCount': updates.metrics.reviewCount,
              'metrics.completionRate': updates.metrics.completionRate,
              'metrics.lessons': updates.metrics.lessons,
              'metrics.duration': updates.metrics.duration,
              'metrics.lastUpdated': updates.metrics.lastUpdated,
              'pricing.price': updates.pricing.price,
              'pricing.originalPrice': updates.pricing.originalPrice,
              'pricing.discount': updates.pricing.discount,
              'pricing.currency': updates.pricing.currency,
              'pricing.installments': updates.pricing.installments,
              'copy.shortDescription': updates.copy.shortDescription,
              'copy.subheadline': updates.copy.subheadline,
              guarantees: updates.guarantees,
              features: updates.features,
              // Clear fake testimonials for courses with 0 students
              testimonials: [],
              // Mark as updated
              updatedAt: new Date().toISOString(),
              honestMetrics: true,
            },
          }
        );

        results.push({
          slug,
          success: result.matchedCount > 0,
          error: result.matchedCount === 0 ? 'Not found' : undefined,
        });
      } catch (error) {
        results.push({
          slug,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Updated ${successCount} courses, ${failCount} failed`,
      results,
    });
  } catch (error) {
    console.error('Error fixing courses:', error);
    return NextResponse.json(
      { error: 'Failed to fix courses' },
      { status: 500 }
    );
  }
}
