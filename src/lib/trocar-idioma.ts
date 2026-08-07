"use client";

/**
 * A troca de idioma — a mecânica, num lugar só.
 *
 * Existiam duas telas com cabeçalho próprio (o do site e o da landing) e a
 * mecânica morava dentro do `LocaleSwitcher`, que é um dropdown com o visual do
 * site. A home não podia usar aquele visual — fundo escuro, header próprio — e
 * por isso ficou sem seletor nenhum: quem caísse na home em inglês não tinha
 * como voltar, e quem caísse em português não tinha como ir.
 *
 * Aqui fica só a decisão (para onde ir e o que lembrar); o visual é de cada
 * cabeçalho.
 */

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export const IDIOMAS = [
  { code: "pt-BR", label: "Português (BR)", short: "PT" },
  { code: "en", label: "English", short: "EN" },
] as const;

const UM_ANO_EM_SEGUNDOS = 60 * 60 * 24 * 365;

/**
 * Troca o prefixo de idioma da rota atual, preservando o resto do caminho e a
 * query. `/en/cursos/x?a=1` → `/pt-BR/cursos/x?a=1`.
 */
export function caminhoNoIdioma(caminhoAtual: string, novoIdioma: string): string {
  const semQuery = caminhoAtual.split("?")[0];
  const partes = semQuery.split("/").filter(Boolean);
  if (partes.length > 0 && IDIOMAS.some((i) => i.code === partes[0])) {
    partes[0] = novoIdioma;
  } else {
    partes.unshift(novoIdioma);
  }
  const query = caminhoAtual.includes("?")
    ? caminhoAtual.slice(caminhoAtual.indexOf("?"))
    : "";
  return `/${partes.join("/")}${query}`;
}

export function useTrocarIdioma() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pendente, iniciar] = useTransition();

  const trocar = (novoIdioma: string) => {
    if (novoIdioma === locale) return;

    iniciar(() => {
      try {
        // O cookie é o que o middleware lê na próxima visita à raiz; o
        // localStorage é a memória do lado do cliente. Os dois, porque nenhum
        // dos dois sozinho cobre entrada por link direto e entrada pela raiz.
        document.cookie = `NEXT_LOCALE=${novoIdioma}; path=/; max-age=${UM_ANO_EM_SEGUNDOS}`;
        window.localStorage.setItem("preferredLocale", novoIdioma);
      } catch {
        // sem storage (aba anônima, SSR) — a navegação abaixo ainda funciona
      }

      router.replace(caminhoNoIdioma(pathname ?? "/", novoIdioma));
      router.refresh();
    });
  };

  return { locale, trocar, pendente };
}
