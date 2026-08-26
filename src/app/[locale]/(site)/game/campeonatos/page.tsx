import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { VitrineCampeonatos } from "@/components/game/VitrineCampeonatos";
import { generatePageMetadata } from "@/lib/metadata";
import { getCopyCampeonato } from "@/lib/game/copy-campeonato";
import { getGameCopy } from "@/lib/game/copy";
import { FUNDO, LIMA, bebas } from "@/lib/game/tema";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const en = locale === "en";
  return generatePageMetadata({
    locale,
    path: "/game/campeonatos",
    title: en
      ? "Championships — Winners 22 | FayAI"
      : "Campeonatos — Winners 22 | FayAI",
    description: en
      ? "Create a league or a cup for EA SPORTS FC Clubs in under a minute: standings, calendar, bracket and top scorers computed for you."
      : "Monte uma liga ou uma copa do EA SPORTS FC Clubs em menos de um minuto: classificação, calendário, chaveamento e artilharia calculados sozinhos.",
  });
}

/**
 * A área de campeonatos. Conteúdo estático; a vitrine e a criação são clientes
 * que batem nas APIs — a casca pode ser servida da borda.
 */
export const dynamic = "force-static";

export default async function CampeonatosPage({ params }: Props) {
  const { locale } = await params;
  const copy = getCopyCampeonato(locale);
  const game = getGameCopy(locale);

  return (
    <main
      className="min-h-dvh overflow-x-clip px-4 pb-20 pt-24 sm:px-8 sm:pt-28"
      style={{ background: FUNDO, color: "#f3f1ff" }}
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href="/game"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          {game.brandShort}
        </Link>

        <div
          aria-hidden
          className="fx-orb"
          style={{
            width: 380,
            height: 380,
            left: "8%",
            top: 40,
            background: `radial-gradient(circle, ${LIMA}26, transparent 65%)`,
            animation: "fx-drift-a 14s ease-in-out infinite",
          }}
        />

        <h1 className="relative mt-4 text-4xl leading-none sm:text-6xl" style={bebas}>
          {copy.hub.title.toUpperCase()}
        </h1>

        <div className="relative mt-8">
          <VitrineCampeonatos copy={copy} />
        </div>

        <footer className="mx-auto mt-16 max-w-3xl border-t border-white/[0.08] pt-6">
          <p className="text-center text-[11.5px] leading-relaxed text-white/50">
            {game.disclaimer}
          </p>
        </footer>
      </div>
    </main>
  );
}
