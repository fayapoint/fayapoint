import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Fira_Code } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fayapoint.com.br"),
  title: "FayaPoint AI Academy - Aprenda IA do Zero ao Avançado",
  description: "A plataforma definitiva para dominar Inteligência Artificial. Cursos práticos de IA, automação, ChatGPT, Midjourney e mais de 100 ferramentas.",
  keywords: "inteligência artificial, IA, cursos online, ChatGPT, Midjourney, automação, machine learning, Brasil",
  authors: [{ name: "Ricardo Faya" }],
  creator: "FayaPoint",
  publisher: "FayaPoint AI Academy",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://fayapoint.com.br",
    siteName: "FayaPoint AI Academy",
    title: "FayaPoint AI Academy - Aprenda IA do Zero ao Avançado",
    description: "A plataforma definitiva para dominar Inteligência Artificial no Brasil",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "FayaPoint AI Academy",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FayaPoint AI Academy",
    description: "A plataforma definitiva para dominar IA",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${plusJakarta.variable} ${firaCode.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
      >
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
      </body>
    </html>
  );
}
