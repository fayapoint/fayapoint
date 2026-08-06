import type { Metadata } from "next";
import { Lab3D } from "@/components/lab/Lab3D";
import { ROUTE_SEO } from "@/lib/metadata";

/**
 * Bancada interna de escolha. **Não é página de produto**: fica fora do índice
 * e fora do sitemap de propósito — existe só para o Ricardo comparar opções
 * antes de alguma delas virar a versão do site.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = ROUTE_SEO["/lab/3d"][locale === "en" ? "en" : "pt-BR"];
  return {
    title: copy.title,
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-static";

export default function Page() {
  return <Lab3D />;
}
