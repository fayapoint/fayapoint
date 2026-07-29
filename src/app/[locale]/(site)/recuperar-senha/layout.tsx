import type { Metadata } from "next";

/**
 * `recuperar-senha` fora do índice.
 *
 * O robots.txt bloqueia `/recuperar-senha`, mas o padrão não casa com o prefixo de
 * locale: a URL real é `/pt-BR/recuperar-senha`. Medido em produção em 29/07/2026,
 * `/pt-BR/login` respondia 200 com `index, follow` e o título da home —
 * rastreável, indexável e cópia de outra página.
 *
 * O `noindex` vai na tag, e não no robots.txt, de propósito: URL bloqueada
 * no robots.txt pode seguir indexada só pela URL, porque o Google nunca chega
 * a LER a instrução que manda removê-la. Para tirar do índice é preciso
 * deixar rastrear e dizer noindex.
 */
export const metadata: Metadata = {
  title: "Recuperar senha | FayAI",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
