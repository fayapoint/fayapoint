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
    logo: "https://logo.clearbit.com/perplexity.ai",
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
  }
};
