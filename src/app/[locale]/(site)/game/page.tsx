import type { Metadata } from "next";
import { GameLanding } from "@/components/game/GameLanding";
import { generatePageMetadata, ROUTE_SEO } from "@/lib/metadata";
import { getGameCopy } from "@/lib/game/copy";
import { getCopyCampeonato } from "@/lib/game/copy-campeonato";

interface Props {
  params: Promise<{ locale: string }>;
}

// Canonical com locale via generatePageMetadata — nunca à mão (ver /radar).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = ROUTE_SEO["/game"][locale === "en" ? "en" : "pt-BR"];
  return generatePageMetadata({
    locale,
    path: "/game",
    title: copy.title,
    description: copy.description,
  });
}

// O conteúdo é estático; a busca de clube e o formulário são clientes que
// batem nas APIs — a página em si pode ser servida da borda.
export const dynamic = "force-static";

export default async function GamePage({ params }: Props) {
  const { locale } = await params;
  return (
    <GameLanding
      copy={getGameCopy(locale)}
      copyCamp={getCopyCampeonato(locale)}
      locale={locale}
    />
  );
}
