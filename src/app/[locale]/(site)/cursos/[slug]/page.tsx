import { permanentRedirect } from "next/navigation";

/**
 * `/cursos/<slug>` é a URL legada da página de curso; a canônica é
 * `/curso/<slug>` (singular).
 *
 * Duas correções aqui, ambas medidas em produção em 28/07/2026:
 *
 * 1. `redirect()` responde **307 (temporário)**, e temporário diz ao Google
 *    para MANTER a URL antiga no índice — o oposto do que se quer de uma rota
 *    legada. `permanentRedirect()` responde 308.
 * 2. O destino não tinha locale (`/curso/<slug>`), então o salto caía no
 *    redirecionador de idioma e virava uma cadeia 307 → 308. Cada salto extra
 *    é orçamento de rastreamento gasto à toa num domínio novo.
 */
export default async function CourseRedirectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  permanentRedirect(`/${locale}/curso/${slug}`);
}
