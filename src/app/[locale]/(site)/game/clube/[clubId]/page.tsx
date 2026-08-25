import type { Metadata } from "next";
import { ClubeHub } from "@/components/game/ClubeHub";
import { generatePageMetadata } from "@/lib/metadata";
import { getGameCopy } from "@/lib/game/copy";
import { FUNDO } from "@/lib/game/tema";
import type { EaPlatform } from "@/lib/game/ea-api";

interface Props {
  params: Promise<{ locale: string; clubId: string }>;
  /** `?p=common-gen4` vem da busca, que já sabe em que piscina achou o clube. */
  searchParams: Promise<{ p?: string }>;
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
    title: en ? `Club ${clubId} — Winners 22 | FayAI` : `Clube ${clubId} — Winners 22 | FayAI`,
    description: en
      ? "Squad, record and recent matches read live from the Clubs public source."
      : "Elenco, campanha e últimas partidas lidos ao vivo da fonte pública do modo Clubs.",
  });
}

export default async function ClubePage({ params, searchParams }: Props) {
  const { locale, clubId } = await params;
  const { p } = await searchParams;
  // Só as duas piscinas da EA passam; qualquer outra coisa vira descoberta
  // automática no servidor (tenta as duas), que é o comportamento seguro.
  const plataforma: EaPlatform | undefined =
    p === "common-gen4" || p === "common-gen5" ? p : undefined;

  return (
    <main
      className="min-h-dvh overflow-x-clip px-4 pb-16 pt-24 sm:px-8 sm:pt-28"
      style={{ background: FUNDO, color: "#f3f1ff" }}
    >
      <ClubeHub
        clubId={clubId}
        copy={getGameCopy(locale)}
        locale={locale}
        plataforma={plataforma}
      />
    </main>
  );
}
