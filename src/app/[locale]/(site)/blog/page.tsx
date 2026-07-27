import { permanentRedirect } from "next/navigation";

/**
 * O blog vive agora no hub de notícias IA Hoje. Posts legados continuam
 * acessíveis em `/blog/[slug]`.
 *
 * Dois detalhes que valem tráfego:
 *
 * 1. **O destino carrega o idioma.** `redirect("/noticias")` mandava para uma
 *    URL sem prefixo, que o proxy redirecionava de novo — a cadeia real era
 *    `/blog → /pt-BR/blog → /noticias → /pt-BR/noticias`, quatro respostas
 *    para uma página. Cada salto dilui sinal e gasta rastreamento.
 * 2. **`permanentRedirect` (308) em vez de `redirect` (307).** O `/blog`
 *    estava indexado como página própria, com título antigo em inglês, ao
 *    lado do hub real. Temporário é exatamente o que pedimos ao Google, e foi
 *    o que ele fez.
 */
export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/noticias`);
}
