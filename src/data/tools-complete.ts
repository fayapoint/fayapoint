export const toolsData = {
  chatgpt: {
    title: "ChatGPT",
    category: "IA Conversacional",
    vendor: "OpenAI",
    pricing: "Freemium",
    rating: 4.9,
    description: "Assistente conversacional para texto, código e automação. Ideal para produtividade, atendimento e prototipagem.",
    detailedDescription: `ChatGPT é a ferramenta de IA mais revolucionária da atualidade. Com capacidades de compreensão e geração de texto que rivalizam com humanos, o ChatGPT transforma completamente como trabalhamos, aprendemos e criamos. Desde escrever e-mails perfeitos até desenvolver códigos complexos, desde análise de dados até criação de conteúdo criativo, o ChatGPT é seu assistente pessoal 24/7 que nunca cansa e está sempre pronto para ajudar. Com plugins, GPTs customizados e integração com milhares de ferramentas, as possibilidades são literalmente infinitas.`,
    impactForIndividuals: [
      "🚀 Economize 20+ horas semanais automatizando tarefas repetitivas",
      "💰 Aumente seu salário em até 40% com novas habilidades de IA",
      "📚 Aprenda qualquer assunto 5x mais rápido com tutoria personalizada",
      "✍️ Escreva 10x mais rápido mantendo qualidade profissional",
      "💡 Desenvolva projetos que antes pareciam impossíveis",
      "🧠 Resolva problemas complexos com ajuda de IA avançada"
    ],
    impactForEntrepreneurs: [
      "🚀 Lance produtos 10x mais rápido com auxílio de IA",
      "💵 Reduza custos operacionais em até 70% com automação",
      "📈 Crie copy de vendas que converte 3x mais",
      "🤖 Automatize atendimento mantendo personalização",
      "💡 Gere ideias de negócio validadas e inovadoras",
      "📊 Analise mercado e concorrência em minutos"
    ],
    impactForCompanies: [
      "📊 Aumente produtividade da equipe em até 300%",
      "⏱️ Reduza tempo de desenvolvimento pela metade",
      "🤖 Automatize processos que custam milhares em horas",
      "📄 Melhore qualidade de documentação e comunicação",
      "🧠 Crie base de conhecimento inteligente",
      "🏆 Mantenha competitividade em mercado orientado por IA"
    ],
    features: [
      "Geração e revisão de texto",
      "Auxílio em código e documentação",
      "Memória e instruções personalizadas",
      "Integração via API"
    ],
    gettingStarted: [
      "Crie uma conta gratuita no ChatGPT",
      "Defina suas Instruções Personalizadas",
      "Salve prompts e crie coleções por tema",
      "Teste modelos e parâmetros (temperature, system prompt)"
    ],
    useCases: [
      "Atendimento e suporte ao cliente",
      "Criação de conteúdo e marketing",
      "Geração de código e revisão",
      "Pesquisa e análise de informações"
    ],
    integrations: ["Zapier", "Make", "n8n", "Notion", "Google Docs", "Slack"],
    bestPractices: [
      "Seja específico sobre persona, objetivo e formato de saída",
      "Dê exemplos (few-shot) e critérios de avaliação",
      "Use etapas numeradas para raciocínio estruturado",
      "Crie prompts reutilizáveis por processo"
    ],
    pitfalls: [
      "Alucinações sem verificação de fontes",
      "Instruções vagas geram respostas genéricas",
      "Falta de contexto histórico sem memória"
    ],
    prompts: [
      { title: "Brief de Conteúdo", content: "Você é um estrategista de conteúdo. Gere um brief detalhado sobre [tema] para [público], incluindo objetivos, estrutura H2/H3 e CTAs." },
      { title: "Refatoração de Código", content: "Aja como senior engineer. Refatore o seguinte código para legibilidade, testes e performance:```[código]```" }
    ],
    relatedCourses: [
      { title: "ChatGPT Masterclass", slug: "chatgpt-masterclass", level: "Todos", price: 497 },
      { title: "Prompt Engineering Avançado", slug: "prompt-engineering", level: "Intermediário", price: 247 }
    ],
    docUrl: "https://platform.openai.com/docs"
  },
  
  claude: {
    title: "Claude",
    category: "IA Conversacional",
    vendor: "Anthropic",
    pricing: "Freemium",
    rating: 4.9,
    description: "IA com foco em segurança e janelas de contexto extensas. Excelente para análise de documentos e programação.",
    detailedDescription: `Claude é a IA mais segura e capaz para tarefas complexas. Com janelas de contexto de 100k+ tokens, pode analisar documentos extensos mantendo precisão excepcional.`,
    impactForIndividuals: [
      "📚 Analise documentos de 200+ páginas instantaneamente",
      "💻 Programe 5x mais rápido com pair programming",
      "🔍 Identifique insights ocultos em dados complexos"
    ],
    impactForEntrepreneurs: [
      "📄 Analise contratos e propostas instantaneamente",
      "💡 Desenvolva estratégias com análise profunda",
      "💻 Construa MVPs com code generation avançado"
    ],
    impactForCompanies: [
      "📊 Processe big data textual com precisão",
      "⚖️ Automatize análise legal e compliance",
      "💻 Acelere desenvolvimento de software 3x"
    ],
    features: ["Contexto longo", "Raciocínio forte", "Ferramentas/funcalls", "Foco em segurança"],
    gettingStarted: ["Crie conta", "Teste modelos Claude", "Configure tool use", "Integre com seu fluxo (API)"],
    useCases: ["Análise de contratos", "Resumo de pesquisas", "Code review", "Assistente interno"],
    integrations: ["n8n", "Slack", "GitHub", "Notion"],
    bestPractices: ["Divida tarefas em etapas", "Use doc snippets", "Reforce critérios de qualidade"],
    pitfalls: ["Timeouts com arquivos grandes", "Custo/latência em contextos gigantes"],
    prompts: [
      { title: "Análise de Documento", content: "Você é analista jurídico. Leia o contrato abaixo e gere um resumo com riscos, prazos e cláusulas críticas:```[trechos]```" }
    ],
    relatedCourses: [{ title: "Claude para Devs", slug: "claude-desenvolvedores", level: "Avançado", price: 497 }]
  },
  
  gemini: {
    title: "Gemini",
    category: "IA Conversacional",
    vendor: "Google",
    pricing: "Gratuito",
    rating: 4.7,
    description: "IA multimodal com integração ao ecossistema Google (Docs, Drive).",
    detailedDescription: `Gemini é a IA multimodal do Google que entende texto, imagens, vídeos e código simultaneamente, com integração perfeita ao Google Workspace.`,
    impactForIndividuals: [
      "🧠 Processe informação multimodal 10x mais rápido",
      "📊 Analise dados complexos no Sheets instantaneamente",
      "📝 Escreva documentos profissionais 5x mais rápido"
    ],
    impactForEntrepreneurs: [
      "💼 Automatize todo workflow com Google Workspace + IA",
      "📊 Analise mercado e concorrência em minutos",
      "🎯 Crie estratégias baseadas em dados visuais e textuais"
    ],
    impactForCompanies: [
      "🏢 Transforme produtividade com IA no Google Workspace",
      "📊 Processe big data visual e textual simultaneamente",
      "🤖 Automatize análise de documentos e mídias"
    ],
    features: ["Multimodal", "Integração Google", "Ferramentas"],
    gettingStarted: ["Ative Gemini", "Teste prompts multimodais", "Integre com Apps Script"],
    useCases: ["Resumo de reuniões", "Auxílio em planilhas", "Geração de imagens"],
    integrations: ["Google Workspace", "Firebase", "Apps Script"],
    bestPractices: ["Defina formatos (tabelas)", "Combine texto e imagens"],
    pitfalls: ["Limites por região", "APIs em evolução"],
    prompts: [{ title: "Resumo de Reunião", content: "Resuma esta transcrição com decisões e responsáveis:```[texto]```" }],
    relatedCourses: [{ title: "Google Gemini Essencial", slug: "gemini-essencial", level: "Iniciante", price: 397 }]
  },
  
  perplexity: {
    title: "Perplexity",
    category: "Pesquisa",
    vendor: "Perplexity",
    pricing: "Freemium",
    rating: 4.8,
    description: "Pesquisa com fontes verificáveis e respostas objetivas.",
    detailedDescription: `Perplexity revoluciona pesquisa online combinando IA com fontes verificáveis em tempo real, fornecendo sempre informações precisas com citações.`,
    impactForIndividuals: [
      "🔍 Torne-se expert em qualquer assunto 10x mais rápido",
      "📚 Acelere pesquisa acadêmica drasticamente",
      "📰 Mantenha-se atualizado sem perder horas lendo"
    ],
    impactForEntrepreneurs: [
      "🔍 Analise mercado e concorrência em minutos",
      "📊 Identifique tendências antes dos competidores",
      "💡 Valide ideias com dados reais rapidamente"
    ],
    impactForCompanies: [
      "📊 Democratize acesso a informação na empresa",
      "🔍 Acelere R&D e inovação 5x",
      "💰 Reduza custos com consultorias externas"
    ],
    features: ["Citações", "Atualidade", "Coleções"],
    gettingStarted: ["Crie conta", "Pesquise com follow-ups", "Salve coleções"],
    useCases: ["Pesquisa de mercado", "Revisão sistemática", "News tracking"],
    integrations: ["Zapier", "Make"],
    bestPractices: ["Peça links e datas", "Itere com follow-ups"],
    pitfalls: ["Fontes por paywall", "Limites em queries longas"],
    prompts: [{ title: "Pesquisa Guiada", content: "Faça uma revisão sobre [tema] com fontes confiáveis, datas e resumo crítico." }],
    relatedCourses: [{ title: "Pesquisa Avançada com IA", slug: "perplexity-pesquisa", level: "Iniciante", price: 297 }]
  },
  
  midjourney: {
    title: "Midjourney",
    category: "Imagem",
    vendor: "Midjourney",
    pricing: "Pago",
    rating: 4.8,
    description: "Geração de imagens de alto nível para arte e design.",
    detailedDescription: `Midjourney é a ferramenta de IA mais poderosa para criação artística, capaz de gerar obras de arte profissionais em minutos.`,
    impactForIndividuals: [
      "🎨 Torne-se artista digital sem anos de prática",
      "💰 Crie negócio de arte digital (R$ 5k-50k/mês)",
      "🖼️ Produza portfolio de classe mundial rapidamente"
    ],
    impactForEntrepreneurs: [
      "🎨 Elimine custos com designers e ilustradores",
      "📸 Crie identidade visual única para marca",
      "📱 Gere conteúdo visual ilimitado e original"
    ],
    impactForCompanies: [
      "💵 Economize milhões em produção visual",
      "🎨 Mantenha consistência de marca em escala",
      "📊 Produza campanhas inteiras internamente"
    ],
    features: ["Styles", "Parameters", "Consistência"],
    gettingStarted: ["Assine", "Entre no Discord", "Teste prompts básicos", "Explore styles"],
    useCases: ["Direção de arte", "Branding", "Conceitos visuais"],
    integrations: ["Discord", "Photoshop"],
    bestPractices: ["Use referências visuais", "Controle parâmetros"],
    pitfalls: ["Aspectos éticos de estilo", "Consistência de personagens"],
    prompts: [{ title: "Estilo Cinematográfico", content: "[tema], cinematic lighting, 35mm, depth of field, --ar 3:2 --v 6 --stylize 400" }],
    relatedCourses: [{ title: "Midjourney Masterclass", slug: "midjourney-arte-profissional", level: "Intermediário", price: 497 }]
  },
  
  "stable-diffusion": {
    title: "Stable Diffusion",
    category: "Imagem",
    vendor: "Stability AI",
    pricing: "Open Source",
    rating: 4.6,
    description: "Pipeline open-source para geração de imagens com alto controle.",
    detailedDescription: `Stable Diffusion é a solução open-source mais poderosa para geração de imagens, oferecendo controle total sobre o processo criativo.`,
    impactForIndividuals: [
      "🎨 Crie arte sem limites de créditos",
      "💻 Aprenda IA generativa profundamente",
      "🔧 Customize modelos para necessidades específicas"
    ],
    impactForEntrepreneurs: [
      "💰 Zero custo após setup inicial",
      "🎯 Controle total sobre geração",
      "🚀 Crie produtos únicos com modelos custom"
    ],
    impactForCompanies: [
      "🔒 Mantenha dados e imagens privados",
      "💵 Elimine custos recorrentes de APIs",
      "🎨 Desenvolva modelos proprietários"
    ],
    features: ["Checkpoint models", "LoRAs", "ControlNet"],
    gettingStarted: ["Instale o Automatic1111 ou ComfyUI", "Baixe modelos", "Teste ControlNet"],
    useCases: ["Design", "Produto", "Arte procedural"],
    integrations: ["ComfyUI", "Automatic1111"],
    bestPractices: ["Gerencie versões", "Documente seeds"],
    pitfalls: ["Configuração complexa", "Uso de GPU"],
    prompts: [{ title: "Produto", content: "photo of [produto], studio lighting, 8k, ultra-detailed, --seed 1234" }],
    relatedCourses: [{ title: "Stable Diffusion Essencial", slug: "stable-diffusion-essencial", level: "Intermediário", price: 397 }]
  },
  
  leonardo: {
    title: "Leonardo AI",
    category: "Imagem",
    vendor: "Leonardo",
    pricing: "Freemium",
    rating: 4.7,
    description: "Ferramenta prática para gerar imagens com presets e modelos prontos.",
    detailedDescription: `Leonardo AI democratiza criação visual profissional com interface intuitiva e modelos especializados para produção em escala.`,
    impactForIndividuals: [
      "🎨 Crie arte profissional facilmente",
      "💰 Side income com design (R$ 3k-15k/mês)",
      "🚀 Produza 100x mais conteúdo visual"
    ],
    impactForEntrepreneurs: [
      "📸 Elimine custos com fotografia de produto",
      "🛍️ Crie catálogos completos rapidamente",
      "💰 Reduza custos de criação em 90%"
    ],
    impactForCompanies: [
      "💵 Economize em produção visual massiva",
      "⚡ Acelere time-to-market drasticamente",
      "🎨 Mantenha consistência visual em escala"
    ],
    features: ["Presets", "Canvas", "Modelos próprios"],
    gettingStarted: ["Crie conta", "Use presets", "Ajuste parâmetros"],
    useCases: ["E-commerce", "Social media", "Thumbnail"],
    integrations: ["Canva"],
    bestPractices: ["Itere variações", "Biblioteca de presets"],
    pitfalls: ["Limites de créditos"],
    prompts: [{ title: "Packshots", content: "[produto], background branco, high-key, sombras suaves" }],
    relatedCourses: [{ title: "Leonardo AI para Criadores", slug: "leonardo-criacao-visual", level: "Iniciante", price: 397 }]
  },
  
  n8n: {
    title: "n8n",
    category: "Automação",
    vendor: "n8n",
    pricing: "Open Source",
    rating: 4.8,
    description: "Automação visual com nós, webhooks e integrações.",
    detailedDescription: `n8n é a ferramenta de automação mais poderosa e flexível, permitindo criar qualquer automação imaginável com liberdade total.`,
    impactForIndividuals: [
      "💼 Torne-se especialista valorizado (R$ 10k-25k)",
      "⚡ Elimine 90% do trabalho manual repetitivo",
      "🏢 Crie consultoria de automação própria"
    ],
    impactForEntrepreneurs: [
      "⚙️ Opere negócio com 10x menos esforço",
      "📈 Escale sem aumentar custos proporcionalmente",
      "🤖 Crie produtos digitais automatizados"
    ],
    impactForCompanies: [
      "💵 Economize milhões em custos operacionais",
      "⏰ Reduza processos de dias para minutos",
      "🔄 Integre sistemas legados com tecnologias modernas"
    ],
    features: ["Self-host", "Nodes", "Webhooks"],
    gettingStarted: ["Crie conta/cloud ou docker", "Monte primeiro fluxo", "Teste webhooks"],
    useCases: ["Marketing automation", "Ops", "Chatbots"],
    integrations: ["OpenAI", "Slack", "Google Sheets", "CRMs"],
    bestPractices: ["Versione fluxos", "Log e retries"],
    pitfalls: ["Manutenção de instância", "Rate limits"],
    prompts: [],
    relatedCourses: [{ title: "Automação com n8n", slug: "n8n-automacao-avancada", level: "Intermediário", price: 697 }]
  },
  
  make: {
    title: "Make",
    category: "Automação",
    vendor: "Make",
    pricing: "Pago",
    rating: 4.5,
    description: "Automação visual com centenas de integrações.",
    detailedDescription: `Make (ex-Integromat) oferece automação visual intuitiva com interface drag-and-drop para conectar centenas de aplicações sem código.`,
    impactForIndividuals: [
      "⚡ Automatize tarefas e libere 15+ horas semanais",
      "💰 Crie side business de automação (R$ 5k-15k/mês)",
      "🎯 Torne-se especialista requisitado no mercado"
    ],
    impactForEntrepreneurs: [
      "🚀 Lance e escale negócios com automação total",
      "💸 Reduza custos operacionais em 60%",
      "📊 Integre todas suas ferramentas perfeitamente"
    ],
    impactForCompanies: [
      "💰 Economize centenas de milhares anualmente",
      "⚡ Acelere processos de dias para minutos",
      "🔗 Integre sistemas sem desenvolvimento custom"
    ],
    features: ["Cenários", "Integrações"],
    gettingStarted: ["Crie conta", "Monte cenário", "Teste gatilhos"],
    useCases: ["Relatórios", "CRM", "Leads"],
    integrations: ["Gmail", "Drive", "CRMs"],
    bestPractices: ["Tratamento de erros", "Paginação"],
    pitfalls: ["Custos por operações"],
    prompts: [],
    relatedCourses: [{ title: "Make: Integração Total", slug: "make-integracao-total", level: "Iniciante", price: 497 }]
  },
  
  zapier: {
    title: "Zapier",
    category: "Automação",
    vendor: "Zapier",
    pricing: "Pago",
    rating: 4.4,
    description: "Automação simples para apps SaaS.",
    detailedDescription: `Zapier é a plataforma de automação mais popular, conectando milhares de apps com interface simples e intuitiva.`,
    impactForIndividuals: [
      "⚡ Automatize tarefas sem conhecimento técnico",
      "⏰ Economize 10+ horas por semana",
      "🔗 Conecte todos seus apps favoritos"
    ],
    impactForEntrepreneurs: [
      "🚀 Automatize operações rapidamente",
      "💰 Reduza custos operacionais",
      "📊 Integre ferramentas de negócio"
    ],
    impactForCompanies: [
      "💵 Reduza custos de integração",
      "⚡ Implemente automações rapidamente",
      "🔗 Conecte sistemas diversos"
    ],
    features: ["Zaps", "Triggers", "Multi-step"],
    gettingStarted: ["Crie conta", "Conecte apps", "Crie primeiro Zap"],
    useCases: ["Leads", "Notificações", "Planilhas"],
    integrations: ["Gmail", "Sheets", "Slack"],
    bestPractices: ["Nomeie zaps claramente", "Documente dependências"],
    pitfalls: ["Limites de tarefas"],
    prompts: [],
    relatedCourses: []
  },
  
  flowise: {
    title: "Flowise",
    category: "Low-code",
    vendor: "Flowise",
    pricing: "Open Source",
    rating: 4.6,
    description: "Construa chatbots e pipelines de LLMs com interface visual.",
    detailedDescription: `Flowise permite criar aplicações de IA complexas visualmente, conectando LLMs, bancos de vetores e ferramentas sem programar.`,
    impactForIndividuals: [
      "🤖 Crie chatbots profissionais facilmente",
      "💡 Desenvolva aplicações de IA sem programar",
      "📚 Aprenda arquitetura de LLMs na prática"
    ],
    impactForEntrepreneurs: [
      "🤖 Lance produtos de IA rapidamente",
      "💰 Crie soluções customizadas de IA",
      "🚀 Prototipe e valide ideias de IA"
    ],
    impactForCompanies: [
      "🤖 Implemente IA sem time especializado",
      "💵 Reduza custos de desenvolvimento de IA",
      "🔧 Crie soluções internas de IA rapidamente"
    ],
    features: ["Canvas", "LLM chains", "Connectors"],
    gettingStarted: ["Suba instância", "Monte chain", "Teste provider"],
    useCases: ["FAQ bots", "RAG", "Formulários inteligentes"],
    integrations: ["OpenAI", "Anthropic", "Vector DBs"],
    bestPractices: ["Salve versões", "Monitore latência"],
    pitfalls: ["Complexidade de deploy"],
    prompts: [],
    relatedCourses: []
  }
};
