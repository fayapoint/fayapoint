import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import "../globals.css";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import { UserProvider } from "@/contexts/UserContext";
import { ServiceCartProvider } from "@/contexts/ServiceCartContext";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.SITE_URL ??
  "https://fayai.shop";

const baseMetadata = {
  metadataBase: new URL(SITE_URL),
  authors: [{ name: "Ricardo Faya" }],
  creator: "FayaPoint",
  publisher: "FayaPoint AI Academy",
  openGraph: {
    type: "website" as const,
    url: SITE_URL,
    siteName: "FayaPoint AI Academy",
    images: [{
      url: "/rwx6.jpg",
      width: 1200,
      height: 630,
      alt: "FayaPoint AI Academy",
    }],
  },
  twitter: {
    card: "summary_large_image" as const,
    creator: "@fayapoint",
    images: ["/rwx6.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-verification-code",
  },
} satisfies Metadata;

const localizedMetadata: Record<string, Metadata> = {
  "pt-BR": {
    ...baseMetadata,
    title: "FayaPoint AI Academy - Aprenda IA do Zero ao Avançado",
    description: "A plataforma definitiva para dominar Inteligência Artificial. Cursos práticos de IA, automação, ChatGPT, Midjourney e mais de 100 ferramentas.",
    keywords: "inteligência artificial, IA, cursos online, ChatGPT, Midjourney, automação, machine learning, Brasil",
    openGraph: {
      ...baseMetadata.openGraph,
      locale: "pt_BR",
      title: "FayaPoint AI Academy - Aprenda IA do Zero ao Avançado",
      description: "A plataforma definitiva para dominar Inteligência Artificial no Brasil",
    },
    twitter: {
      ...baseMetadata.twitter,
      title: "FayaPoint AI Academy",
      description: "A plataforma definitiva para dominar IA",
    },
  },
  en: {
    ...baseMetadata,
    title: "FayaPoint AI Academy - Master AI from Beginner to Pro",
    description: "Brazil's definitive platform to master Artificial Intelligence with hands-on courses covering ChatGPT, Midjourney, automation and 100+ tools.",
    keywords: "artificial intelligence, AI courses, ChatGPT, Midjourney, automation, Brazil",
    openGraph: {
      ...baseMetadata.openGraph,
      locale: "en_US",
      title: "FayaPoint AI Academy - Master AI from Beginner to Pro",
      description: "Master Artificial Intelligence with practical training and 100+ AI tools.",
    },
    twitter: {
      ...baseMetadata.twitter,
      title: "FayaPoint AI Academy",
      description: "Master AI with practical courses",
    },
  },
};

type LocaleParams = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = localizedMetadata[locale] ?? localizedMetadata["pt-BR"];
  const canonicalPath = `/${locale}`;

  return {
    ...metadata,
    alternates: {
      canonical: canonicalPath,
      languages: {
        "pt-BR": "/pt-BR",
        en: "/en",
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<LocaleParams>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FayaPoint",
    url: SITE_URL,
    logo: `${SITE_URL}/rwx6.jpg`,
    sameAs: ["https://www.instagram.com/fayapoint"],
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FayaPoint AI Academy",
    url: SITE_URL,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/${locale}/cursos?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <UserProvider>
      <ServiceCartProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Script
            id="ld-organization"
            type="application/ld+json"
            strategy="afterInteractive"
          >
            {JSON.stringify(organizationLd)}
          </Script>
          <Script
            id="ld-website"
            type="application/ld+json"
            strategy="afterInteractive"
          >
            {JSON.stringify(websiteLd)}
          </Script>
          {children}
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1f2937",
                color: "#fff",
                border: "1px solid #374151",
              },
            }}
          />
        </NextIntlClientProvider>
      </ServiceCartProvider>
    </UserProvider>
  );
}
