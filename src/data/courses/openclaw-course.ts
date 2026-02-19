export const openclawCourse = {
  id: 11,
  slug: "openclaw-ia-open-source",
  title: "OpenClaw: IA Open Source na Prática",
  subtitle: "Domine Ferramentas de IA Open Source e Construa Seus Próprios Sistemas — Ollama, Hugging Face, LangChain e Mais",
  tool: "OpenClaw",
  category: "Inteligência Artificial",
  level: "Intermediário",
  duration: "30+ horas",
  totalLessons: 180,
  price: 197,
  originalPrice: 497,
  rating: 4.8,
  students: 487,
  lastUpdated: "2025-02-01",
  shortDescription: "Aprenda a instalar, configurar e operar modelos de IA open source localmente e na nuvem. Domine Ollama, Hugging Face, LangChain, Open WebUI e construa sistemas completos sem depender de APIs pagas.",
  fullDescription: "O curso mais completo sobre IA Open Source em português. Você aprenderá a rodar LLMs localmente com Ollama, fazer fine-tuning com Hugging Face, construir pipelines RAG com LangChain e LlamaIndex, criar interfaces com Open WebUI, e fazer deploy de modelos em produção. Ideal para quem quer independência tecnológica, privacidade de dados e redução de custos com IA.",
  impactForIndividuals: [
    "Rodar modelos de IA poderosos no seu computador sem custo mensal",
    "Privacidade total — seus dados nunca saem da sua máquina",
    "Independência de OpenAI, Google e outras big techs",
    "Personalizar modelos para suas necessidades específicas",
    "Construir portfolio impressionante com projetos open source"
  ],
  impactForEntrepreneurs: [
    "Reduzir custos de IA em até 90% usando modelos open source",
    "Criar produtos proprietários com IA sem royalties",
    "Oferecer serviços de IA para clientes com margens altas",
    "Compliance total com LGPD usando processamento local",
    "Diferenciar-se no mercado com soluções customizadas"
  ],
  impactForCompanies: [
    "Soberania de dados — processamento 100% interno",
    "Conformidade com regulamentações de privacidade",
    "Customização total de modelos para o negócio",
    "Escalabilidade com controle de custos",
    "Integração com infraestrutura existente"
  ],
  whatYouLearn: [
    "Instalar e configurar Ollama para rodar LLMs localmente",
    "Usar Hugging Face para encontrar e baixar modelos",
    "Construir pipelines RAG com LangChain e LlamaIndex",
    "Criar interfaces com Open WebUI e Gradio",
    "Fine-tuning de modelos com LoRA e QLoRA",
    "Deploy de modelos em produção com Docker e Kubernetes",
    "Quantização de modelos para hardware limitado",
    "Integrar múltiplos modelos em workflows complexos"
  ],
  modules: [
    { id: 1, title: "Fundamentos de IA Open Source", description: "Ecossistema, modelos disponíveis, hardware necessário", duration: "5 horas", lessons: 25, topics: ["Ecossistema open source", "LLMs locais", "GPU vs CPU", "Modelos populares"] },
    { id: 2, title: "Ollama e Modelos Locais", description: "Instalação, configuração e uso de LLMs no seu computador", duration: "6 horas", lessons: 30, topics: ["Instalação Ollama", "Llama 3", "Mistral", "Code Llama", "Customização"] },
    { id: 3, title: "Hugging Face Masterclass", description: "Hub de modelos, Transformers, datasets e Spaces", duration: "6 horas", lessons: 30, topics: ["Hub de modelos", "Transformers", "Datasets", "Spaces", "Inference API"] },
    { id: 4, title: "LangChain e RAG", description: "Retrieval-Augmented Generation e pipelines de IA", duration: "5 horas", lessons: 30, topics: ["LangChain", "RAG", "Vector stores", "Embeddings", "Chains"] },
    { id: 5, title: "Fine-Tuning e Customização", description: "LoRA, QLoRA, PEFT e treinamento de modelos", duration: "5 horas", lessons: 35, topics: ["LoRA", "QLoRA", "PEFT", "Datasets", "Avaliação"] },
    { id: 6, title: "Deploy e Produção", description: "Docker, APIs, monitoramento e escalabilidade", duration: "3 horas", lessons: 30, topics: ["Docker", "FastAPI", "Monitoramento", "Escalabilidade", "Custos"] }
  ],
  testimonials: [
    { name: "Lucas Ferreira", role: "CTO", company: "TechFlow", rating: 5, comment: "Conseguimos reduzir 85% dos custos com IA migrando para open source.", impact: "Economia de R$15.000/mês" },
    { name: "Ana Costa", role: "Data Scientist", rating: 5, comment: "O curso me deu confiança para propor soluções open source na empresa.", impact: "Promoção para Tech Lead" },
    { name: "Pedro Santos", role: "Freelancer", rating: 5, comment: "Agora ofereço consultoria de IA open source como serviço premium.", impact: "Renda extra de R$8.000/mês" }
  ],
  bonuses: [
    { title: "Docker Compose Templates", value: 297, description: "Templates prontos para deploy de modelos" },
    { title: "Guia de Hardware para IA", value: 197, description: "Escolha o melhor hardware para rodar IA local" },
    { title: "Comunidade Open Source IA", value: 497, description: "Acesso vitalício ao grupo exclusivo" }
  ],
  faqs: [
    { question: "Preciso de GPU potente?", answer: "Não obrigatoriamente. Ensinamos técnicas de quantização que permitem rodar modelos em CPUs e GPUs modestas. Mas uma GPU com 8GB+ VRAM é recomendada para melhor experiência." },
    { question: "É necessário saber programar?", answer: "Conhecimento básico de Python é recomendado. O curso ensina o que precisa, mas familiaridade com terminal e código ajuda muito." },
    { question: "Funciona no Windows?", answer: "Sim! Todas as ferramentas funcionam em Windows, Mac e Linux. Mostramos instalação em todos os sistemas." }
  ],
  targetAudience: ["Desenvolvedores", "Data Scientists", "CTOs", "Entusiastas de IA", "Startups"],
  requirements: ["Computador com 16GB+ RAM (recomendado)", "Python básico", "Terminal/linha de comando"],
  features: ["180 aulas práticas", "30+ horas de conteúdo", "Projetos reais", "Certificado de conclusão"]
};
