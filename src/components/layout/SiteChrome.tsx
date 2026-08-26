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
      {/*
        O piso de altura existe para segurar o RODAPÉ fora da dobra no primeiro
        quadro.

        Metade das páginas do site é `"use client"` e monta o miolo depois do
        `useEffect` — em `/precos`, por exemplo, o HTML do servidor traz o nome
        dos planos mas nenhum preço. Medido em 26/08/2026: aos 350 ms o
        documento tinha 1.308 px e o rodapé estava em y=558, dentro de uma
        janela de 900; aos 644 ms o conteúdo chegava, o documento ia a 6.547 px
        e o rodapé descia 5.239 px de uma vez. Como o rodapé estava VISÍVEL
        quando se moveu, aquilo entrava inteiro no CLS: 0,43 em todas as
        páginas de desktop, contra o limite de 0,10 do Core Web Vitals.

        Com `min-h-screen` o rodapé nasce abaixo da linha d'água. Ele continua
        descendo quando o conteúdo chega, mas fora da viewport — e o que não
        está visível não conta para o CLS. Páginas cujo conteúdo já passa de uma
        tela não sentem diferença nenhuma.

        Isto trata o SINTOMA. A cura é o conteúdo vir renderizado do servidor
        nas páginas comerciais; enquanto essa migração não acontece, este piso
        é o que separa "ruim" de "bom" na medição.
      */}
      <div className="min-h-screen">{children}</div>
      <Footer />
    </>
  );
}
