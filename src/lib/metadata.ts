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
  image = "/rwx6.jpg",
}: PageMetadataParams): Metadata {
  const fullPath = `/${locale}${path}`;
  const canonicalUrl = `${SITE_URL}${fullPath}`;

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
        url: `${SITE_URL}${image}`,
        width: 1200,
        height: 630,
        alt: title || "FayAi",
      }],
    },
    twitter: {
      card: "summary_large_image",
      ...(title && { title }),
      ...(description && { description }),
      images: [`${SITE_URL}${image}`],
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
