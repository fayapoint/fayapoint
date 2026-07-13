import { NovaLanding } from "@/components/landing/NovaLanding";
import { WhatsAppButton } from "@/components/conversion/WhatsAppButton";
import { getAiNews } from "@/lib/ai-news";

// Home oficial (12/07/2026): a experiência de imersão gamificada substituiu o
// gate de hype e o cubo 3D. O gate segue existindo apenas como código
// (components/gate) e o cubo continua acessível como componente — nada foi
// apagado, a home apenas deixou de usá-los.

// Revalida a cada 30 min — a seção IA HOJE pega as notícias novas do agente
export const revalidate = 1800;

export default async function Home() {
  const { items } = await getAiNews(3);
  return (
    <>
      <NovaLanding news={items} />
      <WhatsAppButton />
    </>
  );
}
