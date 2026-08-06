import type { Metadata } from "next";
import { PublicArcade } from "@/components/landing/PublicArcade";
import { generatePageMetadata, ROUTE_SEO } from "@/lib/metadata";

interface Props {
  params: Promise<{ locale: string }>;
}

/**
 * Sem canonical próprio esta página herdava `/${locale}` do layout e se
 * declarava cópia da home — o mesmo defeito que manteve as 19 matérias fora do
 * índice até 21/07. Medido em produção em 26/07: o /arcade era a única rota
 * pública ainda nessa situação.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = ROUTE_SEO["/arcade"][locale === "en" ? "en" : "pt-BR"];

  return generatePageMetadata({
    locale,
    path: "/arcade",
    title: copy.title,
    description: copy.description,
  });
}

export default function ArcadePage() {
  return <PublicArcade />;
}
