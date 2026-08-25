import { NextResponse } from "next/server";
import {
  clubInfo,
  clubOverallStats,
  clubMembersStats,
  clubMembersCareer,
  divisoes,
  linhaDoClube,
  PLATAFORMAS,
  type EaPlatform,
  type ClubSearchResult,
} from "@/lib/game/ea-api";

/**
 * GET /api/game/ea/clube/[clubId]?plataforma=common-gen5
 *
 * Ficha completa do clube: identidade, campanha, elenco da temporada, carreira
 * de cada membro e a tabela de divisões do modo Clubs (para dizer quantos
 * pontos promovem e quantos seguram a divisão atual).
 *
 * **Descoberta de plataforma**: a v1 assumia `common-gen5` e um clube de PS4/
 * Xbox One devolvia página vazia sem dizer por quê. Quando o cliente não manda
 * a piscina, tentamos as duas em paralelo e ficamos com a que respondeu.
 *
 * Cache curto (2 min): stats mudam a cada partida, mas a página do clube é o
 * hot path da seção e não pode virar metralhadora contra a EA.
 */
export const dynamic = "force-dynamic";

/** Descobre em qual piscina o clube vive. Uma ida por piscina, em paralelo. */
async function descobrir(clubId: string): Promise<{
  plataforma: EaPlatform;
  info: ClubSearchResult | null;
}> {
  const respostas = await Promise.all(
    PLATAFORMAS.map(async (p) => ({ plataforma: p, info: await clubInfo(clubId, p) }))
  );
  const boa = respostas.find((r) => r.info && r.info.name !== "?");
  return boa ?? { plataforma: PLATAFORMAS[0], info: null };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const { clubId } = await params;
  const url = new URL(req.url);
  const pedida = url.searchParams.get("plataforma");

  if (!/^\d{1,12}$/.test(clubId)) {
    return NextResponse.json({ error: "clubId inválido" }, { status: 400 });
  }

  let plataforma: EaPlatform;
  let info: ClubSearchResult | null;

  if (pedida === "common-gen5" || pedida === "common-gen4") {
    plataforma = pedida;
    info = await clubInfo(clubId, plataforma);
  } else {
    ({ plataforma, info } = await descobrir(clubId));
  }

  const [stats, members, career, divs, tabela] = await Promise.all([
    clubOverallStats(clubId, plataforma),
    clubMembersStats(clubId, plataforma),
    clubMembersCareer(clubId, plataforma),
    divisoes(),
    // Divisão ATUAL e pontos da temporada só existem no índice de busca.
    info ? linhaDoClube(clubId, info.name, plataforma) : Promise.resolve(null),
  ]);

  if (!info && !stats && members.length === 0) {
    return NextResponse.json({ error: "clube não encontrado" }, { status: 404 });
  }

  return NextResponse.json(
    {
      info,
      stats,
      members,
      career,
      divisoes: divs,
      tabela,
      plataforma,
      sourceGrade: "B",
      capturedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        "Netlify-Vary": "query=plataforma",
      },
    }
  );
}
