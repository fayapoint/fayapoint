import type { Metadata } from "next";
import { ROUTE_SEO } from "@/lib/metadata";

/**
 * `login` fora do índice.
 *
 * O robots.txt bloqueia `/login`, mas o padrão não casa com o prefixo de
 * locale: a URL real é `/pt-BR/login`. Medido em produção em 29/07/2026,
 * `/pt-BR/login` respondia 200 com `index, follow` e o título da home —
 * rastreável, indexável e cópia de outra página.
 *
 * O `noindex` vai na tag, e não no robots.txt, de propósito: URL bloqueada
 * no robots.txt pode seguir indexada só pela URL, porque o Google nunca chega
 * a LER a instrução que manda removê-la. Para tirar do índice é preciso
 * deixar rastrear e dizer noindex.
 *
 * ⚠️ O título passou a depender do idioma em 06/08/2026. Era `const metadata`,
 * que é estático e não enxerga `params` — então `/en/login` servia "Entrar" na
 * aba. `robots` continua idêntico: `follow: false` é escolha desta página e
 * não vem do helper de rota.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = ROUTE_SEO["/login"][locale === "en" ? "en" : "pt-BR"];
  return {
    title: copy.title,
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
