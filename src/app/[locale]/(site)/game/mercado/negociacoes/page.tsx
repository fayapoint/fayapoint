import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { Negociacoes } from "@/components/game/Negociacoes";
import { generatePageMetadata } from "@/lib/metadata";
import { getGameCopy } from "@/lib/game/copy";
import { FUNDO, OURO, bebas } from "@/lib/game/tema";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const en = locale === "en";
  return generatePageMetadata({
    locale,
    path: "/game/mercado/negociacoes",
    title: en ? "Buy and sell clubs and players — Winners 22 | FayAI" : "Compra e venda de clubes e jogadores — Winners 22 | FayAI",
    description: en
      ? "Chip-based transfers for EA SPORTS FC 27 Clubs: market value from EA's public data, escrow, consent from every side and a public transfer board."
      : "Transferências em fichas no Clubs do EA SPORTS FC 27: valor de mercado a partir do dado público da EA, custódia, consentimento de todos os lados e quadro público de transferências.",
  });
}

/** Casca estática; o quadro e as ações são clientes de `/api/game/negociacoes/*`. */
export const dynamic = "force-static";

export default async function NegociacoesPage({ params }: Props) {
  const { locale } = await params;
  const en = locale === "en";
  return (
    <main className="min-h-dvh overflow-x-clip px-4 pb-20 pt-24 sm:px-8 sm:pt-28" style={{ background: FUNDO, color: "#f3f1ff" }}>
      <div className="mx-auto max-w-6xl">
        <Link href="/game/mercado" className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white">
          <ArrowLeft size={14} /> {en ? "Transfer market" : "Mercado da bola"}
        </Link>
        <h1 className="mt-4 text-4xl leading-none sm:text-6xl" style={bebas}>{(en ? "Buy & sell" : "Compra e venda").toUpperCase()}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/60">
          {en
            ? "Buy the management of a club or sign a player for yours. Every offer is valued from EA's public data, held in escrow and only completes when every side says yes."
            : "Compre a gestão de um clube ou contrate um jogador para o seu. Toda proposta é avaliada pelo dado público da EA, fica em custódia e só se conclui quando todos os lados dizem sim."}
        </p>
        <p className="mt-2 inline-block rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: `${OURO}14`, color: OURO, border: `1px solid ${OURO}33` }}>
          {en ? "EA SPORTS FC 27 · paid in chips, no monetary value" : "EA SPORTS FC 27 · pago em fichas, sem valor econômico"}
        </p>
        <div className="mt-8"><Negociacoes locale={locale} /></div>
        <footer className="mx-auto mt-16 max-w-3xl border-t border-white/[0.08] pt-6">
          <p className="text-center text-[11.5px] leading-relaxed text-white/50">{getGameCopy(locale).disclaimer}</p>
        </footer>
      </div>
    </main>
  );
}
