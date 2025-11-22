import type { ReactNode } from "react";
import { Inter, Plus_Jakarta_Sans, Fira_Code } from "next/font/google";
import Script from "next/script";
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

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const lang = "pt-BR";
  return (
    <html lang={lang} className="scroll-smooth theme-dark dark">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${plusJakarta.variable} ${firaCode.variable} font-sans antialiased bg-background text-foreground min-h-screen`}
      >
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
