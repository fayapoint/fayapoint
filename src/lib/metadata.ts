import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://fayai.com.br";

export type PageMetadataParams = {
  locale: string;
  path: string;
  title?: string;
  description?: string;
  image?: string;
};

/**
 * Generate page-specific metadata with proper canonical URLs
 */
export function generatePageMetadata({
  locale,
  path,
  title,
  description,
  image = "/og-fayai.jpg",
}: PageMetadataParams): Metadata {
  const fullPath = `/${locale}${path}`;
  const canonicalUrl = `${SITE_URL}${fullPath}`;

  // A capa do curso mora no Cloudinary, não em `public/`. Sem esta linha o
  // prefixo do domínio era colado na frente da URL absoluta e saía
  // `https://fayai.com.brhttps://res.cloudinary.com/...` — um OG quebrado que
  // nenhum build acusa, porque é só uma string.
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  /**
   * O `hreflang="en"` VOLTOU em 06/08/2026, junto com a tradução de verdade.
   *
   * Ele tinha saído em 27/07 por uma razão medida: a árvore `/en/` servia o
   * mesmo conteúdo em português — `/en/noticias` respondia com
   * `<title>Blog IA Hoje — notícias e guias…`. Declarar aquilo como "a versão
   * inglesa" era dizer ao Google uma coisa falsa, e o efeito prático foi ele
   * escolher sozinho qual das duas cópias mostrar: o `site:` do domínio
   * trazia resultados em inglês para páginas portuguesas, com o aviso de que
   * entradas "bastante semelhantes" tinham sido omitidas.
   *
   * A condição para voltar era exatamente essa: existir tradução. Agora
   * existe — interface, catálogo dos 27 cursos, corpo das aulas, as 56 fichas
   * de ferramenta e as matérias do blog.
   *
   * ⚠️ `x-default` continua apontando para pt-BR, e isso é deliberado: o
   * site é brasileiro, o acesso é majoritariamente do Brasil, e `x-default` é
   * para quem o Google não consegue classificar. Ele não significa "idioma
   * principal" — significa "quando nenhum dos outros serve".
   *
   * ⚠️ A declaração precisa ser RECÍPROCA para valer. Como as duas árvores
   * usam este mesmo helper e o mesmo `path`, cada página aponta para a outra
   * automaticamente. Mudar isto de lugar sem manter a reciprocidade faz o
   * Google descartar o par inteiro, em silêncio.
   */
  return {
    ...(title && { title }),
    ...(description && { description }),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "x-default": `${SITE_URL}/pt-BR${path}`,
        "pt-BR": `${SITE_URL}/pt-BR${path}`,
        en: `${SITE_URL}/en${path}`,
      },
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: "FayAi",
      locale: locale === "en" ? "en_US" : "pt_BR",
      ...(title && { title }),
      ...(description && { description }),
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: title || "FayAi",
      }],
    },
    twitter: {
      card: "summary_large_image",
      ...(title && { title }),
      ...(description && { description }),
      images: [imageUrl],
    },
  };
}

/**
 * Common metadata for static pages - can be spread into page metadata
 */
