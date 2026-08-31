import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { Mercado } from "@/components/game/Mercado";
import { generatePageMetadata } from "@/lib/metadata";
import { getGameCopy } from "@/lib/game/copy";
import { getCopyMercado } from "@/lib/game/copy-mercado";
import { FUNDO, LIMA, CIANO, bebas } from "@/lib/game/tema";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const en = locale === "en";
  return generatePageMetadata({
    locale,
    path: "/game/mercado",
    title: en
      ? "Transfer market — Winners 22 | FayAI"
      : "Mercado da bola — Winners 22 | FayAI",
    description: en
      ? "The EA SPORTS FC Clubs transfer board: clubs recruiting and free agents, filtered by position, platform and schedule, with each club's real division pulled from EA — and a one-click recruitment poster."
      : "O quadro de transferências do EA SPORTS FC Clubs: clubes recrutando e jogadores livres, filtrados por posição, plataforma e horário, com a divisão real do clube puxada da EA — e o cartaz de recrutamento gerado num clique.",
  });
}

/**
 * O MERCADO. Casca estática servida da borda; a vitrine, o filtro, a publicação
 * e a candidatura são clientes que batem nas APIs de `/api/game/mercado/*`.
 */
export const dynamic = "force-static";

export default async function MercadoPage({ params }: Props) {
  const { locale } = await params;
  const game = getGameCopy(locale);
  const copy = getCopyMercado(locale);

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
          {copy.hub.back}
        </Link>

        <div
          aria-hidden
          className="fx-orb"
          style={{
            width: 400,
            height: 400,
            right: "6%",
            top: 20,
            background: `radial-gradient(circle, ${CIANO}22, transparent 65%)`,
            animation: "fx-drift-b 15s ease-in-out infinite",
          }}
        />

        <h1 className="relative mt-4 text-4xl leading-none sm:text-6xl" style={bebas}>
          {copy.hub.title.toUpperCase()}
        </h1>
        <p className="relative mt-3 max-w-3xl text-sm leading-relaxed text-white/60">
          {copy.hub.subtitle}
        </p>
        <p
          className="relative mt-2 inline-block rounded-full px-3 py-1 text-[11px] font-bold"
          style={{ background: `${LIMA}14`, color: LIMA, border: `1px solid ${LIMA}33` }}
        >
          {copy.hub.badge}
        </p>

        <div className="relative mt-8">
          <Mercado copy={copy} locale={locale} />
        </div>

        <footer className="mx-auto mt-16 max-w-3xl border-t border-white/[0.08] pt-6">
          <p className="text-center text-[11.5px] leading-relaxed text-white/50">{game.disclaimer}</p>
        </footer>
      </div>
    </main>
  );
}
