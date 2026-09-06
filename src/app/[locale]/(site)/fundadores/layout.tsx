import type { Metadata } from "next";
import { routeMetadata } from "@/lib/metadata";

/**
 * Canônica e título próprios de `/fundadores`.
 *
 * Sem isto a página herda o título da home — foi o defeito que 28 rotas deste
 * site tiveram até 29/07/2026, e ele diz ao Google "descarte esta página, a boa
 * é a home". Numa página de oferta com prazo, isso é a diferença entre existir
 * na busca e não existir.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata({ locale, path: "/fundadores" });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
