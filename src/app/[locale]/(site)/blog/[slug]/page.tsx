import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPostContent } from "@/data/blog-posts";
import { generatePageMetadata } from "@/lib/metadata";
import BlogPostView from "./BlogPostView";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

/**
 * Rota legada das matérias. O hub atual é `/noticias` — `/blog` responde 308
 * para lá —, mas os 15 artigos que ainda têm corpo continuam servidos aqui
 * porque já estão no índice.
 *
 * Este arquivo virou server component por dois defeitos medidos em produção em
 * 28/07/2026, os dois reportados pelo Search Console:
 *
 * 1. **Canônica inválida.** Sendo `"use client"`, a página não declarava
 *    metadata própria e herdava a do layout: todas as URLs `/blog/<slug>`
 *    diziam ser `/pt-BR/blog` — que responde 308 para `/pt-BR/noticias`.
 *    Canônica apontando para URL que redireciona é descartada pelo Google, que
 *    então escolhe a canônica sozinho ("Cópia, o Google e o usuário
 *    selecionaram uma página canônica diferente").
 *
 * 2. **Soft 404.** Slug desconhecido devolvia 200 com "Artigo não encontrado",
 *    e os 6 posts sem corpo devolviam 200 com "Conteúdo completo em breve".
 *    Página que anuncia a própria ausência com status 200 é a definição de
 *    soft 404. Aqui os dois casos caem no mesmo `notFound()`: sem corpo, sem
 *    página.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const content = getBlogPostContent(slug);
  if (!content) return { robots: { index: false, follow: true } };

  const primeiroParagrafo = content.sections.find(
    (s) => s.type === "paragraph" && s.content,
  )?.content;

  return generatePageMetadata({
    locale,
    path: `/blog/${slug}`,
    ...(primeiroParagrafo && { description: primeiroParagrafo.slice(0, 160) }),
  });
}

export default async function Page({ params }: Props) {
  const { slug } = await params;

  if (!getBlogPostContent(slug)) {
    notFound();
  }

  return <BlogPostView />;
}
