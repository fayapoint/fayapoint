import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, UserX } from "lucide-react";
import { PerfilJogador } from "@/components/game/PerfilJogador";
import { generatePageMetadata } from "@/lib/metadata";
import { getCopyMercado } from "@/lib/game/copy-mercado";
import { getAuthUser } from "@/lib/auth";
import { montarFicha, getCopyFicha } from "@/lib/game/jogador-servidor";
import { FUNDO, LIMA, bebas } from "@/lib/game/tema";

interface Props {
  params: Promise<{ locale: string; gamertag: string }>;
}

// Per-gamertag, lido do banco/espelho, e depende de quem olha (dono × visitante)
// — renderizado sob demanda, nunca em cache.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, gamertag } = await params;
  const gt = decodeURIComponent(gamertag).slice(0, 40);
  const en = locale === "en";
  return generatePageMetadata({
    locale,
    path: `/game/jogador/${gamertag}`,
    title: en
      ? `${gt} — player profile · Winners 22 | FayAI`
      : `${gt} — perfil do jogador · Winners 22 | FayAI`,
    description: en
      ? `${gt}'s Winners 22 profile: career, season stats and community reputation for EA SPORTS FC Clubs.`
      : `Perfil de ${gt} no Winners 22: carreira, estatística da temporada e reputação da comunidade do EA SPORTS FC Clubs.`,
  });
}

export default async function PerfilJogadorPage({ params }: Props) {
  const { locale, gamertag } = await params;
  const copy = getCopyMercado(locale);
  const copyFicha = getCopyFicha(locale);
  const user = await getAuthUser();
  const ficha = await montarFicha(decodeURIComponent(gamertag), user?.id ?? null);

  if (!ficha) {
    const c = copy.perfil;
    return (
      <main
        className="grid min-h-dvh place-items-center px-4 py-24"
        style={{ background: FUNDO, color: "#f3f1ff" }}
      >
        <div className="max-w-md text-center">
          <UserX size={40} className="mx-auto text-white/30" />
          <h1 className="mt-4 text-3xl" style={bebas}>{c.naoEncontrado.toUpperCase()}</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{c.naoEncontradoSub}</p>
          {/* Sem ficha não é parede: quem não joga Pro Clubs entra pela mesa ou pelo mercado. */}
          <p className="mt-6 text-sm font-bold text-white/80">{copyFicha.livre.naoJogo}</p>
          <p className="mt-1 text-[13px] text-white/50">{copyFicha.livre.naoJogoSub}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/game/apostas"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold"
              style={{ background: LIMA, color: FUNDO }}
            >
              {copyFicha.livre.irApostar}
            </Link>
            <Link
              href="/game/mercado"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white/80 transition-colors hover:text-white"
            >
              <ArrowLeft size={14} />
              {copy.hub.title}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <PerfilJogador ficha={ficha} copy={copy} copyFicha={copyFicha} locale={locale} />;
}
