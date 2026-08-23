import { NextResponse } from "next/server";
import {
  clubInfo,
  clubOverallStats,
  clubMembersStats,
  type EaPlatform,
} from "@/lib/game/ea-api";

/**
 * GET /api/game/ea/clube/[clubId]?plataforma=common-gen5
 *
 * Ficha completa do clube: identidade + estatística geral + elenco com stats.
 * As três consultas à EA saem em paralelo; se uma falhar, as outras ainda
 * pintam a página (o cliente trata null).
 *
 * Cache curto (2 min): stats mudam a cada partida, mas a página do clube é o
 * hot path da seção e não pode virar metralhadora contra a EA.
 */
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const { clubId } = await params;
  const url = new URL(req.url);
  const plataforma = (url.searchParams.get("plataforma") ?? "common-gen5") as EaPlatform;

  if (!/^\d{1,12}$/.test(clubId)) {
    return NextResponse.json({ error: "clubId inválido" }, { status: 400 });
  }

  const [info, stats, members] = await Promise.all([
    clubInfo(clubId, plataforma),
    clubOverallStats(clubId, plataforma),
    clubMembersStats(clubId, plataforma),
  ]);

  if (!info && !stats && members.length === 0) {
    return NextResponse.json({ error: "clube não encontrado" }, { status: 404 });
  }

  return NextResponse.json(
    { info, stats, members, sourceGrade: "B", capturedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        "Netlify-Vary": "query=plataforma",
      },
    }
  );
}
