import type { Metadata } from "next";

import { ROUTE_SEO } from "@/lib/metadata";
import { BancadaDaMarca } from "./BancadaDaMarca";

/**
 * Bancada da marca — **não é página de produto**, igual à `/lab/3d`.
 *
 * O logo agora tem estados: parado, enchendo, cheio, com progresso real, no
 * quadrado, no letreiro, na aba. Espalhados pelo site, esses estados só
 * aparecem por meio segundo e em momentos que não dá para forçar — conferir
 * uma mudança no menisco exigiria recarregar o portal e torcer.
 *
 * Aqui todos ficam parados, lado a lado, no componente de verdade.
 *
 * Fica fora do índice e fora do sitemap de propósito.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = ROUTE_SEO["/lab/marca"][locale === "en" ? "en" : "pt-BR"];
  return {
    title: copy.title,
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-static";

export default function Page() {
  return <BancadaDaMarca />;
}