export const pageMetadataConfig = {
  cursos: {
    // "mais de 50 cursos" era falso — o catálogo tem 20 ativos (21/07). Número
    // inflado em página de venda queima confiança e não ajuda em ranking.
    "pt-BR": {
      title: "Cursos de Inteligência Artificial com Certificado | FayAI",
      description: "20 cursos práticos de IA em português: ChatGPT, automação com n8n, Midjourney, agentes e RAG. Certificado verificável, acesso vitalício e conteúdo atualizado.",
    },
    en: {
      title: "Artificial Intelligence Courses with Certificate | FayAI",
      description: "20 hands-on AI courses: ChatGPT, n8n automation, Midjourney, agents and RAG. Verifiable certificate, lifetime access and content kept up to date.",
    },
  },
  contato: {
    "pt-BR": {
      title: "Contato - FayAi",
      description: "Entre em contato com a FayAi para dúvidas sobre cursos, parcerias corporativas, suporte técnico ou consultoria em IA. Resposta em até 24h úteis.",
    },
    en: {
      title: "Contact - FayAi",
      description: "Contact FayAi for course inquiries, corporate partnerships, technical support or AI consulting. We respond within 24 business hours.",
    },
  },
  blog: {
    "pt-BR": {
      title: "Blog de IA - Artigos e Tutoriais | FayAi",
      description: "Artigos, tutoriais detalhados e novidades sobre Inteligência Artificial. Aprenda dicas práticas de ChatGPT, Midjourney, automação e tendências do mercado de IA.",
    },
    en: {
      title: "AI Blog - Articles & Tutorials | FayAi",
      description: "In-depth articles, tutorials and news about Artificial Intelligence. Learn practical tips for ChatGPT, Midjourney, automation and AI market trends.",
    },
  },
  sobre: {
    "pt-BR": {
      title: "Sobre Nós - FayAi",
      description: "Conheça a FayAi, nossa missão de democratizar a Inteligência Artificial no Brasil e a equipe de especialistas por trás dos cursos.",
    },
    en: {
      title: "About Us - FayAi",
      description: "Learn about FayAi, our mission to democratize Artificial Intelligence in Brazil, and the team of experts behind our courses.",
    },
  },
  precos: {
    "pt-BR": {
      title: "Preços e Planos - FayAi",
      description: "Compare planos de assinatura e preços de serviços da FayAi. Starter, Pro e Business com acesso a cursos, mentoria, certificados e suporte prioritário.",
    },
    en: {
      title: "Pricing & Plans - FayAi",
      description: "Compare FayAi subscription plans and service pricing. Starter, Pro and Business tiers with course access, mentorship, certificates and priority support.",
    },
  },
  faq: {
    "pt-BR": {
      title: "Perguntas Frequentes - FayAi",
      description: "Encontre respostas para dúvidas sobre cursos de IA, planos de assinatura, certificados, métodos de pagamento e acesso à plataforma FayAi.",
    },
    en: {
      title: "FAQ - FayAi",
      description: "Find answers to questions about AI courses, subscription plans, certificates, payment methods and access to the FayAi platform.",
    },
  },
} as const;

type RouteSeoEntry = {
  "pt-BR": { title: string; description: string };
  en: { title: string; description: string };
  /** Fora do índice: página de passagem, placeholder ou estado transitório. */
  noindex?: true;
};

/**
 * Título e descrição das rotas que não os declaravam.
 *
 * Até 29/07/2026 estas 25 páginas serviam, letra por letra, o título da home:
 * "Cursos de Inteligência Artificial do Zero | FayAI". A causa é a cascata de
 * metadata do Next — o layout de `[locale]` declara `title`, e todo filho que
 * não sobrescreve herda. O conserto de 28/07 deu canônica própria a cada rota
 * mas deixou título e descrição de fora de propósito, e é o que sobrou:
 * 25 páginas distintas pedindo ao Google para tratá-las como a mesma coisa.
 * Medido em produção: 18 de 20 páginas amostradas com o título idêntico.
 *
 * O texto de cada entrada descreve o que a página REALMENTE renderiza — foi
 * lido do HTML servido, não inferido do nome da rota. `/en` traduz de verdade
 * (`/en/casos` responde "Projects That Deliver Real Results"), então o par
 * bilíngue não é decorativo.
 */
