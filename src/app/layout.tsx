import type { ReactNode } from "react";
import { Inter, Plus_Jakarta_Sans, Fira_Code, Bebas_Neue, DM_Mono } from "next/font/google";
import Script from "next/script";
import { getLocale } from "next-intl/server";
import "./globals.css";

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

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

type RootLayoutProps = {
  children: ReactNode;
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * ⚠️ `lang` era "pt-BR" cravado, em TODA página — inclusive `/en`. O `<html>`
 * mora aqui, fora do `[locale]`, então ninguém percebeu quando o inglês entrou:
 * o texto virava inglês e o atributo continuava dizendo português.
 *
 * Não é detalhe. É por `lang` que o Google decide para qual idioma indexar a
 * página, e é por ele que o leitor de tela escolhe a pronúncia — uma página
 * inteira em inglês lida com fonemas de português.
 *
 * `getLocale()` do next-intl resolve o idioma do pedido. O `catch` existe
 * porque este layout também embrulha rotas fora do `[locale]` (ex.: /blocked),
 * onde não há idioma para resolver — ali o padrão do site é o certo.
 */
export default async function RootLayout({ children }: RootLayoutProps) {
  let lang = "pt-BR";
  try {
    lang = await getLocale();
  } catch {
    // rota fora do [locale]: segue o padrão
  }

  return (
    <html lang={lang} className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${plusJakarta.variable} ${firaCode.variable} ${bebasNeue.variable} ${dmMono.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
      >
        {/* Google Tag Manager (noscript) */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {children}
        <Script id="hotmart-checkout" strategy="lazyOnload">
          {`
            function importHotmart(){ 
              var imported = document.createElement('script'); 
              imported.src = 'https://static.hotmart.com/checkout/widget.min.js'; 
              document.head.appendChild(imported); 
              var link = document.createElement('link'); 
              link.rel = 'stylesheet'; 
              link.type = 'text/css'; 
              link.href = 'https://static.hotmart.com/css/hotmart-fb.min.css'; 
              document.head.appendChild(link);
            } 
            importHotmart();
          `}
        </Script>
      </body>
    </html>
  );
}
