import type { Metadata } from "next";
import { ROUTE_SEO } from "@/lib/metadata";

/**
 * `onboarding` fora do índice.
 *
 * O robots.txt bloqueia `/onboarding`, mas o padrão não casa com o prefixo de
 * locale: a URL real é `/pt-BR/onboarding`. Medido em produção em 29/07/2026,
 * `/pt-BR/login` respondia 200 com `index, follow` e o título da home —
 * rastreável, indexável e cópia de outra página.
 *
 * O `noindex` vai na tag, e não no robots.txt, de propósito: URL bloqueada
 * no robots.txt pode seguir indexada só pela URL, porque o Google nunca chega
 * a LER a instrução que manda removê-la. Para tirar do índice é preciso
 * deixar rastrear e dizer noindex.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = ROUTE_SEO["/onboarding"][locale === "en" ? "en" : "pt-BR"];
  return {
    title: copy.title,
    robots: { index: false, follow: false },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
