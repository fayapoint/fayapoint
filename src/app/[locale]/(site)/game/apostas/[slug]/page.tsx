import type { Metadata } from "next";
import { MesaDeAposta } from "@/components/game/MesaDeAposta";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const pt = locale !== "en";
  return {
    title: pt ? "Partida — Winners 22" : "Match — Winners 22",
    description: pt
      ? "Cardápio de mercados, prova de honestidade e súmula da partida."
      : "Market board, fairness proof and match report.",
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-dynamic";

export default async function MesaPage({ params }: Props) {
  const { locale, slug } = await params;
  return <MesaDeAposta slug={slug} locale={locale} />;
}
