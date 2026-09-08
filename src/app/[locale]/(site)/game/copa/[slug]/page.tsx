import type { Metadata } from "next";
import { PaginaDaCopa } from "@/components/game/PaginaDaCopa";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const pt = locale !== "en";
  return {
    title: pt
      ? "Super Copa dos Streamers — tabela, súmulas e dados da EA | Winners 22"
      : "Super Copa dos Streamers — tables and EA data | Winners 22",
    description: pt
      ? "A Super Copa dos Streamers de EA FC 26 Pro Clubs com dado conferido na fonte: placar, súmula por jogador e a procedência de cada número."
      : "The Brazilian streamer Pro Clubs cup, with data checked against EA's own public source.",
    // Esta É para indexar — é conteúdo original e verificável, ao contrário do
    // saguão de apostas, que muda a cada rodada e não deve ranquear.
    robots: { index: true, follow: true },
  };
}

export const dynamic = "force-dynamic";

export default async function CopaPage({ params }: Props) {
  const { locale, slug } = await params;
  return <PaginaDaCopa slug={slug} locale={locale} />;
}
