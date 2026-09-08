import type { Metadata } from "next";
import { SaguaoApostas } from "@/components/game/SaguaoApostas";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const pt = locale !== "en";
  return {
    title: pt ? "Apostas com fichas — Winners 22" : "Play-money betting — Winners 22",
    description: pt
      ? "Aposte em times, partidas e jogadores de Pro Clubs com fichas do jogo. Partidas simuladas, resultado conferível por qualquer pessoa."
      : "Bet on Pro Clubs teams, matches and players with in-game chips. Simulated matches, results anyone can verify.",
    // ⚠️ `noindex` de propósito: o saguão muda de conteúdo a cada rodada e não
    // tem nada estável para o buscador indexar. Pior: uma página nossa
    // ranqueando para "apostas" atrairia quem procura casa de aposta de
    // verdade — público que aqui só encontraria frustração, e um risco
    // regulatório que não temos motivo nenhum para correr.
    robots: { index: false, follow: true },
  };
}

export const dynamic = "force-dynamic";

export default async function ApostasPage({ params }: Props) {
  const { locale } = await params;
  return <SaguaoApostas locale={locale} />;
}
