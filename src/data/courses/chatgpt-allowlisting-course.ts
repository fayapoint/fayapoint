export const chatGPTAllowlistingCourse = {
  id: 10,
  slug: "chatgpt-allowlisting",
  title: "ChatGPT Allowlisting: Seja Encontrado pela IA",
  subtitle: "O Guia Definitivo Para Fazer Seu Site Aparecer nas Respostas do ChatGPT e Outras IAs",
  tool: "ChatGPT",
  category: "SEO para IA",
  level: "Iniciante",
  duration: "8+ horas",
  totalLessons: 45,
  price: 57,
  originalPrice: 397,
  rating: 0,
  students: 0,
  lastUpdated: "Janeiro 2025",
  
  shortDescription: "Aprenda a configurar seu site para ser indexado e citado pelo ChatGPT, Claude, Gemini e outras IAs. O novo SEO que vai definir quem será encontrado na era da IA.",
  
  fullDescription: `A forma como as pessoas buscam informação está mudando radicalmente. Em 2025, milhões de usuários perguntam ao ChatGPT antes de pesquisar no Google. 

Se o seu site não está configurado corretamente, você simplesmente NÃO EXISTE para esses usuários.

Este curso ensina exatamente como configurar seu site para ser rastreado, indexado e CITADO pelo ChatGPT e outras IAs generativas. Desde configurações técnicas de robots.txt até estratégias avançadas com Cloudflare, Akamai e outros WAFs.

Baseado na documentação oficial da OpenAI e nas melhores práticas de mercado, você vai aprender a posicionar seu negócio na frente desta revolução.`,
  
  impactForIndividuals: [
    "🔍 Seu conteúdo aparece nas respostas do ChatGPT",
    "📈 Aumento de até 300% em tráfego qualificado de IA",
    "🎯 Seja citado como fonte confiável por assistentes de IA",
    "⚡ Configure tudo em menos de 1 hora com nossos guias",
    "🛡️ Proteja seu site mantendo acesso para bots de IA legítimos",
    "📊 Monitore quais IAs estão acessando seu conteúdo",
    "🚀 Saia na frente de 95% dos sites que ainda bloqueiam IAs",
    "💡 Entenda a diferença entre crawlers de treino e de busca",
    "🔧 Domine robots.txt, AI.txt e headers de verificação",
    "📱 Aplique em qualquer plataforma: WordPress, Next.js, etc."
  ],
  
  impactForEntrepreneurs: [
    "🏆 Clientes encontram você quando perguntam ao ChatGPT",
    "💰 Novo canal de aquisição com custo zero",
    "📣 Sua marca é recomendada por IAs em conversas",
    "🎯 Marketing de conteúdo que funciona na era da IA",
    "📈 Aumente autoridade sendo fonte citada por IA",
    "🔗 Backlinks naturais quando IA referencia seu site",
    "⏱️ ROI imediato: configure uma vez, beneficie para sempre",
    "🛒 E-commerce: produtos aparecem em recomendações de IA",
    "📝 Blog: artigos são citados em respostas do ChatGPT",
    "🤝 Diferencial competitivo real e mensurável"
  ],
  
  impactForCompanies: [
    "🏢 Presença corporativa em assistentes de IA",
    "📊 Métricas de AI visibility para relatórios",
    "🔒 Configuração segura com WAFs enterprise (Cloudflare, Akamai)",
    "👥 Treinamento de equipe técnica incluso",
    "📋 Checklists e SOPs prontos para implementação",
    "🛡️ Compliance: controle granular do que IA pode acessar",
    "📈 KPIs específicos para monitorar presença em IA",
    "🌐 Multi-domínio: aplique em todos os sites da empresa",
    "🔧 Integração com ferramentas de analytics existentes",
    "💼 Suporte prioritário para implementação enterprise"
  ],
  
  whatYouLearn: [
    "O que é ChatGPT Agent Mode e como funciona o Allowlisting",
    "Diferença entre GPTBot, ChatGPT-User e OAI-SearchBot",
    "Configuração completa de robots.txt para todos os bots de IA",
    "Allowlisting em Cloudflare: regras de firewall e bot management",
    "Configuração em Akamai: Bot Manager e Custom Bot Categories",
    "Verificação de assinatura criptográfica de requests da OpenAI",
    "IP ranges oficiais da OpenAI e como implementar whitelist",
    "Headers HTTP que identificam bots legítimos",
    "Monitoramento de tráfego de IA com analytics",
    "Estratégias de conteúdo otimizado para citação por IA",
    "AI.txt: o novo padrão emergente para controle de IA",
    "Troubleshooting: quando a IA não consegue acessar seu site",
    "Configuração em plataformas: WordPress, Vercel, Netlify, AWS",
    "Métricas e KPIs para medir sucesso de AI visibility",
    "Casos práticos de sites que multiplicaram tráfego com allowlisting"
  ],
  
  modules: [
    {
      id: 1,
      title: "Fundamentos: A Nova Era da Busca por IA",
      description: "Entenda por que AI Allowlisting é essencial para qualquer negócio online",
      duration: "1.5 horas",
      lessons: 8,
      topics: [
        "Como ChatGPT Agent Mode funciona",
        "Diferença entre busca tradicional e busca por IA",
        "Por que 95% dos sites estão bloqueando IAs sem saber",
        "O custo de ser invisível para assistentes de IA",
        "Estudo de caso: sites que dobraram tráfego com allowlisting"
      ]
    },
    {
      id: 2,
      title: "Robots.txt Masterclass para IA",
      description: "Domine o arquivo que controla o acesso de bots ao seu site",
      duration: "2 horas",
      lessons: 10,
      topics: [
        "Anatomia do robots.txt perfeito para IA",
        "GPTBot vs ChatGPT-User vs OAI-SearchBot",
        "Configurando acesso para Claude, Gemini e outros",
        "Controle granular: o que permitir e o que bloquear",
        "Templates prontos para copiar e colar"
      ]
    },
    {
      id: 3,
      title: "Cloudflare: Configuração Completa",
      description: "Libere IAs no Cloudflare mantendo proteção contra ataques",
      duration: "1.5 horas",
      lessons: 8,
      topics: [
        "Bot Management vs Super Bot Fight Mode",
        "Criando regras de firewall para OpenAI",
        "Verificação automática via Bot Detection ID",
        "Managed Challenge vs Allow para IAs",
        "AI Crawl Control: o painel definitivo"
      ]
    },
    {
      id: 4,
      title: "Akamai e Outros WAFs Enterprise",
      description: "Configuração em ambientes corporativos",
      duration: "1 hora",
      lessons: 6,
      topics: [
        "Akamai Bot Manager: ChatGPT Agent como trusted bot",
        "Custom Bot Categories para OpenAI",
        "Fastly, AWS WAF e outras soluções",
        "Verificação de assinatura HTTP da OpenAI",
        "IP Allowlisting com ranges oficiais"
      ]
    },
    {
      id: 5,
      title: "Verificação e Autenticação Avançada",
      description: "Garanta que apenas bots legítimos acessam seu conteúdo",
      duration: "1 hora",
      lessons: 5,
      topics: [
        "IP ranges oficiais da OpenAI (atualizados)",
        "Verificação de User-Agent legítimo",
        "Assinatura criptográfica de requests",
        "Reverse DNS lookup para validação",
        "Logs e auditoria de acesso de IA"
      ]
    },
    {
      id: 6,
      title: "Implementação por Plataforma",
      description: "Guias específicos para cada tecnologia",
      duration: "1.5 horas",
      lessons: 8,
      topics: [
        "WordPress: plugins e configuração manual",
        "Next.js e Vercel: middleware e edge functions",
        "Netlify: _headers e configuração de bots",
        "AWS: CloudFront e WAF configuration",
        "Apache e Nginx: configuração direta"
      ]
    },
    {
      id: 7,
      title: "Monitoramento e Analytics de IA",
      description: "Meça o impacto e otimize continuamente",
      duration: "1 hora",
      lessons: 5,
      topics: [
        "Identificando tráfego de IA no analytics",
        "Métricas de AI visibility",
        "Ferramentas de monitoramento especializadas",
        "Relatórios executivos de presença em IA",
        "A/B testing para otimização de citações"
      ]
    },
    {
      id: 8,
      title: "Estratégia de Conteúdo para IA",
      description: "Crie conteúdo que IAs adoram citar",
      duration: "1 hora",
      lessons: 5,
      topics: [
        "Estrutura de conteúdo otimizada para IA",
        "Schema markup que IAs entendem",
        "Autoridade e E-E-A-T na era da IA",
        "FAQ e conteúdo de resposta direta",
        "O futuro: AI.txt e novos padrões"
      ]
    }
  ],
  
  testimonials: [],
  
  guarantees: [
    "30 dias de garantia incondicional",
    "Acesso vitalício ao conteúdo",
    "Atualizações conforme OpenAI muda regras",
    "Suporte técnico por 1 ano",
    "Certificado de conclusão",
    "Comunidade exclusiva de AI SEO"
  ],
  
  bonuses: [
    {
      title: "Pack Templates robots.txt",
      value: 197,
      description: "20+ templates prontos para diferentes plataformas e necessidades"
    },
    {
      title: "Checklist de Implementação",
      value: 97,
      description: "Passo a passo visual para nunca esquecer nada"
    },
    {
      title: "Regras Cloudflare Prontas",
      value: 297,
      description: "Exportação JSON das regras de firewall para importar direto"
    },
    {
      title: "Dashboard de Monitoramento",
      value: 497,
      description: "Template de dashboard para acompanhar tráfego de IA"
    },
    {
      title: "Acesso Grupo VIP de AI SEO",
      value: 297,
      description: "Comunidade exclusiva com atualizações e networking"
    }
  ],
  
  faqs: [
    {
      question: "Funciona para qualquer tipo de site?",
      answer: "Sim! WordPress, e-commerce, blogs, sites institucionais, aplicações em React/Next.js, qualquer coisa."
    },
    {
      question: "Preciso saber programar?",
      answer: "Não. A maioria das configurações é copiar e colar. Para casos avançados, temos guias passo a passo."
    },
    {
      question: "Quanto tempo leva para implementar?",
      answer: "Configuração básica em 15-30 minutos. Implementação completa em 1-2 horas."
    },
    {
      question: "Quando vejo resultados?",
      answer: "Bots de IA começam a acessar imediatamente. Citações em respostas dependem do seu conteúdo, mas muitos veem em dias."
    },
    {
      question: "É seguro liberar acesso para IAs?",
      answer: "Sim! Você controla exatamente o que cada bot pode acessar. O curso ensina configuração segura."
    },
    {
      question: "E se a OpenAI mudar as regras?",
      answer: "Atualizamos o curso sempre que há mudanças. Você tem acesso vitalício às atualizações."
    }
  ],
  
  realWorldProjects: [
    "Configurar robots.txt completo do zero",
    "Implementar allowlisting no Cloudflare",
    "Criar dashboard de monitoramento de IA",
    "Auditoria de site para AI visibility",
    "Otimizar conteúdo existente para citação por IA"
  ],
  
  targetAudience: [
    "Donos de sites e blogs",
    "Profissionais de SEO e Marketing Digital",
    "Desenvolvedores web e DevOps",
    "Gestores de e-commerce",
    "Agências de marketing digital",
    "Empresas que querem presença em IA"
  ],
  
  requirements: [
    "Acesso administrativo ao seu site",
    "Conhecimento básico de internet (não precisa ser técnico)",
    "Vontade de aprender e implementar"
  ],
  
  features: [
    "Certificado de conclusão",
    "Projetos práticos hands-on",
    "Templates prontos para usar",
    "Suporte da comunidade",
    "Atualizações vitalícias"
  ]
};
