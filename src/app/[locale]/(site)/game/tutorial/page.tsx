import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";
import { getGameCopy } from "@/lib/game/copy";
import { getTutorial } from "@/lib/game/tutorial";
import { divisoesComEspelho } from "@/lib/game/espelho";
import { TutorialProClubs } from "@/components/game/TutorialProClubs";
import { FUNDO } from "@/lib/game/tema";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = getTutorial(locale);
  return generatePageMetadata({ locale, path: "/game/tutorial", title: `${t.titulo} | FayAI`, description: t.subtitulo });
}

/** A régua de divisões vem do espelho da EA; uma hora de cache basta (é estática por título). */
export const revalidate = 3600;

export default async function TutorialPage({ params }: Props) {
  const { locale } = await params;
  const divisoes = await divisoesComEspelho().then((r) => r.dados).catch(() => []);
  return (
    <main className="min-h-dvh overflow-x-clip px-4 pb-20 pt-24 sm:px-8 sm:pt-28" style={{ background: FUNDO, color: "#f3f1ff" }}>
      <TutorialProClubs t={getTutorial(locale)} divisoes={divisoes} en={locale === "en"} />
      <footer className="mx-auto mt-16 max-w-3xl border-t border-white/[0.08] pt-6">
        <p className="text-center text-[11.5px] leading-relaxed text-white/50">{getGameCopy(locale).disclaimer}</p>
      </footer>
    </main>
  );
}
