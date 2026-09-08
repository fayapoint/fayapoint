import type { Metadata } from "next";
import { FilaDeDescobertas } from "@/components/game/FilaDeDescobertas";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Campeonatos achados — Winners 22",
    description: "Fila interna de candidatos a campeonato achados no acervo.",
    // ⚠️ `noindex` obrigatório, e não por higiene de SEO: cada linha desta
    // página é uma SUSPEITA nossa sobre clubes de pessoas reais. Deixar o
    // buscador indexar "achamos que estes 14 clubes estão num campeonato"
    // publicaria uma afirmação que ninguém confirmou.
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-dynamic";

export default async function DescobertasPage({ params }: Props) {
  await params;
  return <FilaDeDescobertas />;
}
