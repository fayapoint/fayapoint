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
 *
 * ⚠️ **ESTE ARQUIVO NÃO É MAIS QUEM REDIRECIONA** (26/08/2026). Ele é a
 * segunda linha de defesa; a primeira está em `next.config.ts`, no bloco
 * `redirects()`.
 *
 * Motivo, medido em produção um mês depois do item 2 acima: `/pt-BR/blog`
 * respondia **200**, não 308. A rota é pré-renderizada (`●` no build, os dois
 * idiomas), e página estática não carrega código de status — o Next assa a
 * intenção como `<meta http-equiv="refresh">` dentro de um HTML completo de
 * 212 KB, com título próprio e nenhum artigo. O item 2 descreve o que se
 * pretendia; o que o site fazia era outra coisa, e ninguém tinha conferido o
 * código de resposta depois de publicar.
 *
 * A lição é essa: `redirect()` numa rota estática vira meta-refresh calado.
 * Redirecionamento estrutural vai em `next.config.ts`, onde sai antes de
 * qualquer HTML.
 */
export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/noticias`);
}
