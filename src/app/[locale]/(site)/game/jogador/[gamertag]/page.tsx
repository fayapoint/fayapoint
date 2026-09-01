import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, UserX } from "lucide-react";
import { PerfilJogador } from "@/components/game/PerfilJogador";
import { generatePageMetadata } from "@/lib/metadata";
import { getCopyMercado } from "@/lib/game/copy-mercado";
import { montarPerfil } from "@/lib/game/perfil-servidor";
import { FUNDO, bebas } from "@/lib/game/tema";

interface Props {
  params: Promise<{ locale: string; gamertag: string }>;
}

// Per-gamertag, lido do banco/espelho — renderizado sob demanda.
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
  const perfil = await montarPerfil(decodeURIComponent(gamertag));

  if (!perfil) {
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
          <Link
            href="/game/mercado"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            {copy.hub.title}
          </Link>
        </div>
      </main>
    );
  }

  return <PerfilJogador perfil={perfil} copy={copy} locale={locale} />;
}
