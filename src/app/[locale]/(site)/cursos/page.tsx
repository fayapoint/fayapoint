import { getAllProducts, paraVitrine } from "@/lib/products";
import CoursesCatalog from "./CoursesCatalog";
import IndicePrevias from "@/components/courses/IndicePrevias";

/**
 * A vitrine passou a ser montada no SERVIDOR em 28/07/2026.
 *
 * Ela é uma das 65 URLs do sitemap e servia 873 caracteres ao rastreador —
 * cabeçalho, os contadores ainda em "...", e nenhum card de curso —, porque os
 * cursos só chegavam por `fetch('/api/products')` depois da hidratação. Para o
 * Google isso é página sem conteúdo (soft 404) numa URL que nós mesmos
 * anunciamos como importante.
 *
 * `catch(() => [])` de propósito: banco fora do ar cai na busca do cliente, que
 * é o comportamento anterior. Nunca vale derrubar a vitrine por causa disto.
 */
export const revalidate = 900;

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const products = await getAllProducts({ type: "course", limit: 200 }).catch(
    () => [],
  );

  /**
   * ⚠️ `paraVitrine` é obrigatório aqui, não é otimização.
   *
   * `CoursesCatalog` é Client Component, e tudo que atravessa essa fronteira é
   * serializado no HTML público. Passando o produto cru, esta página servia
   * 4,3 MB — com o TEXTO DAS AULAS dos 22 cursos dentro, legível sem login.
   * Ver `CAMPOS_FORA_DA_VITRINE` em `@/lib/products`.
   */
  const paraCards = paraVitrine(products);

  return (
    <>
      <CoursesCatalog initialProducts={paraCards} />
      {/* Fora do catálogo de propósito: a vitrine é client component e seus
          links dependem do filtro. Este índice sai no HTML do servidor e dá a
          cada prévia um link interno de um hub — ver IndicePrevias. */}
      {/* Também reduzido, embora este seja Server Component e suas props não
          sejam serializadas hoje: ele usa só `name`, `shortName` e `slug`, e um
          `"use client"` acrescentado aqui um dia reabriria o vazamento sem que
          nada acusasse. */}
      <IndicePrevias produtos={paraCards} locale={locale} />
    </>
  );
}
