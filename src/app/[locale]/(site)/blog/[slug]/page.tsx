import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPostContent, blogPostContents } from "@/data/blog-posts";
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
/**
 * ⚠️ `dynamicParams = false` — sem isto o 404 desta rota sai com status 200.
 *
 * Medido em 10/09/2026 no build de produção, com User-Agent de navegador (sem
 * `-A` o proxy devolve 403 e a medição mente): `/pt-BR/blog/nao-existe`
 * respondia **HTTP 200** servindo a página de 404 por dentro. É o mesmo soft
 * 404 que `/curso/`, `/ferramentas/` e `/inventando/` tinham — página que
 * anuncia a própria ausência com status de sucesso, gastando rastreio num site
 * cujo problema medido é indexação.
 *
 * Aqui o conserto é o mais seguro dos quatro: a lista é **fechada, local e
 * congelada**. `blogPostContents` são os 15 artigos legados que ainda têm
 * corpo, escritos à mão em `@/data/blog-posts`; `/blog` responde 308 para
 * `/noticias` desde então e nenhum artigo novo entra aqui. Slug fora da lista
 * nunca teve conteúdo — o `notFound()` abaixo já o mandava para a página de
 * erro, só que com o número errado.
 *
 * ⛔ Não copie isto para `/noticias/[slug]`: lá os slugs vêm do banco e o
 * Estúdio Social publica três por dia. Com `dynamicParams` desligado, matéria
 * nova ficaria sem página até o próximo build.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return blogPostContents.map((p) => ({ slug: p.slug }));
}

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
