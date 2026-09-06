import type { Metadata } from "next";

/**
 * O convite de fundador NÃO entra no índice.
 *
 * São cem páginas quase iguais, uma por código, que existem para ser clicadas
 * a partir de um grupo ou de um cartaz — não para disputar busca. Indexadas,
 * seriam cem quase-duplicatas competindo com `/fundadores`, que é a página que
 * deve aparecer. `noindex, follow`: não indexa, mas segue os links daqui.
 */
export const metadata: Metadata = {
  title: "Convite de Fundador | FayAI",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
