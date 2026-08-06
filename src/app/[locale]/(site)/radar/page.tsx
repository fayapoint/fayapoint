import type { Metadata } from "next";
import { RadarPagina } from "@/components/radar/RadarPagina";
import { generatePageMetadata, ROUTE_SEO } from "@/lib/metadata";

interface Props {
  params: Promise<{ locale: string }>;
}

/**
 * O canonical PRECISA carregar o locale, e por isso passa por
 * `generatePageMetadata` em vez de ser escrito à mão. Dois jeitos de errar,
 * ambos já cometidos neste repo:
 *   - não declarar nenhum: a página herda `canonical = /${locale}` do layout e
 *     se declara cópia da home (foi o que sumiu com as 19 matérias até 21/07);
 *   - declarar relativo ("/radar"): resolve para /radar, que responde 307 para
 *     /pt-BR/radar — canonical apontando para redirecionamento.
 * O helper também emite os `hreflang`, que a versão manual não tinha.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = ROUTE_SEO["/radar"][locale === "en" ? "en" : "pt-BR"];

  return generatePageMetadata({
    locale,
    path: "/radar",
    title: copy.title,
    description: copy.description,
  });
}

// As tendências mudam ao longo do dia; a página é montada no cliente e a
// medição vem da API, que tem cache próprio de 30 min.
export const dynamic = "force-static";

export default function Page() {
  return <RadarPagina />;
}
