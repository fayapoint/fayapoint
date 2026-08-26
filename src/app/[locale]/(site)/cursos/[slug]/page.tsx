import { permanentRedirect } from "next/navigation";

/**
 * `/cursos/<slug>` é a URL legada da página de curso; a canônica é
 * `/curso/<slug>` (singular).
 *
 * ⚠️ **O redirecionamento de verdade NÃO acontece aqui** — ele está no
 * `redirects()` do `next.config.ts`, e é lá que se mexe.
 *
 * Este arquivo prometeu 308 desde 28/07/2026 e nunca cumpriu: rota
 * pré-renderizada não carrega código de status, então o Next assava a intenção
 * como `<meta http-equiv="refresh">` dentro de um HTML de 212 KB, com o título
 * do catálogo e zero `<h1>`. Medido em produção em 26/08/2026, um mês depois.
 * Ver `reference_redirect_estatico_meta_refresh` na memória.
 *
 * Fica como segunda linha de defesa, para o caso de a regra da config deixar
 * de casar. Se você chegou aqui investigando um 200 nesta rota, o problema não
 * está neste arquivo.
 */
export default async function CourseRedirectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  permanentRedirect(`/${locale}/curso/${slug}`);
}
