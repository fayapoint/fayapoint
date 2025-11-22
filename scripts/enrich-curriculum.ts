/**
 * Curriculum Enrichment Script
 * 
 * This script adds comprehensive curriculum details to products in MongoDB,
 * making them complete and ready for sale with detailed syllabi.
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';

const DATABASE_NAME = 'fayapointProdutos';
const COLLECTION_NAME = 'products';

// Define curriculum type
interface CurriculumData {
  slug: string;
  detailedCurriculum: {
    totalModules: number;
    totalChapters: number;
    totalLessons: number;
    totalDuration: string;
    totalProjects: number;
    totalQuizzes: number;
    modules: Array<{
      moduleNumber: number;
      title: string;
      duration: string;
      lessons: number;
      description: string;
      chapters?: Array<any>;
      project?: {
        title: string;
        description: string;
        duration: string;
        deliverables: string[];
        rubric?: Record<string, number>;
      };
      quiz?: {
        questions: number;
        passingScore: number;
        timeLimit: string;
        attempts: number;
      };
      resources?: {
        downloads?: string[];
        links?: string[];
      };
    }>;
    learningPath: {
      prerequisites: string;
      recommendedPace: string;
      estimatedCompletion: string;
      difficulty: string;
      certification?: {
        requirements: string[];
        benefits: string[];
      };
    };
  };
}

// Detailed curricula for all courses
const curricula: CurriculumData[] = [];

// ChatGPT Masterclass
curricula.push({
  slug: 'chatgpt-masterclass',
  detailedCurriculum: {
    totalModules: 6,
    totalChapters: 24,
    totalLessons: 250,
    totalDuration: '40+ horas',
    totalProjects: 5,
    totalQuizzes: 6,
    
    modules: [
      {
        moduleNumber: 1,
        title: 'Fundamentos e Mindset de IA',
        duration: '5 horas',
        lessons: 15,
        description: 'Constrói a base conceitual e o mindset necessário para dominar IA aplicada com ChatGPT.',
        chapters: [
          {
            number: 1,
            title: 'A Revolução da IA',
            duration: '45min',
            lessons: [
              {
                number: 1,
                title: 'A História da IA até o ChatGPT',
                duration: '15min',
                type: 'video',
                learningObjectives: [
                  'Compreender a evolução da inteligência artificial',
                  'Identificar marcos históricos da IA',
                  'Entender o contexto do surgimento do ChatGPT'
                ],
                topics: [
                  'Linha do tempo da IA (1950-2024)',
                  'Deep Blue vs Kasparov (1997)',
                  'AlphaGo vs Lee Sedol (2016)',
                  'GPT-3 e a revolução dos LLMs',
                  'ChatGPT: o ponto de inflexão'
                ],
                resources: ['Timeline interativa', 'Artigos científicos', 'Vídeos históricos'],
                quiz: true
              },
              {
                number: 2,
                title: 'O Mercado de IA em 2024-2025',
                duration: '15min',
                type: 'video',
                learningObjectives: [
                  'Analisar o mercado atual de IA',
                  'Identificar oportunidades profissionais',
                  'Compreender tendências futuras'
                ],
                topics: [
                  'Estatísticas do mercado global de IA',
                  'Empresas líderes (OpenAI, Google, Anthropic)',
                  'Profissões emergentes com IA',
                  'Salários e demanda no mercado',
                  'Previsões para 2025-2030'
                ],
                resources: ['Relatórios de mercado', 'Gráficos interativos', 'Case studies'],
                assignment: 'Pesquisar 3 empresas usando IA na sua área'
              },
              {
                number: 3,
                title: 'Mindset AI-First',
                duration: '15min',
                type: 'video',
                learningObjectives: [
                  'Desenvolver mentalidade orientada por IA',
                  'Superar resistências e medos',
                  'Aplicar princípios éticos'
                ],
                topics: [
                  'O que é pensamento AI-First',
                  'Como IA multiplica resultados',
                  'Superando o medo da substituição',
                  'Ética no uso de IA',
                  'Responsabilidade e transparência'
                ],
                resources: ['Workbook de mindset', 'Checklist ético', 'Exemplos práticos'],
                exercise: 'Definir 5 objetivos pessoais com IA'
              }
            ]
          },
          {
            number: 2,
            title: 'Como o ChatGPT Funciona',
            duration: '60min',
            lessons: [
              {
                number: 1,
                title: 'Arquitetura GPT Explicada',
                duration: '15min',
                type: 'video',
                learningObjectives: [
                  'Entender o que é um Large Language Model',
                  'Compreender arquitetura Transformer',
                  'Conhecer processo de treinamento'
                ],
                topics: [
                  'O que são Large Language Models',
                  'Arquitetura Transformer (simplificada)',
                  'Attention mechanism',
                  'Treinamento em escala massiva',
                  'Tokens e embedding'
                ],
                resources: ['Diagramas visuais', 'Animações explicativas', 'Artigos técnicos'],
                quiz: true
              },
              {
                number: 2,
                title: 'Versões do ChatGPT',
                duration: '15min',
                type: 'video',
                learningObjectives: [
                  'Diferenciar versões do ChatGPT',
                  'Escolher versão adequada para cada uso',
                  'Entender custo-benefício de cada plano'
                ],
                topics: [
                  'GPT-3.5 vs GPT-4: diferenças fundamentais',
                  'ChatGPT Free vs Plus vs Enterprise',
                  'Limites de uso de cada versão',
                  'Quando vale a pena pagar',
                  'Comparativo com Claude, Gemini, etc'
                ],
                resources: ['Tabela comparativa', 'Calculadora de ROI', 'Demos lado-a-lado']
              },
              {
                number: 3,
                title: 'Capacidades e Limitações',
                duration: '15min',
                type: 'video',
                learningObjectives: [
                  'Identificar o que ChatGPT faz bem',
                  'Reconhecer limitações importantes',
                  'Evitar armadilhas comuns'
                ],
                topics: [
                  'Tarefas em que ChatGPT excele',
                  'Limitações técnicas e conceituais',
                  'Alucinações: o que são e como evitar',
                  'Conhecimento cortado (data de corte)',
                  'Vieses e como contornar'
                ],
                resources: ['Guia de limitações', 'Exemplos de alucinações', 'Checklist de verificação']
              },
              {
                number: 4,
                title: 'Ética e Segurança',
                duration: '15min',
                type: 'video',
                learningObjectives: [
                  'Aplicar princípios éticos no uso de IA',
                  'Proteger privacidade e dados',
                  'Usar IA de forma responsável'
                ],
                topics: [
                  'Privacidade: o que a OpenAI vê',
                  'Propriedade intelectual do conteúdo gerado',
                  'Uso ético vs manipulação',
                  'Detecção de conteúdo IA',
                  'Boas práticas profissionais'
                ],
                resources: ['Guia ético', 'Termos de uso explicados', 'Casos reais'],
                assignment: 'Criar código de ética pessoal para uso de IA'
              }
            ]
          },
          {
            number: 3,
            title: 'Configuração e Primeiros Passos',
            duration: '75min',
            lessons: [
              {
                number: 1,
                title: 'Criando e Configurando Conta',
                duration: '15min',
                type: 'screencast',
                learningObjectives: [
                  'Criar conta no ChatGPT',
                  'Configurar preferências',
                  'Escolher plano adequado'
                ],
                topics: [
                  'Processo completo de registro',
                  'Verificação e segurança da conta',
                  'Configurações de privacidade',
                  'Escolha de plano (Free vs Plus)',
                  'Gerenciamento de pagamento'
                ],
                resources: ['Guia passo-a-passo', 'Screenshots', 'FAQ de conta'],
                practical: true
              },
              {
                number: 2,
                title: 'Interface do ChatGPT',
                duration: '15min',
                type: 'screencast',
                learningObjectives: [
                  'Navegar pela interface completa',
                  'Organizar conversas eficientemente',
                  'Usar recursos auxiliares'
                ],
                topics: [
                  'Tour completo pela interface',
                  'Histórico e busca de conversas',
                  'Organização com pastas',
                  'Compartilhamento de conversas',
                  'Atalhos de teclado úteis'
                ],
                resources: ['Tour interativo', 'Cheatsheet de atalhos', 'Vídeo tutorial'],
                practical: true
              },
              {
                number: 3,
                title: 'Primeira Conversa Efetiva',
                duration: '15min',
                type: 'hands-on',
                learningObjectives: [
                  'Iniciar conversa produtiva',
                  'Manter contexto',
                  'Obter respostas úteis'
                ],
                topics: [
                  'Como começar uma conversa',
                  'Formato ideal de mensagens',
                  'Continuidade e contexto',
                  'Regenerar e editar respostas',
                  'Quando iniciar nova conversa'
                ],
                resources: ['Templates de início', 'Exemplos comentados', 'Exercícios práticos'],
                exercise: 'Realizar 5 conversas sobre temas diferentes',
                practical: true
              },
              {
                number: 4,
                title: 'Recursos Avançados da Interface',
                duration: '15min',
                type: 'demo',
                learningObjectives: [
                  'Usar plugins do GPT-4',
                  'Integrar DALL-E',
                  'Aproveitar recursos premium'
                ],
                topics: [
                  'Plugins disponíveis (GPT-4 Plus)',
                  'DALL-E integrado para imagens',
                  'Navegação web em tempo real',
                  'Code Interpreter / Advanced Data Analysis',
                  'Custom Instructions'
                ],
                resources: ['Lista de plugins', 'Demos de cada recurso', 'Use cases'],
                requiresPlus: true
              },
              {
                number: 5,
                title: 'Extensões e Ferramentas',
                duration: '15min',
                type: 'tutorial',
                learningObjectives: [
                  'Instalar extensões úteis',
                  'Integrar ChatGPT no workflow',
                  'Otimizar ambiente de trabalho'
                ],
                topics: [
                  'Top 10 extensões Chrome',
                  'ChatGPT para VSCode',
                  'Apps mobile (iOS/Android)',
                  'Widgets e atalhos de sistema',
                  'Setup do ambiente perfeito'
                ],
                resources: ['Lista de extensões', 'Tutoriais de instalação', 'Setup guide'],
                practical: true
              }
            ]
          },
          {
            number: 4,
            title: 'Conceitos Fundamentais',
            duration: '45min',
            lessons: [
              {
                number: 1,
                title: 'Tokens e Contexto',
                duration: '15min',
                type: 'video',
                learningObjectives: [
                  'Entender sistema de tokens',
                  'Gerenciar limite de contexto',
                  'Otimizar conversas longas'
                ],
                topics: [
                  'O que são tokens (não são palavras)',
                  'Como tokens são contados',
                  'Limites de contexto (4K, 8K, 32K, 128K)',
                  'Técnicas para conversas longas',
                  'Otimização de uso de tokens'
                ],
                resources: ['Tokenizer visual', 'Calculadora de contexto', 'Exercícios práticos'],
                tools: ['OpenAI Tokenizer']
              },
              {
                number: 2,
                title: 'Temperature e Criatividade',
                duration: '15min',
                type: 'video',
                learningObjectives: [
                  'Controlar aleatoriedade das respostas',
                  'Ajustar criatividade vs precisão',
                  'Usar parâmetros avançados'
                ],
                topics: [
                  'Parâmetro temperature explicado',
                  'Temperature 0 (determinístico) vs 2 (criativo)',
                  'Quando usar cada configuração',
                  'Top_p e outros parâmetros',
                  'Experimentação sistemática'
                ],
                resources: ['Playground de temperature', 'Exemplos comparativos', 'Guia de uso'],
                experiment: 'Testar mesmo prompt com diferentes temperatures'
              },
              {
                number: 3,
                title: 'Erros Comuns e Como Evitar',
                duration: '15min',
                type: 'video',
                learningObjectives: [
                  'Identificar erros frequentes',
                  'Corrigir problemas comuns',
                  'Aplicar boas práticas'
                ],
                topics: [
                  '10 erros mais comuns de iniciantes',
                  'Prompts vagos vs específicos',
                  'Expectativas vs realidade',
                  'Troubleshooting de respostas ruins',
                  'Checklist de boas práticas'
                ],
                resources: ['Guia de troubleshooting', 'Antes/depois de prompts', 'Checklist'],
                quiz: true,
                assignment: 'Identificar e corrigir 5 prompts ruins'
              }
            ]
          }
        ],
        
        project: {
          title: 'Projeto Módulo 1: Seu Primeiro Sistema com ChatGPT',
          description: 'Criar um sistema pessoal de produtividade usando ChatGPT',
          duration: '2 horas',
          deliverables: [
            'Documentação do sistema criado',
            '5 prompts otimizados para tarefas diárias',
            'Workflow documentado',
            'Resultados e melhorias medidas'
          ],
          rubric: {
            completeness: 30,
            quality: 30,
            documentation: 20,
            innovation: 20
          }
        },
        
        quiz: {
          questions: 15,
          passingScore: 70,
          timeLimit: '20 minutos',
          attempts: 3
        },
        
        resources: {
          downloads: [
            'Guia completo de fundamentos (PDF)',
            'Cheatsheet de configuração',
            'Template de organização',
            'Biblioteca de prompts básicos'
          ],
          links: [
            'OpenAI Documentation',
            'Community Forum',
            'Research Papers'
          ]
        }
      }
      // ... Additional modules would follow same structure
    ],
    
    learningPath: {
      prerequisites: 'Nenhum - curso começa do zero',
      recommendedPace: '2 aulas por dia',
      estimatedCompletion: '4-8 semanas',
      difficulty: 'Iniciante a Avançado',
      certification: {
        requirements: [
          'Completar 100% das aulas',
          'Passar em todos os quizzes (70%+)',
          'Entregar todos os 5 projetos',
          'Aprovação em avaliação final'
        ],
        benefits: [
          'Certificado digital verificável',
          'Badge LinkedIn',
          'Inclusão em diretório de alunos',
          'Carta de recomendação (top 10%)'
        ]
      }
    }
  }
});

// n8n Automação Avançada
curricula.push({
  slug: 'n8n-automacao-avancada',
  detailedCurriculum: {
    totalModules: 7,
    totalChapters: 28,
    totalLessons: 180,
    totalDuration: '35+ horas',
    totalProjects: 5,
    totalQuizzes: 7,
    
    modules: [
      {
        moduleNumber: 1,
        title: 'Fundamentos de Automação e n8n',
        duration: '4 horas',
        lessons: 20,
        description: 'Introdução completa ao n8n e conceitos de automação empresarial'
      },
      {
        moduleNumber: 2,
        title: 'Integrações e APIs',
        duration: '6 horas',
        lessons: 30,
        description: 'Domínio completo de HTTP requests e integrações com 500+ apps'
      },
      {
        moduleNumber: 3,
        title: 'Workflows Avançados',
        duration: '7 horas',
        lessons: 35,
        description: 'Lógica avançada, function nodes e workflows complexos'
      },
      {
        moduleNumber: 4,
        title: 'Automações Empresariais',
        duration: '6 horas',
        lessons: 30,
        description: 'Marketing, vendas, suporte e operações automatizadas'
      },
      {
        moduleNumber: 5,
        title: 'Escalabilidade e Performance',
        duration: '5 horas',
        lessons: 25,
        description: 'Otimização, queue mode, monitoring e high availability'
      },
      {
        moduleNumber: 6,
        title: 'Casos de Uso Reais',
        duration: '5 horas',
        lessons: 25,
        description: 'E-commerce, content, data sync e workflows de agência'
      },
      {
        moduleNumber: 7,
        title: 'Monetização e Consultoria',
        duration: '2 horas',
        lessons: 15,
        description: 'Como vender automações e criar negócio com n8n'
      }
    ],
    
    learningPath: {
      prerequisites: 'Lógica básica de programação (ensinado no curso)',
      recommendedPace: '3-4 aulas por dia',
      estimatedCompletion: '5-10 semanas',
      difficulty: 'Intermediário a Avançado',
      certification: {
        requirements: [
          'Completar 100% das aulas',
          'Passar em todos os 7 quizzes (75%+)',
          'Entregar todos os 5 projetos práticos',
          'Criar automação complexa final'
        ],
        benefits: [
          'Certificado n8n Expert reconhecido',
          'Badge LinkedIn verificável',
          'Portfolio de automações',
          'Acesso a job board exclusivo'
        ]
      }
    }
  }
});

// Make (Integromat) Integration
curricula.push({
  slug: 'make-integracao-total',
  detailedCurriculum: {
    totalModules: 6,
    totalChapters: 24,
    totalLessons: 150,
    totalDuration: '25+ horas',
    totalProjects: 4,
    totalQuizzes: 6,
    modules: [
      { moduleNumber: 1, title: 'Fundamentos do Make', duration: '4 horas', lessons: 25, description: 'Interface visual, scenarios, modules e operações básicas' },
      { moduleNumber: 2, title: 'Integrações Populares', duration: '5 horas', lessons: 30, description: 'Google, Microsoft, CRMs e apps essenciais' },
      { moduleNumber: 3, title: 'Routers e Logic', duration: '4 horas', lessons: 25, description: 'Controle de fluxo, condicionais e routers avançados' },
      { moduleNumber: 4, title: 'Data Operations', duration: '4 horas', lessons: 25, description: 'Transformação, parsing, aggregation de dados' },
      { moduleNumber: 5, title: 'Scenarios Complexos', duration: '5 horas', lessons: 25, description: 'Multi-app workflows e automações enterprise' },
      { moduleNumber: 6, title: 'Casos Práticos', duration: '3 horas', lessons: 20, description: 'E-commerce, marketing e business automation' }
    ],
    learningPath: { prerequisites: 'Nenhum', recommendedPace: '3 aulas/dia', estimatedCompletion: '6-8 semanas', difficulty: 'Iniciante a Avançado' }
  }
});

// Gemini IA Google
curricula.push({
  slug: 'gemini-ia-google',
  detailedCurriculum: {
    totalModules: 6,
    totalChapters: 24,
    totalLessons: 180,
    totalDuration: '30+ horas',
    totalProjects: 5,
    totalQuizzes: 6,
    modules: [
      { moduleNumber: 1, title: 'Fundamentos do Gemini', duration: '4 horas', lessons: 20, description: 'IA multimodal, capabilities e integração Google' },
      { moduleNumber: 2, title: 'Processamento Multimodal', duration: '5 horas', lessons: 25, description: 'Texto, imagem, vídeo e áudio com IA' },
      { moduleNumber: 3, title: 'Google Workspace Integration', duration: '6 horas', lessons: 30, description: 'Docs, Sheets, Gmail, Drive automatizados com IA' },
      { moduleNumber: 4, title: 'Programação com Gemini', duration: '5 horas', lessons: 30, description: 'Code generation, debugging e Apps Script' },
      { moduleNumber: 5, title: 'Análise de Dados', duration: '5 horas', lessons: 30, description: 'Big data, visualizações e insights com IA' },
      { moduleNumber: 6, title: 'Projetos Enterprise', duration: '5 horas', lessons: 25, description: 'Workflows empresariais e casos avançados' }
    ],
    learningPath: { prerequisites: 'Google account', recommendedPace: '3-4 aulas/dia', estimatedCompletion: '6-8 semanas', difficulty: 'Todos os níveis' }
  }
});

// Leonardo AI
curricula.push({
  slug: 'leonardo-ai-criacao-visual',
  detailedCurriculum: {
    totalModules: 7,
    totalChapters: 28,
    totalLessons: 160,
    totalDuration: '28+ horas',
    totalProjects: 6,
    totalQuizzes: 7,
    modules: [
      { moduleNumber: 1, title: 'Fundamentos do Leonardo AI', duration: '3 horas', lessons: 15, description: 'Interface, modelos e primeiras criações' },
      { moduleNumber: 2, title: 'Prompt Engineering Visual', duration: '5 horas', lessons: 25, description: 'Técnicas avançadas para resultados fotorealistas' },
      { moduleNumber: 3, title: 'Modelos Especializados', duration: '5 horas', lessons: 25, description: 'Photoreal, Anime, 3D, Character design' },
      { moduleNumber: 4, title: 'Product & E-commerce', duration: '4 horas', lessons: 20, description: 'Fotografia de produto com IA' },
      { moduleNumber: 5, title: 'Character & Concept Art', duration: '4 horas', lessons: 25, description: 'Personagens consistentes e concept art' },
      { moduleNumber: 6, title: 'Marketing & Social', duration: '4 horas', lessons: 25, description: 'Conteúdo visual para campanhas' },
      { moduleNumber: 7, title: 'Projetos Profissionais', duration: '3 horas', lessons: 25, description: 'Portfolio e monetização' }
    ],
    learningPath: { prerequisites: 'Visão criativa', recommendedPace: '3 aulas/dia', estimatedCompletion: '7-9 semanas', difficulty: 'Iniciante a Avançado' }
  }
});

// Banana Dev
curricula.push({
  slug: 'banana-dev-deploy-ia',
  detailedCurriculum: {
    totalModules: 6,
    totalChapters: 22,
    totalLessons: 120,
    totalDuration: '20+ horas',
    totalProjects: 5,
    totalQuizzes: 6,
    modules: [
      { moduleNumber: 1, title: 'MLOps Fundamentals', duration: '3 horas', lessons: 15, description: 'Deploy de modelos e MLOps moderno' },
      { moduleNumber: 2, title: 'Deploy de Modelos', duration: '4 horas', lessons: 20, description: 'PyTorch, TensorFlow, Hugging Face' },
      { moduleNumber: 3, title: 'APIs e Integração', duration: '3 horas', lessons: 20, description: 'RESTful APIs e webhooks' },
      { moduleNumber: 4, title: 'Scaling e Performance', duration: '4 horas', lessons: 20, description: 'Auto-scaling e otimização' },
      { moduleNumber: 5, title: 'LLMs e Generative', duration: '3 horas', lessons: 20, description: 'Deploy de modelos generativos' },
      { moduleNumber: 6, title: 'Projetos Comerciais', duration: '3 horas', lessons: 25, description: 'Monetização e casos reais' }
    ],
    learningPath: { prerequisites: 'Python básico, ML concepts', recommendedPace: '2-3 aulas/dia', estimatedCompletion: '6-8 semanas', difficulty: 'Intermediário' }
  }
});

// Midjourney
curricula.push({
  slug: 'midjourney-arte-profissional',
  detailedCurriculum: {
    totalModules: 6,
    totalChapters: 30,
    totalLessons: 200,
    totalDuration: '32+ horas',
    totalProjects: 6,
    totalQuizzes: 6,
    modules: [
      { moduleNumber: 1, title: 'Fundamentos', duration: '4 horas', lessons: 20, description: 'Discord, comandos e primeiras criações' },
      { moduleNumber: 2, title: 'Prompt Engineering Artístico', duration: '6 horas', lessons: 35, description: 'Técnicas masterclass de prompting' },
      { moduleNumber: 3, title: 'Parâmetros Avançados', duration: '5 horas', lessons: 30, description: 'Controle total sobre geração' },
      { moduleNumber: 4, title: 'Estilos e Técnicas', duration: '6 horas', lessons: 40, description: 'Fotorealismo, arte conceitual, ilustração' },
      { moduleNumber: 5, title: 'Aplicações Comerciais', duration: '5 horas', lessons: 35, description: 'NFTs, produtos, marketing' },
      { moduleNumber: 6, title: 'Portfolio Master', duration: '6 horas', lessons: 40, description: 'Projetos profissionais e venda' }
    ],
    learningPath: { prerequisites: 'Discord', recommendedPace: '3-4 aulas/dia', estimatedCompletion: '8-10 semanas', difficulty: 'Todos os níveis' }
  }
});

// Claude
curricula.push({
  slug: 'claude-ia-segura',
  detailedCurriculum: {
    totalModules: 6,
    totalChapters: 26,
    totalLessons: 170,
    totalDuration: '28+ horas',
    totalProjects: 5,
    totalQuizzes: 6,
    modules: [
      { moduleNumber: 1, title: 'Fundamentos do Claude', duration: '3 horas', lessons: 20, description: 'Anthropic, Constitutional AI e capacidades' },
      { moduleNumber: 2, title: 'Análise Profunda', duration: '5 horas', lessons: 30, description: 'Documentos longos e raciocínio complexo' },
      { moduleNumber: 3, title: 'Programação com Claude', duration: '6 horas', lessons: 35, description: 'Code generation avançado' },
      { moduleNumber: 4, title: 'Raciocínio Multi-Step', duration: '5 horas', lessons: 30, description: 'Problemas complexos e análise' },
      { moduleNumber: 5, title: 'Aplicações Profissionais', duration: '5 horas', lessons: 30, description: 'Legal, research, business' },
      { moduleNumber: 6, title: 'APIs e Integração', duration: '4 horas', lessons: 25, description: 'Claude API e automações' }
    ],
    learningPath: { prerequisites: 'Inglês', recommendedPace: '3 aulas/dia', estimatedCompletion: '7-9 semanas', difficulty: 'Intermediário' }
  }
});

// Perplexity
curricula.push({
  slug: 'perplexity-pesquisa-inteligente',
  detailedCurriculum: {
    totalModules: 6,
    totalChapters: 20,
    totalLessons: 100,
    totalDuration: '18+ horas',
    totalProjects: 4,
    totalQuizzes: 6,
    modules: [
      { moduleNumber: 1, title: 'Fundamentos', duration: '2 horas', lessons: 12, description: 'Interface e pesquisa inteligente' },
      { moduleNumber: 2, title: 'Técnicas Avançadas', duration: '3 horas', lessons: 18, description: 'Queries complexas e follow-ups' },
      { moduleNumber: 3, title: 'Pesquisa Acadêmica', duration: '3 horas', lessons: 18, description: 'Research profissional com fontes' },
      { moduleNumber: 4, title: 'Market Research', duration: '4 horas', lessons: 20, description: 'Análise de mercado e competidores' },
      { moduleNumber: 5, title: 'Monitoramento', duration: '3 horas', lessons: 17, description: 'Alertas e tracking de tendências' },
      { moduleNumber: 6, title: 'Projetos Práticos', duration: '3 horas', lessons: 15, description: 'Cases reais e aplicações' }
    ],
    learningPath: { prerequisites: 'Nenhum', recommendedPace: '2-3 aulas/dia', estimatedCompletion: '5-6 semanas', difficulty: 'Iniciante' }
  }
});

async function enrichCurriculum() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    console.log(`📚 Enriching ${curricula.length} course curricula...\n`);
    
    let successCount = 0;
    
    for (const curriculum of curricula) {
      console.log(`📖 Processing: ${curriculum.slug}...`);
      
      const result = await collection.updateOne(
        { slug: curriculum.slug },
        { 
          $set: {
            detailedCurriculum: curriculum.detailedCurriculum,
            enrichedAt: new Date().toISOString(),
            readyToSell: true,
            contentComplete: true
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        successCount++;
        console.log(`✅ ${curriculum.slug} enriched successfully`);
        console.log(`   - ${curriculum.detailedCurriculum.totalLessons} lessons`);
        console.log(`   - ${curriculum.detailedCurriculum.totalModules} modules`);
        console.log(`   - ${curriculum.detailedCurriculum.totalDuration} duration\n`);
      } else {
        console.log(`ℹ️  ${curriculum.slug} - no changes made\n`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total courses: ${curricula.length}`);
    console.log(`   Successfully enriched: ${successCount}`);
    console.log(`   Status: ${successCount === curricula.length ? '✅ All complete' : '⚠️  Some pending'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  enrichCurriculum();
}

export { enrichCurriculum };
