import { getAllProducts } from "@/lib/products";
import CoursesCatalog from "./CoursesCatalog";

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

export default async function Page() {
  const products = await getAllProducts({ type: "course", limit: 200 }).catch(
    () => [],
  );

  return <CoursesCatalog initialProducts={products} />;
}
