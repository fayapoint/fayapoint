import type { Metadata } from "next";
import { generatePageMetadata, ROUTE_SEO } from "@/lib/metadata";
import { HubDeNoticias } from "./HubDeNoticias";

// canonical explícito: sem ele o hub herda o canonical da home declarado no
// layout de [locale] e some do índice do Google (mesmo bug das matérias).
//
// ⚠️ Era `const metadata`, que é estático: `/en/noticias` servia o título em
// português E a canônica apontando para `/pt-BR/noticias` — ou seja, a versão
// inglesa declarava a portuguesa como a original dela. Agora cada idioma
// aponta para si mesmo.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = ROUTE_SEO["/noticias"][locale === "en" ? "en" : "pt-BR"];
  return generatePageMetadata({
    locale,
    path: "/noticias",
    title: copy.title,
    description: copy.description,
  });
}

/**
 * ⚠️ ESTA PÁGINA NÃO LÊ `searchParams`, E É DE PROPÓSITO.
 *
 * Ela lia, para filtrar por tag — e ler `searchParams` desliga o ISR. O
 * `revalidate = 900` abaixo está no arquivo desde sempre e **nunca valeu**:
 * toda visita renderizava o hub inteiro no servidor, com as 60 notícias.
 * Medido no laudo de 26/08/2026: TTFB de 1.707 ms, a página mais lenta do site
 * por margem larga (o resto fica entre 95 e 350 ms).
 *
 * O filtro por tag agora é rota própria: `/noticias/tag/<tag>`.
 */
export const revalidate = 900;

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function NoticiasPage({ params }: Props) {
  const { locale } = await params;
  return <HubDeNoticias locale={locale} />;
}