export const ROUTE_SEO: Record<string, RouteSeoEntry> = {
  /**
   * As 9 rotas abaixo entraram em 06/08/2026, na tradução do site para inglês.
   *
   * Elas JÁ tinham título e descrição próprios — só que escritos à mão, em
   * português, dentro da própria página. O efeito no `/en` era o pior dos dois
   * mundos: a página renderizava em inglês e se anunciava em português na aba
   * do navegador, no resultado de busca e no cartão compartilhado. Trazer para
   * cá não muda uma vírgula do que o pt-BR serve; só dá ao inglês o par que
   * faltava.
   */
  "/arcade": {
    "pt-BR": {
      title: "Arcade Grátis — Jogue Sem Cadastro | FayAi",
      description:
        "Experimente 5 minigames de IA generativa da FayAi sem precisar criar conta. Monte prompts, separe verdade de mito e mais.",
    },
    en: {
      title: "Free Arcade — Play Without Signing Up | FayAi",
      description:
        "Try FayAi's 5 generative-AI mini-games without creating an account. Build prompts, tell truth from myth and more.",
    },
  },
  "/game": {
    "pt-BR": {
      title: "Winners 22 Championship — a liga do futebol virtual | FayAI",
      description:
        "Campeonatos organizados, estatística verificada e carreira de jogador no modo Clubs do EA SPORTS FC. Conecte seu clube em 30 segundos, sem senha e sem instalação.",
    },
    en: {
      title: "Winners 22 Championship — the virtual football league | FayAI",
      description:
        "Organized championships, verified statistics and player careers for EA SPORTS FC Clubs. Connect your club in 30 seconds — no password, no install.",
    },
  },
  "/inventando": {
    "pt-BR": {
      title: "Inventando — microcursos grátis de ferramentas de IA | FayAI",
      description:
        "Cada ferramenta de IA que aparece nos lançamentos vira um microcurso curto e ilustrado em português: o que é, como usar e onde ela falha. A primeira aula é grátis.",
    },
    en: {
      title: "Inventing — free micro-courses on AI tools | FayAI",
      description:
        "Every AI tool that shows up in the launches becomes a short, illustrated micro-course: what it is, how to use it and where it falls apart. The first lesson is free.",
    },
  },
  "/lab/3d": {
    "pt-BR": {
      title: "Bancada 3D — FayAI",
      description: "Laboratório interno de peças 3D da FayAI.",
    },
    en: {
      title: "3D Workbench — FayAI",
      description: "FayAI's internal workbench for 3D pieces.",
    },
    noindex: true,
  },
  "/lab/marca": {
    "pt-BR": {
      title: "Bancada da marca — FayAI",
      description: "Laboratório interno do logo FayAI: letreiro, símbolo e carregamento.",
    },
    en: {
      title: "Brand workbench — FayAI",
      description: "FayAI's internal workbench for the logo, the symbol and the loader.",
    },
    noindex: true,
  },
  "/lab/dossie": {
    "pt-BR": {
      title: "Bancada do dossiê — FayAI",
      description: "Laboratório interno do dossiê de persona da FayAI.",
    },
    en: {
      title: "Dossier workbench — FayAI",
      description: "FayAI's internal workbench for the persona dossier.",
    },
    noindex: true,
  },
  "/login": {
    "pt-BR": { title: "Entrar | FayAI", description: "Acesse a sua conta FayAI." },
    en: { title: "Sign in | FayAI", description: "Access your FayAI account." },
    noindex: true,
  },
  "/noticias": {
    "pt-BR": {
      title: "Blog IA Hoje — notícias e guias de inteligência artificial | FayAI",
      description:
        "As notícias de IA que importam para brasileiros, selecionadas e explicadas todos os dias pela FayAI — com link para a fonte original.",
    },
    en: {
      title: "AI Blog Today — artificial intelligence news and guides | FayAI",
      description:
        "The AI news that matters, picked and explained every day by FayAI — always with a link to the original source.",
    },
  },
  "/onboarding": {
    "pt-BR": {
      title: "Primeiros passos | FayAI",
      description: "Monte a sua trilha de IA em poucos minutos.",
    },
    en: {
      title: "Getting started | FayAI",
      description: "Build your AI learning trail in a few minutes.",
    },
    noindex: true,
  },
  "/projetos": {
    "pt-BR": {
      title: "Projetos FayAI — uma vida dedicada à tecnologia",
      description:
        "Do 386 à inteligência artificial: cursos, Ultimate Social Suite, WorldForge Studio, visão computacional de futebol, copiloto de games e o app de música sincronizada Som em Bando. Conheça os projetos e a história de Ricardo Faya.",
    },
    en: {
      title: "FayAI Projects — a life spent on technology",
      description:
        "From the 386 to artificial intelligence: courses, Ultimate Social Suite, WorldForge Studio, football computer vision, a games copilot and Som em Bando, the synced-music app. The projects, and Ricardo Faya's story behind them.",
    },
  },
  "/radar": {
    "pt-BR": {
      title: "Radar FayAI — o que o Brasil e o mundo estão procurando agora",
      description:
        "Tendências medidas, não estimadas: buscas em alta do Google por estado, artigos mais lidos da Wikipédia e a demanda real de inteligência artificial no autocomplete do Google e do YouTube.",
    },
    en: {
      title: "FayAI Radar — what Brazil and the world are searching for right now",
      description:
        "Trends that are measured, not estimated: Google's rising searches by state, the most-read Wikipedia articles, and real artificial-intelligence demand in Google and YouTube autocomplete.",
    },
  },
  "/registro": {
    "pt-BR": { title: "Criar conta | FayAI", description: "Crie a sua conta gratuita na FayAI." },
    en: { title: "Create account | FayAI", description: "Create your free FayAI account." },
    noindex: true,
  },
  "/afiliados": {
    "pt-BR": {
      title: "Programa de Afiliados — 30% de comissão | FayAI",
      description:
        "Monetize sua audiência indicando cursos de IA em português. 30% de comissão por venda, material pronto e acompanhamento de resultados.",
    },
    en: {
      title: "Affiliate Program — 30% commission | FayAI",
      description:
        "Monetize your audience by referring Brazilian AI courses. 30% commission per sale, ready-made assets and result tracking.",
    },
  },
  "/ajuda": {
    "pt-BR": {
      title: "Central de Ajuda — guias e suporte | FayAI",
      description:
        "Guias de primeiros passos, tutoriais da plataforma e suporte para aproveitar ao máximo os cursos de IA da FayAI.",
    },
    en: {
      title: "Help Center — guides and support | FayAI",
      description:
        "Getting-started guides, platform tutorials and support to make the most of FayAI's AI courses.",
    },
  },
  "/api-docs": {
    "pt-BR": {
      title: "Documentação da API — autenticação, cursos e IA | FayAI",
      description:
        "Referência da API RESTful da FayAI: autenticação, endpoints de usuário, cursos e geração com IA, com quick start e exemplos de requisição.",
    },
    en: {
      title: "API Documentation — auth, courses and AI | FayAI",
      description:
        "FayAI RESTful API reference: authentication, user endpoints, courses and generative AI, with a quick start and request examples.",
    },
  },
  "/aula-gratis": {
    "pt-BR": {
      title: "Mini-curso grátis de IA — 3 aulas práticas, sem cadastro | FayAI",
      description:
        "Três aulas gratuitas para começar a usar Inteligência Artificial hoje. Conteúdo real, sem cadastro e sem cartão de crédito.",
    },
    en: {
      title: "Free AI mini-course — 3 hands-on lessons, no signup | FayAI",
      description:
        "Three free lessons to start using Artificial Intelligence today. Real content, no signup and no credit card.",
    },
  },
  "/carreiras": {
    "pt-BR": {
      title: "Trabalhe na FayAI — vagas em IA e educação",
      description:
        "Vagas abertas e oportunidades para construir educação em Inteligência Artificial no Brasil. Conheça a equipe e como se candidatar.",
    },
    en: {
      title: "Careers at FayAI — jobs in AI and education",
      description:
        "Open roles and opportunities to build AI education in Brazil. Meet the team and learn how to apply.",
    },
  },
  // 21/08/2026: o título e a descrição aqui descreviam sete cases INVENTADOS
  // ("projetos de clientes que transformaram suas operações com IA"). A página
  // passou a ser o portfólio real de 34 anos — ver `src/dados/casos.ts`.
  "/casos": {
    "pt-BR": {
      title: "Casos — 34 anos de corte, de 1992 a hoje | Ricardo Faya",
      description:
        "32 trabalhos reais: MultiRio, ZDF em alemão, Emmanuelle in Rio, FGV, Jockey Club, drone desde 2013, Fox Sports na Copa e nas Olimpíadas, e a virada para inteligência artificial.",
    },
    en: {
      title: "Work — 34 years of cutting, from 1992 to today | Ricardo Faya",
      description:
        "32 real projects: MultiRio, ZDF, Emmanuelle in Rio, FGV, Jockey Club, drone flying since 2013, Fox Sports at the World Cup and the Olympics, and the turn to artificial intelligence.",
    },
  },
  "/certificacoes": {
    // A página renderiza "Em breve: detalhes sobre critérios e verificação".
    // Anunciar placeholder ao Google é pedir "Rastreada, mas não indexada".
    // Sai o noindex quando existir o conteúdo.
    noindex: true,
    "pt-BR": {
      title: "Certificações | FayAI",
      description:
        "Certificados de conclusão dos cursos e trilhas da FayAI, com verificação pública.",
    },
    en: {
      title: "Certifications | FayAI",
      description:
        "Completion certificates for FayAI courses and tracks, with public verification.",
    },
  },
  "/chatgpt-allowlisting": {
    "pt-BR": {
      title: "Curso de AEO — apareça nas respostas do ChatGPT | FayAI",
      description:
        "Answer Engine Optimization na prática: como fazer o ChatGPT e os motores de resposta citarem o seu negócio em vez do concorrente. Garantia de 30 dias.",
    },
    en: {
      title: "AEO Course — get recommended by ChatGPT | FayAI",
      description:
        "Answer Engine Optimization in practice: how to get ChatGPT and answer engines to cite your business instead of your competitor. 30-day guarantee.",
    },
  },
  "/comunidade": {
    "pt-BR": {
      title: "Comunidade criativa — galeria de criações com IA | FayAI",
      description:
        "Explore criações da comunidade FayAI, inspire-se e compartilhe suas próprias imagens e projetos feitos com Inteligência Artificial.",
    },
    en: {
      title: "Creative community — AI creations gallery | FayAI",
      description:
        "Explore creations from the FayAI community, get inspired and share your own AI-made images and projects.",
    },
  },
  "/contato/vendas": {
    "pt-BR": {
      title: "Falar com vendas — planos corporativos de IA | FayAI",
      description:
        "Conte sobre sua empresa e receba uma proposta de treinamento ou consultoria em Inteligência Artificial. Resposta em até 1 dia útil.",
    },
    en: {
      title: "Talk to sales — corporate AI plans | FayAI",
      description:
        "Tell us about your company and get a proposal for AI training or consulting. We reply within one business day.",
    },
  },
  "/cursos/por-ferramenta": {
    "pt-BR": {
      title: "Cursos de IA por ferramenta — ChatGPT, Claude, Midjourney | FayAI",
      description:
        "Escolha o curso pela ferramenta que você quer dominar: ChatGPT, Claude, Gemini, Perplexity, Midjourney, DALL-E e mais.",
    },
    en: {
      title: "AI courses by tool — ChatGPT, Claude, Midjourney | FayAI",
      description:
        "Pick a course by the tool you want to master: ChatGPT, Claude, Gemini, Perplexity, Midjourney, DALL-E and more.",
    },
  },
  "/cursos/por-setor": {
    "pt-BR": {
      title: "Cursos de IA por setor — e-commerce, saúde, advocacia | FayAI",
      description:
        "Cursos de Inteligência Artificial aplicados ao seu mercado: e-commerce, educação, saúde, advocacia e marketing digital.",
    },
    en: {
      title: "AI courses by industry — e-commerce, healthcare, law | FayAI",
      description:
        "Artificial Intelligence courses applied to your market: e-commerce, education, healthcare, law and digital marketing.",
    },
  },
  "/descobrir": {
    "pt-BR": {
      title: "Curso grátis do mês e catálogo transparente | FayAI",
      description:
        "Um curso completo de IA grátis todo mês e catálogo com preços abertos. Comece pelo gratuito, prove o resultado e só então avance de plano.",
    },
    en: {
      title: "Free course of the month and open catalog | FayAI",
      description:
        "A complete AI course free every month and a catalog with open pricing. Start free, prove the result, then move up a plan.",
    },
  },
  "/exclusao-de-dados": {
    "pt-BR": {
      title: "Solicitação de exclusão de dados (LGPD) | FayAI",
      description:
        "Como pedir a exclusão dos seus dados pessoais na FayAI: canais de solicitação, dados removidos, prazo e o que a lei permite reter.",
    },
    en: {
      title: "Data deletion request (LGPD) | FayAI",
      description:
        "How to request deletion of your personal data at FayAI: how to ask, what gets removed, the deadline and what the law lets us keep.",
    },
  },
  "/instrutores": {
    "pt-BR": {
      title: "Instrutores — quem ensina os cursos de IA | FayAI",
      description:
        "Conheça os instrutores da FayAI: profissionais atuantes no mercado, com experiência real em projetos de Inteligência Artificial.",
    },
    en: {
      title: "Instructors — who teaches the AI courses | FayAI",
      description:
        "Meet FayAI's instructors: working professionals with real experience delivering Artificial Intelligence projects.",
    },
  },
  "/parcerias": {
    "pt-BR": {
      title: "Parcerias e treinamento corporativo em IA | FayAI",
      description:
        "Leve educação em Inteligência Artificial para sua organização: programas corporativos, parcerias educacionais e projetos sob medida.",
    },
    en: {
      title: "Partnerships and corporate AI training | FayAI",
      description:
        "Bring Artificial Intelligence education to your organization: corporate programs, educational partnerships and tailored projects.",
    },
  },
  "/privacidade": {
    "pt-BR": {
      title: "Política de Privacidade e LGPD | FayAI",
      description:
        "Como a FayAI coleta, usa, compartilha e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados.",
    },
    en: {
      title: "Privacy Policy and data protection | FayAI",
      description:
        "How FayAI collects, uses, shares and protects your personal data, in compliance with Brazil's data protection law.",
    },
  },
  "/recursos": {
    "pt-BR": {
      title: "Recursos gratuitos de IA — guias, templates e glossário | FayAI",
      description:
        "Materiais gratuitos da FayAI: guias práticos, templates de prompts, calculadora de ROI e glossário de Inteligência Artificial.",
    },
    en: {
      title: "Free AI resources — guides, templates and glossary | FayAI",
      description:
        "Free FayAI materials: hands-on guides, prompt templates, an ROI calculator and an Artificial Intelligence glossary.",
    },
  },
  "/recursos/calculadora-roi": {
    "pt-BR": {
      title: "Calculadora de ROI de Inteligência Artificial | FayAI",
      description:
        "Calcule o retorno de um investimento em IA: informe investimento inicial, ganho mensal estimado e prazo para ver ganho total e ROI.",
    },
    en: {
      title: "Artificial Intelligence ROI Calculator | FayAI",
      description:
        "Estimate the return of an AI investment: enter upfront cost, expected monthly gain and timeframe to see total gain and ROI.",
    },
  },
  "/recursos/glossario": {
    "pt-BR": {
      title: "Glossário de Inteligência Artificial — termos explicados | FayAI",
      description:
        "Dicionário de IA em português: modelos, técnicas, ferramentas e conceitos explicados de forma direta, de A a Z.",
    },
    en: {
      title: "Artificial Intelligence Glossary — terms explained | FayAI",
      description:
        "AI dictionary: models, techniques, tools and concepts explained plainly, from A to Z.",
    },
  },
  "/recursos/guias": {
    "pt-BR": {
      title: "Guias práticos de IA gratuitos | FayAI",
      description:
        "Materiais completos e gratuitos para dominar ferramentas e técnicas de Inteligência Artificial, do iniciante ao avançado.",
    },
    en: {
      title: "Free hands-on AI guides | FayAI",
      description:
        "Complete, free materials to master Artificial Intelligence tools and techniques, from beginner to advanced.",
    },
  },
  "/recursos/templates": {
    "pt-BR": {
      title: "Templates e prompts prontos para ChatGPT | FayAI",
      description:
        "Prompts testados para produtividade, marketing, escrita e análise. Copie, cole e adapte para o seu dia a dia.",
    },
    en: {
      title: "Ready-made ChatGPT prompts and templates | FayAI",
      description:
        "Tested prompts for productivity, marketing, writing and analysis. Copy, paste and adapt to your routine.",
    },
  },
  "/status": {
    // Estado transitório: o que ela diz hoje não vale amanhã, e não há consulta
    // de busca que ela deva ganhar.
    noindex: true,
    "pt-BR": {
      title: "Status da plataforma | FayAI",
      description: "Disponibilidade dos serviços da plataforma FayAI em tempo real.",
    },
    en: {
      title: "Platform status | FayAI",
      description: "Real-time availability of FayAI platform services.",
    },
  },
  "/termos": {
    "pt-BR": {
      title: "Termos de Uso | FayAI",
      description:
        "Condições de uso da plataforma FayAI: contas, serviços, propriedade intelectual, pagamentos e responsabilidades das partes.",
    },
    en: {
      title: "Terms of Use | FayAI",
      description:
        "FayAI platform terms: accounts, services, intellectual property, payments and the responsibilities of each party.",
    },
  },
  "/waiting-list": {
    // Confirmação pós-cadastro ("Parabéns! Você está na lista!"). Só faz sentido
    // para quem acabou de se inscrever — nunca como resultado de busca.
    noindex: true,
    "pt-BR": {
      title: "Lista de espera | FayAI",
      description: "Confirmação de inscrição na lista de espera da FayAI.",
    },
    en: {
      title: "Waiting list | FayAI",
      description: "Confirmation of your FayAI waiting list signup.",
    },
  },
};

/**
 * Metadata completa de uma rota estática: canônica + título + descrição + OG.
 *
 * É o que os `layout.tsx` das rotas chamam. Se a rota não estiver em
 * `ROUTE_SEO`, devolve só o que `generatePageMetadata` dá — nunca inventa
 * título, para não substituir por acidente o de uma página que já tem o seu.
 */
export function routeMetadata({
  locale,
  path,
}: {
  locale: string;
  path: string;
}): Metadata {
  const entry = ROUTE_SEO[path];
  if (!entry) return generatePageMetadata({ locale, path });

  const copy = locale === "en" ? entry.en : entry["pt-BR"];
  const meta = generatePageMetadata({
    locale,
    path,
    title: copy.title,
    description: copy.description,
  });

  /**
   * `noindex` aqui, e não no robots.txt, é deliberado: URL bloqueada no
   * robots.txt pode continuar indexada só pela URL, porque o Google nunca
   * chega a LER a tag que manda removê-la. Para tirar do índice é preciso
   * deixar rastrear e dizer noindex.
   */
  if (entry.noindex) {
    return { ...meta, robots: { index: false, follow: true } };
  }
  return meta;
}
