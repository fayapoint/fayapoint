import type { Metadata } from "next";
import { routeMetadata } from "@/lib/metadata";

/**
 * Canônica própria de `/comunidade`.
 *
 * Até 28/07/2026 esta página não declarava nenhuma e herdava a do layout de
 * `[locale]`, que apontava para a home — ou seja, dizia ao Google "descarte
 * esta página, a boa é a home". Eram 28 rotas públicas no mesmo caso, e é a
 * origem do "Cópia, o Google e o usuário selecionaram uma página canônica
 * diferente" no Search Console.
 *
 * Desde 29/07/2026 o título e a descrição também saem daqui. Antes não
 * saíam, e a página servia o título da home — ver ROUTE_SEO em
 * `src/lib/metadata.ts`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata({ locale, path: "/comunidade" });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
