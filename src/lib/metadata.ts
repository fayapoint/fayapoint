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
   * O `hreflang="en"` saiu — e a razão é medida, não estética.
   *
   * A árvore `/en/` serve o MESMO conteúdo em português: em 27/07/2026,
   * `/en/noticias` respondia com `<title>Blog IA Hoje — notícias e guias…`.
   * Declarar essa URL como a versão inglesa é dizer ao Google uma coisa que
   * não é verdade, e o efeito prático é ele escolher sozinho qual das duas
   * cópias mostrar. O `site:` do domínio confirmava o estrago: resultados em
   * inglês para páginas que hoje são portuguesas, e o aviso de que entradas
   * "bastante semelhantes" tinham sido omitidas.
   *
   * Quando existir tradução de verdade, o alternativo volta — junto com ela.
   */
  return {
    ...(title && { title }),
    ...(description && { description }),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "x-default": `${SITE_URL}/pt-BR${path}`,
        "pt-BR": `${SITE_URL}/pt-BR${path}`,
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
  "/casos": {
    "pt-BR": {
      title: "Cases e portfólio — projetos de IA e automação | FayAI",
      description:
        "Projetos reais de clientes que transformaram suas operações com IA, automação e plataformas digitais desenvolvidas pela FayAI.",
    },
    en: {
      title: "Case studies and portfolio — AI and automation | FayAI",
      description:
        "Real client projects that transformed their operations with AI, automation and digital platforms built by FayAI.",
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
