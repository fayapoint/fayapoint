import type { Metadata } from "next";
import { Lab3D } from "@/components/lab/Lab3D";

/**
 * Bancada interna de escolha. **Não é página de produto**: fica fora do índice
 * e fora do sitemap de propósito — existe só para o Ricardo comparar opções
 * antes de alguma delas virar a versão do site.
 */
export const metadata: Metadata = {
  title: "Bancada 3D — FayAI",
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

export default function Page() {
  return <Lab3D />;
}
