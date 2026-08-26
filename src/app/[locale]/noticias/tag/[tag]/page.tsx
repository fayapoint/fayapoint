import type { Metadata } from "next";
import { generatePageMetadata, ROUTE_SEO } from "@/lib/metadata";
import { HubDeNoticias } from "../../HubDeNoticias";

/**
 * O hub filtrado por tag.
 *
 * Era `/noticias?tag=<tag>`, e a query custava caro duas vezes: ler
 * `searchParams` tirava a página inteira do ISR (TTFB de 1,7 s, item 21 do
 * laudo), e a borda da Netlify ignora todo parâmetro fora do
 * `Netlify-Vary: query=<lista>` — o que faria a versão cacheada de
 * `?tag=MODELOS` servir o hub sem filtro nenhum.
 *
 * Em segmento, cada tag tem cache próprio, entra no índice com título próprio
 * e não arrasta o hub para o caminho dinâmico.
 */
export const revalidate = 900;

interface Props {
  params: Promise<{ locale: string; tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tag } = await params;
  const copy = ROUTE_SEO["/noticias"][locale === "en" ? "en" : "pt-BR"];
  const nome = decodeURIComponent(tag);
  return generatePageMetadata({
    locale,
    path: `/noticias/tag/${tag}`,
    title: `${nome} — ${copy.title}`,
    description: copy.description,
  });
}

export default async function NoticiasPorTagPage({ params }: Props) {
  const { locale, tag } = await params;
  return <HubDeNoticias locale={locale} tag={decodeURIComponent(tag)} />;
}
