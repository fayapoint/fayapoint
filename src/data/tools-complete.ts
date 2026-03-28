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
    logo: "https://www.perplexity.ai/favicon.svg",
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
  },
  
  "dall-e": {
    title: "DALL-E 3",
    category: "Criação Visual",
    vendor: "OpenAI",
    pricing: "Freemium",
    rating: 4.9,
    description: "Gerador de imagens fotorealistas integrado ao ChatGPT.",
    detailedDescription: `DALL-E 3 é o gerador de imagens mais avançado da OpenAI, totalmente integrado ao ChatGPT. Crie imagens impressionantes a partir de descrições textuais com qualidade fotorealista.`,
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
    features: ["Geração HD", "Integrado ao ChatGPT", "Múltiplos estilos", "Edição"],
    gettingStarted: ["Use ChatGPT Plus", "Descreva a imagem", "Itere com refinamentos"],
    useCases: ["Marketing visual", "Conceitos de produto", "Ilustrações"],
    integrations: ["ChatGPT", "API OpenAI"],
    bestPractices: ["Seja específico", "Use referências visuais", "Itere"],
    pitfalls: ["Limites de geração", "Controle fino limitado"],
    prompts: [{ title: "Produto", content: "Create a professional product photo of [produto], studio lighting, white background, high detail, commercial photography style" }],
    relatedCourses: [{ title: "ChatGPT Masterclass", slug: "chatgpt-masterclass", level: "Todos", price: 497 }]
  },
  
  runwayml: {
    title: "RunwayML",
    category: "Criação Visual",
    vendor: "Runway",
    pricing: "Freemium",
    rating: 4.8,
    description: "Ferramentas criativas de IA para vídeo e imagem de nível profissional.",
    detailedDescription: `RunwayML revoluciona criação de vídeo com IA, oferecendo desde geração text-to-video até edição avançada com inteligência artificial.`,
    impactForIndividuals: [
      "🎬 Crie vídeos profissionais sem expertise técnica",
      "💰 Inicie carreira em produção de vídeo com IA",
      "🚀 Produza conteúdo 10x mais rápido"
    ],
    impactForEntrepreneurs: [
      "📹 Crie campanhas de vídeo sem produtora",
      "💵 Economize milhares em produção",
      "📱 Gere conteúdo para todas plataformas"
    ],
    impactForCompanies: [
      "🎬 Produza vídeos internamente",
      "💰 Reduza custos de produção em 80%",
      "⚡ Acelere time-to-market drasticamente"
    ],
    features: ["Gen-2 video", "Frame interpolation", "Motion brush", "Inpainting"],
    gettingStarted: ["Crie conta", "Explore Gen-2", "Teste motion tracking"],
    useCases: ["Vídeo marketing", "Motion graphics", "VFX"],
    integrations: ["Premiere", "After Effects"],
    bestPractices: ["Planeje takes", "Use referências", "Itere progressivamente"],
    pitfalls: ["Créditos limitados", "Consistência temporal"],
    prompts: [{ title: "Vídeo Produto", content: "Cinematic product reveal of [produto], slow motion, dramatic lighting, 4k" }],
    relatedCourses: [{ title: "Vídeo com IA: RunwayML", slug: "runwayml-video-ia", level: "Intermediário", price: 597 }]
  },
  
  elevenlabs: {
    title: "ElevenLabs",
    category: "Áudio",
    vendor: "ElevenLabs",
    pricing: "Freemium",
    rating: 4.9,
    description: "Síntese de voz ultra-realista com clonagem de voz e múltiplos idiomas.",
    detailedDescription: `ElevenLabs oferece a voz de IA mais realista do mercado, indistinguível de vozes humanas, com suporte a clonagem e múltiplos idiomas.`,
    impactForIndividuals: [
      "🎙️ Crie audiolivros e podcasts profissionalmente",
      "💰 Monetize criação de conteúdo de áudio",
      "🗣️ Clone sua própria voz para escala"
    ],
    impactForEntrepreneurs: [
      "📢 Crie ads e vídeos com voiceover profissional",
      "💵 Elimine custos com dubladores",
      "🌍 Expanda para múltiplos idiomas"
    ],
    impactForCompanies: [
      "🎧 Produza treinamentos e cursos em escala",
      "💰 Economize milhões em locução",
      "🌍 Localize conteúdo globalmente"
    ],
    features: ["Voice cloning", "Multi-idioma", "Controle emocional", "API"],
    gettingStarted: ["Crie conta", "Teste vozes", "Clone voz", "Ajuste parâmetros"],
    useCases: ["Audiolivros", "Dublagem", "Assistentes virtuais", "Podcasts"],
    integrations: ["API", "Zapier"],
    bestPractices: ["Forneça áudio limpo para clonagem", "Ajuste velocidade e emoção"],
    pitfalls: ["Limites de caracteres", "Questões éticas de clonagem"],
    prompts: [],
    relatedCourses: [{ title: "Áudio com IA: ElevenLabs", slug: "elevenlabs-audio-ia", level: "Iniciante", price: 397 }]
  },
  
  suno: {
    title: "Suno",
    category: "Áudio",
    vendor: "Suno",
    pricing: "Freemium",
    rating: 4.7,
    description: "Geração completa de música com IA - letra, melodia, vocais e instrumentação.",
    detailedDescription: `Suno revoluciona criação musical permitindo gerar músicas completas, profissionais e originais a partir de simples descrições textuais.`,
    impactForIndividuals: [
      "🎵 Crie músicas completas sem instrumentos",
      "💰 Inicie carreira musical com IA",
      "🎧 Produza trilhas originais ilimitadas"
    ],
    impactForEntrepreneurs: [
      "🎬 Crie trilhas para vídeos sem royalties",
      "💵 Elimine custos com música licenciada",
      "🎵 Produza jingles e brandtrack únicos"
    ],
    impactForCompanies: [
      "🎵 Produção musical interna ilimitada",
      "💰 Zero custos com royalties",
      "🎧 Música personalizada para marca"
    ],
    features: ["Text-to-music", "Letra customizada", "Múltiplos gêneros", "Extensões"],
    gettingStarted: ["Crie conta", "Descreva o estilo", "Customize letra", "Gere variações"],
    useCases: ["Trilhas para vídeo", "Jingles", "Background music", "Podcasts"],
    integrations: [],
    bestPractices: ["Seja específico sobre gênero", "Forneça letra ou temas", "Gere múltiplas versões"],
    pitfalls: ["Direitos autorais complexos", "Qualidade variável"],
    prompts: [{ title: "Jingle", content: "Upbeat corporate jingle, 30 seconds, professional, energetic, about [marca]" }],
    relatedCourses: [{ title: "Música com IA: Suno", slug: "suno-musica-ia", level: "Iniciante", price: 397 }]
  },
  
  "github-copilot": {
    title: "GitHub Copilot",
    category: "Código",
    vendor: "GitHub/Microsoft",
    pricing: "Pago",
    rating: 4.8,
    description: "Assistente de programação com IA integrado ao VS Code e IDEs populares.",
    detailedDescription: `GitHub Copilot transforma programação oferecendo sugestões de código contextual em tempo real, acelerando desenvolvimento drasticamente.`,
    impactForIndividuals: [
      "💻 Programe 55% mais rápido comprovadamente",
      "💰 Aumente salário tornando-se dev 10x",
      "📚 Aprenda novas linguagens 5x mais rápido"
    ],
    impactForEntrepreneurs: [
      "🚀 Lance produtos 2x mais rápido",
      "💵 Reduza custos com equipe técnica",
      "💡 Implemente ideias sem equipe grande"
    ],
    impactForCompanies: [
      "⚡ Aumente produtividade de devs em 55%",
      "💰 ROI de 180% em 12 meses",
      "🏆 Atraia e retenha talentos tech"
    ],
    features: ["Code completion", "Chat integrado", "Multi-linguagem", "Docs automáticas"],
    gettingStarted: ["Instale extensão", "Autentique", "Configure preferências", "Aceite sugestões"],
    useCases: ["Desenvolvimento fullstack", "Testes", "Refatoração", "Documentação"],
    integrations: ["VS Code", "Visual Studio", "JetBrains IDEs", "Neovim"],
    bestPractices: ["Revise sugestões criticamente", "Use chat para contexto", "Configure keybindings"],
    pitfalls: ["Dependência excessiva", "Segurança de código gerado", "Licenças de código"],
    prompts: [{ title: "Função com Testes", content: "/tests - gere função para [tarefa] com cobertura completa de testes" }],
    relatedCourses: [{ title: "GitHub Copilot Pro", slug: "github-copilot-profissional", level: "Intermediário", price: 497 }]
  },
  
  cursor: {
    title: "Cursor",
    category: "Código",
    vendor: "Anysphere",
    pricing: "Freemium",
    rating: 4.9,
    description: "IDE com IA nativa - o futuro da programação com IA integrada desde o início.",
    detailedDescription: `Cursor é o IDE revolucionário construído do zero com IA no centro, oferecendo experiência de programação assistida por IA incomparável.`,
    impactForIndividuals: [
      "💻 Programe na velocidade do pensamento",
      "🚀 Construa projetos antes impossíveis",
      "📚 Domine qualquer tech stack rapidamente"
    ],
    impactForEntrepreneurs: [
      "⚡ Desenvolva MVP em dias, não meses",
      "💰 Reduza custos de desenvolvimento em 70%",
      "🎯 Itere e valide ideias 10x mais rápido"
    ],
    impactForCompanies: [
      "💻 Transforme produtividade de engenharia",
      "🏆 Mantenha competitividade tecnológica",
      "⚡ Acelere time-to-market drasticamente"
    ],
    features: ["Composer (multi-file edit)", "Chat contextual", "Terminal AI", "Codebase understanding"],
    gettingStarted: ["Baixe Cursor", "Importe settings do VS Code", "Explore Composer", "Use Cmd+K"],
    useCases: ["Desenvolvimento rápido", "Refatoração massiva", "Debugging", "Arquitetura"],
    integrations: ["Extensões VS Code", "Git", "Docker"],
    bestPractices: ["Use Composer para mudanças multi-arquivo", "Indexe codebase", "Configure regras AI"],
    pitfalls: ["Custo de API", "Curva de aprendizado de features"],
    prompts: [{ title: "Refatoração Completa", content: "@codebase refatore arquitetura para [padrão] mantendo funcionalidade" }],
    relatedCourses: [{ title: "Cursor: Nova Era do Código", slug: "cursor-ia-nativa", level: "Avançado", price: 697 }]
  },
  
  notebooklm: {
    title: "NotebookLM",
    category: "Produtividade",
    vendor: "Google",
    pricing: "Gratuito",
    rating: 4.8,
    description: "Assistente de pesquisa do Google que trabalha com seus documentos.",
    detailedDescription: `NotebookLM é o assistente de pesquisa revolucionário do Google que entende profundamente seus documentos e fontes, fornecendo insights precisos.`,
    impactForIndividuals: [
      "📚 Processe livros e papers 10x mais rápido",
      "🎓 Acelere pesquisa acadêmica drasticamente",
      "💡 Extraia insights de documentos complexos"
    ],
    impactForEntrepreneurs: [
      "📊 Analise documentos de negócio instantaneamente",
      "💡 Extraia insights competitivos rapidamente",
      "📝 Gere conteúdo baseado em research"
    ],
    impactForCompanies: [
      "📚 Democratize conhecimento documentado",
      "🔍 Acelere onboarding e treinamento",
      "💰 Reduza tempo de análise documental"
    ],
    features: ["Source grounding", "Audio overviews", "Citation tracking", "Multi-source"],
    gettingStarted: ["Acesse NotebookLM", "Faça upload de fontes", "Faça perguntas", "Gere áudio overview"],
    useCases: ["Pesquisa acadêmica", "Análise de contratos", "Learning", "Content research"],
    integrations: ["Google Drive", "Upload direto"],
    bestPractices: ["Organize fontes por projeto", "Use citações", "Gere summaries"],
    pitfalls: ["Limitado a fontes fornecidas", "Sem acesso à internet"],
    prompts: [{ title: "Análise Profunda", content: "Analise todos os documentos e identifique os 5 principais insights sobre [tema] com citações" }],
    relatedCourses: [{ title: "NotebookLM para Pesquisa", slug: "notebooklm-pesquisa-avancada", level: "Iniciante", price: 297 }]
  },
  
  "pika-labs": {
    title: "Pika Labs",
    category: "Criação Visual",
    vendor: "Pika",
    pricing: "Freemium",
    rating: 4.7,
    description: "Geração de vídeos com IA de alta qualidade a partir de texto e imagens.",
    detailedDescription: `Pika Labs democratiza criação de vídeo com IA, permitindo gerar vídeos profissionais a partir de descrições textuais ou imagens.`,
    impactForIndividuals: [
      "🎬 Crie vídeos sem equipamento ou expertise",
      "💰 Inicie negócio de produção de vídeo com IA",
      "🚀 Produza conteúdo para social media ilimitado"
    ],
    impactForEntrepreneurs: [
      "📹 Crie ads de vídeo internamente",
      "💵 Elimine custos com produção",
      "📱 Gere conteúdo para todas plataformas"
    ],
    impactForCompanies: [
      "🎬 Produção de vídeo interna massiva",
      "💰 Reduza custos de vídeo marketing",
      "⚡ Teste campanhas rapidamente"
    ],
    features: ["Text-to-video", "Image-to-video", "Video extension", "Camera controls"],
    gettingStarted: ["Acesse Discord/Web", "Descreva o vídeo", "Ajuste parâmetros", "Refine resultado"],
    useCases: ["Social media", "Ads", "Concept videos", "Animações"],
    integrations: ["Discord"],
    bestPractices: ["Seja específico sobre movimento", "Use image-to-video para controle", "Itere progressivamente"],
    pitfalls: ["Créditos limitados", "Consistência entre frames"],
    prompts: [{ title: "Produto em Ação", content: "[produto] being used, smooth camera movement, professional lighting, 3 seconds" }],
    relatedCourses: [{ title: "Pika: Vídeos com IA", slug: "pika-video-ia", level: "Iniciante", price: 497 }]
  },

  // =============================================
  // LLMs & IA Conversacional
  // =============================================

  "meta-ai": {
    title: "Meta AI",
    category: "IA Conversacional",
    vendor: "Meta",
    pricing: "Gratuito",
    rating: 4.5,
    description: "Modelos Llama de codigo aberto da Meta, disponiveis gratuitamente via meta.ai e para download.",
    detailedDescription: `Meta AI oferece a familia de modelos Llama, que sao LLMs de codigo aberto entre os mais poderosos do mercado. O Llama 3 compete diretamente com GPT-4 e Claude em diversas tarefas, com a vantagem de poder ser rodado localmente ou em infraestrutura propria. Acessivel gratuitamente pelo site meta.ai ou integrado ao WhatsApp, Instagram e Facebook.`,
    impactForIndividuals: ["🆓 Acesso gratuito a IA de alta qualidade sem assinatura", "📱 Integrado ao WhatsApp e Instagram que voce ja usa", "🔓 Modelos abertos que podem ser rodados localmente"],
    impactForEntrepreneurs: ["💰 Zero custo para comecar com IA conversacional", "🏗️ Modelos Llama podem ser customizados para seu negocio", "🌐 Sem vendor lock-in por ser open source"],
    impactForCompanies: ["🔒 Deploy on-premise para dados sensiveis com Llama", "⚡ Fine-tuning dos modelos para casos de uso especificos", "📊 Sem custos de API para uso interno com infraestrutura propria"],
    features: ["Llama 3 com ate 405B parametros", "Acesso gratuito via meta.ai", "Integracao com WhatsApp e Instagram", "Modelos open-weight para download"],
    gettingStarted: ["Acesse meta.ai no navegador", "Faca login com sua conta Meta", "Comece a conversar diretamente", "Para uso avancado, baixe os modelos em llama.meta.com"],
    useCases: ["Assistente pessoal gratuito via WhatsApp", "Pesquisa e resumo de informacoes", "Geracao de texto e codigo", "Base para aplicacoes de IA customizadas"],
    integrations: ["WhatsApp", "Instagram", "Facebook", "Hugging Face"],
    bestPractices: ["Use o meta.ai para tarefas do dia a dia sem custo", "Considere Llama local para privacidade total", "Explore os diferentes tamanhos de modelo para seu caso de uso"],
    pitfalls: ["Funcionalidades podem variar por regiao", "Versao web menos madura que ChatGPT"],
    prompts: [{ title: "Resumo Rapido", content: "Resuma os pontos principais sobre [topico] em 5 bullet points claros e objetivos" }],
    relatedCourses: [],
    docUrl: "https://ai.meta.com/"
  },

  "mistral": {
    title: "Mistral AI",
    category: "IA Conversacional",
    vendor: "Mistral AI",
    pricing: "Freemium",
    rating: 4.6,
    description: "Empresa europeia de IA com modelos eficientes e de peso aberto, referencia em performance por parametro.",
    detailedDescription: `Mistral AI e a principal empresa europeia de IA, conhecida por criar modelos extremamente eficientes que competem com modelos muito maiores. O Mistral Large rivaliza com GPT-4, enquanto modelos menores como Mistral 7B oferecem excelente custo-beneficio. Destaca-se pela abordagem open-weight e conformidade com regulacoes europeias de dados.`,
    impactForIndividuals: ["🚀 Modelos rapidos e eficientes para uso diario", "🇪🇺 Alternativa europeia com foco em privacidade", "💬 Le Chatgratuito para conversas com IA"],
    impactForEntrepreneurs: ["💰 API com excelente custo-beneficio", "🔧 Modelos menores que rodam em hardware acessivel", "📋 Conformidade com GDPR nativa"],
    impactForCompanies: ["🏢 Opcao soberana para empresas europeias", "⚡ Mixtral MoE para alta performance com menor custo", "🔒 Deploy on-premise disponivel"],
    features: ["Mistral Large para tarefas complexas", "Mixtral com arquitetura Mixture of Experts", "Le Chat como interface gratuita", "API compativel com formato OpenAI"],
    gettingStarted: ["Acesse chat.mistral.ai para usar Le Chat gratuitamente", "Crie uma conta na plataforma Mistral", "Obtenha uma API key em console.mistral.ai", "Integre usando SDK Python ou API REST"],
    useCases: ["Chatbot empresarial com conformidade europeia", "Processamento de documentos em multiplos idiomas", "Geracao de codigo eficiente", "Analise de dados com modelos especializados"],
    integrations: ["Hugging Face", "AWS Bedrock", "Azure AI", "LangChain"],
    bestPractices: ["Use Mistral Small para tarefas simples e economize", "Mixtral e ideal para balanco entre custo e qualidade", "Aproveite a compatibilidade com formato OpenAI para migracao facil"],
    pitfalls: ["Ecossistema menor que OpenAI e Google", "Le Chat ainda em evolucao comparado ao ChatGPT"],
    prompts: [{ title: "Analise Multilíngue", content: "Analise o seguinte texto em [idioma] e forneca um resumo detalhado em portugues: [texto]" }],
    relatedCourses: [],
    docUrl: "https://docs.mistral.ai/"
  },

  "grok": {
    title: "Grok",
    category: "IA Conversacional",
    vendor: "xAI",
    pricing: "Freemium",
    rating: 4.5,
    description: "IA da xAI de Elon Musk, integrada ao X/Twitter com acesso a informacoes em tempo real.",
    detailedDescription: `Grok e o modelo de IA da xAI, empresa de Elon Musk, com acesso direto e em tempo real aos posts do X (Twitter). Diferencia-se por ter um modo "sem censura" e por conseguir responder sobre eventos que acabaram de acontecer. O Grok 2 compete com os melhores modelos do mercado em raciocinio e geracao de texto.`,
    impactForIndividuals: ["📰 Respostas baseadas em informacoes em tempo real do X", "🎭 Modo divertido com respostas mais irreverentes", "🆓 Acesso gratuito com limite no X"],
    impactForEntrepreneurs: ["📊 Monitoramento de tendencias em tempo real", "🐦 Analise de sentimento do X integrada", "✍️ Geracao de conteudo para redes sociais"],
    impactForCompanies: ["📈 Inteligencia de mercado com dados do X em tempo real", "🔍 Analise de mencoes de marca", "🤖 API para integracao em produtos"],
    features: ["Acesso em tempo real a posts do X", "Geracao de imagens com Aurora", "Modo Fun vs modo Regular", "Grok 2 com raciocinio avancado"],
    gettingStarted: ["Acesse grok.x.ai ou use pelo app do X", "Faca login com sua conta do X", "Escolha entre modo Fun ou Regular", "Para API, acesse console.x.ai"],
    useCases: ["Pesquisa de noticias e eventos recentes", "Analise de tendencias nas redes sociais", "Geracao de conteudo com tom informal", "Resumo de discussoes do X sobre um topico"],
    integrations: ["X/Twitter", "xAI API"],
    bestPractices: ["Aproveite o acesso em tempo real para noticias recentes", "Use o modo Fun para conteudo criativo", "Combine com dados do X para analise de tendencias"],
    pitfalls: ["Pode refletir vieses do conteudo do X", "Ecossistema de integracoes ainda limitado"],
    prompts: [{ title: "Tendencias do Momento", content: "Quais sao as principais discussoes acontecendo agora no X sobre [topico]? Resuma os pontos de vista mais relevantes." }],
    relatedCourses: [],
    docUrl: "https://docs.x.ai/"
  },

  "deepseek": {
    title: "DeepSeek",
    category: "IA Conversacional",
    vendor: "DeepSeek",
    pricing: "Open Source",
    rating: 4.7,
    description: "Laboratorio chines de IA com modelos open source de ponta, incluindo o DeepSeek-R1 com raciocinio avancado.",
    detailedDescription: `DeepSeek e um laboratorio chines que surpreendeu o mercado com modelos que rivalizam com os melhores do mundo a custos muito menores. O DeepSeek-V3 compete com GPT-4 em benchmarks gerais, enquanto o DeepSeek-R1 introduziu raciocinio em cadeia de pensamento comparavel ao o1 da OpenAI. Todos os modelos sao open source e podem ser rodados localmente.`,
    impactForIndividuals: ["🧠 Raciocinio avancado gratuito com R1", "🆓 Uso ilimitado no chat.deepseek.com", "💻 Modelos open source para rodar localmente"],
    impactForEntrepreneurs: ["💰 API ate 95% mais barata que GPT-4", "🔓 Sem dependencia de provedores americanos", "🏗️ Fine-tuning livre sem restricoes de licenca"],
    impactForCompanies: ["⚡ Custo dramaticamente menor em escala", "🔒 Deploy totalmente privado com modelos open source", "🧪 Modelos de raciocinio para tarefas complexas de engenharia"],
    features: ["DeepSeek-V3 para tarefas gerais", "DeepSeek-R1 com cadeia de raciocinio", "API com precos muito competitivos", "Modelos 100% open source"],
    gettingStarted: ["Acesse chat.deepseek.com para uso gratuito", "Ative o modo 'DeepThink' para raciocinio profundo", "Para API, registre-se em platform.deepseek.com", "Para uso local, baixe via Ollama ou Hugging Face"],
    useCases: ["Resolucao de problemas complexos de matematica e logica", "Programacao e debug de codigo", "Analise profunda de documentos", "Alternativa open source para aplicacoes enterprise"],
    integrations: ["Ollama", "Hugging Face", "LangChain", "OpenRouter"],
    bestPractices: ["Use R1 para problemas que exigem raciocinio passo a passo", "V3 e melhor para tarefas rapidas do dia a dia", "Rode localmente com Ollama para privacidade total"],
    pitfalls: ["Servidor na China pode ter latencia alta do Brasil", "Censura em topicos politicos sensiveis para a China"],
    prompts: [{ title: "Raciocinio Profundo", content: "Pense passo a passo e resolva: [problema complexo]. Mostre todo seu raciocinio antes de dar a resposta final." }],
    relatedCourses: [],
    docUrl: "https://platform.deepseek.com/docs"
  },

  "cohere": {
    title: "Cohere",
    category: "IA Conversacional",
    vendor: "Cohere",
    pricing: "Freemium",
    rating: 4.5,
    description: "Plataforma enterprise de NLP focada em RAG, embeddings e busca semantica para empresas.",
    detailedDescription: `Cohere e uma plataforma de IA focada em uso empresarial, com destaque para Retrieval-Augmented Generation (RAG), embeddings de alta qualidade e busca semantica. O modelo Command R+ e otimizado para tarefas com documentos longos e citacoes precisas. Ideal para empresas que precisam de IA conectada a bases de conhecimento internas.`,
    impactForIndividuals: ["📚 Busca semantica poderosa em documentos", "🔗 Respostas com citacoes de fontes", "🆓 Tier gratuito generoso para experimentar"],
    impactForEntrepreneurs: ["📄 RAG pronto para conectar a seus dados", "🔍 Embeddings de alta qualidade para busca", "💰 Modelo de precos acessivel para startups"],
    impactForCompanies: ["🏢 Focado em seguranca e compliance enterprise", "📊 Conecte IA a bases de conhecimento internas", "🌐 Suporte multilingue nativo em 100+ idiomas"],
    features: ["Command R+ para RAG avancado", "Embeddings multilingues de alta qualidade", "Rerank para melhorar resultados de busca", "Classificacao de texto em escala"],
    gettingStarted: ["Crie uma conta em dashboard.cohere.com", "Obtenha sua API key gratuita", "Experimente o playground para testar modelos", "Integre via SDK Python ou API REST"],
    useCases: ["Busca inteligente em documentacao interna", "Chatbot com RAG sobre base de conhecimento", "Classificacao automatica de tickets de suporte", "Reranking de resultados de busca existentes"],
    integrations: ["LangChain", "LlamaIndex", "Pinecone", "Weaviate"],
    bestPractices: ["Use Embed para criar vector stores de alta qualidade", "Command R+ com RAG para respostas com citacoes", "Rerank melhora qualquer sistema de busca existente"],
    pitfalls: ["Menos versatil que ChatGPT para uso geral", "Curva de aprendizado para implementar RAG corretamente"],
    prompts: [{ title: "RAG com Citacoes", content: "Com base nos documentos fornecidos, responda: [pergunta]. Cite as fontes especificas para cada afirmacao." }],
    relatedCourses: [],
    docUrl: "https://docs.cohere.com/"
  },

  // =============================================
  // Marketing & Conteudo
  // =============================================

  "jasper": {
    title: "Jasper AI",
    category: "Marketing",
    vendor: "Jasper",
    pricing: "Pago",
    rating: 4.6,
    description: "Plataforma de IA para marketing que gera conteudo on-brand em escala para equipes.",
    detailedDescription: `Jasper e a plataforma de IA lider para equipes de marketing, com foco em manter a voz e identidade da marca consistentes. Permite criar campanhas completas, posts de blog, emails, anuncios e conteudo para redes sociais com IA treinada no tom da sua empresa. Possui templates prontos para dezenas de formatos de marketing.`,
    impactForIndividuals: ["✍️ Crie conteudo de marketing profissional rapidamente", "📝 50+ templates para diferentes formatos", "🎯 Conteudo otimizado para conversao"],
    impactForEntrepreneurs: ["🚀 Escale producao de conteudo sem contratar equipe", "🎨 Mantenha consistencia de marca em todo conteudo", "📊 Campanhas completas geradas em minutos"],
    impactForCompanies: ["👥 Colaboracao de equipe com controle de marca", "🔒 Brand voice configuravel e consistente", "📈 Integracao com stack de marketing existente"],
    features: ["Brand Voice para manter tom consistente", "50+ templates de marketing", "Campanhas multi-canal integradas", "Extensao para Chrome"],
    gettingStarted: ["Acesse jasper.ai e inicie o trial de 7 dias", "Configure sua Brand Voice com exemplos de conteudo", "Escolha um template para seu tipo de conteudo", "Gere, edite e publique"],
    useCases: ["Posts de blog otimizados para SEO", "Copy para anuncios no Google e Meta", "Emails de marketing e sequencias de nurturing", "Conteudo para redes sociais em escala"],
    integrations: ["Google Docs", "Surfer SEO", "Grammarly", "Zapier"],
    bestPractices: ["Configure Brand Voice com pelo menos 5 exemplos de conteudo", "Use templates especificos em vez de texto livre", "Sempre revise e humanize o conteudo gerado"],
    pitfalls: ["Preco elevado comparado a usar ChatGPT direto", "Conteudo pode ficar generico sem boa configuracao de Brand Voice"],
    prompts: [{ title: "Blog SEO", content: "Escreva um artigo de blog sobre [topico] com foco na palavra-chave [keyword], tom [tom da marca], 1500 palavras com subtitulos otimizados para SEO." }],
    relatedCourses: [],
    docUrl: "https://www.jasper.ai/docs"
  },

  "copy-ai": {
    title: "Copy.ai",
    category: "Marketing",
    vendor: "Copy.ai",
    pricing: "Freemium",
    rating: 4.5,
    description: "Plataforma de automacao de copy para vendas e marketing com workflows de IA.",
    detailedDescription: `Copy.ai evoluiu de um gerador de copy para uma plataforma completa de automacao de go-to-market com IA. Permite criar workflows que automatizam prospeccao, enriquecimento de leads, personalizacao de emails de vendas e geracao de conteudo de marketing. Possui tier gratuito generoso com 2.000 palavras por mes.`,
    impactForIndividuals: ["✍️ Gere copy persuasiva em segundos", "🆓 2.000 palavras gratuitas por mes", "📋 Templates para dezenas de formatos"],
    impactForEntrepreneurs: ["📧 Automacao de emails de vendas personalizados", "🔄 Workflows de go-to-market automatizados", "💰 Reducao de custo em producao de conteudo"],
    impactForCompanies: ["⚙️ Automacao completa de pipeline de vendas", "👥 Colaboracao de equipe com aprovacoes", "📊 Enriquecimento e scoring de leads com IA"],
    features: ["Workflows de automacao de GTM", "90+ templates de copy", "Enriquecimento de leads", "Personalizacao de outreach em escala"],
    gettingStarted: ["Crie conta gratuita em copy.ai", "Explore os templates por categoria", "Configure um workflow para seu caso de uso", "Conecte suas ferramentas via integracoes"],
    useCases: ["Emails de vendas personalizados em escala", "Descricoes de produtos para e-commerce", "Copy para landing pages e anuncios", "Automacao de prospeccao outbound"],
    integrations: ["Salesforce", "HubSpot", "Zapier", "Slack"],
    bestPractices: ["Use workflows para automatizar processos repetitivos", "Personalize outputs com dados reais do lead", "Teste diferentes tons para encontrar o que converte melhor"],
    pitfalls: ["Tier gratuito muito limitado em palavras", "Workflows avancados exigem plano pago"],
    prompts: [{ title: "Email de Vendas", content: "Escreva um email de vendas para [cargo] em empresa de [setor] apresentando [produto/servico] com foco no problema de [dor principal]." }],
    relatedCourses: [],
    docUrl: "https://www.copy.ai/"
  },

  "grammarly": {
    title: "Grammarly",
    category: "Escrita",
    vendor: "Grammarly",
    pricing: "Freemium",
    rating: 4.7,
    description: "Assistente de escrita com IA que corrige gramatica, tom e clareza em qualquer plataforma.",
    detailedDescription: `Grammarly e o assistente de escrita mais popular do mundo, usado por 30+ milhoes de pessoas. Vai muito alem de correcao gramatical: analisa tom, clareza, engajamento e entrega do texto. Com IA generativa integrada, agora tambem reescreve textos inteiros e sugere melhorias de conteudo. Funciona em praticamente qualquer lugar onde voce digita.`,
    impactForIndividuals: ["📝 Escreva sem erros em ingles e outros idiomas", "🎯 Ajuste o tom do texto automaticamente", "🌐 Funciona em emails, docs, redes sociais e mais"],
    impactForEntrepreneurs: ["✉️ Emails profissionais e persuasivos automaticamente", "📄 Documentos e propostas sem erros", "⏱️ Economize tempo de revisao"],
    impactForCompanies: ["👥 Padronize a comunicacao escrita da equipe", "📊 Analytics de escrita por equipe", "🔒 Grammarly Business com controles enterprise"],
    features: ["Correcao gramatical em tempo real", "Analise de tom e clareza", "IA generativa para reescrita", "Extensao para Chrome, Word e mais"],
    gettingStarted: ["Instale a extensao do Chrome em grammarly.com", "Crie sua conta gratuita", "Comece a escrever em qualquer site - Grammarly aparece automaticamente", "Upgrade para Premium para sugestoes avancadas"],
    useCases: ["Revisao de emails profissionais", "Melhoria de artigos e posts de blog", "Ajuste de tom para diferentes audiencias", "Correcao de textos academicos"],
    integrations: ["Google Docs", "Microsoft Word", "Slack", "Gmail"],
    bestPractices: ["Configure seus objetivos de comunicacao para sugestoes personalizadas", "Use a analise de tom antes de enviar emails importantes", "Revise sugestoes antes de aceitar automaticamente"],
    pitfalls: ["Suporte limitado para portugues - melhor em ingles", "Sugestoes de IA generativa so no Premium"],
    prompts: [{ title: "Reescrita Profissional", content: "Reescreva este texto com tom mais profissional e direto, mantendo a mensagem principal: [texto]" }],
    relatedCourses: [],
    docUrl: "https://www.grammarly.com/"
  },

  "gamma": {
    title: "Gamma",
    category: "Apresentacoes",
    vendor: "Gamma",
    pricing: "Freemium",
    rating: 4.6,
    description: "Crie apresentacoes, documentos e sites com IA em minutos, sem precisar de design.",
    detailedDescription: `Gamma revoluciona a criacao de apresentacoes usando IA para gerar slides completos a partir de um prompt ou documento. Diferente do PowerPoint, Gamma cria conteudo visual responsivo que funciona como apresentacao, documento ou pagina web. A IA sugere layout, imagens e estrutura, permitindo criar decks profissionais em minutos.`,
    impactForIndividuals: ["🎨 Apresentacoes bonitas sem habilidade de design", "⚡ Deck completo gerado em 2 minutos", "📱 Conteudo responsivo que funciona em qualquer tela"],
    impactForEntrepreneurs: ["📊 Pitch decks profissionais rapidamente", "📄 Propostas comerciais visualmente impactantes", "🔗 Compartilhe como link - sem enviar arquivos"],
    impactForCompanies: ["👥 Padronize apresentacoes da empresa", "📈 Relatorios interativos com dados", "🌐 Paginas web internas sem desenvolvedor"],
    features: ["Geracao de apresentacoes com IA", "Templates profissionais", "Importacao de documentos e PDFs", "Analise de engajamento dos viewers"],
    gettingStarted: ["Acesse gamma.app e crie conta gratuita", "Descreva sua apresentacao em um prompt", "Escolha um tema visual", "Edite e personalize os slides gerados"],
    useCases: ["Pitch decks para investidores", "Apresentacoes de projeto para clientes", "Relatorios mensais de resultados", "Resumos visuais de documentos longos"],
    integrations: ["Google Drive", "PowerPoint", "PDF", "Notion"],
    bestPractices: ["Forneca um outline detalhado para melhores resultados", "Use import de documento para transformar textos em apresentacoes", "Personalize o tema para sua marca"],
    pitfalls: ["Creditos limitados no plano gratuito", "Menos controle fino que PowerPoint para layouts complexos"],
    prompts: [{ title: "Pitch Deck Startup", content: "Crie uma apresentacao de pitch para investidores da startup [nome] que resolve [problema] para [publico-alvo] com o produto [descricao do produto]." }],
    relatedCourses: [],
    docUrl: "https://gamma.app/"
  },

  "tome": {
    title: "Tome",
    category: "Apresentacoes",
    vendor: "Tome",
    pricing: "Freemium",
    rating: 4.5,
    description: "Plataforma de storytelling com IA para criar narrativas visuais e apresentacoes interativas.",
    detailedDescription: `Tome combina IA com storytelling para criar apresentacoes que contam historias envolventes. Gera narrativas completas com texto, imagens e layout a partir de um prompt simples. Foca em comunicacao visual moderna com paginas interativas em vez de slides tradicionais, ideal para equipes de vendas e marketing.`,
    impactForIndividuals: ["📖 Transforme ideias em narrativas visuais", "🎬 Storytelling profissional sem esforco", "⚡ Apresentacoes geradas em segundos"],
    impactForEntrepreneurs: ["🎯 Propostas comerciais que contam uma historia", "📊 Apresentacoes de dados mais engajantes", "🚀 Comunicacao visual de alto impacto"],
    impactForCompanies: ["👥 Padronize narrativa de vendas da equipe", "📈 Decks interativos com analytics", "🎨 Marca consistente em todas apresentacoes"],
    features: ["Geracao de narrativa com IA", "Imagens geradas por IA integradas", "Layout adaptativo e interativo", "Analytics de visualizacao"],
    gettingStarted: ["Acesse tome.app e crie conta", "Descreva sua historia ou objetivo em um prompt", "Revise e edite a narrativa gerada", "Compartilhe via link ou exporte"],
    useCases: ["Narrativa de vendas para prospects", "Apresentacoes de estrategia", "One-pagers de produto", "Resumos executivos visuais"],
    integrations: ["Figma", "DALL-E", "Google Drive", "Notion"],
    bestPractices: ["Foque na historia que quer contar, nao nos slides", "Use prompts com contexto sobre a audiencia", "Edite para adicionar dados e especificidades do seu caso"],
    pitfalls: ["Pode gerar conteudo generico sem contexto suficiente", "Formato nao-tradicional pode confundir audiencias conservadoras"],
    prompts: [{ title: "Narrativa de Vendas", content: "Crie uma narrativa de vendas para [produto] mostrando como resolve o problema de [dor] para [perfil do cliente], com dados de impacto." }],
    relatedCourses: [],
    docUrl: "https://tome.app/"
  },

  "beautiful-ai": {
    title: "Beautiful.ai",
    category: "Apresentacoes",
    vendor: "Beautiful.ai",
    pricing: "Pago",
    rating: 4.5,
    description: "Design inteligente de slides que ajusta layout automaticamente conforme voce adiciona conteudo.",
    detailedDescription: `Beautiful.ai usa regras de design inteligentes para criar apresentacoes profissionais automaticamente. Diferente de outras ferramentas, o layout se adapta dinamicamente conforme voce adiciona conteudo, mantendo proporcoes e alinhamentos perfeitos. Com IA generativa integrada, tambem pode criar slides completos a partir de prompts.`,
    impactForIndividuals: ["🎨 Slides sempre bem desenhados automaticamente", "⏱️ Crie apresentacoes 10x mais rapido", "📐 Design profissional sem conhecimento tecnico"],
    impactForEntrepreneurs: ["📊 Apresentacoes com aparencia de agencia de design", "🏷️ Templates com sua marca personalizada", "🔄 Reutilize e adapte decks rapidamente"],
    impactForCompanies: ["👥 Biblioteca compartilhada de templates da empresa", "🔒 Controle de marca centralizado", "📈 Integracoes com ferramentas corporativas"],
    features: ["Smart Slides com layout automatico", "IA generativa para criacao de slides", "Biblioteca de templates profissionais", "Controle de marca e team library"],
    gettingStarted: ["Acesse beautiful.ai e inicie o trial gratuito", "Escolha um template ou comece com IA", "Adicione conteudo e veja o layout se adaptar", "Exporte como PDF ou PowerPoint"],
    useCases: ["Apresentacoes corporativas padronizadas", "Propostas comerciais profissionais", "Relatorios com graficos e dados", "Treinamentos internos"],
    integrations: ["PowerPoint", "Google Slides", "Slack", "Dropbox"],
    bestPractices: ["Comece com Smart Slide Templates para resultados rapidos", "Configure sua brand kit primeiro para consistencia", "Use os graficos integrados em vez de importar imagens"],
    pitfalls: ["Sem plano gratuito permanente", "Menos flexibilidade de layout que PowerPoint"],
    prompts: [{ title: "Apresentacao Corporativa", content: "Crie uma apresentacao sobre [topico] com 10 slides incluindo: capa, agenda, contexto, problema, solucao, beneficios, roadmap, equipe, investimento e proximos passos." }],
    relatedCourses: [],
    docUrl: "https://www.beautiful.ai/"
  },

  // =============================================
  // Video & Avatar
  // =============================================

  "synthesia": {
    title: "Synthesia",
    category: "Video com IA",
    vendor: "Synthesia",
    pricing: "Pago",
    rating: 4.7,
    description: "Crie videos com avatares de IA realistas em 150+ idiomas sem camera ou estudio.",
    detailedDescription: `Synthesia e a plataforma lider em criacao de videos com avatares de IA, usada por 50.000+ empresas incluindo metade das Fortune 100. Permite criar videos profissionais simplesmente digitando um roteiro - a IA gera um apresentador virtual realista que fala em 150+ idiomas com sincronizacao labial perfeita. Ideal para treinamentos, comunicacao interna e marketing.`,
    impactForIndividuals: ["🎥 Crie videos profissionais sem aparecer na camera", "🌍 Traduza videos para 150+ idiomas automaticamente", "⚡ Videos prontos em minutos, nao em dias"],
    impactForEntrepreneurs: ["📚 Treinamentos em video escalaveis e editaveis", "💰 Eliminacao de custos de producao de video", "🔄 Atualize videos mudando apenas o texto"],
    impactForCompanies: ["👥 Treinamento corporativo em multiplos idiomas", "📢 Comunicacao interna personalizada por departamento", "🎯 Videos de onboarding padronizados"],
    features: ["160+ avatares realistas pre-construidos", "Avatares customizados com sua aparencia", "150+ idiomas com sincronizacao labial", "Templates de video profissionais"],
    gettingStarted: ["Acesse synthesia.io e crie conta", "Escolha um avatar e template", "Digite ou cole seu roteiro", "Gere o video e faca download"],
    useCases: ["Treinamento corporativo e compliance", "Videos de onboarding para novos funcionarios", "Comunicados internos em video", "Tutoriais de produto multilingues"],
    integrations: ["PowerPoint", "LMS (Moodle, etc)", "YouTube", "Vimeo"],
    bestPractices: ["Escreva roteiros curtos e diretos - 1 topico por video", "Use slides e graficos para complementar o avatar", "Teste diferentes avatares para encontrar o melhor para sua marca"],
    pitfalls: ["Preco pode ser alto para uso individual", "Avatares ainda tem um aspecto 'uncanny valley' em alguns momentos"],
    prompts: [{ title: "Roteiro de Treinamento", content: "Crie um roteiro de 2 minutos para video de treinamento sobre [topico], com tom profissional mas acessivel, dividido em 3 secoes: introducao, conteudo principal e resumo." }],
    relatedCourses: [],
    docUrl: "https://www.synthesia.io/"
  },

  "heygen": {
    title: "HeyGen",
    category: "Video com IA",
    vendor: "HeyGen",
    pricing: "Freemium",
    rating: 4.6,
    description: "Geracao de videos com avatares de IA ultra-realistas, traducao de videos e clonagem de voz.",
    detailedDescription: `HeyGen e uma plataforma de video com IA que se destaca pela qualidade visual dos avatares e pelo recurso de traducao de videos existentes. Permite criar avatares a partir de uma gravacao de 2 minutos e traduzir videos mantendo sua voz original em outros idiomas com sincronizacao labial. Compete diretamente com Synthesia com precos mais acessiveis.`,
    impactForIndividuals: ["🎭 Crie um avatar digital seu para videos", "🗣️ Clone sua voz para conteudo em escala", "🌐 Traduza seus videos para qualquer idioma"],
    impactForEntrepreneurs: ["📹 Videos de marketing sem equipe de producao", "🔄 Traduza conteudo para mercados internacionais", "⚡ Prototipe videos de produto rapidamente"],
    impactForCompanies: ["👤 Avatares corporativos padronizados", "🌍 Localizacao de videos para equipes globais", "📊 Integracao com CRM para videos personalizados"],
    features: ["Avatares ultra-realistas com expressoes", "Traducao de video com voice cloning", "Avatar personalizado a partir de 2min de video", "Streaming avatar em tempo real"],
    gettingStarted: ["Crie conta gratuita em heygen.com", "Escolha um avatar ou crie o seu", "Digite o roteiro e selecione o idioma", "Gere o video e compartilhe"],
    useCases: ["Videos de vendas personalizados", "Traducao e localizacao de conteudo", "Porta-voz virtual para marca", "Videos de suporte ao cliente"],
    integrations: ["Zapier", "HubSpot", "Salesforce", "API REST"],
    bestPractices: ["Grave 2min de video com boa iluminacao para criar seu avatar", "Use traducao de video para expandir audiencia internacional", "Combine avatar com slides para conteudo educacional"],
    pitfalls: ["Creditos do plano gratuito sao limitados", "Avatar personalizado requer plano Business"],
    prompts: [{ title: "Video de Vendas", content: "Crie um roteiro de 60 segundos para video de vendas do [produto] destacando: problema que resolve, como funciona, diferencial e call-to-action." }],
    relatedCourses: [],
    docUrl: "https://www.heygen.com/"
  },

  "descript": {
    title: "Descript",
    category: "Edicao de Video",
    vendor: "Descript",
    pricing: "Freemium",
    rating: 4.7,
    description: "Edite video e audio tao facilmente quanto editar texto - delete palavras e o video se ajusta.",
    detailedDescription: `Descript revolucionou a edicao de video e audio ao permitir que voce edite midia como se fosse um documento de texto. A IA transcreve automaticamente o conteudo, e ao deletar ou mover palavras na transcricao, o video/audio correspondente e editado automaticamente. Inclui remocao de "uhms", eye contact correction, e geracao de conteudo com IA.`,
    impactForIndividuals: ["✂️ Edite video deletando texto - sem timeline complexa", "🎙️ Transcricao automatica de alta qualidade", "👁️ Correcao de contato visual por IA"],
    impactForEntrepreneurs: ["📹 Producao de conteudo em video 5x mais rapida", "🎧 Podcast editado em minutos", "📱 Clips para redes sociais automaticos"],
    impactForCompanies: ["👥 Qualquer pessoa da equipe pode editar video", "📝 Transcricoes e legendas automaticas", "🔄 Reaproveitamento de conteudo multicanal"],
    features: ["Edicao de video baseada em texto", "Transcricao automatica em 20+ idiomas", "Remocao de palavras de preenchimento", "Screen recording integrado"],
    gettingStarted: ["Baixe Descript em descript.com", "Importe um video ou faca uma gravacao", "Edite a transcricao para editar o video", "Exporte nos formatos desejados"],
    useCases: ["Edicao de podcasts e entrevistas", "Criacao de clips para redes sociais", "Videos tutoriais com screen recording", "Legendagem automatica de conteudo"],
    integrations: ["YouTube", "Spotify", "Google Drive", "Slack"],
    bestPractices: ["Use a transcricao para encontrar os melhores trechos rapidamente", "Remova filler words automaticamente antes de editar", "Exporte em multiplos formatos para diferentes plataformas"],
    pitfalls: ["Transcricao em portugues menos precisa que em ingles", "Recursos avancados exigem plano Pro"],
    prompts: [{ title: "Roteiro para Podcast", content: "Crie um roteiro de episodio de podcast sobre [topico] com: introducao gancho (30s), desenvolvimento com 3 pontos principais, e conclusao com call-to-action." }],
    relatedCourses: [],
    docUrl: "https://www.descript.com/"
  },

  "kling": {
    title: "Kling AI",
    category: "Geracao de Video",
    vendor: "Kuaishou",
    pricing: "Freemium",
    rating: 4.6,
    description: "Geracao de video por IA da Kuaishou, rival do Sora com videos de ate 2 minutos em alta qualidade.",
    detailedDescription: `Kling AI e um modelo de geracao de video da gigante chinesa Kuaishou que impressionou o mercado ao rivalizar com o Sora da OpenAI. Gera videos de ate 2 minutos em 1080p com fisica realista, movimentos de camera cinematograficos e consistencia temporal impressionante. Suporta tanto text-to-video quanto image-to-video com controle avancado de movimento.`,
    impactForIndividuals: ["🎬 Videos cinematograficos a partir de texto", "📸 Anime suas fotos com image-to-video", "⏱️ Videos de ate 2 minutos com consistencia"],
    impactForEntrepreneurs: ["🎥 Conteudo de video para marketing sem filmagem", "💡 Prototipagem rapida de conceitos visuais", "💰 Producao de video a uma fracao do custo"],
    impactForCompanies: ["📹 Videos de produto com qualidade cinematografica", "🎨 Conceitos criativos visualizados rapidamente", "🔄 Iteracao rapida em conteudo visual"],
    features: ["Videos de ate 2 minutos em 1080p", "Text-to-video e image-to-video", "Controle de camera e movimento", "Fisica e dinamica realistas"],
    gettingStarted: ["Acesse klingai.com e crie conta", "Descreva a cena que deseja gerar", "Ajuste configuracoes de duracao e qualidade", "Gere e faca download do video"],
    useCases: ["Videos conceituais para campanhas de marketing", "Visualizacao de ideias criativas", "Conteudo para redes sociais", "Storyboarding animado"],
    integrations: ["API REST", "ComfyUI"],
    bestPractices: ["Seja detalhado na descricao de cena e movimento de camera", "Use image-to-video para maior controle do resultado", "Gere multiplas variacoes e selecione a melhor"],
    pitfalls: ["Fila de geracao pode ser longa em horarios de pico", "Resultados com pessoas podem ter inconsistencias faciais"],
    prompts: [{ title: "Cena Cinematografica", content: "Cinematic shot of [cena], smooth camera dolly movement, golden hour lighting, shallow depth of field, 4K quality" }],
    relatedCourses: [],
    docUrl: "https://klingai.com/"
  },

  "luma": {
    title: "Luma Dream Machine",
    category: "Geracao de Video",
    vendor: "Luma AI",
    pricing: "Freemium",
    rating: 4.5,
    description: "Geracao de video e reconstrucao 3D com IA, especializada em cenas realistas e objetos 3D.",
    detailedDescription: `Luma AI oferece o Dream Machine para geracao de video e ferramentas avancadas de reconstrucao 3D a partir de fotos. O Dream Machine gera videos de alta qualidade com fisica realista e movimentos fluidos. A tecnologia de NeRF/Gaussian Splatting permite criar cenas 3D navegaveis a partir de fotos ou videos, algo unico no mercado.`,
    impactForIndividuals: ["🎬 Gere videos realistas a partir de texto ou imagem", "📦 Crie modelos 3D a partir de fotos", "🆓 Geracoes gratuitas diarias"],
    impactForEntrepreneurs: ["🛍️ Visualizacao 3D de produtos a partir de fotos", "🎥 Videos de marketing com IA", "💡 Prototipagem visual de conceitos"],
    impactForCompanies: ["🏗️ Reconstrucao 3D de espacos e produtos", "📹 Conteudo de video em escala", "🔧 API para integracao em pipelines"],
    features: ["Dream Machine para text/image-to-video", "Reconstrucao 3D a partir de fotos", "Gaussian Splatting para cenas interativas", "API para desenvolvedores"],
    gettingStarted: ["Acesse lumalabs.ai e crie conta", "Escolha entre video ou 3D", "Para video: descreva a cena ou envie uma imagem", "Para 3D: envie fotos de diferentes angulos do objeto"],
    useCases: ["Geracao de videos para redes sociais", "Digitalizacao 3D de produtos", "Tour virtual de espacos", "Efeitos visuais para producoes"],
    integrations: ["API REST", "Blender", "Unity", "Three.js"],
    bestPractices: ["Para 3D, capture 20-50 fotos de diferentes angulos", "Use image-to-video para manter consistencia visual", "Combine com edicao de video para resultados finais polidos"],
    pitfalls: ["Reconstrucao 3D exige muitas fotos bem capturadas", "Videos longos podem perder consistencia"],
    prompts: [{ title: "Video de Produto", content: "[produto] rotating slowly on a clean white surface, studio lighting, smooth camera orbit, professional product photography style" }],
    relatedCourses: [],
    docUrl: "https://lumalabs.ai/"
  },

  // =============================================
  // Coding & Desenvolvimento
  // =============================================

  "replit": {
    title: "Replit",
    category: "Desenvolvimento",
    vendor: "Replit",
    pricing: "Freemium",
    rating: 4.6,
    description: "IDE online com IA que permite criar, rodar e deployar aplicacoes completas no navegador.",
    detailedDescription: `Replit e uma IDE completa no navegador com IA integrada que permite criar aplicacoes full-stack sem configurar ambiente local. O Replit Agent pode construir aplicacoes inteiras a partir de descricoes em linguagem natural, incluindo banco de dados, autenticacao e deploy. Suporta 50+ linguagens com colaboracao em tempo real e deploy com um clique.`,
    impactForIndividuals: ["💻 Programe de qualquer lugar, sem instalar nada", "🤖 IA que constroi apps inteiros para voce", "🚀 Deploy com um clique"],
    impactForEntrepreneurs: ["⚡ Prototipe ideias em horas, nao semanas", "🌐 Apps prontos para producao sem DevOps", "💰 Sem custos de infraestrutura inicial"],
    impactForCompanies: ["👥 Colaboracao em tempo real no codigo", "🎓 Onboarding de devs sem setup", "🔒 Replit Teams para equipes"],
    features: ["Replit Agent para criacao com IA", "50+ linguagens de programacao", "Banco de dados integrado", "Deploy automatico com URL publica"],
    gettingStarted: ["Acesse replit.com e crie conta", "Descreva o app que quer criar para o Agent", "Ou escolha um template e comece a codar", "Clique em Deploy quando estiver pronto"],
    useCases: ["Prototipagem rapida de ideias", "Projetos de aprendizado de programacao", "Hackathons e provas de conceito", "Ferramentas internas simples"],
    integrations: ["GitHub", "Google Cloud", "PostgreSQL", "API REST"],
    bestPractices: ["Use o Agent para scaffolding e depois refine manualmente", "Aproveite o banco de dados integrado para MVPs", "Configure secrets para variaveis de ambiente sensiveis"],
    pitfalls: ["Performance limitada no tier gratuito", "Aplicacoes complexas podem ter latencia em servidores compartilhados"],
    prompts: [{ title: "App com IA", content: "Crie um app web com [framework] que [funcionalidade principal], com autenticacao de usuarios, banco de dados para [dados], e interface moderna com [estilo]." }],
    relatedCourses: [],
    docUrl: "https://docs.replit.com/"
  },

  "v0": {
    title: "v0",
    category: "Desenvolvimento",
    vendor: "Vercel",
    pricing: "Freemium",
    rating: 4.7,
    description: "Gerador de componentes UI com IA da Vercel usando React, Tailwind e shadcn/ui.",
    detailedDescription: `v0 e a ferramenta de IA da Vercel que gera componentes de interface completos a partir de descricoes em texto ou imagens. Produz codigo React com Tailwind CSS e componentes shadcn/ui prontos para producao. A qualidade do codigo gerado e excepcional, com responsividade, acessibilidade e boas praticas incluidas automaticamente.`,
    impactForIndividuals: ["🎨 Crie interfaces profissionais descrevendo em texto", "📸 Converta screenshots em codigo funcional", "⚡ Componentes prontos para copiar e usar"],
    impactForEntrepreneurs: ["🚀 Frontend de qualidade sem contratar designer", "💰 Prototipe interfaces em minutos", "📱 Componentes responsivos automaticamente"],
    impactForCompanies: ["👥 Acelere o desenvolvimento de UI da equipe", "📐 Codigo consistente com shadcn/ui", "🔧 Componentes customizaveis e de alta qualidade"],
    features: ["Geracao de UI a partir de texto", "Screenshot-to-code", "Componentes shadcn/ui e Tailwind", "Preview interativo em tempo real"],
    gettingStarted: ["Acesse v0.dev", "Descreva a interface que deseja ou envie uma imagem", "Itere com instrucoes adicionais", "Copie o codigo gerado para seu projeto"],
    useCases: ["Prototipagem rapida de interfaces", "Conversao de designs Figma em codigo", "Geracao de componentes reutilizaveis", "Landing pages e dashboards"],
    integrations: ["Next.js", "React", "shadcn/ui", "Tailwind CSS"],
    bestPractices: ["Seja especifico sobre layout, cores e funcionalidades", "Envie screenshots de referencia para resultados mais proximos", "Use iteracoes para refinar o componente gerado"],
    pitfalls: ["Codigo pode precisar de ajustes para projetos complexos", "Limitado a React/Next.js e Tailwind"],
    prompts: [{ title: "Dashboard Component", content: "Crie um dashboard com sidebar de navegacao, header com busca e notificacoes, cards de metricas com graficos, e tabela de dados com paginacao. Tema escuro, responsivo." }],
    relatedCourses: [],
    docUrl: "https://v0.dev/"
  },

  "lovable": {
    title: "Lovable",
    category: "Desenvolvimento",
    vendor: "Lovable",
    pricing: "Freemium",
    rating: 4.6,
    description: "Gere aplicacoes full-stack completas a partir de descricoes em linguagem natural.",
    detailedDescription: `Lovable (anteriormente GPT Engineer) permite criar aplicacoes web completas descrevendo o que voce quer em linguagem natural. A IA gera frontend, backend, banco de dados e autenticacao automaticamente, com deploy em um clique. Diferencia-se por gerar apps reais e funcionais, nao apenas prototipos, com codigo limpo e editavel.`,
    impactForIndividuals: ["🏗️ Crie apps completos sem saber programar", "⚡ Da ideia ao deploy em minutos", "🔧 Codigo editavel - nao e low-code"],
    impactForEntrepreneurs: ["🚀 MVP funcional em horas, nao meses", "💰 Sem custo de equipe de desenvolvimento inicial", "🔄 Itere rapidamente com feedback do mercado"],
    impactForCompanies: ["⚡ Prototipagem ultra-rapida de novas ideias", "👥 Empodere equipes nao-tecnicas a criar ferramentas", "📊 Ferramentas internas sem backlog de desenvolvimento"],
    features: ["Geracao full-stack com IA", "Supabase integrado para backend", "Deploy com um clique", "GitHub sync para controle de versao"],
    gettingStarted: ["Acesse lovable.dev e crie conta", "Descreva a aplicacao que quer criar", "Revise e itere com instrucoes adicionais", "Conecte ao Supabase para backend e faca deploy"],
    useCases: ["MVPs de startups", "Ferramentas internas para equipes", "Landing pages com funcionalidade", "Dashboards e paineis administrativos"],
    integrations: ["Supabase", "GitHub", "Stripe", "Vercel"],
    bestPractices: ["Comece com uma descricao detalhada do que quer", "Itere em pequenos passos em vez de pedir tudo de uma vez", "Conecte ao GitHub para manter historico do codigo"],
    pitfalls: ["Apps muito complexos podem precisar de refinamento manual", "Dependencia do Supabase para funcionalidades de backend"],
    prompts: [{ title: "SaaS MVP", content: "Crie um SaaS de [funcionalidade] com: pagina de login, dashboard do usuario com [metricas], funcionalidade principal de [acao], e pagina de configuracoes. Design moderno e responsivo." }],
    relatedCourses: [],
    docUrl: "https://lovable.dev/"
  },

  "bolt": {
    title: "Bolt.new",
    category: "Desenvolvimento",
    vendor: "StackBlitz",
    pricing: "Freemium",
    rating: 4.6,
    description: "Construtor de apps web full-stack com IA que roda inteiramente no navegador via WebContainers.",
    detailedDescription: `Bolt.new da StackBlitz permite criar, rodar e deployar aplicacoes web completas diretamente no navegador usando WebContainers. A IA instala dependencias, configura frameworks e escreve codigo full-stack em tempo real. Diferencia-se por nao precisar de servidor - tudo roda localmente no browser com Node.js real, oferecendo velocidade e privacidade.`,
    impactForIndividuals: ["🌐 Crie apps direto no navegador sem instalar nada", "⚡ Execucao instantanea sem servidores", "🔧 Node.js real rodando no browser"],
    impactForEntrepreneurs: ["🚀 Do prompt ao app funcional em minutos", "💻 Sem custos de servidor durante desenvolvimento", "📱 Funciona em qualquer dispositivo com browser"],
    impactForCompanies: ["🔒 Codigo roda localmente - dados nao saem do browser", "👥 Compartilhe projetos via URL", "⚡ Prototipagem mais rapida que qualquer IDE"],
    features: ["WebContainers com Node.js no browser", "Suporte a React, Vue, Svelte, Astro, etc", "Instalacao de pacotes npm em tempo real", "Deploy integrado com Netlify"],
    gettingStarted: ["Acesse bolt.new", "Descreva o app que quer criar", "Veja a IA construir e rodar o app em tempo real", "Faca deploy quando estiver satisfeito"],
    useCases: ["Prototipos rapidos de aplicacoes web", "Experimentacao com frameworks e bibliotecas", "Demos interativas para clientes", "Ferramentas web rapidas"],
    integrations: ["Netlify", "npm", "React", "Next.js"],
    bestPractices: ["Use para MVPs e prototipos antes de migrar para IDE local", "Aproveite a execucao no browser para iteracoes rapidas", "Exporte o codigo para GitHub quando o projeto amadurecer"],
    pitfalls: ["Apps muito grandes podem ficar lentos no browser", "Nem todos os pacotes npm funcionam em WebContainers"],
    prompts: [{ title: "App React Completo", content: "Crie um app React com TypeScript que [funcionalidade], usando Tailwind para estilizacao, React Router para navegacao e localStorage para persistencia de dados." }],
    relatedCourses: [],
    docUrl: "https://bolt.new/"
  },

  "windsurf": {
    title: "Windsurf",
    category: "Desenvolvimento",
    vendor: "Codeium",
    pricing: "Freemium",
    rating: 4.6,
    description: "IDE com IA integrada da Codeium, competidor direto do Cursor com foco em fluxo de codigo.",
    detailedDescription: `Windsurf (anteriormente Codeium Editor) e uma IDE construida sobre VS Code com IA profundamente integrada ao fluxo de desenvolvimento. O Cascade, seu agente de IA, entende o contexto completo do projeto e pode fazer alteracoes em multiplos arquivos simultaneamente. Oferece autocompletar inteligente, chat com codebase e refatoracao automatica.`,
    impactForIndividuals: ["💻 IDE gratuita com IA mais generosa que Cursor", "🧠 IA que entende o contexto do projeto inteiro", "⚡ Autocomplete ultra-rapido"],
    impactForEntrepreneurs: ["🚀 Desenvolvimento acelerado com agente Cascade", "💰 Tier gratuito mais generoso que concorrentes", "🔧 Transicao facil do VS Code"],
    impactForCompanies: ["👥 IDE padronizada com IA para equipe", "🔒 Opcao de nao enviar codigo para cloud", "📊 Suporte a qualquer linguagem e framework"],
    features: ["Cascade - agente de IA multi-arquivo", "Autocomplete com contexto do projeto", "Chat integrado com codebase", "Compativel com extensoes VS Code"],
    gettingStarted: ["Baixe Windsurf em codeium.com/windsurf", "Instale e abra seu projeto", "Use Cmd/Ctrl+L para chat com IA", "Use Tab para aceitar sugestoes de autocomplete"],
    useCases: ["Desenvolvimento diario com assistencia de IA", "Refatoracao de codigo em larga escala", "Debug com contexto do projeto", "Aprendizado de novos frameworks"],
    integrations: ["VS Code Extensions", "GitHub", "GitLab", "Todas as linguagens"],
    bestPractices: ["Use Cascade para alteracoes que afetam multiplos arquivos", "Configure o contexto do projeto para melhores sugestoes", "Combine autocomplete com chat para produtividade maxima"],
    pitfalls: ["Ainda mais novo e menos maduro que Cursor", "Algumas extensoes do VS Code podem ter incompatibilidades"],
    prompts: [{ title: "Refatoracao", content: "Refatore este codigo para seguir os principios SOLID, extraia logica repetida para funcoes utilitarias, e adicione tipagem TypeScript completa." }],
    relatedCourses: [],
    docUrl: "https://codeium.com/windsurf"
  },

  // =============================================
  // Produtividade & Workspace
  // =============================================

  "notion-ai": {
    title: "Notion AI",
    category: "Produtividade",
    vendor: "Notion",
    pricing: "Pago",
    rating: 4.7,
    description: "IA integrada ao Notion que escreve, resume, traduz e organiza informacoes no seu workspace.",
    detailedDescription: `Notion AI traz inteligencia artificial diretamente para o workspace do Notion, permitindo gerar, resumir, traduzir e melhorar conteudo sem sair da ferramenta. O diferencial e a IA com acesso ao contexto do seu workspace inteiro - pode encontrar informacoes espalhadas em paginas, bases de dados e docs, funcionando como um assistente que conhece toda sua empresa.`,
    impactForIndividuals: ["✍️ Escreva e melhore textos sem sair do Notion", "🔍 Encontre qualquer informacao no workspace com IA", "📝 Resumos automaticos de paginas longas"],
    impactForEntrepreneurs: ["📋 Documentacao gerada e organizada automaticamente", "🧠 IA que conhece todo o contexto do seu negocio", "⏱️ Automacao de tarefas repetitivas de escrita"],
    impactForCompanies: ["🏢 Base de conhecimento pesquisavel com IA", "👥 Aceleracao de toda equipe na producao de conteudo", "🔒 Dados protegidos dentro do Notion"],
    features: ["Q&A sobre todo o workspace", "Geracao e edicao de texto", "Resumo automatico de paginas", "Traducao integrada"],
    gettingStarted: ["Ative Notion AI nas configuracoes do workspace", "Pressione Space em qualquer pagina para ativar a IA", "Use /ai para acessar funcoes especificas", "Faca perguntas sobre seu workspace na busca"],
    useCases: ["Resumir notas de reunioes longas", "Gerar rascunhos de documentacao", "Encontrar informacoes espalhadas no workspace", "Traduzir conteudo para outros idiomas"],
    integrations: ["Slack", "Google Drive", "GitHub", "Jira"],
    bestPractices: ["Organize bem seu workspace para a IA encontrar informacoes", "Use Q&A para onboarding de novos membros", "Combine com templates para documentacao padronizada"],
    pitfalls: ["Custo adicional por membro no Notion", "Respostas dependem da qualidade da organizacao do workspace"],
    prompts: [{ title: "Resumo de Reuniao", content: "Resuma as notas desta reuniao em: decisoes tomadas, action items com responsaveis e prazos, e topicos pendentes para proxima reuniao." }],
    relatedCourses: [],
    docUrl: "https://www.notion.so/product/ai"
  },

  "microsoft-copilot": {
    title: "Microsoft Copilot",
    category: "Produtividade",
    vendor: "Microsoft",
    pricing: "Freemium",
    rating: 4.6,
    description: "IA integrada ao Microsoft 365 que ajuda em Word, Excel, PowerPoint, Teams e Outlook.",
    detailedDescription: `Microsoft Copilot traz IA generativa para todo o ecossistema Microsoft 365. No Word, escreve e edita documentos. No Excel, analisa dados e cria formulas. No PowerPoint, gera apresentacoes completas. No Teams, resume reunioes e sugere acoes. No Outlook, redige emails. Tudo conectado ao Microsoft Graph com contexto dos seus dados corporativos.`,
    impactForIndividuals: ["📝 Word que escreve documentos para voce", "📊 Excel que analisa dados e cria formulas com IA", "📧 Emails redigidos automaticamente no Outlook"],
    impactForEntrepreneurs: ["📑 Apresentacoes geradas em minutos no PowerPoint", "🤝 Resumos de reunioes automaticos no Teams", "⏱️ Horas economizadas em tarefas rotineiras"],
    impactForCompanies: ["🏢 IA com contexto dos dados corporativos via Graph", "🔒 Seguranca e compliance Microsoft enterprise", "👥 Produtividade aumentada em toda organizacao"],
    features: ["Copilot no Word, Excel, PowerPoint, Teams, Outlook", "Microsoft Graph para contexto corporativo", "Copilot Studio para customizacao", "Chat integrado em todas as apps"],
    gettingStarted: ["Verifique se sua licenca Microsoft 365 inclui Copilot", "Ative Copilot nas configuracoes do admin", "Abra qualquer app do Office e clique no icone Copilot", "Comece com tarefas simples como resumir ou redigir"],
    useCases: ["Redigir documentos e propostas no Word", "Analisar planilhas complexas no Excel", "Criar apresentacoes a partir de documentos", "Resumir threads longas de email"],
    integrations: ["Microsoft 365", "SharePoint", "OneDrive", "Dynamics 365"],
    bestPractices: ["Organize seus arquivos no SharePoint para melhor contexto", "Use referencia a arquivos especificos nos prompts", "Combine Copilot em diferentes apps para workflows completos"],
    pitfalls: ["Requer licenca Microsoft 365 Business/Enterprise + addon", "Qualidade depende da organizacao dos dados corporativos"],
    prompts: [{ title: "Analise de Dados Excel", content: "Analise esta planilha e identifique: tendencias principais, outliers, e crie um grafico que melhor represente a evolucao de [metrica] ao longo do tempo." }],
    relatedCourses: [],
    docUrl: "https://copilot.microsoft.com/"
  },

  "google-workspace-ai": {
    title: "Google Workspace AI",
    category: "Produtividade",
    vendor: "Google",
    pricing: "Pago",
    rating: 4.5,
    description: "Gemini integrado ao Google Docs, Sheets, Slides, Gmail e Meet para produtividade com IA.",
    detailedDescription: `Google Workspace AI integra o Gemini diretamente nas ferramentas Google que voce ja usa. No Docs, ajuda a escrever e formatar. No Sheets, gera formulas e analisa dados. No Slides, cria apresentacoes com imagens geradas por IA. No Gmail, rascunha respostas inteligentes. No Meet, gera resumos e transcricoes de reunioes automaticamente.`,
    impactForIndividuals: ["📝 Gemini ajudando diretamente no Google Docs", "📊 Formulas e analises automaticas no Sheets", "📧 Respostas de email inteligentes no Gmail"],
    impactForEntrepreneurs: ["🖼️ Imagens geradas por IA nos Slides", "🤝 Transcricoes automaticas do Meet", "⚡ Produtividade em todo ecossistema Google"],
    impactForCompanies: ["🔒 Dados protegidos no ecossistema Google Cloud", "👥 IA disponivel para toda organizacao", "📋 Conformidade com politicas corporativas"],
    features: ["Gemini no Docs, Sheets, Slides, Gmail, Meet", "Geracao de imagens no Slides", "Resumos e transcricoes do Meet", "Organizacao inteligente no Drive"],
    gettingStarted: ["Verifique se Gemini esta ativado no Google Workspace Admin", "Abra qualquer app Google e procure o icone Gemini", "No Docs, use 'Help me write' para gerar texto", "No Sheets, use 'Help me organize' para analises"],
    useCases: ["Rascunhos de documentos e emails", "Analise de dados em planilhas", "Apresentacoes com conteudo gerado por IA", "Resumos de videoconferencias"],
    integrations: ["Google Drive", "Google Calendar", "Google Chat", "Google Cloud"],
    bestPractices: ["Use '@' para referenciar arquivos do Drive nos prompts", "Aproveite as transcricoes do Meet para documentacao", "Combine Sheets com Gemini para analise de dados rapida"],
    pitfalls: ["Funcionalidades variam por tipo de licenca", "Gemini no Workspace ainda menos maduro que Copilot da Microsoft"],
    prompts: [{ title: "Analise de Planilha", content: "Analise os dados desta planilha e crie um resumo com: principais metricas, tendencias identificadas e 3 recomendacoes baseadas nos dados." }],
    relatedCourses: [],
    docUrl: "https://workspace.google.com/solutions/ai/"
  },

  // =============================================
  // Design
  // =============================================

  "canva": {
    title: "Canva",
    category: "Design",
    vendor: "Canva",
    pricing: "Freemium",
    rating: 4.8,
    description: "Plataforma de design com ferramentas Magic AI para criar qualquer tipo de conteudo visual.",
    detailedDescription: `Canva e a plataforma de design mais acessivel do mundo, agora turbinada com IA. As ferramentas Magic incluem geracao de imagens (Magic Media), remocao de fundo (Magic Eraser), expansao de imagens, escrita assistida (Magic Write) e transformacao de designs entre formatos. Com 100+ milhoes de usuarios, e o padrao para design sem conhecimento tecnico.`,
    impactForIndividuals: ["🎨 Design profissional sem habilidade tecnica", "🪄 Magic Eraser remove fundos e objetos", "📱 Templates para qualquer formato de rede social"],
    impactForEntrepreneurs: ["📋 Brand Kit para manter consistencia visual", "📊 Apresentacoes, posts e materiais em minutos", "👥 Colaboracao com equipe em tempo real"],
    impactForCompanies: ["🏢 Canva for Teams com controle de marca", "📁 Biblioteca de assets compartilhada", "🔒 Aprovacoes e permissoes granulares"],
    features: ["Magic Media para geracao de imagens", "Magic Write para texto com IA", "Magic Eraser e Background Remover", "100.000+ templates profissionais"],
    gettingStarted: ["Crie conta gratuita em canva.com", "Escolha o formato do seu design", "Selecione um template ou comece do zero", "Use ferramentas Magic AI para acelerar o trabalho"],
    useCases: ["Posts para redes sociais", "Apresentacoes e pitch decks", "Materiais de marketing impressos e digitais", "Videos curtos para Reels e TikTok"],
    integrations: ["Google Drive", "Dropbox", "HubSpot", "Slack"],
    bestPractices: ["Configure seu Brand Kit primeiro para consistencia", "Use Magic Resize para adaptar designs entre formatos", "Explore templates antes de criar do zero"],
    pitfalls: ["Muitos recursos bons sao exclusivos do Pro", "Designs podem parecer 'genericos' sem customizacao"],
    prompts: [{ title: "Post para Instagram", content: "Crie um design para post de Instagram sobre [topico] com: titulo chamativo, 3 pontos principais, call-to-action e visual moderno usando as cores [cores da marca]." }],
    relatedCourses: [],
    docUrl: "https://www.canva.com/"
  },

  "figma": {
    title: "Figma",
    category: "Design",
    vendor: "Figma",
    pricing: "Freemium",
    rating: 4.8,
    description: "Ferramenta de design UI/UX colaborativa com recursos de IA para prototipagem e design systems.",
    detailedDescription: `Figma e a ferramenta padrao da industria para design de interfaces, usada por equipes de produto em todo o mundo. Com colaboracao em tempo real, design systems poderosos e prototipagem interativa, permite que designers e desenvolvedores trabalhem juntos. Recursos de IA recentes incluem geracao automatica de layouts e sugestoes de design.`,
    impactForIndividuals: ["🎨 Design de interfaces profissionais no navegador", "🆓 Plano gratuito generoso para uso pessoal", "📱 Prototipacao interativa sem codigo"],
    impactForEntrepreneurs: ["🚀 Prototipe seu produto antes de desenvolver", "👥 Colabore com designers em tempo real", "🔗 Handoff perfeito para desenvolvedores"],
    impactForCompanies: ["📐 Design Systems escaláveis para equipes", "👥 Colaboracao em tempo real com toda equipe de produto", "🔧 Dev Mode para facilitar implementacao"],
    features: ["Design de interfaces colaborativo", "Prototipagem interativa", "Design Systems e componentes", "Dev Mode para desenvolvedores"],
    gettingStarted: ["Crie conta gratuita em figma.com", "Explore templates da comunidade", "Crie seu primeiro frame com o tamanho do dispositivo", "Use Auto Layout para designs responsivos"],
    useCases: ["Design de interfaces web e mobile", "Prototipacao de fluxos de usuario", "Design Systems corporativos", "Colaboracao entre design e desenvolvimento"],
    integrations: ["Slack", "Jira", "GitHub", "Storybook"],
    bestPractices: ["Use Auto Layout em todos os componentes", "Crie e mantenha um Design System desde o inicio", "Use variaveis para temas claro/escuro"],
    pitfalls: ["Curva de aprendizado para recursos avancados", "Performance pode cair com arquivos muito grandes"],
    prompts: [{ title: "Design System Setup", content: "Crie a estrutura de um Design System com: paleta de cores (primaria, secundaria, neutros), tipografia (headings, body, caption), espacamento (4, 8, 12, 16, 24, 32, 48px) e componentes base (botao, input, card)." }],
    relatedCourses: [],
    docUrl: "https://help.figma.com/"
  },

  "adobe-firefly": {
    title: "Adobe Firefly",
    category: "Design",
    vendor: "Adobe",
    pricing: "Freemium",
    rating: 4.6,
    description: "IA generativa da Adobe para criacao de imagens, efeitos de texto e edicao de fotos comercialmente segura.",
    detailedDescription: `Adobe Firefly e o modelo de IA generativa da Adobe, treinado exclusivamente em conteudo licenciado (Adobe Stock, dominio publico). Isso o torna a unica opcao comercialmente segura para uso corporativo, sem risco de violacao de direitos autorais. Integrado ao Photoshop, Illustrator e Express, permite gerar imagens, expandir fotos, remover objetos e criar efeitos de texto.`,
    impactForIndividuals: ["🎨 Geracao de imagens segura para uso comercial", "✨ Efeitos de texto e estilos artisticos", "📸 Edicao de fotos com IA no Photoshop"],
    impactForEntrepreneurs: ["✅ Sem risco de copyright - treinado em conteudo licenciado", "🖼️ Imagens profissionais para marketing", "🔧 Integrado ao fluxo de trabalho Adobe"],
    impactForCompanies: ["🔒 Compensacao a artistas via Content Credentials", "📋 Conformidade legal garantida", "🎨 Integrado a toda suite Adobe Creative Cloud"],
    features: ["Text-to-image comercialmente segura", "Generative Fill no Photoshop", "Generative Expand para ampliar imagens", "Efeitos de texto com IA"],
    gettingStarted: ["Acesse firefly.adobe.com", "Faca login com Adobe ID", "Descreva a imagem que deseja gerar", "Refine com controles de estilo e estrutura"],
    useCases: ["Imagens para marketing e publicidade", "Edicao e expansao de fotos de produto", "Mockups e conceitos criativos", "Efeitos tipograficos para branding"],
    integrations: ["Photoshop", "Illustrator", "Adobe Express", "Adobe Stock"],
    bestPractices: ["Use para conteudo comercial onde copyright importa", "Combine com Photoshop para edicao avancada", "Aproveite os controles de estilo para resultados consistentes"],
    pitfalls: ["Qualidade artistica inferior a Midjourney em alguns estilos", "Creditos mensais limitados no plano gratuito"],
    prompts: [{ title: "Imagem para Marketing", content: "Professional product photography of [produto] on [cenario], warm lighting, high quality, commercial style, clean background" }],
    relatedCourses: [],
    docUrl: "https://www.adobe.com/products/firefly.html"
  },

  "ideogram": {
    title: "Ideogram",
    category: "Geracao de Imagens",
    vendor: "Ideogram",
    pricing: "Freemium",
    rating: 4.6,
    description: "Geracao de imagens com IA que se destaca por renderizar texto dentro das imagens com perfeicao.",
    detailedDescription: `Ideogram e um gerador de imagens com IA que resolveu um dos maiores problemas da area: renderizar texto legivel e correto dentro de imagens. Enquanto DALL-E e Midjourney frequentemente erram letras e palavras, o Ideogram gera logos, posters, capas e sinalizacao com texto perfeito. Ideal para designers que precisam de mockups com texto real.`,
    impactForIndividuals: ["🔤 Texto perfeito em imagens geradas por IA", "🎨 Estilos variados de tipografia e poster", "🆓 Geracoes gratuitas diarias generosas"],
    impactForEntrepreneurs: ["🏷️ Logos e branding com texto correto", "📱 Mockups de marketing com texto real", "🎯 Posters e banners prontos para uso"],
    impactForCompanies: ["📋 Material de marketing com texto preciso", "🎨 Conceitos visuais com branding correto", "⚡ Prototipagem visual rapida para campanhas"],
    features: ["Renderizacao de texto perfeita em imagens", "Multiplos estilos artisticos", "Text-to-image de alta qualidade", "Edicao e variacao de imagens"],
    gettingStarted: ["Acesse ideogram.ai e crie conta", "Descreva a imagem incluindo o texto desejado", "Escolha o estilo visual", "Gere e itere ate o resultado ideal"],
    useCases: ["Logos e identidade visual conceitual", "Posters e banners com texto", "Capas de livros e thumbnails", "Mockups de embalagens e sinalizacao"],
    integrations: ["API REST", "Canva"],
    bestPractices: ["Coloque o texto desejado entre aspas no prompt", "Especifique o estilo tipografico desejado", "Use para mockups iniciais antes de finalizar no design tool"],
    pitfalls: ["Menos versatil que Midjourney para imagens sem texto", "Controle de composicao ainda limitado comparado a concorrentes"],
    prompts: [{ title: "Logo com Texto", content: "A modern minimalist logo design with the text \"[nome da marca]\" in elegant sans-serif font, clean background, professional branding style" }],
    relatedCourses: [],
    docUrl: "https://ideogram.ai/"
  },

  // =============================================
  // Infraestrutura para Desenvolvedores
  // =============================================

  "hugging-face": {
    title: "Hugging Face",
    category: "Infraestrutura de IA",
    vendor: "Hugging Face",
    pricing: "Freemium",
    rating: 4.8,
    description: "O GitHub dos modelos de IA - repositorio central de modelos, datasets e espacos para ML.",
    detailedDescription: `Hugging Face e a plataforma central da comunidade de IA e machine learning, com 500.000+ modelos, 100.000+ datasets e milhares de demos (Spaces). E onde pesquisadores e empresas publicam modelos como Llama, Mistral e Stable Diffusion. A biblioteca Transformers facilita o uso de qualquer modelo com poucas linhas de codigo. Essencial para qualquer desenvolvedor de IA.`,
    impactForIndividuals: ["🤗 Acesso gratuito a 500.000+ modelos de IA", "📚 Datasets prontos para projetos de ML", "🎮 Demos interativas para experimentar modelos"],
    impactForEntrepreneurs: ["🚀 Modelos pre-treinados para acelerar desenvolvimento", "💰 Inference API gratuita para prototipagem", "🔓 Modelos open source sem custos de licenca"],
    impactForCompanies: ["🏢 Hub privado para modelos corporativos", "🔧 Inference Endpoints para deploy em producao", "📊 AutoTrain para fine-tuning sem codigo"],
    features: ["Hub com 500.000+ modelos", "Biblioteca Transformers", "Inference API", "Spaces para demos interativas"],
    gettingStarted: ["Crie conta gratuita em huggingface.co", "Explore modelos por tarefa (texto, imagem, audio)", "Use a Inference API para testar modelos", "Instale a biblioteca: pip install transformers"],
    useCases: ["Download e uso de modelos open source", "Fine-tuning de modelos para seu dominio", "Deploy de modelos em producao", "Pesquisa e experimentacao com IA"],
    integrations: ["PyTorch", "TensorFlow", "LangChain", "AWS SageMaker"],
    bestPractices: ["Use model cards para entender limitacoes de cada modelo", "Comece com modelos menores para prototipagem", "Explore Spaces para ver modelos em acao antes de integrar"],
    pitfalls: ["Quantidade de modelos pode ser overwhelming", "Qualidade varia muito entre modelos da comunidade"],
    prompts: [{ title: "Busca de Modelo", content: "Preciso de um modelo para [tarefa] que funcione em [hardware]. Quais modelos no Hugging Face voce recomenda considerando [requisito especifico]?" }],
    relatedCourses: [],
    docUrl: "https://huggingface.co/docs"
  },

  "langchain": {
    title: "LangChain",
    category: "Infraestrutura de IA",
    vendor: "LangChain",
    pricing: "Open Source",
    rating: 4.6,
    description: "Framework open source para construir aplicacoes com LLMs - RAG, agentes, chains e memoria.",
    detailedDescription: `LangChain e o framework mais popular para construir aplicacoes com modelos de linguagem. Fornece abstracoes para conectar LLMs a fontes de dados (RAG), criar agentes autonomos, encadear multiplas chamadas (chains) e gerenciar memoria de conversacao. Com LangSmith para observabilidade e LangGraph para agentes complexos, e o ecossistema completo para desenvolvimento com IA.`,
    impactForIndividuals: ["🔧 Framework padrao para apps com LLM", "📚 Documentacao e exemplos extensivos", "🆓 Open source e gratuito"],
    impactForEntrepreneurs: ["🏗️ Construa chatbots com RAG rapidamente", "🔌 Conecte qualquer LLM a qualquer fonte de dados", "🚀 De prototipo a producao com LangServe"],
    impactForCompanies: ["📊 LangSmith para monitoramento em producao", "🤖 LangGraph para agentes enterprise complexos", "🔒 Deploy seguro com LangServe"],
    features: ["Chains para orquestrar LLMs", "RAG com qualquer vector store", "Agentes com ferramentas customizaveis", "LangSmith para observabilidade"],
    gettingStarted: ["Instale: pip install langchain", "Configure sua API key do LLM escolhido", "Siga o quickstart na documentacao", "Construa seu primeiro chain ou RAG pipeline"],
    useCases: ["Chatbot com RAG sobre documentos da empresa", "Agentes autonomos que usam ferramentas", "Pipelines de processamento de texto", "Aplicacoes conversacionais com memoria"],
    integrations: ["OpenAI", "Anthropic", "Pinecone", "Chroma"],
    bestPractices: ["Use LCEL (LangChain Expression Language) para chains", "Implemente LangSmith desde o inicio para debugging", "Comece simples e adicione complexidade gradualmente"],
    pitfalls: ["Abstracoes podem esconder complexidade e dificultar debug", "API muda frequentemente entre versoes"],
    prompts: [{ title: "RAG Pipeline", content: "Crie um pipeline RAG com LangChain que: carregue documentos de [fonte], crie embeddings, armazene em [vector store], e responda perguntas com citacoes das fontes." }],
    relatedCourses: [],
    docUrl: "https://python.langchain.com/docs/"
  },

  "vercel-ai": {
    title: "Vercel",
    category: "Infraestrutura de IA",
    vendor: "Vercel",
    pricing: "Freemium",
    rating: 4.7,
    description: "Plataforma frontend cloud com AI SDK para construir aplicacoes web com IA integrada.",
    detailedDescription: `Vercel e a plataforma de deploy lider para aplicacoes frontend, criadora do Next.js. O AI SDK da Vercel simplifica a integracao de LLMs em aplicacoes web com streaming, tool calling e UI components prontos. Combina deploy instantaneo com edge computing e ferramentas de IA, sendo a escolha padrao para desenvolvedores React/Next.js que querem adicionar IA.`,
    impactForIndividuals: ["🚀 Deploy de sites e apps com um git push", "🤖 AI SDK para integrar IA facilmente", "⚡ Edge computing para performance global"],
    impactForEntrepreneurs: ["💰 Tier gratuito generoso para comecar", "🌐 CDN global automatica", "📱 Preview deploys para cada PR"],
    impactForCompanies: ["🏢 Enterprise com SLA e suporte", "🔒 Seguranca e compliance", "📊 Analytics e monitoring integrados"],
    features: ["AI SDK com streaming e tool calling", "Deploy automatico via Git", "Edge Functions e Middleware", "Preview Deployments"],
    gettingStarted: ["Conecte seu repositorio GitHub em vercel.com", "Importe o projeto com deteccao automatica de framework", "Cada push gera um deploy automatico", "Use AI SDK: npm install ai"],
    useCases: ["Deploy de aplicacoes Next.js", "Apps com IA usando AI SDK", "Landing pages e sites de marketing", "APIs serverless na edge"],
    integrations: ["GitHub", "Next.js", "React", "OpenAI"],
    bestPractices: ["Use AI SDK para streaming de respostas de LLM", "Aproveite ISR para conteudo que muda com frequencia", "Configure Preview Deployments para review de PRs"],
    pitfalls: ["Custos podem subir rapidamente com muito trafego", "Vendor lock-in com funcionalidades especificas do Vercel"],
    prompts: [{ title: "Chat com AI SDK", content: "Crie um componente de chat usando Vercel AI SDK com streaming de respostas, suporte a multiplos modelos (OpenAI, Anthropic), e historico de conversas persistente." }],
    relatedCourses: [],
    docUrl: "https://vercel.com/docs"
  },

  "supabase": {
    title: "Supabase",
    category: "Infraestrutura de IA",
    vendor: "Supabase",
    pricing: "Freemium",
    rating: 4.7,
    description: "Alternativa open source ao Firebase com PostgreSQL, auth, storage e funcoes de IA integradas.",
    detailedDescription: `Supabase e a alternativa open source ao Firebase, construida sobre PostgreSQL. Oferece banco de dados, autenticacao, storage, edge functions e real-time subscriptions. Com a extensao pgvector, permite busca semantica e RAG diretamente no banco de dados. Combinacao perfeita de backend-as-a-service com capacidades de IA, sendo a escolha favorita de startups e projetos modernos.`,
    impactForIndividuals: ["🆓 Backend completo no tier gratuito", "📊 PostgreSQL real, nao um banco proprietario", "⚡ De zero a backend em minutos"],
    impactForEntrepreneurs: ["🚀 MVP completo sem backend engineer", "🔐 Autenticacao pronta com social login", "💾 Storage de arquivos integrado"],
    impactForCompanies: ["🔓 Open source - sem vendor lock-in", "📈 Escala de PostgreSQL para dados empresariais", "🤖 pgvector para busca vetorial e RAG"],
    features: ["PostgreSQL com dashboard visual", "Autenticacao com 20+ provedores", "Storage com CDN integrado", "Edge Functions em Deno/TypeScript"],
    gettingStarted: ["Crie um projeto em supabase.com", "Use o dashboard para criar tabelas", "Integre com supabase-js no frontend", "Configure autenticacao e RLS (Row Level Security)"],
    useCases: ["Backend para aplicacoes web e mobile", "Busca semantica com pgvector", "Real-time features como chat e notificacoes", "APIs REST automaticas sobre PostgreSQL"],
    integrations: ["Next.js", "React", "Flutter", "LangChain"],
    bestPractices: ["Configure RLS (Row Level Security) desde o inicio", "Use migrations para versionamento do schema", "Aproveite pgvector para funcionalidades de IA"],
    pitfalls: ["Free tier tem limites de conexoes e armazenamento", "Self-hosting exige conhecimento de DevOps"],
    prompts: [{ title: "Schema com RLS", content: "Crie um schema Supabase para [aplicacao] com tabelas para [entidades], relacionamentos, e politicas RLS que garantam que usuarios so vejam seus proprios dados." }],
    relatedCourses: [],
    docUrl: "https://supabase.com/docs"
  },

  // =============================================
  // Data & Databases
  // =============================================

  "pinecone": {
    title: "Pinecone",
    category: "Banco de Dados",
    vendor: "Pinecone",
    pricing: "Freemium",
    rating: 4.6,
    description: "Banco de dados vetorial lider para aplicacoes de IA com busca semantica em escala.",
    detailedDescription: `Pinecone e o banco de dados vetorial mais popular para aplicacoes de IA, otimizado para armazenar e buscar embeddings em alta velocidade. Essencial para RAG (Retrieval-Augmented Generation), busca semantica e sistemas de recomendacao. Totalmente gerenciado, escala automaticamente e oferece busca em milissegundos mesmo com bilhoes de vetores.`,
    impactForIndividuals: ["🔍 Busca semantica poderosa para projetos de IA", "🆓 Tier gratuito com 100K vetores", "⚡ Setup em minutos, sem infraestrutura"],
    impactForEntrepreneurs: ["🤖 Base para chatbots com RAG", "📊 Recomendacoes personalizadas para usuarios", "💰 Escalavel sem gerenciar servidores"],
    impactForCompanies: ["📈 Bilhoes de vetores com busca em milissegundos", "🔒 SOC 2 e compliance enterprise", "🌐 Deploy multi-regiao para latencia global"],
    features: ["Busca vetorial em milissegundos", "Escalamento automatico", "Filtragem por metadados", "Namespaces para organizacao"],
    gettingStarted: ["Crie conta gratuita em pinecone.io", "Crie um index com a dimensao dos seus embeddings", "Use o SDK Python: pip install pinecone-client", "Faca upsert dos vetores e comece a buscar"],
    useCases: ["RAG para chatbots inteligentes", "Busca semantica em documentos", "Sistemas de recomendacao", "Deteccao de duplicatas e similaridade"],
    integrations: ["LangChain", "LlamaIndex", "OpenAI", "Cohere"],
    bestPractices: ["Escolha a dimensao do embedding correta para seu modelo", "Use metadados para filtrar resultados", "Implemente hybrid search combinando vetorial com keyword"],
    pitfalls: ["Custos podem crescer com volume de vetores", "Vendor lock-in por ser proprietario"],
    prompts: [{ title: "Pipeline RAG", content: "Configure um pipeline RAG com Pinecone: gere embeddings de [documentos] com [modelo], armazene no Pinecone, e busque os top-5 resultados mais relevantes para cada pergunta do usuario." }],
    relatedCourses: [],
    docUrl: "https://docs.pinecone.io/"
  },

  // =============================================
  // Comunicacao & Colaboracao
  // =============================================

  "slack-ai": {
    title: "Slack",
    category: "Comunicacao",
    vendor: "Salesforce",
    pricing: "Freemium",
    rating: 4.6,
    description: "Plataforma de comunicacao corporativa com recursos de IA para resumos, busca e automacao.",
    detailedDescription: `Slack e a plataforma padrao de comunicacao para equipes de tecnologia, agora com IA integrada. O Slack AI resume conversas longas, responde perguntas sobre o historico de mensagens e sugere respostas. Com Workflow Builder, automacoes podem ser criadas sem codigo. A integracao com milhares de apps e bots de IA torna o Slack o hub central de produtividade.`,
    impactForIndividuals: ["💬 Comunicacao organizada por canais e topicos", "🔍 Busca inteligente em todo historico", "🤖 Resumos de canais que voce perdeu"],
    impactForEntrepreneurs: ["⚡ Automacoes sem codigo com Workflow Builder", "🔌 Integracoes com 2.000+ ferramentas", "📱 Comunicacao assincrona e sincrona"],
    impactForCompanies: ["🏢 Slack AI para resumos e busca enterprise", "🔒 Criptografia e compliance enterprise", "📊 Analytics de colaboracao da equipe"],
    features: ["Slack AI para resumos e Q&A", "Workflow Builder sem codigo", "Canais, threads e huddles", "2.000+ integracoes de apps"],
    gettingStarted: ["Crie um workspace em slack.com", "Convide sua equipe", "Organize canais por projeto, equipe ou topico", "Instale integracoes relevantes (GitHub, Jira, etc)"],
    useCases: ["Comunicacao de equipe organizada por canais", "Automacoes de workflow empresarial", "Integracao de alertas e notificacoes de ferramentas", "Hub central para bots de IA"],
    integrations: ["GitHub", "Jira", "Google Drive", "Salesforce"],
    bestPractices: ["Use threads para manter conversas organizadas", "Configure Workflow Builder para processos repetitivos", "Integre ferramentas para centralizar notificacoes"],
    pitfalls: ["Pode se tornar barulhento sem boa organizacao de canais", "Slack AI disponivel apenas em planos pagos"],
    prompts: [{ title: "Automacao de Workflow", content: "Crie um workflow no Slack que: [trigger], coleta informacoes via formulario sobre [dados], envia para [canal/pessoa], e registra em [ferramenta externa]." }],
    relatedCourses: [],
    docUrl: "https://api.slack.com/"
  },

  "discord": {
    title: "Discord",
    category: "Comunicacao",
    vendor: "Discord",
    pricing: "Freemium",
    rating: 4.5,
    description: "Plataforma de comunidades popular entre desenvolvedores e comunidades de IA.",
    detailedDescription: `Discord se tornou a plataforma padrao para comunidades de IA, desenvolvimento e tecnologia. Midjourney, Stable Diffusion, LangChain e centenas de projetos de IA usam Discord como hub principal de comunidade e suporte. Com bots poderosos, canais de voz e texto, forum threads e integracoes, e onde a comunidade de IA se encontra para colaborar e compartilhar conhecimento.`,
    impactForIndividuals: ["🤝 Acesso a comunidades de IA mais ativas do mundo", "🤖 Bots de IA diretamente nos chats", "📚 Suporte e aprendizado com a comunidade"],
    impactForEntrepreneurs: ["👥 Construa comunidade em torno do seu produto", "🔔 Suporte ao cliente via comunidade", "📊 Feedback direto de usuarios engajados"],
    impactForCompanies: ["🏢 Developer relations e comunidade tecnica", "🤖 Bots customizados com IA para automacao", "📋 Forum threads para documentacao colaborativa"],
    features: ["Canais de texto e voz", "Bots e integracoes poderosas", "Forum threads para discussoes organizadas", "Stage channels para eventos"],
    gettingStarted: ["Baixe Discord em discord.com", "Entre em servidores de comunidades de IA (Midjourney, Hugging Face, etc)", "Explore canais e participe de discussoes", "Para criar comunidade: crie um servidor e configure canais"],
    useCases: ["Participar de comunidades de IA e tech", "Usar bots de IA como Midjourney diretamente", "Suporte e feedback de produto", "Eventos e workshops online"],
    integrations: ["GitHub", "Midjourney", "Zapier", "Custom Bots"],
    bestPractices: ["Entre nos servidores oficiais das ferramentas de IA que usa", "Use forum threads para perguntas detalhadas", "Configure notificacoes para nao ser sobrecarregado"],
    pitfalls: ["Pode ser confuso para novatos com muitos servidores", "Sem funcionalidades enterprise como Slack"],
    prompts: [{ title: "Setup de Comunidade", content: "Defina a estrutura de canais para um servidor Discord de [tema]: canais de boas-vindas, regras, categorias tematicas, canais de ajuda, e integracao com bots relevantes." }],
    relatedCourses: [],
    docUrl: "https://discord.com/developers/docs"
  },

  // =============================================
  // Especializados
  // =============================================

  "napkin-ai": {
    title: "Napkin AI",
    category: "Visualizacao",
    vendor: "Napkin AI",
    pricing: "Freemium",
    rating: 4.5,
    description: "Transforme texto em diagramas, infograficos e visuais explicativos automaticamente com IA.",
    detailedDescription: `Napkin AI transforma qualquer texto em visuais explicativos profissionais como diagramas, fluxogramas, infograficos e ilustracoes. Cole um paragrafo ou documento e a IA gera automaticamente multiplas opcoes visuais para comunicar a informacao. Ideal para transformar conceitos complexos em visuais claros para apresentacoes, posts e documentacao.`,
    impactForIndividuals: ["📊 Transforme textos em diagramas em segundos", "🎨 Visuais profissionais sem habilidade de design", "📱 Perfeito para posts e apresentacoes"],
    impactForEntrepreneurs: ["📈 Infograficos para marketing de conteudo", "📋 Visualize processos e fluxos de negocio", "⚡ Conteudo visual para redes sociais rapidamente"],
    impactForCompanies: ["📊 Documentacao tecnica visual automatizada", "👥 Comunique estrategias com visuais claros", "🎯 Material de treinamento visual"],
    features: ["Texto para diagrama automatico", "Multiplos estilos visuais", "Infograficos e fluxogramas", "Exportacao em alta resolucao"],
    gettingStarted: ["Acesse napkin.ai e crie conta", "Cole ou digite o texto que quer visualizar", "Escolha entre as opcoes visuais geradas", "Personalize cores e estilo e exporte"],
    useCases: ["Diagramas para documentacao tecnica", "Infograficos para marketing de conteudo", "Fluxogramas de processos", "Visuais para apresentacoes e slides"],
    integrations: ["Notion", "Google Docs", "Canva"],
    bestPractices: ["Estruture o texto em topicos claros para melhores visuais", "Use para complementar apresentacoes com diagramas", "Exporte em SVG para qualidade maxima"],
    pitfalls: ["Visuais complexos podem precisar de ajuste manual", "Estilo visual pode ser limitado em opcoes"],
    prompts: [{ title: "Diagrama de Processo", content: "Crie um diagrama visual do processo de [processo], mostrando as etapas: [etapa 1] -> [etapa 2] -> [etapa 3], com decisoes e ramificacoes." }],
    relatedCourses: [],
    docUrl: "https://www.napkin.ai/"
  },

  "claude-code": {
    title: "Claude Code",
    category: "Desenvolvimento",
    vendor: "Anthropic",
    pricing: "Pago",
    rating: 4.8,
    description: "Agente de codigo IA da Anthropic que opera diretamente no seu terminal com acesso total ao projeto.",
    detailedDescription: `Claude Code e o agente de programacao oficial da Anthropic que roda diretamente no terminal. Diferente de IDEs com IA, Claude Code tem acesso ao sistema de arquivos completo, pode executar comandos, rodar testes, fazer commits e gerenciar deploy. Com contexto de ate 200K tokens, entende projetos inteiros e faz alteracoes em multiplos arquivos coordenadamente. E o assistente de programacao mais poderoso disponivel.`,
    impactForIndividuals: ["🖥️ IA no terminal com acesso total ao projeto", "🧠 Contexto de 200K tokens para entender codebases grandes", "⚡ Edita, testa e comita codigo autonomamente"],
    impactForEntrepreneurs: ["🚀 Desenvolvimento acelerado com agente autonomo", "🔧 Debug, refatoracao e features com um comando", "💻 Funciona com qualquer linguagem e framework"],
    impactForCompanies: ["👥 Multiplique produtividade de desenvolvedores", "📊 Integracoes com GitHub, CI/CD e ferramentas de equipe", "🔒 Codigo roda localmente no seu ambiente"],
    features: ["Agente autonomo no terminal", "Edicao coordenada de multiplos arquivos", "Execucao de comandos e testes", "Git e GitHub integrados"],
    gettingStarted: ["Instale: npm install -g @anthropic-ai/claude-code", "Configure sua API key da Anthropic", "Navegue ate a pasta do projeto", "Execute 'claude' e descreva o que quer fazer"],
    useCases: ["Desenvolvimento de features complexas", "Debug e investigacao de bugs", "Refatoracao de codigo em larga escala", "Code review e melhorias de qualidade"],
    integrations: ["GitHub", "Git", "Terminal/Shell", "MCP Servers"],
    bestPractices: ["Use CLAUDE.md para dar contexto sobre o projeto", "Comece com tarefas especificas e bem definidas", "Revise sempre as alteracoes antes de comitar"],
    pitfalls: ["Requer API key paga da Anthropic", "Pode consumir muitos tokens em projetos grandes"],
    prompts: [{ title: "Feature Completa", content: "Implemente [funcionalidade] seguindo os padroes existentes do projeto. Inclua testes, trate erros adequadamente, e faca commit com mensagem descritiva." }],
    relatedCourses: [],
    docUrl: "https://docs.anthropic.com/en/docs/claude-code"
  }
};
