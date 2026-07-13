"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Chrome global do site (Header + Footer) montado uma única vez no layout do
 * grupo (site) — antes disso cada page.tsx importava os dois na mão (51
 * páginas), e as que esqueciam viravam becos sem saída (13/07/2026).
 *
 * Rotas SEM chrome:
 * - /portal — tem shell próprio (sidebar + bottom-nav)
 * - /receipt — comprovante limpo para impressão
 */
const BARE_ROUTES = ["/portal", "/receipt"];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  // remove o prefixo de locale (/pt-BR/..., /en/...) para casar as rotas
  const path = pathname.replace(/^\/(pt-BR|en)(?=\/|$)/, "") || "/";
  const bare = BARE_ROUTES.some((r) => path === r || path.startsWith(r));

  if (bare) return <>{children}</>;

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
