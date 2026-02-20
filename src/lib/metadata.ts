import type { Metadata } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://fayai.shop";

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
  const altLocale = locale === "pt-BR" ? "en" : "pt-BR";
  const altPath = `${SITE_URL}/${altLocale}${path}`;

  return {
    ...(title && { title }),
    ...(description && { description }),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "x-default": `${SITE_URL}/pt-BR${path}`,
        "pt-BR": `${SITE_URL}/pt-BR${path}`,
        "en": `${SITE_URL}/en${path}`,
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
    "pt-BR": {
      title: "Cursos de IA - FayAi",
      description: "Explore mais de 50 cursos práticos de Inteligência Artificial. Aprenda ChatGPT, Midjourney, automação com n8n, machine learning e muito mais. Certificado incluso e acesso vitalício.",
    },
    en: {
      title: "AI Courses - FayAi",
      description: "Explore 50+ hands-on Artificial Intelligence courses. Learn ChatGPT, Midjourney, n8n automation, machine learning and more. Certificate included with lifetime access.",
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
