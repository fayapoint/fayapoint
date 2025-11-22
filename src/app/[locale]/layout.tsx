import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import "../globals.css";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "@/contexts/UserContext";
import { ServiceCartProvider } from "@/contexts/ServiceCartContext";
import { routing } from "@/i18n/routing";

const baseMetadata = {
  metadataBase: new URL("https://fayapoint.com.br"),
  authors: [{ name: "Ricardo Faya" }],
  creator: "FayaPoint",
  publisher: "FayaPoint AI Academy",
  openGraph: {
    type: "website" as const,
    url: "https://fayapoint.com.br",
    siteName: "FayaPoint AI Academy",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "FayaPoint AI Academy",
    }],
  },
  twitter: {
    card: "summary_large_image" as const,
    creator: "@fayapoint",
    images: ["/og-image.png"],
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
  return localizedMetadata[locale] ?? localizedMetadata["pt-BR"];
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

  return (
    <UserProvider>
      <ServiceCartProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
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
