import type { Metadata } from "next";
import { NovaLanding } from "@/components/landing/NovaLanding";
import { getAiNews } from "@/lib/ai-news";

export const metadata: Metadata = {
  title: "FayAI — O que a IA faz por você em 30 segundos?",
  description:
    "Escolha um pedaço da sua vida e veja a mágica: exemplos práticos de IA que você repete na hora, de graça. Aprenda IA fazendo.",
  // Protótipo: fora do Google até virar a home oficial
  robots: { index: false, follow: false },
};

// Revalida a cada 30 min — a seção IA HOJE pega as notícias novas do agente
export const revalidate = 1800;

export default async function NovaPage() {
  const { items } = await getAiNews(3);
  return <NovaLanding news={items} />;
}
