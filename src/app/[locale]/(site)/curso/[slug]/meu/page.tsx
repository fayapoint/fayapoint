import type { Metadata } from "next";
import AteliePainel from "./AteliePainel";

type Props = { params: Promise<{ locale: string; slug: string }> };

/**
 * O Ateliê de um curso — `/curso/<slug>/meu`.
 *
 * ⚠️ `noindex` e dinâmica, e as duas coisas pelo mesmo motivo: esta página é
 * uma tela de UMA pessoa. Cada visitante vê a própria persona, o próprio saldo
 * e a própria amostra. Não há versão pública dela para o Google indexar, e uma
 * página assim entrando no índice seria conteúdo raso e duplicado em cima de
 * cada URL de curso — o oposto do trabalho de SEO de 28/07, que tirou as
 * páginas de curso do soft 404.
 *
 * A prévia PÚBLICA do curso continua sendo `/curso/<slug>/previa`, que é
 * servida no servidor e existe justamente para ser indexada.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "O seu curso | FayAI",
    description: "Personalize este curso para o seu negócio.",
    robots: { index: false, follow: false },
    alternates: { canonical: `/curso/${slug}` },
  };
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  return <AteliePainel slug={slug} locale={locale} />;
}
