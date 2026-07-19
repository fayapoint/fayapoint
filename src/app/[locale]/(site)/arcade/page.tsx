import type { Metadata } from "next";
import { PublicArcade } from "@/components/landing/PublicArcade";

export const metadata: Metadata = {
  title: "Arcade Grátis — Jogue Sem Cadastro | FayAi",
  description:
    "Experimente 5 minigames de IA generativa da FayAi sem precisar criar conta. Monte prompts, separe verdade de mito e mais.",
};

export default function ArcadePage() {
  return <PublicArcade />;
}
