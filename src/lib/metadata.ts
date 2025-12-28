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
        [locale]: canonicalUrl,
        [altLocale]: altPath,
      },
    },
    openGraph: {
      url: canonicalUrl,
      ...(title && { title }),
      ...(description && { description }),
      images: [{ url: image }],
    },
  };
}

/**
 * Common metadata for static pages - can be spread into page metadata
 */
export const pageMetadataConfig = {
  cursos: {
    "pt-BR": {
      title: "Cursos de IA - FayaPoint AI Academy",
      description: "Explore nossos cursos de Inteligência Artificial. ChatGPT, Midjourney, automação e mais.",
    },
    en: {
      title: "AI Courses - FayaPoint AI Academy", 
      description: "Explore our Artificial Intelligence courses. ChatGPT, Midjourney, automation and more.",
    },
  },
  contato: {
    "pt-BR": {
      title: "Contato - FayaPoint AI Academy",
      description: "Entre em contato conosco para dúvidas, parcerias ou suporte.",
    },
    en: {
      title: "Contact - FayaPoint AI Academy",
      description: "Contact us for questions, partnerships or support.",
    },
  },
  blog: {
    "pt-BR": {
      title: "Blog - FayaPoint AI Academy",
      description: "Artigos, tutoriais e novidades sobre Inteligência Artificial.",
    },
    en: {
      title: "Blog - FayaPoint AI Academy",
      description: "Articles, tutorials and news about Artificial Intelligence.",
    },
  },
  sobre: {
    "pt-BR": {
      title: "Sobre Nós - FayaPoint AI Academy",
      description: "Conheça a FayaPoint AI Academy e nossa missão de democratizar a IA.",
    },
    en: {
      title: "About Us - FayaPoint AI Academy",
      description: "Learn about FayaPoint AI Academy and our mission to democratize AI.",
    },
  },
  precos: {
    "pt-BR": {
      title: "Preços e Planos - FayaPoint AI Academy",
      description: "Escolha o plano ideal para sua jornada de aprendizado em IA.",
    },
    en: {
      title: "Pricing & Plans - FayaPoint AI Academy",
      description: "Choose the ideal plan for your AI learning journey.",
    },
  },
  faq: {
    "pt-BR": {
      title: "Perguntas Frequentes - FayaPoint AI Academy",
      description: "Respostas para as dúvidas mais comuns sobre nossos cursos e serviços.",
    },
    en: {
      title: "FAQ - FayaPoint AI Academy",
      description: "Answers to common questions about our courses and services.",
    },
  },
} as const;
