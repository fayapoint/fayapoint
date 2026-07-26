import type { Metadata } from "next";
import { PublicArcade } from "@/components/landing/PublicArcade";
import { generatePageMetadata } from "@/lib/metadata";

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

  return generatePageMetadata({
    locale,
    path: "/arcade",
    title: "Arcade Grátis — Jogue Sem Cadastro | FayAi",
    description:
      "Experimente 5 minigames de IA generativa da FayAi sem precisar criar conta. Monte prompts, separe verdade de mito e mais.",
  });
}

export default function ArcadePage() {
  return <PublicArcade />;
}
