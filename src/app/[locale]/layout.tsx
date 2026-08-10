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
import { PostHogProvider } from "@/components/PostHogProvider";
import { UsoTracker } from "@/components/UsoTracker";
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
  "https://fayai.com.br";

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
      // Trocada em 02/08/2026. A anterior (rwx6.jpg) era foto do Web Summit
      // com marca d'agua de OUTRO dominio (fayacuts.com.br), anunciava o
      // Ultimate Social Suite em vez dos cursos, e vinha 2000x934 quando o
      // card pede 1,91:1 — o Facebook e o LinkedIn cortavam por conta propria.
      // Gerada por scripts/og_card.py (fundo ComfyUI + texto PIL).
      url: "/og-fayai.jpg",
      width: 1200,
      height: 630,
      alt: "FayAI — cursos de IA em portugues",
    }],
  },
  twitter: {
    card: "summary_large_image" as const,
    creator: "@fayai",
    images: ["/og-fayai.jpg"],
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
    // Título lidera com o termo de busca, não com a marca: ninguém procura
    // "FayAi" ainda (as 6 consultas do Search Console em 21/07 eram todas
    // variações erradas do nome). A marca fica no fim, como assinatura.
    title: "Cursos de Inteligência Artificial do Zero | FayAI",
    description: "Aprenda IA na prática, em português: ChatGPT, automação, agentes e criação de imagens. Cursos curtos com exemplos reais, certificado e trilha guiada do zero.",
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
      /**
       * ⚠️ O `alt` do cartão social também é texto, e é o texto de quem NÃO vê
       * a imagem. Ele estava herdando o `baseMetadata` em português nas duas
       * árvores — não aparece na tela, então nenhuma leitura de página pega;
       * quem pega é o medidor de HTML.
       */
      images: [{ ...baseMetadata.openGraph.images[0], alt: "FayAI — AI courses in Portuguese" }],
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
    /**
     * `/en/` sai do índice enquanto servir português.
     *
     * A rota continua funcionando — quem chegar nela vê o site. O que muda é
     * o que dizemos ao Google: hoje `/en/qualquer-coisa` devolve o mesmo texto
     * em português de `/pt-BR/qualquer-coisa`, e anunciar isso como versão
     * inglesa é duplicata declarada por nós mesmos. Num domínio sem
     * autoridade, gastar metade do rastreamento em cópia é caro.
     *
     * `follow` fica ligado: as páginas continuam passando valor pelos links
     * internos; elas só não competem consigo mesmas no índice.
     */
    ...(locale === "en" && { robots: { index: false, follow: true } }),
    /**
     * O layout NÃO declara `alternates.canonical` — de propósito.
     *
     * Em Next, metadata de layout desce para todo filho que não a
     * sobrescreve. Como aqui havia `canonical: ${SITE_URL}/${locale}`, cada
     * página sem metadata própria declarava ser a HOME. Medido em produção em
     * 28/07/2026: 18 URLs públicas (`/recursos`, `/casos`, `/instrutores`,
     * `/comunidade`, `/certificacoes`, `/termos`, `/privacidade`…) todas
     * apontando para `https://fayai.com.br/pt-BR`. É a origem direta do
     * "Cópia, o Google e o usuário selecionaram uma página canônica
     * diferente" do Search Console — estávamos pedindo ao Google para
     * descartar 18 páginas em favor da home.
     *
     * Sem esta chave, página sem canônica própria simplesmente não emite a
     * tag, e o Google se auto-canonicaliza pela URL rastreada — que é o
     * comportamento correto. Cada página abaixo declara a sua com
     * `generatePageMetadata`, que já monta canônica e hreflang juntos.
     *
     * O `languages` saiu junto e pelo mesmo motivo: hreflang também descia
     * para os filhos, então toda página anunciava a home como sua versão
     * pt-BR. `generatePageMetadata` monta os dois por caminho.
     *
     * ⚠️ Não reintroduzir `alternates` aqui. Rota nova sob `[locale]` resolve
     * isso no próprio `page.tsx`.
     */
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
    // `logo` do schema.org e o LOGO da organizacao, nao a capa social. Estava
    // apontando para a foto do Web Summit — que nao e logo de coisa nenhuma.
    logo: `${SITE_URL}/brand/fayai-invoice-logo.png`,
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
        <PostHogProvider>
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
          {/* Warm palette override — injected inline to bypass turbopack CSS cache */}
          <style dangerouslySetInnerHTML={{ __html: `
            .dark, .theme-dark {
              --background: oklch(0.16 0.012 65) !important;
              --foreground: oklch(0.93 0.01 80) !important;
              --card: oklch(0.21 0.016 60) !important;
              --card-foreground: oklch(0.93 0.01 80) !important;
              --popover: oklch(0.21 0.016 60) !important;
              --popover-foreground: oklch(0.93 0.01 80) !important;
              --primary: oklch(0.78 0.12 75) !important;
              --primary-foreground: oklch(0.16 0.012 65) !important;
              --secondary: oklch(0.28 0.02 60) !important;
              --secondary-foreground: oklch(0.93 0.01 80) !important;
              --muted: oklch(0.28 0.02 60) !important;
              --muted-foreground: oklch(0.75 0.02 70) !important;
              --accent: oklch(0.78 0.12 75) !important;
              --accent-foreground: oklch(0.16 0.012 65) !important;
              --border: oklch(0.93 0.01 80 / 18%) !important;
              --input: oklch(0.93 0.01 80 / 22%) !important;
              --ring: oklch(0.78 0.12 75) !important;
            }
          `}} />
          {children}
          {/* Mede a banda de verdade (imagem e vídeo do CDN, que não passam por
              rota nossa) e devolve um evento por navegação. Não renderiza nada
              e nunca lança — ver `UsoTracker`. */}
          <UsoTracker />
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
        </PostHogProvider>
      </ServiceCartProvider>
    </UserProvider>
  );
}
