import type { Metadata } from "next";
import { ClubeHub } from "@/components/game/ClubeHub";
import { generatePageMetadata } from "@/lib/metadata";
import { getGameCopy } from "@/lib/game/copy";
import { FUNDO } from "@/lib/game/tema";

interface Props {
  params: Promise<{ locale: string; clubId: string }>;
}

/**
 * Central do clube. O título carrega o nome só depois que o cliente lê a API;
 * para o metadata (que é servidor e não deve pagar uma ida à EA por crawler)
 * fica o genérico com o id — quando a página do clube virar SSR com cache
 * próprio (Fase 1), o nome real entra aqui.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, clubId } = await params;
  const en = locale === "en";
  return generatePageMetadata({
    locale,
    path: `/game/clube/${clubId}`,
    title: en ? `Club ${clubId} — ONZE | FayAI` : `Clube ${clubId} — ONZE | FayAI`,
    description: en
      ? "Squad, record and recent matches read live from the Clubs public source."
      : "Elenco, campanha e últimas partidas lidos ao vivo da fonte pública do modo Clubs.",
  });
}

export default async function ClubePage({ params }: Props) {
  const { locale, clubId } = await params;
  return (
    <main
      className="min-h-dvh overflow-x-clip px-4 pb-16 pt-24 sm:px-8 sm:pt-28"
      style={{ background: FUNDO, color: "#f3f1ff" }}
    >
      <ClubeHub clubId={clubId} copy={getGameCopy(locale)} />
    </main>
  );
}
