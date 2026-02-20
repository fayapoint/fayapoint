import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
  colorScheme: "dark light",
};
import { getMessages, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import "../globals.css";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import { AttributionTracker } from "@/components/AttributionTracker";
import { UserProvider } from "@/contexts/UserContext";
import { ServiceCartProvider } from "@/contexts/ServiceCartContext";
import { routing } from "@/i18n/routing";

// Analytics IDs
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const AHREFS_KEY = process.env.NEXT_PUBLIC_AHREFS_KEY || "1OAn7/HQLLYTfBiptfdygw";

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
  creator: "FayAi",
  publisher: "FayAi",
  openGraph: {
    type: "website" as const,
    url: SITE_URL,
    siteName: "FayAi",
    images: [{
      url: "/rwx6.jpg",
      width: 1200,
      height: 630,
      alt: "FayAi",
    }],
  },
  twitter: {
    card: "summary_large_image" as const,
    creator: "@fayai",
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
  other: {
    "ahrefs-site-verification": "849cd8c9a6b5670a534ad5b0d48c478756a915c5b6a51b24d51f42a99a027a43",
  },
} satisfies Metadata;

const localizedMetadata: Record<string, Metadata> = {
  "pt-BR": {
    ...baseMetadata,
    title: "FayAi - Aprenda IA do Zero ao Avançado",
    description: "A plataforma definitiva para dominar Inteligência Artificial. Cursos práticos de IA, automação, ChatGPT, Midjourney e mais de 100 ferramentas.",
    keywords: "inteligência artificial, IA, cursos online, ChatGPT, Midjourney, automação, machine learning, Brasil",
    openGraph: {
      ...baseMetadata.openGraph,
      locale: "pt_BR",
      title: "FayAi - Aprenda IA do Zero ao Avançado",
      description: "A plataforma definitiva para dominar Inteligência Artificial no Brasil",
    },
    twitter: {
      ...baseMetadata.twitter,
      title: "FayAi",
      description: "A plataforma definitiva para dominar IA",
    },
  },
  en: {
    ...baseMetadata,
    title: "FayAi - Master AI from Beginner to Pro",
    description: "Brazil's definitive platform to master Artificial Intelligence with hands-on courses covering ChatGPT, Midjourney, automation and 100+ tools.",
    keywords: "artificial intelligence, AI courses, ChatGPT, Midjourney, automation, Brazil",
    openGraph: {
      ...baseMetadata.openGraph,
      locale: "en_US",
      title: "FayAi - Master AI from Beginner to Pro",
      description: "Master Artificial Intelligence with practical training and 100+ AI tools.",
    },
    twitter: {
      ...baseMetadata.twitter,
      title: "FayAi",
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

  return {
    ...metadata,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        "x-default": `${SITE_URL}/pt-BR`,
        "pt-BR": `${SITE_URL}/pt-BR`,
        "en": `${SITE_URL}/en`,
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
    name: "FayAi",
    url: SITE_URL,
    logo: `${SITE_URL}/rwx6.jpg`,
    sameAs: ["https://www.instagram.com/fayai"],
  };

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FayAi",
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
          {/* Google Tag Manager */}
          {GTM_ID && (
            <>
              <Script
                id="gtm-script"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','${GTM_ID}');
                  `,
                }}
              />
            </>
          )}
          {/* Ahrefs Web Analytics */}
          <Script
            id="ahrefs-analytics"
            src="https://analytics.ahrefs.com/analytics.js"
            data-key={AHREFS_KEY}
            strategy="afterInteractive"
            async
          />
          <Suspense fallback={null}>
            <AttributionTracker />
          </Suspense>
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
